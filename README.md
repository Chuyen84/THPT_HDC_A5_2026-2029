# Ứng Dụng Quản Lý Lớp Học - Lớp 10A5 (THPT HDC 2026 - 2029)

Hệ thống web quản lý thông tin lớp học, gắn kết giáo viên chủ nhiệm, phụ huynh và học sinh. Xây dựng bằng Next.js (App Router, Turbopack, Tailwind CSS) và Supabase (PostgreSQL, Auth, Row Level Security).

---

## ⚙️ Biến Môi Trường (Environment Variables) Cho Vercel

Trước khi deploy lên Vercel, bạn cần khai báo đầy đủ các biến môi trường sau trong **Vercel Dashboard** (`Project Settings -> Environment Variables`):

| Tên Biến | Mô Tả | Ví Dụ Giá Trị |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Địa chỉ URL kết nối của Supabase Project | `https://your-project-id.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Khóa Public / Anon API Key của Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

> [!NOTE]
> - Lấy các giá trị này tại: **Supabase Dashboard -> Project Settings -> API**.
> - Đảm bảo chọn đủ 3 môi trường trên Vercel: **Production**, **Preview**, và **Development**.

---

## 🚀 Kiểm Tra Trạng Thái Kết Nối (Health Check)

Sau khi deploy thành công lên Vercel, bạn có thể kiểm tra trạng thái kết nối giữa ứng dụng và cơ sở dữ liệu Supabase bằng cách truy cập:

```
https://<domain-cua-ban>.vercel.app/health
```

- Nếu màn hình hiển thị badge xanh **"Kết nối OK"**: Ứng dụng đã kết nối cơ sở dữ liệu Supabase thành công 100%.
- Nếu hiển thị **"Kết nối thất bại"**: Cần kiểm tra lại các biến môi trường đã lưu trên Vercel.

---

## 🌐 Cấu Hình Serverless Region

Ứng dụng được cấu hình chạy trên Serverless Function khu vực **Singapore (`sin1`)** qua file `vercel.json` để tối ưu hóa tốc độ tải trang và độ trễ thấp nhất cho người dùng tại Việt Nam.

---

## 💻 Chạy Local (Môi Trường Phát Triển)

1. Cài đặt dependencies:
   ```bash
   npm install
   ```

2. Tạo file cấu hình `.env.local` từ mẫu:
   ```bash
   cp .env.local.example .env.local
   ```
   Điền URL và Anon Key của Supabase vào file `.env.local`.

3. Khởi động server phát triển:
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại [http://localhost:3000](http://localhost:3000) (hoặc port được cấp).
