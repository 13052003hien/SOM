---
description: "Scaffold nhanh một backend feature module đầy đủ controller/service/repository/validation/route trong backend/src."
name: "Scaffold Backend Module"
argument-hint: "moduleName=<name>; resource=<plural>; basePath=</path>; fields=<a:type,b:type>; auth=<required|public>"
agent: "agent"
---
Tạo hoặc cập nhật code để thêm **1 backend feature module** mới trong `backend/src/modules` dựa trên tham số người dùng.

## Mục tiêu
- Scaffold trọn module theo kiến trúc: `controller -> service -> repository -> validation -> route wiring`.
- Tuân thủ chuẩn REST, middleware order, pagination, validation và error envelope của project.
- Không phá vỡ các module đang có.

## Bắt buộc trước khi code
1. Đọc và tuân thủ:
   - [Workspace instructions](../copilot-instructions.md)
   - [Backend instructions](../instructions/backend.instructions.md)
2. Khảo sát cấu trúc thực tế trong `backend/src` để giữ naming/style nhất quán.

## Đầu vào (từ arguments)
- `moduleName`: tên module (ví dụ `budgets`)
- `resource`: tên resource REST (ví dụ `budgets`)
- `basePath`: base API path (ví dụ `/budgets`)
- `fields`: danh sách field chính kèm kiểu dữ liệu (ví dụ `categoryId:number,month:string,limitAmount:number`)
- `auth`: `required` hoặc `public`

Nếu thiếu tham số quan trọng, hỏi lại ngắn gọn trước khi scaffold.

## Kết quả cần thực hiện
1. Tạo module tại `backend/src/modules/<moduleName>/` gồm:
   - `<moduleName>.controller.js`
   - `<moduleName>.service.js`
   - `<moduleName>.repository.js`
   - `<moduleName>.validation.js`
2. Tạo hoặc cập nhật route module:
   - `backend/src/modules/<moduleName>/<moduleName>.routes.js` (nếu codebase dùng route theo module)
   - hoặc cập nhật `backend/src/routes/index.js` để mount endpoint.
3. Wiring middleware đúng thứ tự:
   - auth middleware (nếu `auth=required`)
   - validation middleware
   - controller handler
4. Sinh các endpoint REST cơ bản:
   - `GET <basePath>` (list, có pagination)
   - `GET <basePath>/:id` (detail)
   - `POST <basePath>` (create)
   - `PUT <basePath>/:id` (update)
   - `DELETE <basePath>/:id` (delete)
5. Đảm bảo response/error theo envelope chuẩn backend instructions.

## Quy tắc triển khai
- Controller mỏng: nhận request, gọi service, trả response.
- Service chứa business logic và orchestration.
- Repository chỉ xử lý truy cập dữ liệu.
- Validation dùng Zod schema, validate params/query/body trước controller.
- List endpoint phải hỗ trợ: `page`, `limit`, `sortBy`, `sortOrder` với default `page=1`, `limit=20`, max `limit=100`.
- Mọi dữ liệu nghiệp vụ theo user phải có user-scoped access.

## Đầu ra trả lời sau khi hoàn tất
- Liệt kê file đã tạo/sửa.
- Tóm tắt wiring path: `route -> controller -> service -> repository`.
- Nêu các giả định (ORM/model/migration chưa có nếu project chưa scaffold DB).
- Đưa ví dụ request để test nhanh CRUD endpoint mới.
