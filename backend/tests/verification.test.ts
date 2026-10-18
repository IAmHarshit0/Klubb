import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  OrganizationRegistration,
  AffiliationRequest,
  Affiliation,
  Notification,
} from "../src/shared/models.js";

describe("Organization Onboarding, Platform Verifier & Affiliation Verification", () => {
  it("rejects non-verifier access to platform verification queue and allows verifier", async () => {
    // Ordinary student cannot access platform verification queue
    const denied = await request(app)
      .get("/api/admin/organization-registrations")
      .set("X-User-Id", "usr-student-001");
    expect(denied.status).toBe(403);

    // Platform Verifier accesses queue
    const allowed = await request(app)
      .get("/api/admin/organization-registrations")
      .set("X-User-Id", "usr-verifier-001");
    expect(allowed.status).toBe(200);
    expect(Array.isArray(allowed.body.registrations)).toBe(true);
    expect(allowed.body.registrations.length).toBeGreaterThanOrEqual(1);
  });

  it("allows submitting organization registration and verifier approves with identifier", async () => {
    // Representative submits onboarding request
    const regRes = await request(app)
      .post("/api/organization-registrations")
      .set("X-User-Id", "usr-alumnus-001")
      .send({
        name: "Stanford Applied AI Labs",
        type: "institution",
        website: "https://ai.stanford.edu",
        officialEmail: "contact@ai.stanford.edu",
        representativeName: "Dr. Chris Manning",
        description: "Frontier research in NLP and foundation models.",
        evidence: "Official Stanford Laboratory accreditation documentation",
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.registration.status).toBe("pending");
    const regId = regRes.body.registration._id;

    // Verifier reviews and approves with identifier
    const approveRes = await request(app)
      .patch(`/api/admin/organization-registrations/${regId}`)
      .set("X-User-Id", "usr-verifier-001")
      .send({
        status: "approved",
        assignedIdentifier: "SAIL",
        reviewReason: "Verified university domain and accreditation documents.",
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.registration.status).toBe("approved");
    expect(approveRes.body.registration.assignedIdentifier).toBe("SAIL");
  });

  it("platform verifier appoints initial Super Admin for an approved organization", async () => {
    // Non-verifier cannot appoint super admin
    const deniedAppoint = await request(app)
      .post("/api/admin/organizations/inst-apex-001/appoint-super-admin")
      .set("X-User-Id", "usr-student-001")
      .send({ userId: "usr-alumnus-002" });
    expect(deniedAppoint.status).toBe(403);

    // Platform Verifier appoints founding Super Admin
    const appointRes = await request(app)
      .post("/api/admin/organizations/inst-apex-001/appoint-super-admin")
      .set("X-User-Id", "usr-verifier-001")
      .send({ userId: "usr-alumnus-002", roleTitle: "Super Admin" });

    expect(appointRes.status).toBe(201);
    expect(appointRes.body.affiliation.role).toBe("Admin");
    expect(appointRes.body.affiliation.verificationStatus).toBe("institution-verified");
  });

  it("student submits affiliation request, duplicate is prevented, and officer approves it", async () => {
    // Alex Rivera already has approved request; Jordan Lee has pending request
    // Taylor Morgan submits request for Apex University as Alumnus
    const reqRes = await request(app)
      .post("/api/affiliation-requests")
      .set("X-User-Id", "usr-company-rep-001")
      .send({
        institutionId: "inst-northstar-002",
        role: "Alumnus",
        programme: "B.S. Computer Engineering",
        department: "Computer Engineering",
        batch: "2022",
        officialEmail: "avery@alumni.northstar.edu",
        evidence: "Diploma serial #NIT-2022-771",
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.request.status).toBe("pending");
    const requestId = reqRes.body.request._id;

    // Submitting duplicate pending request is prevented
    const duplicate = await request(app)
      .post("/api/affiliation-requests")
      .set("X-User-Id", "usr-company-rep-001")
      .send({
        institutionId: "inst-northstar-002",
        role: "Alumnus",
      });
    expect(duplicate.status).toBe(409);

    // Non-officer cannot view verification queue
    const queueDenied = await request(app)
      .get("/api/institutions/inst-northstar-002/verification-requests")
      .set("X-User-Id", "usr-student-001");
    expect(queueDenied.status).toBe(403);

    // Northstar Super Admin reviews and approves
    const queueRes = await request(app)
      .get("/api/institutions/inst-northstar-002/verification-requests")
      .set("X-User-Id", "usr-admin-northstar-001");
    expect(queueRes.status).toBe(200);

    const approveAffRes = await request(app)
      .patch(`/api/affiliation-requests/${requestId}`)
      .set("X-User-Id", "usr-admin-northstar-001")
      .send({
        status: "approved",
        reviewReason: "Confirmed alumni registry record",
      });

    expect(approveAffRes.status).toBe(200);
    expect(approveAffRes.body.request.status).toBe("approved");

    // Check that user now has active verified affiliation
    const aff = await Affiliation.findOne({
      userId: "usr-company-rep-001",
      institutionId: "inst-northstar-002",
      verificationStatus: "institution-verified",
    });
    expect(aff).not.toBeNull();
    expect(aff?.role).toBe("Alumnus");
  });

  it("retrieves distinct institutional metrics accurately", async () => {
    const metricsRes = await request(app)
      .get("/api/institutions/inst-apex-001/metrics")
      .set("X-User-Id", "usr-student-001");

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.metrics).toMatchObject({
      verifiedStudents: expect.any(Number),
      verifiedAlumni: expect.any(Number),
      verifiedFacultyStaff: expect.any(Number),
      activeGroups: expect.any(Number),
      pendingAffiliationRequests: expect.any(Number),
    });
    expect(metricsRes.body.metrics.verifiedStudents).toBeGreaterThanOrEqual(1);
    expect(metricsRes.body.metrics.verifiedAlumni).toBeGreaterThanOrEqual(1);
    expect(metricsRes.body.metrics.activeGroups).toBeGreaterThanOrEqual(5);
  });

  it("delivers in-app notifications and supports mark-as-read", async () => {
    const notifsRes = await request(app)
      .get("/api/notifications")
      .set("X-User-Id", "usr-student-001");

    expect(notifsRes.status).toBe(200);
    expect(Array.isArray(notifsRes.body.notifications)).toBe(true);
    expect(notifsRes.body.notifications.length).toBeGreaterThanOrEqual(1);

    const firstNotif = notifsRes.body.notifications[0];

    // Mark as read
    const patchRes = await request(app)
      .patch(`/api/notifications/${firstNotif._id}`)
      .set("X-User-Id", "usr-student-001")
      .send({ read: true });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.notification.read).toBe(true);

    // Read all
    const readAllRes = await request(app)
      .post("/api/notifications/read-all")
      .set("X-User-Id", "usr-student-001");

    expect(readAllRes.status).toBe(200);
  });
});
