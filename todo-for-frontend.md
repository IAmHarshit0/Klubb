# Frontend Development Roadmap & Task Guide (`todo-for-frontend.md`)

Welcome to the **Campus Network v3.0 (Klubb)** frontend! This document outlines the architectural context, current feature state, backend API integration contracts, and prioritized tasks for incoming frontend developers.

---

## 1. Project Overview & Design Philosophy

* **Stack**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query v5, React Router v6, Lucide React icons, Socket.IO Client.
* **Design System**: *Mercury Visions* — spatial neo-minimalism with fluid decorative ambient blobs, micro-radii card surfaces (`mercury-card`), subtle shadows (`shadow-mercury-sm`, `shadow-mercury-xs`), crisp typography, and badge indicators for verification statuses.
* **Backend API Base**: Running by default on `http://localhost:4000/api` (proxied in Vite or set in `VITE_API_URL`).
* **WebSockets**: Connected to `http://localhost:4000` via `SocketContext`.

---

## 2. Current Implementation State

| Module | Route | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Personalized Feed** | `/feed` | ✅ Complete | Multi-tab discovery (`For You`, `Students`, `Alumni`), candidate pre-ranking & FlashRank reranking, post composer, like/save/hide/comments, **own posts excluded from discovery feeds**. |
| **Communities & Institutions** | `/communities` | ✅ Complete | Institution switcher, multi-tier group hierarchy tree (Departments, Batches, Clubs), **Superadmin custom role creation & assignment modal** with full RBAC. |
| **Group Spaces** | `/groups/:groupId` | ✅ Complete | **Superadmin full-access bypass** (no access request needed), restricted space posting/reading, member access requests & approvals. |
| **Professional Discovery** | `/discover` | ✅ Complete | **Open to everyone** (students, alumni, faculty, staff), filter by company/role/skill/batch, connection request modal with custom message. |
| **My Profile** | `/profile/me` | ✅ Complete | **My Published Posts** archive (with audience filters & deletion), **Campus Topic Map** (time-decayed interest signals, mute/reset), **Discovery & Availability** toggles (for non-students), interest management. |
| **Public Profiles** | `/profile/:userId` | ✅ Complete | Institutional affiliations, employment claims, **Stated Availability** indicators (viewable by all members for non-student profiles), Connect / Direct Chat CTAs. |
| **Private Messaging** | `/messages` | ✅ Complete | Socket.IO real-time direct chat, gated by mutual connection acceptance; **institution Superadmins receive automatic group access request alert messages directly in their inbox** with administrative messaging reply privileges. |
| **Connections** | `/connections` | ✅ Complete | Pending incoming/outgoing requests, accept/decline actions, active connections list. |

---

## 3. Prioritized Frontend Tasks (TODOs)

### 📌 Milestone 1: Rich Media & Interactive Visualizations

- [ ] **Interactive Campus Topic Map Canvas / Timeline**
  - **Location**: `frontend/src/pages/MyProfilePage.tsx`
  - **Description**: Currently rendered as percentage pill tags. Implement an interactive timeline or radar / network graph (using SVG, D3, or VisX) that visualizes how student interests evolve and decay over weeks.
  - **API**: Uses data already available from `GET /api/me/topic-map` (`topic`, `score`, `shortTermWeight`, `longTermWeight`, `lastActive`).
- [ ] **Rich Media & File Attachment Support**
  - **Locations**: `frontend/src/components/feed/CreatePostForm.tsx` & `frontend/src/pages/GroupPage.tsx`
  - **Description**: Add image preview carousels and PDF preview badges to the post composers.
  - **API Contract**: Backend models support `media: string[]` (URLs / data URIs).

---

### 📌 Milestone 2: Notifications Center & Live Activity

- [ ] **Global Notification Bell & Flyout Dropdown**
  - **Location**: `frontend/src/components/layout/Navbar.tsx` or `Sidebar.tsx`
  - **Description**: Add a notification bell with unread count badge.
  - **Events to Surface**:
    - Incoming connection request received.
    - Group access request approved / rejected.
    - New custom role assigned by Superadmin.
    - Comment or reaction on user's post.
  - **Integration**: Listen to Socket.IO events (`notification:new`, `connection:request`, etc.).

---

### 📌 Milestone 3: Advanced Group Administration Dashboard

- [ ] **Group Management & Moderation Panel**
  - **Location**: `frontend/src/pages/GroupPage.tsx`
  - **Description**: When viewed by an admin or supervisor (`membership.role === 'admin' || membership.isSuperAdmin`), show an "Admin Settings" tab:
    - Member roster with role upgrade/downgrade (`member` ↔ `moderator`).
    - Ban / suspend member controls.
    - Pending access requests queue (currently handled via separate endpoint `PATCH /api/group-access-requests/:requestId`).
    - Posting policy switcher (`all_members` vs `moderators_only`).
    - Group visibility toggle (`public`, `campus_only`, `restricted`).
  - **API**: `PATCH /api/groups/:groupId` & `GET /api/groups/:groupId/members`.

---

### 📌 Milestone 4: Enhanced Search & Mentions

- [ ] **Feed Search, Hashtag & @Mention Autocomplete**
  - **Location**: `frontend/src/components/feed/CreatePostForm.tsx`
  - **Description**: Provide an autocomplete popover when users type `#` (matching existing topic labels from `GET /api/me/topic-map`) or `@` (matching peers from active connections).
- [ ] **Global Universal Search Bar**
  - **Description**: A `Cmd+K` / `Ctrl+K` command palette for jumping quickly to groups, communities, or people across institutions.

---

### 📌 Milestone 5: Real-Time Chat Experience Polish

- [ ] **Typing Indicators & Read Receipts**
  - **Location**: `frontend/src/pages/MessagingPage.tsx`
  - **Description**: Emit and listen for `typing:start` and `typing:stop` over `SocketContext`. Show "Jordan is typing..." animated dots.
- [ ] **Unread Conversation Badges**
  - **Description**: Add real-time unread message counter badge on the sidebar "Messages" navigation link.

---

### 📌 Milestone 6: Accessibility, Theming & Mobile Responsiveness

- [ ] **Mobile Drawer Navigation & Bottom Tab Bar**
  - **Location**: `frontend/src/components/layout/Sidebar.tsx` & `Layout.tsx`
  - **Description**: Provide a bottom navigation bar for mobile viewport widths (`< 768px`) with touch-friendly touch targets.
- [ ] **Dark Mode / High-Contrast Theme**
  - **Description**: Add `dark` theme variants to Tailwind configuration supporting spatial neo-minimalist dark shades (`#0a0a0c`, `#141418`, glowing borders).

---

## 4. Key Demo Accounts for Testing & Role Verification

You can switch between any of these users instantly using the demo switcher in the application header:

| Role | Demo ID | User Name | What to Test |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `usr-admin-001` | Dean Robert Sterling | Institution governance, custom role creation/assignment, group bypass without joining. |
| **Faculty / Supervisor** | `usr-faculty-001` | Dr. Elena Vance | Robotics club supervisor, restricted group posts, faculty availability. |
| **Verified Alumnus** | `usr-alumnus-001` | Priya Patel | Stripe employee claim, alumni feed, mentorship/referral toggles in profile. |
| **Student** | `usr-student-001` | Alex Mercer | CS student feed, Discover access, My Published Posts, connection requests. |
| **Delegated Officer** | `usr-officer-001` | Sarah Jenkins | Placement & credential verification, non-student availability flags. |
| **Northstar Admin** | `usr-admin-northstar-001` | Dr. Amara Okafor | Multi-institution identity testing across Northstar Institute. |

---

## 5. Development Scripts & Verification

```bash
# In frontend/:
npm run dev        # Starts Vite dev server on http://localhost:5173
npx tsc --noEmit   # Verifies TypeScript typing without compiling

# In backend/:
npm run dev        # Starts Express + Socket.IO server on http://localhost:4000
npm test           # Runs all 30 Vitest tests across 8 test suites
npm run seed       # Seeds the database with all 84 posts, 10 groups, and demo identities
```
