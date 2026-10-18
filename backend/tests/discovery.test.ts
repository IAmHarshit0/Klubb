import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Professional Discovery & Verification", () => {
  it("restricts discovery and availability to verified alumni", async () => {
    const studentResponse = await request(app)
      .get("/api/discover/people?company=Stripe&role=Alumnus")
      .set("X-User-Id", "usr-student-001");

    expect(studentResponse.status).toBe(403);

    const alumniResponse = await request(app)
      .get("/api/discover/people?company=Stripe&role=Alumnus")
      .set("X-User-Id", "usr-alumnus-002");

    expect(alumniResponse.status).toBe(200);
    expect(alumniResponse.body.results.length).toBeGreaterThanOrEqual(1);

    const priya = alumniResponse.body.results.find((u: any) => u.name === "Priya Sharma");
    expect(priya).toBeDefined();
    expect(priya.employmentClaims[0].companyName).toBe("Stripe");
    expect(priya.employmentClaims[0].status).toBe("employer-verified");
    expect(priya.availability).toBeDefined();

    const dualRoleAlumniResponse = await request(app)
      .get("/api/discover/people")
      .set("X-User-Id", "usr-dual-role-001");
    expect(dualRoleAlumniResponse.status).toBe(200);

    const organisationsResponse = await request(app)
      .get("/api/discover/organisations")
      .set("X-User-Id", "usr-student-001");
    expect(organisationsResponse.status).toBe(403);

    const broadSearch = await request(app)
      .get("/api/discover/people")
      .set("X-User-Id", "usr-alumnus-002");
    expect(broadSearch.status).toBe(200);
    const studentResult = broadSearch.body.results.find((u: any) => u.id === "usr-student-001");
    expect(studentResult).toBeDefined();
    expect(studentResult).not.toHaveProperty("availability");
  });

  it("does not expose staff availability when the profile owner is not a verified alumnus", async () => {
    for (const [userId, name] of [
      ["usr-officer-001", "Sarah Jenkins"],
      ["usr-officer-northstar-001", "Noah Williams"],
    ]) {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set("X-User-Id", "usr-student-001");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
      expect(response.body.name).toBe(name);
      expect(response.body).not.toHaveProperty("availability");

      const alumniViewerResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set("X-User-Id", "usr-alumnus-001");
      expect(alumniViewerResponse.status).toBe(200);
      expect(alumniViewerResponse.body).not.toHaveProperty("availability");
    }
  });

  it("Profile responses distinguish employer-verified vs self-reported", async () => {
    // Priya is employer-verified
    const resPriya = await request(app)
      .get("/api/users/usr-alumnus-001")
      .set("X-User-Id", "usr-student-001");

    expect(resPriya.status).toBe(200);
    expect(resPriya.body.employmentClaims[0].status).toBe("employer-verified");
    expect(resPriya.body.affiliations[0].verificationStatus).toBe("institution-verified");
    expect(resPriya.body).not.toHaveProperty("availability");

    // Marcus is self-reported
    const resMarcus = await request(app)
      .get("/api/users/usr-alumnus-002")
      .set("X-User-Id", "usr-student-001");

    expect(resMarcus.status).toBe(200);
    expect(resMarcus.body.employmentClaims[0].status).toBe("self-reported");

    const alumniView = await request(app)
      .get("/api/users/usr-alumnus-001")
      .set("X-User-Id", "usr-alumnus-002");
    expect(alumniView.status).toBe(200);
    expect(alumniView.body.availability).toBeDefined();

    const studentProfileForAlumni = await request(app)
      .get("/api/users/usr-student-001")
      .set("X-User-Id", "usr-alumnus-002");
    expect(studentProfileForAlumni.status).toBe(200);
    expect(studentProfileForAlumni.body).not.toHaveProperty("availability");
  });
});
