# Skills and Engineering Guidelines

This document defines the skills and implementation practices needed for the Campus Network MVP. Keep the stack simple and the modules independently testable.

## Required Skills

### Frontend
- React fundamentals and component composition
- TypeScript types and interfaces
- Vite development workflow
- REST API integration with `fetch` or a small API client
- Form handling, loading/error states, and basic responsive layouts
- Optional: Tailwind CSS for styling

### Backend
- Python 3
- FastAPI route handlers and dependency injection
- Pydantic request/response schemas
- SQL and PostgreSQL fundamentals
- ORM/data-access patterns
- HTTP status codes and API error handling
- Authentication/authorization basics

### Feed Ranking
- Candidate retrieval and filtering
- Query/candidate text construction for reranking
- FlashRank integration
- Simple freshness and diversity rules
- Baseline comparison and latency measurement

### Quality and Team Workflow
- Git branches and pull requests
- Shared API contracts
- Environment variables and `.env.example`
- Seed data for reproducible demos
- Unit/integration tests for permissions
- Clear module ownership and small pull requests

## Engineering Rules
1. **Modular monolith:** one backend application; do not introduce microservices for the MVP.
2. **Stable interfaces:** frontend work depends on agreed API schemas, not another teammate's internal implementation.
3. **Replaceable reranker:** define a small `Reranker` interface so FlashRank can be swapped without changing the feed API.
4. **Security in the backend:** enforce visibility and permissions in backend services and queries.
5. **Filter before ranking:** unauthorized posts must never enter the reranking candidate set.
6. **Fallback first:** chronological feed must work if FlashRank fails or is disabled.
7. **Seeded demo:** use consistent sample users, posts, institutions, and groups.
8. **Keep dependencies lean:** add libraries only when they clearly help the MVP.
9. **No false verification:** distinguish institution-verified affiliation from employer-verified and self-reported employment.
10. **Test critical paths:** especially connection acceptance, group access, post visibility, and blocking.

## Suggested Module Ownership
- Frontend: feed UI, post cards, profile pages, discovery UI, API client.
- Backend/data: models, migrations/schema, seed data, profile/post endpoints.
- Ranking: candidate retrieval, FlashRank adapter, freshness/diversity, evaluation.
- Integration/security: connections, group access, permission checks, integration tests.

## Definition of Done for a Feature
- Its API/input contract is documented.
- It has loading, error, and empty states where applicable.
- Authorization is checked server-side.
- It has at least a basic test for the critical path.
- It works with the seeded demo data.
- It does not break the chronological fallback.
