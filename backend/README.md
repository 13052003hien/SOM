# Backend Service

Express REST API cho web quan ly chi tieu.

## Cai dat

```bash
npm install
```

## Chay local

```bash
npm run dev
```

Mac dinh backend chay tai `http://localhost:4000`.

## Bien moi truong

- `BACKEND_PORT` (default: 4000)
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 3306)
- `DB_USER` (default: root)
- `DB_PASSWORD`
- `DB_NAME` (default: som_db)
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default: 7d)
- `FRONTEND_ORIGIN` (default: http://localhost:5173)

## Migration schema

- SQL file: `src/database/migrations/001_init_schema.sql`

## API chinh

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET/POST/PUT/DELETE /api/wallets`
- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/transactions`
- `GET/POST/PUT/DELETE /api/budgets`
- `GET /api/reports/monthly`
- `GET /api/reports/category`
- `POST /api/import-export/import` (multipart form-data, field file)
- `GET /api/import-export/export`

## Excel Import Template

Can tao file Excel voi hang header:

- `wallet_id`
- `category_id`
- `amount`
- `type` (`income` hoac `expense`)
- `date` (vd: `2026-04-14`)
- `note` (optional)

Tat ca wallet/category trong file phai thuoc user dang dang nhap.
