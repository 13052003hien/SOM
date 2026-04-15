# AI Service

AI orchestration layer cho natural language -> backend API.

## Cai dat

```bash
npm install
```

## Chay local

```bash
npm run dev
```

Mac dinh ai-service chay tai `http://localhost:5000`.

## Bien moi truong

- `AI_SERVICE_PORT` (default: 5000)
- `BACKEND_BASE_URL` (default: http://localhost:4000/api)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: gpt-4.1-mini)
- `FRONTEND_ORIGIN` (default: http://localhost:5173)

## Endpoint

- `POST /ai/ask`
  - Body: `{ "prompt": "Hom nay an trua 50k" }`
  - Header: `Authorization: Bearer <backend-jwt>`
