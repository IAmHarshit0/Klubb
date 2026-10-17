---
name: backend-engineering
description: Comprehensive backend engineering guide and specifications for Campus Network v3.0 (Node.js, TypeScript, Express, MongoDB, Socket.IO, FlashRank/baseline ranking, permissions, and test suites).
---

# Campus Network v3.0 — Backend Engineering Skill & Specification Guide

This guide establishes the backend architecture, coding standards, data contracts, permission enforcement, feed ranking pipeline, and test-driven validation rules for the **Campus Network v3.0 Final Specification**.

---

## 1. Architectural Principles

1. **Modular Monolith:**
   - Single unified backend application written in **Node.js + TypeScript + Express** with **Socket.IO** for real-time messaging and **MongoDB** as the primary database.
   - Clean layer separation:
     - `src/modules/auth/`: Demo identity, authentication middleware, and context resolution (`req.user`).
     - `src/modules/users/`: Profiles, affiliations, verification badges, employment claims, and visibility.
     - `src/modules/institutions/`: Institution hierarchy (Institution → Programme → Department → Batch → Group).
     - `src/modules/groups/`: Groups, memberships, access requests, and scoped moderation.
     - `src/modules/posts/`: Post creation, audience rules (Public, Campus, Group), comments, and reactions.
     - `src/modules/feed/`: Candidate retrieval, pre-ranking permission filtering, baseline & reranked scoring, diversity rules, and cursor pagination.
     - `src/modules/interests/`: Topic definitions, taxonomy, interest signals, and user topic profiles with time decay.
     - `src/modules/discovery/`: People and organization search with structured filters and explainable cards.
     - `src/modules/connections/`: Connection lifecycle (pending → accepted/declined/cancelled), blocking, and availability preferences.
     - `src/modules/messaging/`: Direct 1-to-1 conversations, message persistence in MongoDB, and Socket.IO real-time gating.
     - `src/modules/moderation/`: Content reporting, escalation to senior administrators, and audit events.
     - `src/shared/`: MongoDB connection, Mongoose models, shared permission evaluator, and error handlers.

2. **Backend Authoritative Security:**
   - Frontend controls are purely visual cues. All authorization, audience gating, and profile visibility checks must execute strictly server-side.
   - Inaccessible posts, blocked users, and unauthorized group content must be filtered *before* reranking and *before* returning responses.

3. **Distinct Verification States:**
   - **Institution Affiliation:** `institution-verified` vs `unverified`.
   - **Employment Status:** `employer-verified` vs `self-reported` vs `pending`.
   - Never conflate self-reported job history with verified credentials.

4. **Replaceable Reranking (Pluggable Strategy Pattern):**
   - Baseline deterministic scoring (topic relevance, behavioural intent, graph affinity, freshness, content quality, relevant verification, normalized popularity).
   - Optional FlashRank adapter with strict timeout and seamless fallback to baseline.
   - Relevance ranking scores must **never** bypass or weaken visibility permissions.

5. **Socket.IO Real-time Security:**
   - Socket handshake authenticates using the same identity/session mechanism as the API.
   - Socket rooms are routing primitives, not permissions. Every room join and message send requires server-side validation.
   - Only `ACCEPTED` connections can join rooms and exchange private messages.
   - Messages are persisted to MongoDB before delivery acknowledgements are emitted.

---

## 2. Directory Layout & Module Structure

```text
backend/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── server.ts                # HTTP + Socket.IO server listener
│   ├── app.ts                   # Express app configuration & middleware
│   ├── socket.ts                # Socket.IO authenticated connection handlers
│   ├── config/
│   │   └── index.ts             # Environment variables & constants
│   ├── shared/
│   │   ├── db.ts                # MongoDB Mongoose connection
│   │   ├── errors.ts            # Standardized API error responses
│   │   └── permissions.ts       # Authoritative server-side permission checks
│   ├── modules/
│   │   ├── auth/                # Demo user switching & auth middleware
│   │   ├── users/               # Profiles, affiliations, employment claims
│   │   ├── institutions/        # Institution tree & hierarchy
│   │   ├── groups/              # Groups, memberships, access requests
│   │   ├── posts/               # Posts, comments, interactions (like/save/hide)
│   │   ├── feed/                # For You, Alumni, Students, Following feeds
│   │   ├── interests/           # Topic map & user interest decay
│   │   ├── discovery/           # People search & structured filters
│   │   ├── connections/         # Connection state machine & blocking
│   │   ├── messaging/           # Conversations & message persistence
│   │   └── moderation/          # Reports, escalation, audit logging
│   └── scripts/
│       └── seed.ts              # Demo seed data (institutions, users, posts, groups)
└── tests/
    ├── permissions.test.ts
    ├── feed.test.ts
    ├── connections.test.ts
    ├── discovery.test.ts
    └── groups.test.ts
```

---

## 3. MongoDB Data Collections

1. `users`: `_id`, `name`, `email/demoKey`, `bio`, `portfolioUrl`, `skills[]`, `interests[]`, `profileVisibility`, `createdAt`
2. `institutions`: `_id`, `name`, `displayName`, `slug`, `type`, `logoUrl`, `themeColors`
3. `affiliations`: `_id`, `userId`, `institutionId`, `role`, `programme`, `department`, `batch`, `verificationStatus`, `verifiedAt`
4. `organisations`: `_id`, `name`, `type`, `website`, `verificationStatus`
5. `employmentClaims`: `_id`, `userId`, `companyName`, `jobTitle`, `status` (`employer_verified`, `self_reported`, `pending`)
6. `groups`: `_id`, `institutionId`, `parentGroupId`, `name`, `groupType`, `visibility`, `postingPolicy`
7. `memberships`: `_id`, `userId`, `groupId`, `role`, `status`, `joinedAt`
8. `posts`: `_id`, `authorId`, `text`, `media[]`, `audienceType`, `audienceId`, `institutionId`, `topicLabels[]`, `createdAt`
9. `postInteractions`: `_id`, `userId`, `postId`, `type` (`like`, `save`, `hide`)
10. `comments`: `_id`, `postId`, `authorId`, `text`, `createdAt`
11. `connections`: `_id`, `pairKey`, `requesterId`, `recipientId`, `status` (`pending`, `accepted`, `declined`, `cancelled`), `createdAt`
12. `blocks`: `_id`, `blockerId`, `blockedId`, `createdAt`
13. `groupAccessRequests`: `_id`, `requesterId`, `groupId`, `status` (`pending`, `approved`, `declined`), `reviewedBy`
14. `conversations`: `_id`, `conversationKey`, `participantIds[]`, `createdAt`, `lastMessageAt`
15. `messages`: `_id`, `conversationId`, `senderId`, `text`, `createdAt`
16. `reports`: `_id`, `reporterId`, `targetType`, `targetId`, `reason`, `status`, `escalatedTo`
17. `auditEvents`: `_id`, `actorId`, `action`, `targetType`, `targetId`, `createdAt`, `metadata`
18. `follows`: `_id`, `followerId`, `targetType`, `targetId`, `createdAt`
19. `userFeedPreferences`: `_id`, `userId`, `defaultFeedMode`, `mutedTopicIds[]`, `mutedAuthorIds[]`
20. `userConnectionPreferences`: `_id`, `userId`, `availableForMentorship`, `availableForReferrals`, `availableForQuestions`

---

## 4. Feed & Ranking Specification

Four distinct feed surfaces:
1. **For You:** Public posts, eligible institutional content, and personalized topic discovery.
2. **Alumni:** Posts from verified alumni affiliations and accessible alumni groups.
3. **Students:** Posts from eligible student affiliations and student communities.
4. **Following:** Posts from users and topics explicitly followed by the viewer.

**Pipeline:**
1. Candidate Generation: Retrieve up to 200 recent candidates based on scope and follows.
2. Eligibility Filtering: Filter out inaccessible, deleted, or blocked content server-side.
3. Scoring (Baseline or Reranked):
   - Baseline: `0.28 topic + 0.20 behavioural + 0.15 graph affinity + 0.12 freshness + 0.10 quality + 0.10 verification + 0.05 popularity`.
   - Reranked: FlashRank / lexical cross-scoring adapter.
4. Post-processing: Author diversity (max 2 consecutive from same author) and freshness decay.
5. Final Permission Check: Ensure viewer remains authorized before returning results.

---

## 5. Security & Permission Rules Matrix

| Action | Preconditions | Failure Code |
|---|---|---|
| View Group Post | Viewer must be an active member of the target group | `403 Forbidden` / Filtered |
| Post to Group | Viewer must be an active member with posting permissions | `403 Forbidden` |
| View Profile | Mutual blocking check passes; returns permitted fields | `404 Not Found` |
| Send Message | Requester and recipient must have an `ACCEPTED` connection | `403 Forbidden` |
| Join Chat Room | Viewer must be one of the two participants; connection accepted | Reject handshake/join |
| Approve Group Request | Requester must have `supervisor` or `admin` role in group | `403 Forbidden` |
| Escalate Report | Authenticated user or moderator routes to supervisor | `200 OK` |
| Blocking | Blocks direct messaging and search, but preserves group membership | `200 OK` |
