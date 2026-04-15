---
description: "Use when generating or refactoring AI service code in ai-service/src. Enforces function-calling skill structure, backend API integration boundaries, and standardized request/response error handling."
name: "AI Service Defaults"
applyTo: "ai-service/src/**"
---
# AI Service Defaults

- Keep AI service as an orchestration layer for natural language to backend API actions.
- Keep feature separation by folder: `skills`, `agents`, `services`, `controllers`, `routes`, `config`, `utils`.
- Do not place business rules or database logic in AI service.

## Function-Calling Skill Rules

- Implement one clear responsibility per skill file (for example: createTransaction, getReport, analyzeSpending).
- Define explicit input schema for each skill (required and optional fields).
- Validate parsed arguments before calling backend APIs.
- Return deterministic structured payloads from skills so controllers can format final responses consistently.

## Integration Boundaries

- AI service must call backend REST APIs only; never connect directly to MySQL.
- Centralize outbound HTTP calls in `services` and keep controller/agent code thin.
- Reuse backend endpoint contracts and avoid introducing parallel data models in AI service.

## Request And Response Handling

- Keep controller responsibilities: read request, call ai service, return normalized response.
- Normalize success responses with a stable shape:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "skill": "createTransaction"
  }
}
```

- Normalize error responses with a stable shape:

```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Unable to process request",
    "details": null
  }
}
```

## Reliability And Safety

- Add timeout and retry strategy for outbound backend calls where appropriate.
- Handle OpenAI and backend failures separately, with different error codes.
- Never log secrets, tokens, or raw credentials.
- Do not expose internal stack traces in API responses.

## Prompting And Parsing Constraints

- Keep prompts task-focused and schema-constrained.
- Prefer strict parsing outputs (typed fields) over free-text interpretation.
- When confidence is low or required fields are missing, return a clarifying response instead of guessing.
