---
description: "Scaffold full feature vertical slice: backend module + frontend page + AI skill trong một lần chạy, tự nối end-to-end theo instruction hiện tại."
name: "Scaffold Vertical Slice"
argument-hint: "featureName=<name>; basePath=</path>; fields=<a:type,b:type>; auth=<required|public>; aiSkill=<name>; userIntent=<text>"
agent: "agent"
---
Tạo hoặc cập nhật code để scaffold **1 full feature vertical slice** chạy xuyên suốt từ frontend tới backend và AI service.

## Mục tiêu
- Scaffold đồng thời:
  - backend feature module
  - frontend page + service + store slice
  - AI skill + wiring route/controller/service
- Tự nối các lớp để có luồng end-to-end nhất quán.
- Tuân thủ toàn bộ instruction hiện có trong workspace.

## Bắt buộc trước khi code
1. Đọc và tuân thủ:
   - [Workspace instructions](../copilot-instructions.md)
   - [Backend instructions](../instructions/backend.instructions.md)
   - [Frontend instructions](../instructions/frontend.instructions.md)
   - [AI service instructions](../instructions/ai-service.instructions.md)
2. Khảo sát cấu trúc thực tế của:
   - `backend/src`
   - `frontend/src`
   - `ai-service/src`
3. Giữ naming/style nhất quán với các file đã có.

## Đầu vào (từ arguments)
- `featureName`: tên feature chính (ví dụ `budgets`)
- `basePath`: backend API path (ví dụ `/budgets`)
- `fields`: danh sách field chính (ví dụ `categoryId:number,month:string,limitAmount:number`)
- `auth`: `required` hoặc `public`
- `aiSkill`: tên AI skill (ví dụ `createBudgetFromText`)
- `userIntent`: mô tả ngắn intent ngôn ngữ tự nhiên AI cần xử lý

Nếu thiếu tham số quan trọng, hỏi lại ngắn gọn trước khi scaffold.

## Kết quả cần thực hiện
1. Backend module (CRUD + validation + route + middleware)
- Tạo/cập nhật trong `backend/src/modules/<featureName>/`:
  - `<featureName>.controller.js`
  - `<featureName>.service.js`
  - `<featureName>.repository.js`
  - `<featureName>.validation.js`
  - `<featureName>.routes.js` (nếu pattern repo dùng route theo module)
- Mount route vào `backend/src/routes/index.js` nếu cần.
- Đảm bảo middleware order đúng và list endpoint có pagination mặc định.

2. Frontend slice (page + service + store + route)
- Tạo/cập nhật:
  - `frontend/src/pages/<FeatureName>/index.jsx`
  - `frontend/src/services/<featureName>.service.js`
  - `frontend/src/store/<featureName>/index.js`
  - `frontend/src/routes/index.jsx`
- Page dùng service layer, không gọi API trực tiếp trong JSX.
- Có loading/empty/error state và responsive mobile-first.

3. AI service slice (skill + orchestration + route)
- Tạo/cập nhật:
  - `ai-service/src/skills/<aiSkill>.js`
  - `ai-service/src/services/ai.service.js`
  - `ai-service/src/controllers/ai.controller.js`
  - `ai-service/src/routes/ai.routes.js`
  - `ai-service/src/agents/copilot.agent.js` (nếu có registry/dispatcher)
- Skill parse intent theo schema input, validate trước khi gọi backend API.
- Chuẩn hóa success/error envelope theo AI instructions.

## Quy tắc triển khai
- Không truy cập DB trực tiếp từ frontend hoặc ai-service.
- Giữ boundary rõ ràng: frontend -> backend -> database, AI service -> backend API.
- Controller mỏng, service orchestration, repository truy cập dữ liệu.
- Không phá vỡ endpoint hiện có; ưu tiên backward compatibility.
- Nếu codebase chưa có đủ khung, scaffold tối thiểu để chạy được và ghi rõ giả định.

## Checklist tự kiểm tra trước khi kết thúc
- Backend endpoint mới gọi được và trả envelope chuẩn.
- Frontend route truy cập được, gọi đúng backend endpoint.
- AI skill gọi đúng backend endpoint và trả kết quả có cấu trúc.
- Không còn import path sai hoặc wiring thiếu.

## Đầu ra trả lời sau khi hoàn tất
- Liệt kê file đã tạo/sửa theo từng service.
- Tóm tắt end-to-end flow: `frontend route -> page -> store -> service -> backend route -> controller -> service -> repository`, và `ai route -> controller -> ai service -> skill -> backend API`.
- Nêu giả định và phần còn thiếu (nếu có).
- Đưa ví dụ test nhanh cho cả 3 phần: backend API, frontend route, AI endpoint.
