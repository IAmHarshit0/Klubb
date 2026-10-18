import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  Affiliation,
  EmploymentClaim,
  Institution,
  Organisation,
  OrganisationRepresentative,
  RoleAssignment,
  RoleDefinition,
} from "../src/shared/models.js";

describe("Institutional Governance, Announcements & Organisation Verification", () => {
  it("keeps role definition and assignment actions Super Admin-only and institution-scoped", async () => {
    const deniedDefinition = await request(app)
      .post("/api/institutions/inst-apex-001/roles")
      .set("X-User-Id", "usr-student-001")
      .send({ name: "Unauthorized role", permissions: ["create_community"] });
    expect(deniedDefinition.status).toBe(403);

    const roleResponse = await request(app)
      .post("/api/institutions/inst-apex-001/roles")
      .set("X-User-Id", "usr-admin-001")
      .send({ name: "Community Officer", permissions: ["create_community"] });
    expect(roleResponse.status).toBe(201);

    const roleDefinitionId = roleResponse.body.roleDefinition._id;
    const assignResponse = await request(app)
      .post("/api/institutions/inst-apex-001/role-assignments")
      .set("X-User-Id", "usr-admin-001")
      .send({ userId: "usr-student-001", roleDefinitionId });
    expect(assignResponse.status).toBe(201);

    const duplicateAssignment = await request(app)
      .post("/api/institutions/inst-apex-001/role-assignments")
      .set("X-User-Id", "usr-admin-001")
      .send({ userId: "usr-student-001", roleDefinitionId });
    expect(duplicateAssignment.status).toBe(409);

    const userRoles = await request(app)
      .get("/api/me")
      .set("X-User-Id", "usr-student-001");
    expect(userRoles.body.user.institutionRoles).toContainEqual(
      expect.objectContaining({
        institutionId: "inst-apex-001",
        name: "Community Officer",
        permissions: ["create_community"],
      })
    );
  });

  it("Only assigned verification officers can verify an affiliation and the current user receives role permissions", async () => {
    // Unverify Alex first
    await Affiliation.findByIdAndUpdate("aff-alex-001", { verificationStatus: "unverified" });

    const deniedResponse = await request(app)
      .post("/api/institutions/inst-apex-001/affiliations/aff-alex-001/verification")
      .set("X-User-Id", "usr-student-002")
      .send({ status: "institution-verified" });
    expect(deniedResponse.status).toBe(403);

    const res = await request(app)
      .post("/api/institutions/inst-apex-001/affiliations/aff-alex-001/verification")
      .set("X-User-Id", "usr-officer-001")
      .send({ status: "institution-verified" });

    expect(res.status).toBe(200);
    expect(res.body.affiliation.verificationStatus).toBe("institution-verified");

    const meResponse = await request(app)
      .get("/api/me")
      .set("X-User-Id", "usr-officer-001");
    expect(meResponse.body.user.institutionRoles).toContainEqual(
      expect.objectContaining({
        institutionId: "inst-apex-001",
        name: "Verification & Placement Officer",
        permissions: expect.arrayContaining(["verify_affiliation", "create_community"]),
      })
    );
  });

  it("Institution publishes an announcement and recipient retrieves it", async () => {
    const postRes = await request(app)
      .post("/api/institutions/inst-apex-001/announcements")
      .set("X-User-Id", "usr-officer-001")
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

    // An ordinary student cannot verify an organisation.
    const deniedVerification = await request(app)
      .patch(`/api/organisations/${orgId}/verification`)
      .set("X-User-Id", "usr-student-001")
      .send({ verificationStatus: "verified" });
    expect(deniedVerification.status).toBe(403);

    // Assigned verification officer verifies the organisation.
    const patchRes = await request(app)
      .patch(`/api/organisations/${orgId}/verification`)
      .set("X-User-Id", "usr-officer-001")
      .send({ verificationStatus: "verified" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.organisation.verificationStatus).toBe("verified");
  });

  it("Seeds multi-institution identities, super admins, delegated roles, and an unverified company representative", async () => {
    const institutions = await Institution.find();
    expect(institutions.map((institution) => institution._id)).toEqual(
      expect.arrayContaining(["inst-apex-001", "inst-northstar-002"])
    );

    const activeAffiliations = await Affiliation.find({
      status: "active",
      verificationStatus: "institution-verified",
    });
    expect(activeAffiliations.filter((affiliation) => affiliation.role === "Student").length)
      .toBeGreaterThanOrEqual(2);
    const verifiedAlumniByUser = new Map<string, number>();
    for (const affiliation of activeAffiliations.filter((item) => item.role === "Alumnus")) {
      verifiedAlumniByUser.set(
        affiliation.userId,
        (verifiedAlumniByUser.get(affiliation.userId) || 0) + 1
      );
    }
    expect(Array.from(verifiedAlumniByUser.values())).toContain(1);

    const multiInstitutionAlumnus = await Affiliation.find({
      userId: "usr-alumnus-multi-001",
      status: "active",
    });
    expect(multiInstitutionAlumnus).toHaveLength(2);
    expect(multiInstitutionAlumnus.every(
      (affiliation) =>
        affiliation.role === "Alumnus" &&
        affiliation.verificationStatus === "institution-verified"
    )).toBe(true);

    const dualRoleAffiliations = await Affiliation.find({
      userId: "usr-dual-role-001",
      status: "active",
    });
    expect(dualRoleAffiliations.map((affiliation) => [
      affiliation.institutionId,
      affiliation.role,
      affiliation.verificationStatus,
    ])).toEqual(expect.arrayContaining([
      ["inst-apex-001", "Alumnus", "institution-verified"],
      ["inst-northstar-002", "Student", "institution-verified"],
    ]));

    const admins = await Affiliation.find({
      role: "Admin",
      status: "active",
      verificationStatus: "institution-verified",
    });
    expect(admins.map((affiliation) => [affiliation.userId, affiliation.institutionId])).toEqual(
      expect.arrayContaining([
        ["usr-admin-001", "inst-apex-001"],
        ["usr-admin-northstar-001", "inst-northstar-002"],
      ])
    );

    const customRoles = await RoleDefinition.find({
      createdBy: { $in: ["usr-admin-001", "usr-admin-northstar-001"] },
    });
    const assignments = await RoleAssignment.find({ status: "active" });
    expect(customRoles.length).toBeGreaterThanOrEqual(3);
    expect(assignments.map((assignment) => [
      assignment.userId,
      assignment.roleDefinitionId,
      assignment.assignedBy,
    ])).toEqual(expect.arrayContaining([
      ["usr-officer-001", "role-verif-officer", "usr-admin-001"],
      ["usr-officer-northstar-001", "role-northstar-community-lead", "usr-admin-northstar-001"],
    ]));

    expect(await Affiliation.countDocuments({ userId: "usr-company-rep-001" })).toBe(0);
    expect(await EmploymentClaim.findOne({ userId: "usr-company-rep-001" })).toMatchObject({
      companyName: "BrightPath Labs",
      status: "self-reported",
    });
    expect(await Organisation.findById("org-brightpath-labs")).toMatchObject({
      verificationStatus: "unverified",
    });
    expect(await OrganisationRepresentative.findById("rep-avery-brightpath")).toMatchObject({
      userId: "usr-company-rep-001",
      verificationStatus: "pending",
    });
  });
});
