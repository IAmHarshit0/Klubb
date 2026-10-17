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

## Tech Stack
- **Frontend:** React, TypeScript, Vite; Tailwind CSS optional
- **Backend:** Python, FastAPI, Pydantic
- **Database:** PostgreSQL
- **Reranking:** FlashRank, behind a model-independent interface

## Architecture
Use a **modular monolith**: one frontend, one backend, and one database. Microservices and a vector database are not required for the MVP.

```text
React + TypeScript
        |
      REST API
        |
FastAPI modular backend
  |      |       |
 Feed  Profiles  Connections / Groups
        |
  Feed ranking service
  Candidate retrieval -> FlashRank -> freshness/diversity
        |
    PostgreSQL
```

## Repository Layout
```text
campus-network/
├── frontend/
│   └── src/
│       ├── components/
│       ├── features/
│       │   ├── feed/
│       │   ├── profiles/
│       │   ├── discovery/
│       │   ├── connections/
│       │   └── groups/
│       └── lib/api.ts
├── backend/
│   └── app/
│       ├── main.py
│       ├── api/
│       ├── models/
│       ├── schemas/
│       ├── db/
│       └── services/
│           ├── feed.py
│           ├── ranking.py
│           ├── permissions.py
│           └── connections.py
├── tests/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting Started
The implementation setup is not finalized yet. Once dependencies and environment variables are added:
1. Configure the backend database connection.
2. Start PostgreSQL.
3. Run the FastAPI backend.
4. Run the Vite frontend.
5. Load seed data for one demo institution, students, alumni, groups, and posts.

Add exact commands here when the project scaffolding is committed.

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
