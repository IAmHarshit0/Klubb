import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Message, UserTopicInterest, User } from "../src/shared/models.js";
import {
  recordTopicSignal,
  isValidTopicNoun,
  normalizeTopic,
  MAX_TOPIC_MAP_ENTRIES,
  BOGUS_FILLER_WORDS,
} from "../src/shared/topic-interests.js";

describe("Time-decayed topic map", () => {
  it("returns declared profile interests as long-term topics", async () => {
    const response = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-001");

    expect(response.status).toBe(200);
    expect(response.body.topicMap).toContainEqual(
      expect.objectContaining({
        topic: "fintech",
        score: 0.6,
        longTermWeight: 1,
        shortTermWeight: 0,
        hasInferredSignals: false,
      })
    );
  });

  it("never infers topics from direct message content", async () => {
    await new Message({
      _id: "msg-private-topic-test",
      conversationId: "conv-private-topic-test",
      senderId: "usr-student-001",
      text: "confidential orbital mechanics discussion",
    }).save();

    const response = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-001");

    expect(response.status).toBe(200);
    expect(response.body.topicMap.some((entry: any) => entry.topic.includes("orbital"))).toBe(false);
  });

  it("records a save once and uses its topic affinity in feed ranking", async () => {
    const initialFeed = await request(app)
      .get("/api/feed?mode=baseline")
      .set("X-User-Id", "usr-student-002");
    const initialPost = initialFeed.body.items.find(
      (item: any) => item.post.id === "post-public-001"
    );

    const firstSave = await request(app)
      .post("/api/posts/post-public-001/interactions")
      .set("X-User-Id", "usr-student-002")
      .send({ type: "save" });
    const repeatedSave = await request(app)
      .post("/api/posts/post-public-001/interactions")
      .set("X-User-Id", "usr-student-002")
      .send({ type: "save" });

    expect(firstSave.status).toBe(200);
    expect(repeatedSave.status).toBe(200);
    const fintech = await UserTopicInterest.findOne({
      userId: "usr-student-002",
      topic: "fintech",
    });
    expect(fintech?.signals).toHaveLength(1);

    const topicMap = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-002");
    const fintechTopic = topicMap.body.topicMap.find((entry: any) => entry.topic === "fintech");
    expect(fintechTopic.score).toBe(0.32);
    expect(fintechTopic.shortTermWeight).toBe(0.8);
    expect(fintechTopic.hasInferredSignals).toBe(true);

    const updatedFeed = await request(app)
      .get("/api/feed?mode=baseline")
      .set("X-User-Id", "usr-student-002");
    const updatedPost = updatedFeed.body.items.find(
      (item: any) => item.post.id === "post-public-001"
    );
    expect(initialPost).toBeDefined();
    expect(updatedPost.score).toBeGreaterThan(initialPost.score);
    expect(updatedPost.explanation).toContain('topic affinity "fintech" (32%)');
  });

  it("records searches once per topic per day and supports resetting inferred signals", async () => {
    const search = await request(app)
      .get("/api/discover/people?q=quantum+computing")
      .set("X-User-Id", "usr-alumnus-001");
    expect(search.status).toBe(200);

    const mapAfterSearch = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-alumnus-001");
    const searchedTopic = mapAfterSearch.body.topicMap.find(
      (entry: any) => entry.topic === "quantum computing"
    );
    expect(searchedTopic.score).toBe(0.16);
    expect(searchedTopic.shortTermWeight).toBe(0.4);

    await request(app)
      .get("/api/discover/people?q=quantum+computing")
      .set("X-User-Id", "usr-alumnus-001");
    const signals = await UserTopicInterest.findOne({
      userId: "usr-alumnus-001",
      topic: "quantum computing",
    });
    expect(signals?.signals).toHaveLength(1);

    const reset = await request(app)
      .post("/api/me/topic-map/reset")
      .set("X-User-Id", "usr-alumnus-001");
    expect(reset.status).toBe(200);

    const mapAfterReset = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-alumnus-001");
    expect(mapAfterReset.body.topicMap.some((entry: any) => entry.topic === "quantum computing")).toBe(false);
    expect(mapAfterReset.body.topicMap.some((entry: any) => entry.topic === "fintech")).toBe(true);
  });

  it("records published topic labels, comments, reactions, and decays signals over time", async () => {
    const publishedPost = await request(app)
      .post("/api/posts")
      .set("X-User-Id", "usr-student-002")
      .send({
        text: "Researching temporal algorithms.",
        topicLabels: ["Temporal Algorithms"],
      });
    expect(publishedPost.status).toBe(201);

    const comment = await request(app)
      .post("/api/posts/post-public-001/comments")
      .set("X-User-Id", "usr-student-002")
      .send({ text: "Thanks for sharing these details!" });
    expect(comment.status).toBe(201);

    const reaction = await request(app)
      .post("/api/posts/post-public-001/interactions")
      .set("X-User-Id", "usr-student-002")
      .send({ type: "like" });
    expect(reaction.status).toBe(200);

    const currentMap = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-002");
    expect(currentMap.body.topicMap).toContainEqual(
      expect.objectContaining({ topic: "temporal algorithms", shortTermWeight: 0.6 })
    );
    const fintech = currentMap.body.topicMap.find((entry: any) => entry.topic === "fintech");
    expect(fintech.shortTermWeight).toBe(0.85);

    const occurredAt = new Date(Date.now() - 14 * 86_400_000);
    await recordTopicSignal(
      "usr-student-002",
      "Old Search",
      "search",
      "search:old-search:test",
      occurredAt
    );
    const decayedMap = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-002");
    const oldSearch = decayedMap.body.topicMap.find(
      (entry: any) => entry.topic === "old search"
    );
    expect(oldSearch.score).toBe(Math.round(0.4 * Math.exp(-0.08 * 14) * 0.4 * 100) / 100);
    expect(oldSearch.shortTermWeight).toBe(Math.round(0.4 * Math.exp(-0.08 * 14) * 100) / 100);
  });

  it("records topic follows, supports muting, and removes unfollowed-only topics", async () => {
    const follow = await request(app)
      .post("/api/follows")
      .set("X-User-Id", "usr-student-002")
      .send({ targetType: "topic", targetId: "Temporal Databases" });
    expect(follow.status).toBe(201);

    const followedMap = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-002");
    expect(followedMap.body.topicMap).toContainEqual(
      expect.objectContaining({ topic: "temporal databases", score: 0.6, longTermWeight: 1 })
    );

    const unfollow = await request(app)
      .delete("/api/follows/topic/Temporal%20Databases")
      .set("X-User-Id", "usr-student-002");
    expect(unfollow.status).toBe(200);

    const unfollowedMap = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-002");
    expect(unfollowedMap.body.topicMap.some((entry: any) => entry.topic === "temporal databases")).toBe(false);

    await request(app)
      .post("/api/follows")
      .set("X-User-Id", "usr-student-002")
      .send({ targetType: "topic", targetId: "Python" });
    await request(app)
      .delete("/api/follows/topic/Python")
      .set("X-User-Id", "usr-student-002");
    const explicitTopicMap = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-002");
    expect(explicitTopicMap.body.topicMap).toContainEqual(
      expect.objectContaining({ topic: "python", score: 0.6, longTermWeight: 1 })
    );

    const mute = await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: ["Fintech"] });
    expect(mute.status).toBe(200);

    const mutedMap = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", "usr-student-001");
    expect(mutedMap.body.topicMap).toContainEqual(
      expect.objectContaining({ topic: "fintech", muted: true })
    );

    const feed = await request(app)
      .get("/api/feed")
      .set("X-User-Id", "usr-student-001");
    expect(feed.body.items.some((item: any) => item.post.topicLabels.includes("Fintech"))).toBe(false);

    const unmute = await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: [] });
    expect(unmute.status).toBe(200);
  });
});

describe("Topic Noun Validation & 15-Topic Cardinality Cap", () => {
  it("validates legitimate single-word and multi-word domain nouns", () => {
    // Valid single nouns
    expect(isValidTopicNoun("kubernetes")).toBe(true);
    expect(isValidTopicNoun("databases")).toBe(true);
    expect(isValidTopicNoun("fintech")).toBe(true);
    expect(isValidTopicNoun("robotics")).toBe(true);
    expect(isValidTopicNoun("python")).toBe(true);

    // Valid 2 to 3 word technical noun phrases
    expect(isValidTopicNoun("machine learning")).toBe(true);
    expect(isValidTopicNoun("distributed systems")).toBe(true);
    expect(isValidTopicNoun("quantum computing")).toBe(true);
    expect(isValidTopicNoun("natural language processing")).toBe(true);
    expect(isValidTopicNoun("cloud infrastructure")).toBe(true);

    // Technical naming conventions with symbols (. - # +)
    expect(isValidTopicNoun("c++")).toBe(true);
    expect(isValidTopicNoun("c#")).toBe(true);
    expect(isValidTopicNoun("node.js")).toBe(true);
    expect(isValidTopicNoun(".net")).toBe(true);
    expect(isValidTopicNoun("web3")).toBe(true);
  });

  it("strictly rejects bogus filler words, conversational slang, pronouns, and verbs", () => {
    // Single bogus filler words
    expect(isValidTopicNoun("stuff")).toBe(false);
    expect(isValidTopicNoun("really")).toBe(false);
    expect(isValidTopicNoun("today")).toBe(false);
    expect(isValidTopicNoun("awesome")).toBe(false);
    expect(isValidTopicNoun("things")).toBe(false);
    expect(isValidTopicNoun("cool")).toBe(false);
    expect(isValidTopicNoun("hello")).toBe(false);
    expect(isValidTopicNoun("lol")).toBe(false);
    expect(isValidTopicNoun("update")).toBe(false);
    expect(isValidTopicNoun("doing")).toBe(false);
    expect(isValidTopicNoun("please")).toBe(false);

    // Compound phrases containing bogus words
    expect(isValidTopicNoun("really cool ml")).toBe(false);
    expect(isValidTopicNoun("awesome stuff")).toBe(false);
    expect(isValidTopicNoun("today update")).toBe(false);
    expect(isValidTopicNoun("good things")).toBe(false);
  });

  it("strictly rejects sentences, phrases > 3 words, pure digits, and punctuation noise", () => {
    // Phrases with > 3 words
    expect(isValidTopicNoun("this is a very long sentence about coding")).toBe(false);
    expect(isValidTopicNoun("machine learning in the modern world today")).toBe(false);

    // Pure numbers
    expect(isValidTopicNoun("12345")).toBe(false);
    expect(isValidTopicNoun("42")).toBe(false);

    // Pure punctuation / symbols
    expect(isValidTopicNoun("???")).toBe(false);
    expect(isValidTopicNoun("---")).toBe(false);
    expect(isValidTopicNoun("!@#$")).toBe(false);

    // Under-length or empty
    expect(isValidTopicNoun("a")).toBe(false);
    expect(isValidTopicNoun("")).toBe(false);
    expect(isValidTopicNoun("   ")).toBe(false);

    // Over 35 characters
    expect(isValidTopicNoun("supercalifragilisticexpialidociousengineering")).toBe(false);
  });

  it("enforces a strict maximum cap of 15 entries in getUserTopicMap sorted by highest score", async () => {
    // Populate user with 20 distinct valid topics
    const twentyTopics = [
      "kubernetes", "databases", "fintech", "robotics", "python",
      "machine learning", "distributed systems", "quantum computing", "natural language processing", "cloud infrastructure",
      "bioengineering", "genetics", "bioinformatics", "data science", "cybersecurity",
      "cryptography", "deep learning", "embedded systems", "computer vision", "microservices"
    ];

    // Seed UserTopicInterest with 20 topics with incrementing weights
    const userId = "usr-student-003";
    for (let i = 0; i < twentyTopics.length; i++) {
      await UserTopicInterest.findOneAndUpdate(
        { userId, topic: twentyTopics[i] },
        {
          $set: {
            longTermWeight: 1,
            shortTermWeight: (i + 1) * 0.05,
            lastInteractedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    const res = await request(app)
      .get("/api/me/topic-map")
      .set("X-User-Id", userId);

    expect(res.status).toBe(200);
    // Must be capped at exactly MAX_TOPIC_MAP_ENTRIES (15)
    expect(res.body.topicMap.length).toBeLessThanOrEqual(MAX_TOPIC_MAP_ENTRIES);
    expect(res.body.topicMap.length).toBe(15);

    // Verify sort order: descending score
    const scores = res.body.topicMap.map((t: any) => t.score);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });

  it("PATCH /api/me/interests rejects bogus filler words and allows valid nouns", async () => {
    // 1. Sending bogus filler words is rejected with 400
    const failRes = await request(app)
      .patch("/api/me/interests")
      .set("X-User-Id", "usr-student-001")
      .send({ interests: ["AI", "awesome stuff"] });

    expect(failRes.status).toBe(400);
    expect(failRes.body.error.message).toContain("not a valid topic noun");

    // 2. Sending valid nouns succeeds with 200
    const successRes = await request(app)
      .patch("/api/me/interests")
      .set("X-User-Id", "usr-student-001")
      .send({ interests: ["AI", "Fintech", "Distributed Systems"] });

    expect(successRes.status).toBe(200);
    expect(successRes.body.interests).toEqual(["AI", "Fintech", "Distributed Systems"]);
  });

  it("POST /api/posts ignores bogus filler topicLabels and only retains valid noun topics", async () => {
    const postRes = await request(app)
      .post("/api/posts")
      .set("X-User-Id", "usr-student-001")
      .send({
        text: "Testing topic label sanitization in post creation.",
        topicLabels: ["Distributed Systems", "really", "cool stuff", "Machine Learning"],
      });

    expect(postRes.status).toBe(201);
    // Only the valid nouns remain
    expect(postRes.body.post.topicLabels).toEqual(["Distributed Systems", "Machine Learning"]);
  });
});
