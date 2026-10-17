import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Conversation, Connection } from "../src/shared/models.js";

describe("Connections & Messaging Gates", () => {
  it("Pending connection cannot send private messages (403 Forbidden)", async () => {
    // Alex and Priya have a pending connection
    const [p1, p2] = ["usr-student-001", "usr-alumnus-001"].sort();
    let conv = await Conversation.findOne({ conversationKey: `${p1}_${p2}` });
    if (!conv) {
      conv = new Conversation({
        _id: "conv-alex-priya",
        conversationKey: `${p1}_${p2}`,
        participantIds: [p1, p2],
      });
      await conv.save();
    }

    const res = await request(app)
      .post(`/api/conversations/${conv._id}/messages`)
      .set("X-User-Id", "usr-student-001")
      .send({ text: "Hi Priya, can I ask you a question?" });

    expect(res.status).toBe(403);
    expect(res.body.error.message.toLowerCase()).toContain("accepted connection");
  });

  it("Accepted connection unlocks private messaging", async () => {
    // Priya accepts Alex's connection request
    const acceptRes = await request(app)
      .patch("/api/connections/conn-alex-priya")
      .set("X-User-Id", "usr-alumnus-001")
      .send({ status: "accepted" });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.connection.status).toBe("accepted");

    const [p1, p2] = ["usr-student-001", "usr-alumnus-001"].sort();
    const conv = await Conversation.findOne({ conversationKey: `${p1}_${p2}` });
    expect(conv).not.toBeNull();

    // Now Alex can message Priya
    const msgRes = await request(app)
      .post(`/api/conversations/${conv!._id}/messages`)
      .set("X-User-Id", "usr-student-001")
      .send({ text: "Hi Priya, thanks for connecting!" });

    expect(msgRes.status).toBe(201);
    expect(msgRes.body.message.text).toBe("Hi Priya, thanks for connecting!");

    // Priya can retrieve the message
    const getRes = await request(app)
      .get(`/api/conversations/${conv!._id}/messages`)
      .set("X-User-Id", "usr-alumnus-001");

    expect(getRes.status).toBe(200);
    expect(getRes.body.messages.length).toBe(1);

    // Third party (Dr. Vance) CANNOT access private messages
    const thirdPartyRes = await request(app)
      .get(`/api/conversations/${conv!._id}/messages`)
      .set("X-User-Id", "usr-faculty-001");

    expect(thirdPartyRes.status).toBe(403);
  });
});
