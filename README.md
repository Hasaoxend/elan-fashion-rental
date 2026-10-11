# Élan Fashion Rental

Ứng dụng đặt lịch thuê trang phục, gồm website khách hàng, trang quản trị và API backend trong một npm workspace.

## Công nghệ và cấu trúc

- `apps/web`: Next.js 15, React 19, TypeScript, Tailwind CSS; cổng 3000.
- `apps/admin`: Next.js 15, React 19, Socket.IO client; cổng 3001.
- `apps/backend`: Express, Prisma 5, SQLite, Socket.IO, JWT, Zod; cổng 4000.
- `docs/API.md`: tài liệu API; `docs/ERD.md`: sơ đồ dữ liệu.

Mã nguồn bao gồm catalog sản phẩm, kiểm tra lịch trống, đặt/tra cứu đơn thuê và các màn hình quản trị. Repo hiện là ứng dụng demo; không coi việc build thành công là bằng chứng đã sẵn sàng production.

## Cài đặt local

Dùng Node.js 22 LTS và npm. Chạy mọi lệnh dưới đây từ thư mục gốc repo. Trên PowerShell, dùng `npm.cmd` và `npx.cmd` nếu chính sách máy chặn `npm.ps1`.

```powershell
npm.cmd ci
```

### 1. Tạo các file môi trường thực tế

`.env.example` ở root chỉ là mẫu tham khảo. Tạo ba file sau; không copy toàn bộ mẫu vào cả ba ứng dụng.

`apps/backend/.env`:

```dotenv
DATABASE_URL="file:./dev.db"
PORT=4000
FRONTEND_URL=http://localhost:3000,http://localhost:3001
JWT_SECRET=replace-with-a-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-random-secret
```

Chạy lệnh này hai lần, dùng mỗi kết quả cho một JWT secret; không giữ giá trị placeholder:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

`apps/web/.env.local` và `apps/admin/.env.local` đều có:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

Biến `NEXT_PUBLIC_*` được gửi đến trình duyệt: chỉ đặt URL công khai ở đây, tuyệt đối không đặt API key/token/password. Env thực tế, database, dependencies, cache và build output được loại khỏi Git. `.dockerignore` cũng loại env/database khỏi Docker build context.

### 2. Tạo database và dữ liệu demo

```powershell
npm.cmd run db:generate --workspace=apps/backend
npm.cmd run db:deploy --workspace=apps/backend
npm.cmd run db:seed --workspace=apps/backend
```

Các lệnh dùng migration SQLite hiện có. Database nằm ở `apps/backend/prisma/dev.db`.

Nếu Prisma 5 trên Windows báo `Schema engine error` khi database chưa tồn tại, chỉ với database local mới, tạo file database qua engine rồi chạy lại `db:deploy`:

```powershell
& ".\node_modules\@prisma\engines\schema-engine-windows.exe" cli --datasource "file:./apps/backend/prisma/dev.db" create-database
npm.cmd run db:deploy --workspace=apps/backend
```

Seed tạo dữ liệu và tài khoản demo; có cập nhật các setting mẫu. Chỉ seed database demo, không chạy seed trên dữ liệu thật.

### 3. Chạy trong ba terminal riêng

Mỗi terminal phải ở thư mục gốc repo:

```powershell
# Terminal 1: backend
npm.cmd run dev:backend
```

```powershell
# Terminal 2: website
npm.cmd run dev:web
```

```powershell
# Terminal 3: admin
npm.cmd run dev:admin
```

- Website: http://localhost:3000
- Admin: http://localhost:3001/login
- API health: http://localhost:4000/health
- Admin demo: `admin@example.com` / `Admin@123456` (chỉ dùng local).

`npm.cmd run dev` chỉ chạy website. Giữ ba terminal mở; `Ctrl+C` dừng server tương ứng. Nếu báo `EADDRINUSE`, cổng đang được một tiến trình sử dụng: dùng server đã chạy hoặc dừng tiến trình đó trước khi chạy lại. Đổi env không giải quyết lỗi trùng cổng.

## Build và kiểm thử

Dừng dev server trước khi build để tránh cùng ghi vào `.next`.

```powershell
npm.cmd run build
```

Website dùng `next/font` với Google Fonts; lần build đầu cần truy cập mạng để tải Inter và Playfair Display.

Backend có hai bài kiểm thử trong `apps/backend/test`. Các bài này cần backend đang chạy, database demo đã seed, và có tạo/xóa dữ liệu test. Chỉ chạy trên môi trường test/demo riêng; không trỏ vào database thật:

```powershell
npm.cmd run test --workspace=apps/backend
```

Nếu dùng database test khác, backend và tiến trình test phải dùng cùng `DATABASE_URL`; `API_URL` của tiến trình test phải trỏ đến backend đó.
