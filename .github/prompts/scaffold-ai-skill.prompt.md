---
description: "Scaffold nhanh một AI skill mới và tự nối route/controller/service trong ai-service theo chuẩn function-calling."
name: "Scaffold AI Skill"
argument-hint: "skillName=<name>; action=<intent>; backendEndpoint=<METHOD /path>; inputFields=<a,b,c>; outputShape=<json>"
agent: "agent"
---
Tạo hoặc cập nhật code để thêm **1 AI skill mới** trong `ai-service/src` dựa trên tham số người dùng.

## Mục tiêu
- Sinh skill mới theo chuẩn function-calling.
- Tự nối đầy đủ qua `service`, `controller`, `route` (và agent/registry nếu có).
- Tuân thủ các instruction hiện có của workspace.

## Bắt buộc trước khi code
1. Đọc và tuân thủ:
   - [Workspace instructions](../copilot-instructions.md)
   - [AI service instructions](../instructions/ai-service.instructions.md)
   - [Backend instructions](../instructions/backend.instructions.md) khi cần map API contract
2. Khảo sát cấu trúc hiện tại trong `ai-service/src` để giữ style hiện có.

## Đầu vào (từ arguments)
- `skillName`: tên skill (ví dụ `createBudgetAlert`)
- `action`: tác vụ nghiệp vụ cần skill xử lý
- `backendEndpoint`: endpoint backend cần gọi (ví dụ `POST /transactions`)
- `inputFields`: danh sách trường đầu vào mong đợi
- `outputShape`: shape response mong muốn

Nếu thiếu tham số quan trọng, hỏi lại ngắn gọn trước khi scaffold.

## Kết quả cần thực hiện
1. Tạo file skill mới: `ai-service/src/skills/<skillName>.js`
2. Cập nhật hoặc tạo các điểm nối cần thiết để skill chạy end-to-end:
   - `ai-service/src/services/ai.service.js`
   - `ai-service/src/controllers/ai.controller.js`
   - `ai-service/src/routes/ai.routes.js`
   - `ai-service/src/agents/copilot.agent.js` (nếu có registry/dispatcher)
3. Đảm bảo:
   - Chỉ gọi backend REST API, không truy cập DB trực tiếp.
   - Validate input trước khi gọi backend.
   - Chuẩn hóa success/error envelope theo instruction AI service.
   - Có xử lý timeout/lỗi backend và lỗi OpenAI tách biệt.
4. Nếu project chưa có khung file trên, scaffold tối thiểu để chạy được và giữ kiến trúc tách lớp.

## Quy tắc triển khai
- Controller mỏng: nhận request, gọi service, trả response chuẩn.
- Service giữ orchestration: prompt/parsing/function-calling + gọi backend API.
- Skill một trách nhiệm, output có cấu trúc rõ ràng.
- Không phá vỡ behavior cũ: giữ tương thích ngược nếu đã có endpoint hoạt động.

## Đầu ra trả lời sau khi hoàn tất
- Liệt kê file đã tạo/sửa.
- Tóm tắt wiring path: `route -> controller -> service -> skill -> backend API`.
- Nêu các giả định đã dùng.
- Đưa ví dụ request để test nhanh endpoint AI mới.
