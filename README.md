# SOM - Quan Ly Chi Tieu Ca Nhan

Monorepo gom 3 service:
- frontend: React + Vite
- backend: Node.js + Express REST API
- ai-service: AI orchestration layer (OpenAI function routing -> backend API)

## 1) Cai dat nhanh

Yeu cau:
- Node.js 18+
- npm 10+

Tai thu muc goc:

```bash
npm install
npm run install:all
```

## 2) Cau hinh moi truong

Copy `.env.example` thanh `.env`, sau do cap nhat gia tri ket noi MySQL va secret:

```bash
copy .env.example .env
```

Mac dinh local:
- backend: http://localhost:4000
- ai-service: http://localhost:5000
- frontend: http://localhost:5173

## 3) Chay du an

Chay dong thoi 3 service:

```bash
npm run dev
```

Hoac chay rieng:

```bash
npm run dev:backend
npm run dev:ai
npm run dev:frontend
```

## 4) Kiem tra nhanh

- backend health: GET http://localhost:4000/health
- ai-service health: GET http://localhost:5000/health
- auth register: POST http://localhost:4000/api/auth/register
- ai endpoint: POST http://localhost:5000/ai/ask

## 5) Tai lieu tung service

- backend docs: backend/README.md
- frontend docs: frontend/README.md
- ai-service docs: ai-service/README.md
