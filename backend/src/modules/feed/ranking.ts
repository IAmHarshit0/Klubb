import { IPost, IUser, Affiliation } from "../../shared/models.js";

export interface ScoredPost {
  post: IPost;
  score: number;
  explanation: string;
}

export function computeBaselineScore(
  post: IPost,
  viewer: IUser,
  authorAffiliations: any[],
  isFollowedAuthor: boolean,
  isFollowedTopic: boolean,
  topicScores?: ReadonlyMap<string, number>
): { score: number; explanation: string } {
  const viewerTopics = new Set([
    ...(viewer.interests || []).map((t) => t.toLowerCase()),
    ...(viewer.skills || []).map((s) => s.toLowerCase()),
  ]);

  // 1. Topic Relevance (0.28)
  const postTopics = (post.topicLabels || []).map((label) => label.trim().toLowerCase());
  const matchingTopics = postTopics.filter((t) => viewerTopics.has(t));
  const bestTopic = postTopics.reduce<{ topic: string; score: number } | null>((best, topic) => {
    const score = topicScores?.get(topic) ?? (viewerTopics.has(topic) ? 1 : 0.1);
    return !best || score > best.score ? { topic, score } : best;
  }, null);
  const topicRelevance = bestTopic?.score ?? 0.1;

  // 2. Behavioural / Follows (0.20)
  const behavioural = isFollowedAuthor ? 1.0 : isFollowedTopic ? 0.8 : 0.2;

  // 3. Graph Affinity (0.15)
  const isSameAuthor = post.authorId === viewer._id;
  const graphAffinity = isSameAuthor ? 1.0 : isFollowedAuthor ? 0.8 : 0.3;

  // 4. Freshness (0.12)
  const ageHours = Math.max(0, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
  const freshness = Math.exp(-0.02 * ageHours);

  // 5. Content Quality (0.10)
  const quality = Math.min(1.0, post.text.length / 100);

  // 6. Relevant Verification (0.10)
  const isVerifiedAuthor = authorAffiliations.some(
    (a) => a.verificationStatus === "institution-verified"
  );
  const verification = isVerifiedAuthor ? 1.0 : 0.4;

  // 7. Normalized Popularity (0.05)
  const popularity = 0.5;

  const totalScore =
    0.28 * topicRelevance +
    0.2 * behavioural +
    0.15 * graphAffinity +
    0.12 * freshness +
    0.1 * quality +
    0.1 * verification +
    0.05 * popularity;

  let explanation = "Relevant institutional discussion";
  if (bestTopic && (matchingTopics.length > 0 || topicScores?.has(bestTopic.topic))) {
    explanation = `Matches topic affinity "${bestTopic.topic}" (${Math.round(bestTopic.score * 100)}%)`;
  } else if (isFollowedAuthor) {
    explanation = "Author you follow";
  } else if (isVerifiedAuthor) {
    explanation = "Posted by a verified campus member";
  }

  return { score: Math.round(totalScore * 1000) / 1000, explanation };
}

export function computeRerankedScore(
  post: IPost,
  viewer: IUser,
  authorAffiliations: any[],
  isFollowedAuthor: boolean,
  isFollowedTopic: boolean,
  topicScores?: ReadonlyMap<string, number>
): { score: number; explanation: string } {
  const base = computeBaselineScore(
    post,
    viewer,
    authorAffiliations,
    isFollowedAuthor,
    isFollowedTopic,
    topicScores
  );

  // Lexical query terms from viewer's profile
  const queryTerms = [
    ...(viewer.interests || []),
    ...(viewer.skills || []),
    viewer.bio || "",
  ]
    .join(" ")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  const postWords = post.text.toLowerCase().split(/\W+/);
  const overlap = postWords.filter((w) => queryTerms.includes(w)).length;
  const semanticBoost = Math.min(0.3, overlap * 0.05);

  const finalScore = Math.min(1.0, base.score + semanticBoost);
  let explanation = base.explanation;
  if (overlap > 0) {
    explanation = `High keyword relevance to your profile (${base.explanation})`;
  }

  return { score: Math.round(finalScore * 1000) / 1000, explanation };
}

export function applyDiversityFilter(candidates: ScoredPost[], maxConsecutive: number = 2): ScoredPost[] {
  if (candidates.length <= 2) return candidates;

  const result: ScoredPost[] = [];
  const deferred: ScoredPost[] = [];

  for (const item of candidates) {
    if (
      result.length >= maxConsecutive &&
      result.slice(-maxConsecutive).every((r) => r.post.authorId === item.post.authorId)
    ) {
      deferred.push(item);
    } else {
      result.push(item);
      if (
        deferred.length > 0 &&
        !result.slice(-maxConsecutive).every((r) => r.post.authorId === deferred[0].post.authorId)
      ) {
        result.push(deferred.shift()!);
      }
    }
  }

  result.push(...deferred);
  return result;
}

export interface FlashRankRerankResult {
  id: string;
  score: number;
  text: string;
}

/**
 * FlashRank adapter for cross-encoder reranking.
 * Calls Python FlashRank service with strict timeout, falling back cleanly to baseline ranking.
 */
export async function rerankWithFlashRank(
  candidates: ScoredPost[],
  viewer: IUser,
  serviceUrl: string = "http://127.0.0.1:8000",
  timeoutMs: number = 200
): Promise<ScoredPost[]> {
  if (candidates.length <= 1) return candidates;

  const query = [
    ...(viewer.interests || []),
    ...(viewer.skills || []),
    viewer.bio || "",
  ]
    .join(" ")
    .trim();

  if (!query) return candidates;

  const passages = candidates.map((c) => ({
    id: c.post._id,
    text: `${c.post.topicLabels ? c.post.topicLabels.join(" ") : ""} ${c.post.text}`,
  }));

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`${serviceUrl}/rerank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, passages }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return candidates;
    }

    const data = (await res.json()) as { results: FlashRankRerankResult[] };
    if (!data.results || !Array.isArray(data.results)) {
      return candidates;
    }

    const scoreMap = new Map<string, number>();
    for (const r of data.results) {
      scoreMap.set(r.id, r.score);
    }

    // Blend cross-encoder semantic score with baseline score
    return candidates.map((item) => {
      const flashScore = scoreMap.get(item.post._id);
      if (flashScore !== undefined) {
        // Normalize flashrank cross-encoder score
        const combinedScore = Math.round((item.score * 0.4 + (flashScore > 0 ? 0.6 : 0.2)) * 1000) / 1000;
        return {
          ...item,
          score: combinedScore,
          explanation: `Cross-encoder reranked (FlashRank): ${item.explanation}`,
        };
      }
      return item;
    });
  } catch (_err) {
    // Clean timeout or network failure fallback to baseline candidates
    return candidates;
  }
}
