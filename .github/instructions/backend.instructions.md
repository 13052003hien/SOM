---
description: "Use when generating or refactoring Express backend code in backend/src. Enforces middleware order, validation, pagination, and standard error envelope for REST APIs."
name: "Backend API Defaults"
applyTo: "backend/src/**"
---
# Backend API Defaults

- Keep module layering: controller -> service -> repository.
- Keep controllers thin: parse request, call service, return response.
- Keep business rules in services and database access in repositories.

## Middleware Order

- Apply middleware in this order for protected routes:
  1. auth middleware
  2. validation middleware
  3. controller handler
- Register centralized error middleware at app level after route registration.

## Validation Rules

- Validate params, query, and body before entering controller logic.
- Use Zod schemas per module.
- On validation failure, return HTTP 400 with this envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": []
  }
}
```

## Pagination Defaults

- For list endpoints, support query params: page, limit, sortBy, sortOrder.
- Defaults: page=1, limit=20. Clamp limit to maximum 100.
- Return paginated list responses in this envelope:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

## Error Envelope

- Return a consistent error shape for all non-validation errors:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unexpected server error",
    "details": null
  }
}
```

## Security Baseline

- Enforce user-scoped data access on wallets, categories, transactions, budgets, and reports.
- Never expose password hashes, JWT secrets, refresh tokens, or internal stack traces in API responses.
