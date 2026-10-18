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

  it("Submitting a group access request sends a notification message to the institution superadmin", async () => {
    // Maya Patel requests access to Robotics Club
    const reqRes = await request(app)
      .post("/api/groups/grp-robotics-club/access-requests")
      .set("X-User-Id", "usr-student-003")
      .send();

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.request).toBeDefined();
    expect(reqRes.body.request.status).toBe("pending");

    // Dean Robert Sterling (Superadmin) checks /api/conversations
    const convsRes = await request(app)
      .get("/api/conversations")
      .set("X-User-Id", "usr-admin-001");

    expect(convsRes.status).toBe(200);
    const conversations = convsRes.body.conversations;
    const adminStudentConv = conversations.find((c: any) =>
      c.participantIds.includes("usr-student-003")
    );
    expect(adminStudentConv).toBeDefined();

    // Dean Robert Sterling checks messages in this conversation
    const msgsRes = await request(app)
      .get(`/api/conversations/${adminStudentConv.id}/messages`)
      .set("X-User-Id", "usr-admin-001");

    expect(msgsRes.status).toBe(200);
    const msgs = msgsRes.body.messages;
    expect(msgs.length).toBeGreaterThan(0);
    const alertMsg = msgs.find((m: any) =>
      m.text.includes("[Group Access Request]") &&
      m.text.includes("Apex AI & Robotics Club") &&
      m.text.includes("Maya Patel")
    );
    expect(alertMsg).toBeDefined();

    // Superadmin can reply directly to student without connection restriction
    const replyRes = await request(app)
      .post(`/api/conversations/${adminStudentConv.id}/messages`)
      .set("X-User-Id", "usr-admin-001")
      .send({ text: "Hello Maya, your access request has been noted and is being reviewed." });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.message.text).toContain("Hello Maya");
  });
});

