---
description: "Scaffold nhanh một frontend page đầy đủ page component, service API và store slice trong frontend/src theo chuẩn page-first."
name: "Scaffold Frontend Page"
argument-hint: "pageName=<name>; routePath=</path>; featureKey=<key>; apiResource=<resource>; fields=<a:type,b:type>"
agent: "agent"
---
Tạo hoặc cập nhật code để thêm **1 frontend page** mới trong `frontend/src` dựa trên tham số người dùng.

## Mục tiêu
- Scaffold trọn bộ: `page + service + store slice` theo chuẩn page-first.
- Tự nối route để page có thể truy cập được.
- Tuân thủ frontend instruction hiện tại (service layer, responsive UI, state flow rõ ràng).

## Bắt buộc trước khi code
1. Đọc và tuân thủ:
   - [Workspace instructions](../copilot-instructions.md)
   - [Frontend instructions](../instructions/frontend.instructions.md)
2. Khảo sát cấu trúc thực tế trong `frontend/src` để giữ naming/style nhất quán.

## Đầu vào (từ arguments)
- `pageName`: tên page (ví dụ `Budgets`)
- `routePath`: route URL (ví dụ `/budgets`)
- `featureKey`: key state/service (ví dụ `budgets`)
- `apiResource`: resource backend (ví dụ `budgets`)
- `fields`: field chính để dựng form/table/filter (ví dụ `category:string,limitAmount:number,month:string`)

Nếu thiếu tham số quan trọng, hỏi lại ngắn gọn trước khi scaffold.

## Kết quả cần thực hiện
1. Tạo page component theo page-first:
   - `frontend/src/pages/<pageName>/index.jsx` (hoặc theo pattern hiện có của repo)
2. Tạo service layer:
   - `frontend/src/services/<featureKey>.service.js`
   - Gồm các hàm cơ bản: list/getById/create/update/delete, gọi backend qua API client chung.
3. Tạo store slice:
   - `frontend/src/store/<featureKey>/index.js` (hoặc file pattern tương ứng)
   - Có state cho: data, loading, error, pagination/filter cơ bản.
4. Wiring route:
   - Cập nhật `frontend/src/routes/index.jsx` để mount `routePath -> <pageName>`.
5. Nếu cần, thêm component con tối thiểu trong page folder để tách UI (form/list/filter) nhưng không over-engineer.

## Quy tắc triển khai
- Không gọi API trực tiếp trong JSX page; mọi network call đi qua `src/services`.
- Page chịu orchestration (load data, dispatch action, pass props), không nhồi business logic vào component trình bày.
- UI mặc định mobile-first, không hard-code kích thước gây vỡ trên màn nhỏ.
- Luôn có trạng thái `loading`, `empty`, `error` rõ ràng cho page dữ liệu.
- Chuẩn hóa xử lý lỗi tại service để UI nhận một shape nhất quán.
- Không gọi trực tiếp database hoặc AI service từ frontend.

## Đầu ra trả lời sau khi hoàn tất
- Liệt kê file đã tạo/sửa.
- Tóm tắt wiring path: `route -> page -> store slice -> service -> backend API`.
- Nêu giả định đã dùng (state library, UI pattern, API client hiện có).
- Đưa ví dụ thao tác nhanh để kiểm tra page mới hoạt động.
