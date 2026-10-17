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
