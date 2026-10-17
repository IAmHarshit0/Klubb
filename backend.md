# Backend Specification

## Stack and Architecture
- Python
- FastAPI
- Pydantic
- PostgreSQL
- Modular monolith: one backend application

Suggested structure:
```text
backend/app/
├── main.py
├── api/
├── models/
├── schemas/
├── db/
└── services/
    ├── feed.py
    ├── ranking.py
    ├── permissions.py
    └── connections.py
```

## Core Data Entities
- **User:** `id`, `name`, `bio`, `company`, `job_title`, `skills`, `interests`, `portfolio_url`
- **Institution:** `id`, `name`
- **Affiliation:** `user_id`, `institution_id`, `role`, `programme`, `department`, `batch`, `verification_status`
- **Group:** `id`, `institution_id`, `parent_group_id`, `name`, `group_type`, `visibility`
- **Membership:** `user_id`, `group_id`, `role`, `status`
- **Post:** `id`, `author_id`, `text`, `audience_type`, `audience_id`, `created_at`, `topic_labels`
- **Connection:** `requester_id`, `recipient_id`, `status`, `created_at`
- **GroupAccessRequest:** `requester_id`, `group_id`, `status`, `reviewed_by`
- **Message (optional):** `conversation_id`, `sender_id`, `text`, `created_at`
- **Report:** `reporter_id`, `target_type`, `target_id`, `reason`, `status`, `escalated_to`

Keep a user's identity separate from group memberships. A user can belong to multiple groups; alumni may have multiple institutional affiliations.

## Initial API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/feed` | Return visible posts in baseline or reranked mode |
| POST | `/posts` | Create a post after audience permission checks |
| GET | `/users/{id}` | Return profile fields visible to requester |
| GET | `/discover` | Search people by professional/institutional fields |
| POST | `/connections` | Send connection request |
| PATCH | `/connections/{id}` | Accept or decline a request |
| POST | `/groups/{id}/access-requests` | Request group access |
| PATCH | `/group-access-requests/{id}` | Approve or decline group access |
| POST | `/groups/{id}/posts` | Create a group post after membership/role checks |
| POST | `/reports` | Submit a report |
| GET | `/conversations/{id}/messages` | Optional: retrieve messages for an accepted connection |

## Feed Pipeline
1. Retrieve a limited set of candidate posts from PostgreSQL using recency, interests, follows, and institutional context.
2. Filter out all posts the requester is not allowed to view.
3. If reranking is enabled, pass the user-interest query and authorized candidate texts to the FlashRank adapter.
4. Apply freshness and simple diversity rules.
5. Return ranked posts and relevant metadata.
6. If FlashRank is disabled or fails, return a deterministic chronological/baseline feed.

Define a small model-independent interface, for example:
```python
class Reranker:
    def rerank(self, query: str, candidates: list[str]) -> list[int]:
        """Return candidate indices in relevance order."""
        ...
```
Adapt this signature to the actual FlashRank API; the interface is an application contract, not a claim about FlashRank's native method signature.

## Permission Rules
- Backend checks are authoritative; frontend hiding is not security.
- Filter inaccessible posts before reranking and before returning feed results.
- Profile visibility follows product rules.
- Sending a connection request does not grant messaging access.
- Only accepted connections can access private messaging.
- Private one-to-one messages are not accessible to institution/group administrators by default.
- Group access requests and personal connections are separate.
- Group posts require the appropriate membership and role.
- Blocking does not remove shared group membership.
- Ranking scores must never override permissions.

## Verification Fields
Keep separate statuses for:
- Institution affiliation: institution-verified or not verified
- Employment: employer-verified or self-reported

Employer integration and automatic employment verification are out of scope for the MVP.

## Testing Priorities
- Unauthorized users cannot retrieve restricted posts.
- Restricted posts are filtered before reranking.
- Pending connection requests cannot access private messages.
- Accepted connections can access private messages.
- Group access is separate from personal connections.
- Unauthorized users cannot post to restricted groups.
- Blocking does not delete group membership.
- Feed works with FlashRank disabled or unavailable.

## Out of Scope
- Production-grade institutional SSO and bulk data migration
- Employer integrations or automatic employment verification
- Custom-trained recommendation models or advanced AI generation
- Large-scale real-time chat, calls, and notification infrastructure
- Complex analytics dashboards, monetization, and multi-institution rollout tooling
