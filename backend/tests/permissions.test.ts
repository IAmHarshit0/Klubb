import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { Membership } from "../src/shared/models.js";

describe("Permissions & Security Gates", () => {
  it("Unauthorized user cannot view restricted group post in feed", async () => {
    // Alex (usr-student-001) is not member of robotics club
    const res = await request(app)
      .get("/api/feed")
      .set("X-User-Id", "usr-student-001");

    expect(res.status).toBe(200);
    const postIds = res.body.items.map((item: any) => item.post.id);
    expect(postIds).not.toContain("post-restricted-robotics-001");
  });

  it("Authorized supervisor can view restricted group post in feed", async () => {
    // Dr. Vance (usr-faculty-001) is supervisor
    const res = await request(app)
      .get("/api/feed")
      .set("X-User-Id", "usr-faculty-001");

    expect(res.status).toBe(200);
    const postIds = res.body.items.map((item: any) => item.post.id);
    expect(postIds).toContain("post-restricted-robotics-001");
  });

  it("Unauthorized user cannot post to restricted group", async () => {
    const res = await request(app)
      .post("/api/groups/grp-robotics-club/posts")
      .set("X-User-Id", "usr-student-001")
      .send({ text: "Hello unauthorized post" });

    expect(res.status).toBe(403);
  });

  it("Blocking another user does not remove shared group membership", async () => {
    // Elena and Priya are both active members of grp-robotics-club
    const memBefore = await Membership.findOne({
      userId: "usr-alumnus-001",
      groupId: "grp-robotics-club",
    });
    expect(memBefore).not.toBeNull();

    // Elena blocks Priya
    const blockRes = await request(app)
      .post("/api/users/usr-alumnus-001/block")
      .set("X-User-Id", "usr-faculty-001");

    expect(blockRes.status).toBe(200);

    // Priya's group membership remains intact (Non-negotiable rule)
    const memAfter = await Membership.findOne({
      userId: "usr-alumnus-001",
      groupId: "grp-robotics-club",
    });
    expect(memAfter).not.toBeNull();
    expect(memAfter!.status).toBe("active");
  });

  it("Institution Superadmin has automatic administrative access to groups without requesting access", async () => {
    // Dean Robert Sterling (usr-admin-001) is superadmin for inst-apex-001
    const groupRes = await request(app)
      .get("/api/groups/grp-robotics-club")
      .set("X-User-Id", "usr-admin-001");

    expect(groupRes.status).toBe(200);
    expect(groupRes.body.isInstitutionAdmin).toBe(true);
    expect(groupRes.body.membership.role).toBe("admin");
    expect(groupRes.body.membership.isSuperAdmin).toBe(true);

    // Superadmin can directly view restricted group posts
    const postsRes = await request(app)
      .get("/api/groups/grp-robotics-club/posts")
      .set("X-User-Id", "usr-admin-001");

    expect(postsRes.status).toBe(200);
    expect(postsRes.body.posts.length).toBeGreaterThan(0);

    // Superadmin can directly post to the group without needing access request
    const createPostRes = await request(app)
      .post("/api/groups/grp-robotics-club/posts")
      .set("X-User-Id", "usr-admin-001")
      .send({ text: "Dean announcement: Annual lab equipment inspection scheduled." });

    expect(createPostRes.status).toBe(201);
  });

  it("Discovery feed excludes viewer's own posts and /api/posts/me retrieves them", async () => {
    // Alex (usr-student-001) publishes a post
    const createRes = await request(app)
      .post("/api/posts")
      .set("X-User-Id", "usr-student-001")
      .send({ text: "Self-authored test post by Alex", audienceType: "public", topicLabels: ["Testing"] });

    expect(createRes.status).toBe(201);
    const createdPostId = createRes.body.post._id;

    // In discovery feed, Alex's own post should NOT appear
    const feedRes = await request(app)
      .get("/api/feed")
      .set("X-User-Id", "usr-student-001");

    expect(feedRes.status).toBe(200);
    const feedPostIds = feedRes.body.items.map((i: any) => i.post.id);
    expect(feedPostIds).not.toContain(createdPostId);

    // In /api/posts/me, Alex can retrieve their own post
    const myPostsRes = await request(app)
      .get("/api/posts/me")
      .set("X-User-Id", "usr-student-001");

    expect(myPostsRes.status).toBe(200);
    const myPostIds = myPostsRes.body.posts.map((p: any) => p.id);
    expect(myPostIds).toContain(createdPostId);

    // Alex can delete their own post
    const deleteRes = await request(app)
      .delete(`/api/posts/${createdPostId}`)
      .set("X-User-Id", "usr-student-001");

    expect(deleteRes.status).toBe(200);
  });
});
