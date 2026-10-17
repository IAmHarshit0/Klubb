import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Membership } from "../src/shared/models.js";

describe("Groups & Access Requests", () => {
  it("Non-supervisor cannot review access requests", async () => {
    // Jordan (student) tries to approve Alex's request to robotics club
    const res = await request(app)
      .patch("/api/group-access-requests/gar-alex-robotics")
      .set("X-User-Id", "usr-student-002")
      .send({ status: "approved" });

    expect(res.status).toBe(403);
  });

  it("Authorized supervisor can approve request and grant membership", async () => {
    // Dr. Vance (supervisor) approves Alex's request
    const res = await request(app)
      .patch("/api/group-access-requests/gar-alex-robotics")
      .set("X-User-Id", "usr-faculty-001")
      .send({ status: "approved" });

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe("approved");

    // Alex is now active member
    const mem = await Membership.findOne({
      userId: "usr-student-001",
      groupId: "grp-robotics-club",
    });
    expect(mem).not.toBeNull();
    expect(mem!.status).toBe("active");

    // Now Alex can view restricted post in feed
    const feedRes = await request(app)
      .get("/api/feed")
      .set("X-User-Id", "usr-student-001");

    const postIds = feedRes.body.items.map((i: any) => i.post.id);
    expect(postIds).toContain("post-restricted-robotics-001");
  });
});
