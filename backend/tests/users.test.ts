import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("Profile interests", () => {
  it("allows a student to save, normalize, and retrieve interests", async () => {
    const update = await request(app)
      .patch("/api/me/interests")
      .set("X-User-Id", "usr-student-001")
      .send({ interests: [" AI ", "AI", "", "Fintech"] });

    expect(update.status).toBe(200);
    expect(update.body.interests).toEqual(["AI", "Fintech"]);

    const get = await request(app)
      .get("/api/me/interests")
      .set("X-User-Id", "usr-student-001");

    expect(get.status).toBe(200);
    expect(get.body.declaredInterests).toEqual(["AI", "Fintech"]);
  });

  it("rejects non-string interest values", async () => {
    const response = await request(app)
      .patch("/api/me/interests")
      .set("X-User-Id", "usr-student-001")
      .send({ interests: ["AI", 42] });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Interests must be an array of strings");
  });

  it("restricts availability settings to non-student profiles (all others)", async () => {
    const studentProfile = await request(app)
      .get("/api/me")
      .set("X-User-Id", "usr-student-001");
    expect(studentProfile.status).toBe(200);
    expect(studentProfile.body.user).not.toHaveProperty("connectionPreferences");

    const studentPreferences = await request(app)
      .get("/api/me/connection-preferences")
      .set("X-User-Id", "usr-student-001");
    expect(studentPreferences.status).toBe(403);

    const studentUpdate = await request(app)
      .patch("/api/me/connection-preferences")
      .set("X-User-Id", "usr-student-001")
      .send({ availableForMentorship: false });
    expect(studentUpdate.status).toBe(403);

    const alumniPreferences = await request(app)
      .get("/api/me/connection-preferences")
      .set("X-User-Id", "usr-alumnus-001");
    expect(alumniPreferences.status).toBe(200);

    const facultyPreferences = await request(app)
      .get("/api/me/connection-preferences")
      .set("X-User-Id", "usr-faculty-001");
    expect(facultyPreferences.status).toBe(200);
  });
});
