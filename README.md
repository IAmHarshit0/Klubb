# Campus Network

An institution-aware social network for personal and professional communities, with a personalized **For You** feed and professional discovery.

## MVP Goal
Demonstrate two connected workflows:
1. Members share and discover relevant posts through a personalized feed.
2. A student finds a relevant alumnus, sends a connection request, and can message them after the request is accepted.

## Core Features
- **Profiles:** institution affiliation, role, department/programme, batch, company, job title, skills, interests, bio, and portfolio.
- **Institution hierarchy:** browse institutions, programmes/departments, batches/sections, and groups.
- **Social feed:** create text posts, view the For You feed, and optionally support comments, reactions, saves, and follows.
- **Feed ranking:** start with chronological ordering, then add FlashRank behind a replaceable `Reranker` interface.
- **Professional discovery:** search by company, role, skills, institution, programme, or batch.
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
  ├── Discovery (Structured Filters, People Search)
  ├── Institutions & Communities (Tree Hierarchy, Announcements)
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
To use a backend on another host or port, set `VITE_API_PROXY_TARGET` in
`frontend/.env` and restart Vite.

Student interests can be added or removed from **My Profile → Your interests**.
The seeded demo users also include multiple verified institution affiliations,
dual alumnus/student affiliations, super admins and their delegated roles, and
an unverified company representative.

## MVP Acceptance Criteria
- A seeded institution contains students, alumni, groups, and posts.
- A user can create a post and see it in the feed.
- The feed supports chronological and FlashRank modes.
- Different demo users can receive meaningfully different feed results.
- A student can find an alumnus by company and role.
- Connection acceptance gates private messaging.
- Group access is separate from personal connections.
- Backend permission tests pass and the demo starts from documented instructions.

## Non-Negotiable Rules
- Backend permission checks are authoritative; frontend hiding is not security.
- Filter inaccessible posts before reranking and before returning results.
- A connection request does not grant messaging access until accepted.
- Private one-to-one messages are not accessible to institution/group administrators by default.
- Institutional affiliation and employer verification are distinct statuses.
- FlashRank must be replaceable and have a deterministic fallback.
- Ranking scores never override access permissions.

## Out of Scope for the MVP
- Production-grade institutional SSO and bulk data migration
- Employer integrations or automatic employment verification
- Custom-trained recommendation models or advanced AI generation
- Large-scale real-time chat infrastructure, calls, and notifications
- Complex analytics dashboards, monetization, and multi-institution rollout tooling

## Implementation Principle
**Ship one reliable end-to-end workflow before adding breadth.**
