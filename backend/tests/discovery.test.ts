import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Professional Discovery & Verification", () => {
  it("Student can discover alumnus by company and role", async () => {
    const res = await request(app)
      .get("/api/discover/people?company=Stripe&role=Alumnus")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThanOrEqual(1);

    const priya = res.body.results.find((u: any) => u.name === "Priya Sharma");
    expect(priya).toBeDefined();
    expect(priya.employmentClaims[0].companyName).toBe("Stripe");
    expect(priya.employmentClaims[0].status).toBe("employer-verified");
  });

  it("Profile responses distinguish employer-verified vs self-reported", async () => {
    // Priya is employer-verified
    const resPriya = await request(app)
      .get("/api/users/usr-alumnus-001")
      .set("X-User-Id", "usr-student-001");

    expect(resPriya.status).toBe(200);
    expect(resPriya.body.employmentClaims[0].status).toBe("employer-verified");
    expect(resPriya.body.affiliations[0].verificationStatus).toBe("institution-verified");

    // Marcus is self-reported
    const resMarcus = await request(app)
      .get("/api/users/usr-alumnus-002")
      .set("X-User-Id", "usr-student-001");

    expect(resMarcus.status).toBe(200);
    expect(resMarcus.body.employmentClaims[0].status).toBe("self-reported");
  });
});
