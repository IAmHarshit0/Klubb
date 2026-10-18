# CAMPUS NETWORK — MASTER ARCHITECTURE & PLATFORM SPECIFICATION (v3.0)
> **"Building a Network, Not Just a Directory"**

Campus Network is an institution-centric professional social networking ecosystem that connects students, alumni, faculty, companies, founders, recruiters, and academic professionals.

Instead of a static contact directory or an engagement-driven social clone, Campus Network unites **verified institutional identity**, **structured community spaces**, **purpose-driven connections**, and a **personalized 7-signal recommendation engine**.

---

## 🌟 Master Product Highlights

1. **Dedicated Landing Page (`/` and `/welcome`):**
   - High-converting architectural walkthrough highlighting the **4 Core Problems** (Directory Trap, Social Noise Trap, Credential Deficit, Monolithic Chaos) and our **Architectural Solutions**.
   - Interactive **7-Signal Feed Personalization** visualizer showing real-time score composition.
   - 4-Tier **Identity & Verification State Matrix**.
   - One-click **Interactive Persona Launcher** covering Platform Verifier, Student, Alumni, Super Admin, and Delegated Officer profiles.

2. **Platform Verifier Portal (`/verifier`):**
   - Reserved for platform-level operators (`usr-verifier-001` Dr. Aris Thorne) to evaluate institution and company onboarding requests.
   - States: `Pending`, `Under Review`, `Approved`, `Rejected`, `More Info Required`, `Suspended`, `Revoked`.
   - Issues canonical human-readable identifiers (e.g. `APEX`, `STR`, `SAIL`) and appoints authorized founding Super Admins.
   - Platform verifiers cannot inspect private conversations or impersonate users.

3. **Institutional Communities & Affiliation Queue (`/communities`):**
   - Institutional metrics banner: verified students, verified alumni, active groups, and pending applications.
   - **Affiliation Verification Queue**: Super Admins and Verification Officers review student/alumni graduation proof, transcripts, and assign authoritative verified status.
   - Self-serve **"Request Affiliation"** modal allowing students and alumni to apply for institutional verification.
   - Granular RBAC: Delegated roles defined and assigned by Super Admins (`verify_affiliation`, `create_community`, `publish_announcement`, etc.).

4. **Personalized 7-Signal Discovery & 15-Topic Noun Affinity Engine:**
   - Pre-filtered candidate selection ensuring 100% authoritative audience gating (public vs campus-only vs restricted groups).
   - Multi-factor scoring formula:
     $$\text{Score} = 0.28 \cdot \text{Topic} + 0.20 \cdot \text{Behaviour} + 0.15 \cdot \text{Graph} + 0.12 \cdot \text{Freshness} + 0.10 \cdot \text{Quality} + 0.10 \cdot \text{Verified} + 0.05 \cdot \text{Popularity}$$
   - **15-Topic Cardinality Cap:** Dynamic Campus Topic Map (`getUserTopicMap`) is strictly capped at the top 15 highest-affinity topics sorted by composite score (`0.6 × ShortTerm + 0.4 × LongTerm`), preventing topic graph bloat.
   - **Strict Noun & Noun-Phrase Parsing:** `isValidTopicNoun` validates 1–3 word academic, professional, and tech concepts (`distributed systems`, `machine learning`, `c++`, `node.js`, `.net`, `robotics`). Strictly eliminates bogus filler words (`stuff`, `really`, `today`, `awesome`, `things`, `cool`, `update`, `hello`, `doing`, `please`, `good`, `bad`), sentences, and pure numbers.
   - **Post Muting & Negative Word Exclusion:** Pre-ranking filter inspects both declared `topicLabels` and post body `text` (whole-word regex). Posts matching any muted word or negative term are strictly **excluded from feed results** (never included, not merely downranked). Muting takes absolute priority over positive interest scores.
   - **Positive Content Ranking:** Non-muted posts matching declared interests, verified authors, high quality, and lexical profile terms receive positive boosts and are ranked at the top of the feed.
   - **Needs-Based Alumni Network Ranking (`computeAlumniNeedsScore`):**
     - Ranks alumni based on student needs when applying for **Job Referrals**, **Mentorship**, or **Career Q&A**.
     - Heavily prioritizes alumni with active referral readiness (`availableForReferrals: true`, `pauseIncomingRequests: false`) and employer-verified credentials at target companies (+45 points).
     - Institutional alma mater synergy (+15 points), department alignment (+10 points), and skill overlap (+15 points) elevate top-match mentors and referrers to #1.
     - Alumni with paused incoming requests or disabled referrals are ranked at the bottom.
     - Dual discovery access: `GET /api/discover/alumni` (students & members) and `GET /api/discover/people` (alumni).
   - **End-to-End Ingestion Gates:** `PATCH /api/me/interests` validates all entries and returns 400 on filler words (capped at 15 interests); `POST /api/posts` cleans topic labels; signal recording verifies noun validity before accumulating weights.
   - Alias taxonomy normalization (`k8s` $\to$ `kubernetes`, `ml` $\to$ `machine learning`, `postgres` $\to$ `postgresql`).
   - Time-decayed campus topic map with half-life decay on interaction signals and mution controls.

5. **Real-time Notification Flyout & Center (`/notifications`):**
   - Live badge counter in the navigation header.
   - Interactive dropdown popover with instant "Mark read" and direct navigation links.
   - Dedicated notification history page with filtering.

6. **Secure Communication & Purpose-Driven Connections:**
   - Private 1-to-1 messaging is strictly gated behind mutual connection acceptance.
   - Connections require explicit intent/purpose (Mentorship, Referral, Questions).
   - Block and moderation controls with complete audit logging.

---

## 🏗️ Architecture

Campus Network is built as a **modular monolith** with clean separation of concerns:

```text
React 18 + Vite + Tailwind CSS (Port 5173 — Mercury Visions spatial interface)
        │
      REST & Socket.IO (Proxy)
        ▼
Node.js + Express + Socket.IO (Port 4000)
  ├── Verification Router (`/api/admin/organization-registrations`, `/api/affiliation-requests`, `/api/institutions/:id/metrics`)
  ├── Notifications Router (`/api/notifications`, `/api/notifications/:id`, `/api/notifications/read-all`)
  ├── Feed Engine (`/api/feed` with 7-signal ranking and topic map)
  ├── Discovery Router (`/api/discover` verified alumni search)
  ├── Communities & Groups Router (`/api/institutions`, `/api/groups`, `/api/communities`)
  ├── Connections & Messaging Router (`/api/connections`, `/api/messages` + Socket.IO gatekeeper)
  └── Users & Interests Router (`/api/me`, `/api/users`)
        │
     MongoDB (campus_network)
```

---

## 🚀 Quickstart & Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running on `mongodb://localhost:27017`

### 1. Backend Setup & Seeding
```bash
cd backend
npm install
npm run seed   # Populates Apex University, Northstar, Stripe, Demo Users & Notifications
npm run dev    # Starts API and Socket.IO server on http://localhost:4000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev    # Starts Vite on http://localhost:5173
```

Visit **`http://localhost:5173`** to view the **Landing Page** and explore the platform!

---

## 🧪 Comprehensive Verification & Test Suite
  
All 9 test suites and 56/56 tests pass with 100% success rate:
  
```bash
cd backend
npm test
```
  
### Test Suite Summary:
- `tests/verification.test.ts` (9 tests): Organization registration queue, platform verifier review, short code assignment, founding super admin appointment, student/alumni affiliation requests, verification officer approvals, institutional metrics, and notification dispatch.
- `tests/feed.test.ts` (10 tests): Pre-filtering candidate pool, audience restrictions, 7-signal personalized feed scoring, post muting by topic labels, post muting by body text (whole-word matching), multiple muted words, absolute mute priority over positive score, positive content top-ranking, and immediate unmuting restoration.
- `tests/topic-interests.test.ts` (13 tests): 15-topic cardinality cap, `isValidTopicNoun` validation (single/multi-word nouns, tech symbols `.net`/`c++`, filler word rejection, pure digit/sentence rejection), top-15 decay sorting, alias taxonomy normalization, declared interests, time-decayed topic map, signal decay, and mution.
- `tests/discovery.test.ts` (7 tests): Verified-alumni discovery gating, employer-verified vs self-reported badge distinction, and **Needs-Based Alumni Network Ranking Engine** (student referral needs prioritization, employer-verification boost at target company, paused/disabled request downranking, mentorship intent ranking, and relevanceScore with rankingReasons).
- `tests/connections.test.ts` (2 tests): Connection request workflow and private messaging gatekeeper (403 Forbidden until accepted).
- `tests/governance.test.ts` (5 tests): Scoped institutional roles, delegated permissions, announcements, and organization verification transitions.
- `tests/groups.test.ts` (5 tests): Super admin group creation, restricted group access request and supervisor approvals.
- `tests/permissions.test.ts` (4 tests): Verification officer checks, super admin role checks, and support exception routing.
- `tests/users.test.ts` (3 tests): Profile interest sanitization, availability gating, and privacy controls.
  
**Result: 9 passed, 56 passed (100% passing).**

---

## 👥 Demo Personas Available in User Switcher

| User ID | Persona Name | Role | Primary Features Demonstrated |
|---|---|---|---|
| `usr-verifier-001` | Dr. Aris Thorne | Campus Network Platform Verifier | `/verifier` Portal, approve orgs, appoint Super Admins |
| `usr-admin-001` | Dean Robert Sterling | Super Admin (Apex University) | Create groups, define roles, delegate officer permissions |
| `usr-officer-001` | Sarah Jenkins | Verification Officer (Delegated) | Review student/alumni affiliation queue, approve credentials |
| `usr-student-001` | Alex Rivera | Student (Computer Science) | Feed, interests topic map, request institutional affiliation |
| `usr-alumnus-001` | Priya Sharma | Alumna (Staff Engineer @ Stripe) | Alumni discovery, mentorship availability, messaging |
| `usr-faculty-001` | Dr. Elena Vance | Faculty & Group Supervisor | Group access supervisor approvals, announcements |
| `usr-company-rep-001` | Avery Brooks | Company Representative (Pending) | Self-reported vs verified distinction |

---

## 📋 Master Product Specifications

The complete, unabridged product specifications, database schemas, API routes, and recommendation engine algorithms are preserved in:
👉 [**final_product_features.md**](./final_product_features.md)
