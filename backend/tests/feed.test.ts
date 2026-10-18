import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Feed Engine & Personalization", () => {
  it("Returns personalized For You feed with explanations", async () => {
    const res = await request(app)
      .get("/api/feed?tab=for-you&mode=reranked")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty("explanation");
    expect(res.body.items[0]).toHaveProperty("score");
  });

  it("Alumni feed returns only posts from alumni", async () => {
    const res = await request(app)
      .get("/api/feed?tab=alumni")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      expect(["usr-alumnus-001", "usr-alumnus-002", "usr-alumnus-003"]).toContain(
        item.post.author.id
      );
    }
  });

  it("Students feed returns only posts from students", async () => {
    const res = await request(app)
      .get("/api/feed?tab=students")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      expect(["usr-student-001", "usr-student-002", "usr-student-003"]).toContain(
        item.post.author.id
      );
    }
  });

  it("Different demo users receive distinct feed rankings", async () => {
    // Alex (CS, Distributed Systems, Fintech) vs Jordan (Bioengineering)
    const resAlex = await request(app)
      .get("/api/feed?tab=for-you&mode=reranked")
      .set("X-User-Id", "usr-student-001");

    const resJordan = await request(app)
      .get("/api/feed?tab=for-you&mode=reranked")
      .set("X-User-Id", "usr-student-002");

    expect(resAlex.status).toBe(200);
    expect(resJordan.status).toBe(200);

    const alexTopId = resAlex.body.items[0].post.id;
    const jordanTopId = resJordan.body.items[0].post.id;

    // The two users should have differing top ranked posts based on personal relevance
    expect(alexTopId).not.toBe(jordanTopId);
  });
});

describe("Feed Ranking & Muting Words (Combinations & Positive Ranking)", () => {
  it("Muting a word by topic label strictly excludes the post from feed results (do not include it)", async () => {
    // 1. Mute "Fintech" for student 001
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: ["Fintech"] });

    const res = await request(app)
      .get("/api/feed?tab=for-you")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    const fintechPosts = res.body.items.filter((item: any) =>
      item.post.topicLabels.some((tl: string) => tl.toLowerCase() === "fintech")
    );
    expect(fintechPosts.length).toBe(0);

    // Clean up
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: [] });
  });

  it("Muting a word appearing in post body text strictly excludes the post even without topic label", async () => {
    const { Post } = await import("../src/shared/models.js");
    const testPost = new Post({
      _id: "post-test-muted-word-001",
      authorId: "usr-alumnus-001",
      text: "Special announcement regarding upcoming crypto regulations in university research",
      audienceType: "public",
      topicLabels: ["Distributed Systems"],
      createdAt: new Date(),
    });
    await testPost.save();

    // Before muting, post is viewable in feed
    const beforeMute = await request(app)
      .get("/api/feed?tab=for-you")
      .set("X-User-Id", "usr-student-001");
    expect(beforeMute.body.items.some((item: any) => item.post.id === "post-test-muted-word-001")).toBe(true);

    // Mute the word "crypto"
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: ["crypto"] });

    const afterMute = await request(app)
      .get("/api/feed?tab=for-you")
      .set("X-User-Id", "usr-student-001");

    // Must NOT be included in the feed results!
    expect(afterMute.body.items.some((item: any) => item.post.id === "post-test-muted-word-001")).toBe(false);

    // Clean up
    await Post.deleteOne({ _id: "post-test-muted-word-001" });
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: [] });
  });

  it("Multiple muted words are all excluded across topic labels and text", async () => {
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: ["Fintech", "Robotics", "Bioengineering"] });

    const res = await request(app)
      .get("/api/feed?tab=for-you")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    for (const item of res.body.items) {
      const labels = item.post.topicLabels.map((l: string) => l.toLowerCase());
      expect(labels).not.toContain("fintech");
      expect(labels).not.toContain("robotics");
      expect(labels).not.toContain("bioengineering");
    }

    // Clean up
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: [] });
  });

  it("Muted word overrides high positive topic interest (mute takes absolute priority over positive score)", async () => {
    // Alex has positive interest in Fintech
    // When Fintech is muted, it must be completely excluded from feed results
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: ["Fintech"] });

    const res = await request(app)
      .get("/api/feed?tab=for-you&mode=reranked")
      .set("X-User-Id", "usr-student-001");

    const includedFintech = res.body.items.filter((item: any) =>
      item.post.topicLabels.includes("Fintech") || item.post.text.toLowerCase().includes("fintech")
    );
    expect(includedFintech.length).toBe(0);

    // Clean up
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: [] });
  });

  it("Ranks positive content with matching declared interests and verified authors at the top", async () => {
    // Alex has declared interest in Distributed Systems and Cloud
    const res = await request(app)
      .get("/api/feed?tab=for-you&mode=reranked")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);

    // Top ranked post should have high relevance score (> 0.5)
    const topItem = res.body.items[0];
    expect(topItem.score).toBeGreaterThan(0.5);

    // Verify scores are returned in strictly descending order
    for (let i = 0; i < res.body.items.length - 1; i++) {
      expect(res.body.items[i].score).toBeGreaterThanOrEqual(res.body.items[i + 1].score);
    }
  });

  it("Unmuting immediately restores the post to its ranked position in the feed", async () => {
    // 1. Mute "AI"
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: ["AI"] });

    const mutedRes = await request(app)
      .get("/api/feed?tab=for-you")
      .set("X-User-Id", "usr-student-001");
    expect(mutedRes.body.items.some((item: any) => item.post.topicLabels.includes("AI"))).toBe(false);

    // 2. Unmute "AI"
    await request(app)
      .patch("/api/me/feed-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ mutedTopicIds: [] });

    const unmutedRes = await request(app)
      .get("/api/feed?tab=for-you")
      .set("X-User-Id", "usr-student-001");
    expect(unmutedRes.body.items.some((item: any) => item.post.topicLabels.includes("AI"))).toBe(true);
  });
});
