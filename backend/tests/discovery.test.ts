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

describe("Alumni Network Needs-Based Ranking Engine", () => {
  it("ranks alumni based on student referral needs (availableForReferrals & employer-verified at target company Priya Sharma ranks #1)", async () => {
    // Student Alex discovers alumni at Stripe for referrals
    const res = await request(app)
      .get("/api/discover/alumni?intent=referral&company=Stripe")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThanOrEqual(1);

    // Priya Sharma (verified at Stripe, open for referrals, Apex alumna) must be ranked #1
    const topAlum = res.body.results[0];
    expect(topAlum.name).toBe("Priya Sharma");
    expect(topAlum.relevanceScore).toBeGreaterThanOrEqual(80);
    expect(topAlum.rankingReasons).toContain("Available for job referrals");
    expect(topAlum.rankingReasons).toContain("Employer-verified professional");
    expect(topAlum.rankingReasons.some((r: string) => r.includes("Stripe"))).toBe(true);
  });

  it("alumni with paused requests or disabled referrals are ranked lower than active referral-ready alumni", async () => {
    const res = await request(app)
      .get("/api/discover/alumni?intent=referral")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    const results = res.body.results;
    expect(results.length).toBeGreaterThan(1);

    // Find Marcus (usr-alumnus-002, who has referrals disabled in seed) and Priya (availableForReferrals: true)
    const priya = results.find((r: any) => r.id === "usr-alumnus-001");
    const marcus = results.find((r: any) => r.id === "usr-alumnus-002");

    if (priya && marcus) {
      expect(priya.relevanceScore).toBeGreaterThan(marcus.relevanceScore);
      expect(results.indexOf(priya)).toBeLessThan(results.indexOf(marcus));
    }
  });

  it("intent=mentorship prioritizes alumni who have mentorship enabled", async () => {
    const res = await request(app)
      .get("/api/discover/alumni?intent=mentorship")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    const top = res.body.results[0];
    expect(top.availability.mentorship).toBe(true);
    expect(top.rankingReasons).toContain("Available for mentorship");
  });

  it("discover/people also ranks results by needs with relevanceScore and rankingReasons for alumni viewers", async () => {
    const res = await request(app)
      .get("/api/discover/people?company=Stripe&intent=referral")
      .set("X-User-Id", "usr-alumnus-002");

    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThanOrEqual(1);
    expect(res.body.results[0]).toHaveProperty("relevanceScore");
    expect(res.body.results[0]).toHaveProperty("rankingReasons");
  });
});
