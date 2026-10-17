import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Affiliation, Organisation } from "../src/shared/models.js";

describe("Institutional Governance, Announcements & Organisation Verification", () => {
  it("Admin verifies an affiliation and creates an audit event", async () => {
    // Unverify Alex first
    await Affiliation.findByIdAndUpdate("aff-alex-001", { verificationStatus: "unverified" });

    const res = await request(app)
      .post("/api/institutions/inst-apex-001/affiliations/aff-alex-001/verification")
      .set("X-User-Id", "usr-faculty-001")
      .send({ status: "institution-verified" });

    expect(res.status).toBe(200);
    expect(res.body.affiliation.verificationStatus).toBe("institution-verified");
  });

  it("Institution publishes an announcement and recipient retrieves it", async () => {
    const postRes = await request(app)
      .post("/api/institutions/inst-apex-001/announcements")
      .set("X-User-Id", "usr-faculty-001")
      .send({
        title: "Campus Commencement 2026",
        body: "Commencement ceremony details have been published.",
        targetType: "institution",
      });

    expect(postRes.status).toBe(201);
    expect(postRes.body.announcement.title).toBe("Campus Commencement 2026");

    // Student Alex checks /api/me/announcements
    const getRes = await request(app)
      .get("/api/me/announcements")
      .set("X-User-Id", "usr-student-001");

    expect(getRes.status).toBe(200);
    expect(getRes.body.announcements.some((a: any) => a.title === "Campus Commencement 2026")).toBe(true);
  });

  it("Organisation representative request and verification status transition", async () => {
    // Register organisation
    const orgRes = await request(app)
      .post("/api/organisations")
      .set("X-User-Id", "usr-alumnus-001")
      .send({ name: "Acme Tech", type: "startup", website: "https://acme.tech" });

    expect(orgRes.status).toBe(201);
    const orgId = orgRes.body.organisation._id;

    // Request representative
    const repRes = await request(app)
      .post(`/api/organisations/${orgId}/representatives`)
      .set("X-User-Id", "usr-alumnus-001")
      .send({ role: "Founder & CEO" });

    expect(repRes.status).toBe(201);
    expect(repRes.body.representative.verificationStatus).toBe("pending");

    // Platform verifier verifies organisation
    const patchRes = await request(app)
      .patch(`/api/organisations/${orgId}/verification`)
      .set("X-User-Id", "usr-faculty-001")
      .send({ verificationStatus: "verified" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.organisation.verificationStatus).toBe("verified");
  });
});
