import {
  Follow,
  IFollow,
  IUser,
  IUserTopicInterest,
  User,
  UserFeedPreferences,
  UserTopicInterest,
} from "./models.js";

export type TopicSignalType = "save" | "comment" | "search" | "like" | "hide" | "post";

const SIGNAL_WEIGHTS: Record<TopicSignalType, number> = {
  save: 0.8,
  comment: 0.6,
  search: 0.4,
  like: 0.25,
  hide: -1,
  post: 0.6,
};

const SIGNAL_DECAY_RATES: Record<TopicSignalType, number> = {
  save: 0.01,
  comment: 0.02,
  search: 0.08,
  like: 0.03,
  hide: 0.03,
  post: 0.02,
};

export const MAX_TOPIC_MAP_ENTRIES = 15;

// Canonical topic taxonomy & normalization mapping
const TOPIC_ALIASES: Record<string, string> = {
  postgres: "postgresql",
  ml: "machine learning",
  ai: "artificial intelligence",
  backend: "backend engineering",
  frontend: "frontend engineering",
  "system design": "distributed systems",
  k8s: "kubernetes",
  js: "javascript",
  ts: "typescript",
  reactjs: "react",
  golang: "go",
  py: "python",
  dl: "deep learning",
  nlp: "natural language processing",
  "web dev": "web development",
  infra: "infrastructure",
  cloud: "cloud computing",
  db: "databases",
};

// Non-noun filler words, conversational slang, pronouns, verbs, and conjunctions
export const BOGUS_FILLER_WORDS = new Set([
  // Articles & prepositions
  "a", "an", "the", "in", "on", "at", "to", "for", "with", "by", "about", "against",
  "between", "into", "through", "during", "before", "after", "above", "below", "from",
  "up", "down", "out", "off", "over", "under", "again", "further", "then", "once",
  // Conjunctions & pronouns
  "and", "or", "but", "so", "because", "although", "while", "since", "unless",
  "it", "its", "this", "that", "these", "those", "my", "your", "our", "their",
  "we", "they", "i", "you", "he", "she", "me", "him", "her", "us", "them",
  "which", "who", "whom", "whose", "what", "whatever",
  // Conversational filler, slang, low-entropy adjectives & adverbs
  "awesome", "cool", "good", "great", "best", "nice", "bad", "today", "yesterday", "tomorrow",
  "stuff", "things", "thing", "post", "update", "hello", "hi", "hey", "lol", "omg", "lmao",
  "really", "very", "just", "much", "more", "most", "always", "never", "maybe", "perhaps",
  "actually", "basically", "literally", "totally", "definitely", "probably", "somewhat",
  // Common filler verbs & modal auxiliaries
  "doing", "done", "does", "did", "going", "goes", "went", "think", "thinks", "thought",
  "please", "help", "want", "wanted", "wants", "like", "likes", "liked", "make", "makes",
  "made", "know", "knows", "knew", "see", "sees", "saw", "get", "gets", "got", "can",
  "could", "will", "would", "shall", "should", "may", "might", "must", "is", "am", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "having",
  // Generic test & placeholder noise
  "asdf", "foo", "bar", "baz", "qwerty", "temp", "tmp", "null", "undefined",
  "etc", "misc", "various", "random"
]);

/**
 * Validates whether a candidate string is an actual noun or technical/academic domain noun phrase.
 * Rules:
 * 1. Length: 2 to 35 characters.
 * 2. Words: 1 to 3 words maximum (e.g. "Databases", "Distributed Systems", "Natural Language Processing").
 * 3. Bogus word check: Rejects any phrase containing bogus filler words (e.g. "really cool ai stuff").
 * 4. Character format: Must start with alphanumeric, allowing valid tech symbols (. - # +).
 * 5. Not pure digits (e.g. "12345") or pure punctuation.
 */
export function isValidTopicNoun(candidate: string): boolean {
  if (!candidate || typeof candidate !== "string") return false;
  const trimmed = candidate.trim().toLowerCase();

  // Length boundaries: 2 to 35 characters
  if (trimmed.length < 2 || trimmed.length > 35) return false;

  // Split into words by whitespace
  const words = trimmed.split(/\s+/).filter(Boolean);

  // Maximum 3 words per topic concept
  if (words.length === 0 || words.length > 3) return false;

  // Reject if any word in the phrase is a bogus filler word
  if (words.some((w) => BOGUS_FILLER_WORDS.has(w))) return false;

  // Must not be a pure number
  if (/^\d+$/.test(trimmed)) return false;

  // Must start with an alphanumeric char or tech symbol (. or # or +), allowing valid characters: letters, numbers, spaces, dots, hyphens, plus, hash
  const validPattern = /^[a-z0-9.#+][a-z0-9\s\.\-#+]{0,34}$/;
  if (!validPattern.test(trimmed)) return false;

  // Must contain at least one letter
  if (!/[a-z]/.test(trimmed)) return false;

  return true;
}

export function normalizeTopic(topic: string): string {
  if (!topic || typeof topic !== "string") return "";
  const cleaned = topic.trim().toLowerCase().slice(0, 35);
  return TOPIC_ALIASES[cleaned] || cleaned;
}

function topicInterestId(userId: string, topic: string): string {
  return `uti-${userId}-${Buffer.from(topic, "utf8").toString("hex")}`;
}

export async function recordTopicSignal(
  userId: string,
  rawTopic: string,
  signalType: TopicSignalType,
  eventId: string,
  occurredAt = new Date()
): Promise<void> {
  const topic = normalizeTopic(rawTopic);
  if (!topic || !eventId || !isValidTopicNoun(topic)) return;

  if (await UserTopicInterest.exists({ userId, topic, "signals.eventId": eventId })) {
    return;
  }

  const weight = SIGNAL_WEIGHTS[signalType];
  await UserTopicInterest.findOneAndUpdate(
    { userId, topic },
    {
      $setOnInsert: {
        _id: topicInterestId(userId, topic),
        longTermWeight: 0,
      },
      $set: { lastInteractedAt: occurredAt },
      $inc: { shortTermWeight: weight },
      $addToSet: {
        signals: {
          eventId,
          signalType,
          weight,
          decayRate: SIGNAL_DECAY_RATES[signalType],
          occurredAt,
        },
      },
    },
    { upsert: true }
  );
}

export async function recordTopicFollow(
  userId: string,
  rawTopic: string,
  followed: boolean,
  occurredAt = new Date()
): Promise<void> {
  const topic = normalizeTopic(rawTopic);
  if (!topic || !isValidTopicNoun(topic)) return;

  if (followed) {
    await UserTopicInterest.findOneAndUpdate(
      { userId, topic },
      {
        $setOnInsert: {
          _id: topicInterestId(userId, topic),
          shortTermWeight: 0,
        },
        $set: { lastInteractedAt: occurredAt },
        $max: { longTermWeight: 1 },
      },
      { upsert: true }
    );
    return;
  }

  const [user, remainingFollow] = await Promise.all([
    User.findById(userId).select("interests skills"),
    Follow.findOne({
      followerId: userId,
      targetType: "topic",
      targetId: { $regex: `^${escapeRegExp(topic)}$`, $options: "i" },
    }),
  ]);
  const remainsExplicit = [...(user?.interests || []), ...(user?.skills || [])].some(
    (item) => normalizeTopic(item) === topic
  );

  await UserTopicInterest.updateOne(
    { userId, topic },
    { $set: { longTermWeight: remainsExplicit || remainingFollow ? 1 : 0 } }
  );
  if (!remainsExplicit && !remainingFollow) {
    await UserTopicInterest.deleteOne({
      userId,
      topic,
      shortTermWeight: 0,
      signals: { $size: 0 },
    });
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface TopicMapEntry {
  topic: string;
  score: number;
  longTermWeight: number;
  shortTermWeight: number;
  lastActive: Date | null;
  muted: boolean;
  hasInferredSignals: boolean;
}

export async function getUserTopicMap(
  user: IUser,
  now = new Date(),
  existingFollows?: IFollow[],
  existingMutedTopicIds?: string[]
): Promise<{ topicMap: TopicMapEntry[]; mutedTopicIds: string[] }> {
  const [interests, follows, muted] = await Promise.all([
    UserTopicInterest.find({ userId: user._id }),
    existingFollows
      ? Promise.resolve(existingFollows.filter((follow) => follow.targetType === "topic"))
      : Follow.find({ followerId: user._id, targetType: "topic" }),
    existingMutedTopicIds
      ? Promise.resolve(existingMutedTopicIds)
      : UserFeedPreferences.findOne({ userId: user._id }).then(
          (preferences) => preferences?.mutedTopicIds || []
        ),
  ]);

  const mutedTopicIds = [...new Set(muted.map(normalizeTopic))];
  const topics = new Map<
    string,
    { longTermWeight: number; signals: IUserTopicInterest["signals"]; lastActive: Date | null }
  >();

  for (const interest of interests) {
    const topic = normalizeTopic(interest.topic);
    if (!isValidTopicNoun(topic)) continue;
    topics.set(topic, {
      longTermWeight: interest.longTermWeight,
      signals: interest.signals || [],
      lastActive: interest.lastInteractedAt,
    });
  }

  for (const topicValue of [...(user.interests || []), ...(user.skills || [])]) {
    const topic = normalizeTopic(topicValue);
    if (!topic || !isValidTopicNoun(topic)) continue;
    const entry = topics.get(topic) || { longTermWeight: 0, signals: [], lastActive: null };
    entry.longTermWeight = 1;
    topics.set(topic, entry);
  }

  for (const follow of follows) {
    const topic = normalizeTopic(follow.targetId);
    if (!topic || !isValidTopicNoun(topic)) continue;
    const entry = topics.get(topic) || { longTermWeight: 0, signals: [], lastActive: null };
    entry.longTermWeight = 1;
    if (!entry.lastActive || follow.createdAt > entry.lastActive) entry.lastActive = follow.createdAt;
    topics.set(topic, entry);
  }

  for (const topic of mutedTopicIds) {
    if (!isValidTopicNoun(topic)) continue;
    if (!topics.has(topic)) {
      topics.set(topic, { longTermWeight: 0, signals: [], lastActive: null });
    }
  }

  const topicMap = [...topics.entries()].map(([topic, entry]) => {
    const shortTerm = entry.signals.reduce((total, signal) => {
      const ageDays = Math.max(0, (now.getTime() - new Date(signal.occurredAt).getTime()) / 86_400_000);
      return total + signal.weight * Math.exp(-signal.decayRate * ageDays);
    }, 0);
    const score = Math.max(0, Math.min(1, entry.longTermWeight * 0.6 + shortTerm * 0.4));
    const recentPositiveWeight = Math.max(
      0,
      entry.signals.reduce((total, signal) => {
        if (signal.weight <= 0) return total;
        const ageDays = Math.max(0, (now.getTime() - new Date(signal.occurredAt).getTime()) / 86_400_000);
        return total + signal.weight * Math.exp(-signal.decayRate * ageDays);
      }, 0)
    );
    const lastSignalAt = entry.signals.reduce<Date | null>(
      (latest, signal) =>
        !latest || signal.occurredAt > latest ? signal.occurredAt : latest,
      entry.lastActive
    );

    return {
      topic,
      score: Math.round(score * 100) / 100,
      longTermWeight: entry.longTermWeight,
      shortTermWeight: Math.round(Math.min(1, recentPositiveWeight) * 100) / 100,
      lastActive: lastSignalAt,
      muted: mutedTopicIds.includes(topic),
      hasInferredSignals: entry.signals.length > 0,
    };
  }).filter((entry) => entry.score > 0 || entry.hasInferredSignals || entry.muted);

  topicMap.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.longTermWeight !== a.longTermWeight) return b.longTermWeight - a.longTermWeight;
    const timeB = b.lastActive ? new Date(b.lastActive).getTime() : 0;
    const timeA = a.lastActive ? new Date(a.lastActive).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return a.topic.localeCompare(b.topic);
  });

  // Strict Max Cap of 15 words/topics for the Campus Topic Map
  const cappedTopicMap = topicMap.slice(0, MAX_TOPIC_MAP_ENTRIES);

  return { topicMap: cappedTopicMap, mutedTopicIds };
}
