# Frontend Specification

## Stack
- React
- TypeScript
- Vite
- Tailwind CSS optional

## Responsibilities
The frontend renders the product experience and calls the backend API. It must not be trusted to enforce permissions; the backend is authoritative.

## MVP Screens

### 1. For You Feed
- Feed tabs: **For You** and **Following**
- Post cards with author, affiliation/verification labels, timestamp, content, and audience context
- Create text post
- Loading, error, and empty states
- Optional if time permits: comments, reactions, saves, follows, image uploads
- Optional filters: My Campus and Professional

### 2. Profile
- Name, bio, institution affiliation, role, programme/department, batch
- Company and job title
- Skills, interests, portfolio link
- Clearly label institution-verified affiliation and employer-verified/self-reported employment
- Render only fields returned as visible by the backend

### 3. People Discovery
- Search by company, role, skills, institution, programme, or batch
- Show relevant profile summary and verification status
- Provide a connection-request action
- Show request status: pending, accepted, declined

### 4. Institution and Groups
- Browse Institution → Programme/Department → Batch/Section → Group
- Show group details, membership state, and visibility
- Request access to a restricted group
- Group supervisors see pending access requests if authorized

### 5. Connections and Messaging
- Incoming and outgoing connection requests
- Accept/decline actions
- Private messaging only after the connection is accepted
- If time is limited, show the accepted connection state and defer full chat

### 6. Reporting and Blocking
- Report a user or post with a reason
- Block a user
- Blocking must not remove the user's membership in shared groups

## API Integration
Create one small API client in `src/lib/api.ts`. Keep API calls out of reusable presentation components where possible.

Initial endpoints:
- `GET /feed`
- `POST /posts`
- `GET /users/{id}`
- `GET /discover`
- `POST /connections`
- `PATCH /connections/{id}`
- `POST /groups/{id}/access-requests`
- `PATCH /group-access-requests/{id}`
- `POST /groups/{id}/posts`
- `POST /reports`

Optional messaging endpoint:
- `GET /conversations/{id}/messages`

## Suggested Component Layout
```text
src/
├── components/
├── features/
│   ├── feed/
│   │   ├── FeedPage.tsx
│   │   ├── PostCard.tsx
│   │   └── CreatePostForm.tsx
│   ├── profiles/
│   ├── discovery/
│   ├── connections/
│   └── groups/
└── lib/
    └── api.ts
```

## Frontend Rules
- Use typed API response models.
- Show loading, error, and empty states.
- Do not hardcode authorization decisions.
- Do not display inaccessible data simply because a link exists.
- Keep the UI focused on the two demo flows: personalized feed and alumnus discovery.
- Avoid building complex UI for features explicitly marked optional.
