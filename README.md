# Campus Network

An institution-aware social network for personal and professional communities, with a personalized **For You** feed and professional discovery.

## MVP Goal
Demonstrate two connected workflows:
1. Members share and discover relevant posts through a personalized feed.
2. Verified alumni use professional discovery, send connection requests, and can message after a request is accepted.

## Core Features
- **Profiles:** institution affiliation, role, department/programme, batch, company, job title, skills, interests, bio, and portfolio.
- **Institution communities and groups:** browse all institution communities and structured groups. Verification officers create named communities with a unique institution-scoped suffix; only that institution's Super Admin can create groups.
- **Institution roles:** Super Admins define and assign roles to verified institution members. Active scoped permissions are shown in the portal and enforced by backend routes.
- **Social feed:** create text posts, view the For You feed, and interact with comments, reactions, saves, and follows.
- **Feed ranking:** deterministic baseline scoring uses declared interests and the time-decayed topic map; optional FlashRank reranking falls back to baseline ranking.
- **Alumni-only professional discovery:** verified alumni search by company, role, skills, institution, programme, or batch.
- **Alumni availability:** only verified alumni can configure or view mentorship, referral, and question availability.
- **Connections:** send, accept, or decline connection requests; accepted connections unlock private messaging.
- **Group access:** request access to restricted groups; authorized supervisors approve or decline.
- **Moderation:** report content or users, with escalation through the administrative hierarchy.

## Tech Stack (v3.0 Final Specification)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS (Mercury Visions spatial interface aesthetic)
- **Backend:** Node.js, TypeScript, Express, Socket.IO
- **Database:** MongoDB
- **Ranking:** Baseline deterministic scoring with optional FlashRank adapter

## Architecture
Use a **modular monolith**: one React/Vite frontend, one Node/Express backend, and one MongoDB database.

```text
React 18 + TypeScript + Vite (Port 5173)
        │
      REST & Socket.IO (Proxy)
        ▼
Node.js + Express + Socket.IO (Port 4000)
  ├── Feed (For You, Alumni, Students)
  ├── Discovery (verified-alumni-only structured people and organisation search)
  ├── Institutions, Communities & Groups (hierarchy, announcements, delegated roles)
  ├── Connections & Real-time Messaging (Socket.IO + Gatekeeper)
  └── Groups & Scoped Moderation
        │
     MongoDB (campus_network)
```

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed  # Populates Apex University demo dataset
npm run dev   # Starts server on http://localhost:4000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev   # Starts Vite on http://localhost:5173
```

Run MongoDB and the backend before starting the frontend. If Vite reports
`ECONNREFUSED 127.0.0.1:4000`, the API is not listening: start MongoDB, then run
`npm run dev` from `backend` and confirm `http://localhost:4000/health` responds.
The frontend proxies both API and Socket.IO traffic through Vite, and real-time
status reconnects automatically when the backend becomes available. To use a
backend on another host or port, set `VITE_API_PROXY_TARGET` in `frontend/.env`
and restart Vite.

## Communities, Groups, and Institutional Roles

- Communities are institution-level directory entries with a display name and a
  lowercase suffix/slug. The suffix must contain letters or numbers separated
  by single hyphens and is unique within its institution. The Communities page
  lists all community entries and all groups for the selected institution.
- A verified institutional role with `create_community` can create communities.
  The seeded Verification & Placement Officer has that permission. Creating a
  community does not grant group membership or group-posting access.
- Group creation is reserved for an active, institution-verified Super Admin
  affiliation. Existing group types, visibility rules, memberships, and
  moderator controls remain separate from community directory entries.
- Super Admins define role templates and assign them to active, verified
  institutional members. Assignments are institution-scoped; role templates
  cannot grant arbitrary or wildcard permissions. The `/api/me` response
  includes the current user's active institutional roles and permissions.
- Relevant permissions include `create_community`, `verify_affiliation`,
  `verify_employment`, `publish_announcement`, and
  `moderate_student_groups`. The backend is authoritative; hiding a button in
  the frontend is not an authorization check.

## Topic Map

**My Profile → Your Campus Topic Map** displays long-term interests and
time-decayed disclosed signals from follows, searches, saves, reactions,
comments, and published post topic labels. Members can mute topics or reset
inferred signals; resetting preserves declared interests, skills, and follows.
Private message content is never used for topic inference.

## Demo Authentication and Deployment Warning

This repository currently uses demo authentication: API requests identify a
user through `X-User-Id` (or a raw user ID in the bearer header), and the UI
includes a demo-user switcher. This is suitable only for a local/demo
environment. **Do not expose this backend to untrusted users or deploy it as a
production service.** A real authentication provider, signed/validated
credentials, and server-side session/token verification are required before
production; otherwise a caller can impersonate another seeded user and bypass
role-based authorization.

## Validation

From `backend`, run `npm test` for the backend Vitest suite and `npm run build`
for the TypeScript build. From `frontend`, run `npm run build` for the Vite
production build. Tests connect to a local MongoDB database named `campus_network_test` and
reseed it before each test case.

Student interests can be added or removed from **My Profile → Your interests**.
The seeded demo users also include multiple verified institution affiliations,
dual alumnus/student affiliations, super admins and their delegated roles, and
an unverified company representative.

## MVP Acceptance Criteria
- A seeded institution contains students, alumni, groups, and posts.
- A user can create a post and see it in the feed.
- The feed supports baseline ranking and optional FlashRank reranking.
- Different demo users can receive meaningfully different feed results.
- Only verified alumni can use professional discovery or view/configure availability.
- Members can still view permitted profile details, but availability is not included for non-alumni profile owners or non-alumni viewers.
- Connection acceptance gates member-to-member private messaging; institution administrators retain the explicit support-message exception implemented by the backend.
- Group access is separate from personal connections.
- Backend permission tests pass and the demo starts from documented instructions.

## Non-Negotiable Rules
- Backend permission checks are authoritative; frontend hiding is not security. The current demo identity mechanism is not production-safe; see the deployment warning above.
- Filter inaccessible posts before reranking and before returning results.
- A connection request does not grant messaging access until accepted.
- Private one-to-one messages are not accessible to institution/group administrators by default.
- Institutional affiliation and employer verification are distinct statuses.
- Alumni-only features require an active, institution-verified Alumnus affiliation. A verified dual-role member qualifies.
- Topic affinity ranking must not override access permissions.

## Out of Scope for the MVP
- Production-grade institutional SSO and bulk data migration
- Employer integrations or automatic employment verification
- Custom-trained recommendation models or advanced AI generation
- Large-scale real-time chat infrastructure, calls, and notifications
- Complex analytics dashboards, monetization, and multi-institution rollout tooling

## Implementation Principle
**Ship one reliable end-to-end workflow before adding breadth.**
