# Project Guidelines

## Project Stage
- This repository is currently in planning/spec phase. The source folders (`frontend/`, `backend/`, `ai-service/`) are present but not yet implemented.
- Treat `description.txt` and `structure.txt` as the source of truth when scaffolding code.

## Architecture
- Keep a 3-service boundary: `frontend` (React/Vite UI), `backend` (Node.js/Express REST API), `ai-service` (OpenAI function-calling layer).
- Keep feature boundaries aligned with the planned modules:
  - Backend modules: `auth`, `users`, `transactions`, `wallets`, `categories`, `reports`, `budgets`, `import-export`.
  - AI skills: `createTransaction`, `getReport`, `analyzeSpending`.
- Preserve the data flow: frontend -> backend -> database, and AI service -> backend APIs.

## Build And Test
- No runnable build/test scripts are committed yet.
- When bootstrapping, add scripts for each service and document them in the relevant `README.md` files:
  - Install
  - Dev run
  - Production build/start
  - Tests

## Conventions
- Backend: follow controller -> service -> repository layering per module.
- API style: RESTful endpoints, request validation, centralized error handling, and pagination on list endpoints.
- Security baseline: JWT auth, password hashing, and user-scoped data access for all business entities.
- Database: use MySQL schema from spec (`users`, `wallets`, `categories`, `transactions`, `budgets`) and manage evolution with migrations.
- Frontend: keep page-first organization (`Dashboard`, `Transactions`, `Wallets`, `Categories`, `Reports`, `Settings`) plus reusable components and a service layer for API calls.

## Decision Rules For New Code
- If a requirement conflicts with generated boilerplate, prefer the project spec.
- If a required technology choice is still undecided in spec (for example ORM or state management), either:
  - keep implementation swappable with a thin abstraction, or
  - make one consistent choice and document it in `README.md`.
- Avoid adding cross-service coupling; integrations must occur through explicit HTTP/API contracts.

## Reference Docs
- Product and technical requirements: `description.txt`
- Planned monorepo/service structure: `structure.txt`
