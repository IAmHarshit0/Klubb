# Campus Network v3.0 Final Spec — Backend Implementation To-Do List

This is the tracking document for building and verifying the Node.js + TypeScript + Express + Socket.IO + MongoDB backend specified in `CampusNetwork_Final_Spec.docx`.

---

## Progress Overview

- [x] **Phase 0: Technical Specification & Skill Formulation**
  - [x] Extract and analyze `CampusNetwork_Final_Spec.docx` (v3.0)
  - [x] Formulate `.agent/skills/backend/SKILL.md` and root `backend_skill.md`
  - [x] Create active `todo_list.md`

- [x] **Phase 1: Project Scaffolding & Configuration**
  - [x] Initialize `backend/package.json` with dependencies (`express`, `mongoose`, `socket.io`, `cors`, `dotenv`, `zod`, `typescript`, `@types/*`, `vitest`, `supertest`)
  - [x] Configure `backend/tsconfig.json`
  - [x] Create `backend/.env.example` & `.env` with `MONGODB_URI=mongodb://localhost:27017/campus_network`, `PORT=4000`

- [x] **Phase 2: Database Layer & Mongoose Models**
  - [x] `src/shared/db.ts` (Mongoose connection to localhost MongoDB)
  - [x] `src/shared/models.ts` (`User`, `Institution`, `Affiliation`, `EmploymentClaim`, `Group`, `Membership`, `GroupAccessRequest`, `Post`, `PostInteraction`, `Comment`, `Connection`, `Block`, `Conversation`, `Message`, `Report`, `Follow`, `UserFeedPreferences`, `UserConnectionPreferences`, `Organisation`)

- [x] **Phase 3: Core Services & Permission Checks**
  - [x] `src/shared/permissions.ts` (authoritative server-side checks: post access, group posting, messaging gate, blocking, mutual block isolation)
  - [x] `src/modules/feed/ranking.ts` (baseline weighted scoring formula + reranked lexical score + diversity filter + "Why am I seeing this?" explanations)

- [x] **Phase 4: API Endpoints (Express Routers)**
  - [x] `src/modules/auth/middleware.ts` (demo identity resolver via `X-User-Id` / `Authorization`)
  - [x] `GET /api/me` & `GET /api/users/:userId`
  - [x] `GET /api/feed` (tabs: for-you, alumni, students, following; modes: baseline, reranked; cursor pagination)
  - [x] `POST /api/posts` & `GET /api/posts/:postId` & `POST /api/posts/:postId/interactions` & `POST /api/posts/:postId/comments` & `GET /api/posts/:postId/comments`
  - [x] `GET /api/discover/people` & `GET /api/discover/organisations` & `POST /api/organisations`
  - [x] `POST /api/connections` & `PATCH /api/connections/:connectionId` & `POST /api/connections/:connectionId/cancel` & `GET /api/connections`
  - [x] `POST /api/users/:userId/block` (blocking preserves shared group membership)
  - [x] `GET /api/institutions/:id/tree` & `GET /api/institutions` & `POST /api/institutions/:id/groups`
  - [x] `POST /api/groups/:groupId/access-requests` & `PATCH /api/group-access-requests/:requestId` & `POST /api/groups/:groupId/posts` & `PATCH /api/groups/:groupId` & `GET /api/groups/:groupId`
  - [x] `POST /api/reports` & `GET /api/reports` & `PATCH /api/reports/:id` (moderation review & escalation)
  - [x] `GET /api/conversations` & `GET /api/conversations/:conversationId/messages` & `POST /api/conversations/:conversationId/messages`
  - [x] `POST /api/follows` & `DELETE /api/follows/:followId`
  - [x] `GET /api/me/interests` & `PATCH /api/me/feed-preferences` & `POST /api/me/interests/reset` & `GET /api/me/connection-preferences` & `PATCH /api/me/connection-preferences`

- [x] **Phase 5: Real-time Socket.IO Handlers**
  - [x] Handshake authentication in `src/socket.ts`
  - [x] `conversation:join` (verifies participant and accepted connection before room join)
  - [x] `message:send` (validates payload, authorization, persists in MongoDB, emits `message:new`)
  - [x] `message:ack` (returns persisted message ID and server timestamp)

- [x] **Phase 6: Seed Script & Verification Test Suite**
  - [x] `src/scripts/seed.ts` (populates MongoDB with demo institutions, students, alumni, posts, restricted groups, connection requests, and preferences)
  - [x] TypeScript compiler build (`npm run build`) passing 100% with zero errors
  - [x] Automated vitest test suite (`npm test`) passing 100% (17/17 tests across 6 test suites) against MongoDB
