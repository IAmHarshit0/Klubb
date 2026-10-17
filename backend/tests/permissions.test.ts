import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Membership } from "../src/shared/models.js";

describe("Permissions & Security Gates", () => {
  it("Unauthorized user cannot view restricted group post in feed", async () => {
    // Alex (usr-student-001) is not member of robotics club
    const res = await request(app)
      .get("/api/feed")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    const postIds = res.body.items.map((item: any) => item.post.id);
    expect(postIds).not.toContain("post-restricted-robotics-001");
  });

  it("Authorized supervisor can view restricted group post in feed", async () => {
    // Dr. Vance (usr-faculty-001) is supervisor
    const res = await request(app)
      .get("/api/feed")
      .set("X-User-Id", "usr-faculty-001");

    expect(res.status).toBe(200);
    const postIds = res.body.items.map((item: any) => item.post.id);
    expect(postIds).toContain("post-restricted-robotics-001");
  });

  it("Unauthorized user cannot post to restricted group", async () => {
    const res = await request(app)
      .post("/api/groups/grp-robotics-club/posts")
      .set("X-User-Id", "usr-student-001")
      .send({ text: "Hello unauthorized post" });

    expect(res.status).toBe(403);
  });

  it("Blocking another user does not remove shared group membership", async () => {
    // Elena and Priya are both active members of grp-robotics-club
    const memBefore = await Membership.findOne({
      userId: "usr-alumnus-001",
      groupId: "grp-robotics-club",
    });
    expect(memBefore).not.toBeNull();

    // Elena blocks Priya
    const blockRes = await request(app)
      .post("/api/users/usr-alumnus-001/block")
      .set("X-User-Id", "usr-faculty-001");

    expect(blockRes.status).toBe(200);

    // Priya's group membership remains intact (Non-negotiable rule)
    const memAfter = await Membership.findOne({
      userId: "usr-alumnus-001",
      groupId: "grp-robotics-club",
    });
    expect(memAfter).not.toBeNull();
    expect(memAfter!.status).toBe("active");
  });
});
