# Hướng dẫn deploy lên Cloudflare Pages (qua Git)

Không cần cài Node/wrangler trên máy. Chỉ cần tài khoản GitHub + Cloudflare.

---

## Bước 1 — Đưa mã nguồn lên GitHub

Mã đã được `git init` + commit sẵn. Bạn tạo repo trống trên GitHub (ví dụ tên `stemlab-web`), rồi chạy:

```bash
cd /Users/phuongdt/stem-edu-web
git remote add origin https://github.com/<TÊN_GITHUB>/stemlab-web.git
git branch -M main
git push -u origin main
```

> `tools/.dev-*.json` (dữ liệu test) và secrets đã được `.gitignore`, không bị đẩy lên.

---

## Bước 2 — Tạo KV namespace (nơi lưu nội dung động)

Cloudflare Dashboard → **Workers & Pages** → **KV** → **Create a namespace**
- Tên: `SETTINGS`
- Tạo xong, **copy Namespace ID**.

Mở `wrangler.toml`, thay `PASTE_KV_ID_HERE` bằng ID vừa copy:

```toml
[[kv_namespaces]]
binding = "SETTINGS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

Commit + push lại:

```bash
git add wrangler.toml && git commit -m "chore: gắn KV id" && git push
```

---

## Bước 3 — Kết nối Cloudflare Pages với Git

Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
- Chọn repo `stemlab-web`.
- **Framework preset**: `None`
- **Build command**: *(để trống)*
- **Build output directory**: `public`
- **Save and Deploy**.

Sau ~1 phút bạn có URL: `https://stemlab-web.pages.dev` → **đây là link gửi khách test**.

---

## Bước 4 — Đặt mật khẩu quản trị (bắt buộc để đăng nhập /admin)

Cloudflare Dashboard → project `stemlab-web` → **Settings** → **Variables and Secrets** → **Add**
- Type: **Secret**
- Name: `ADMIN_PASSWORD`
- Value: *(mật khẩu bạn tự chọn)*

Lưu lại rồi bấm **Retry deployment** (hoặc push 1 commit) để áp dụng.

> `/admin` sẽ đăng nhập bằng đúng mật khẩu này. Sau khi vào có thể đổi mật khẩu trong tab Hộp thư.

---

## Bước 5 — Nạp nội dung bạn đã dựng vào KV

Để bản live hiển thị **đúng nội dung bạn đã nhập** (danh mục, sản phẩm, trang Giới thiệu, footer…), nạp dữ liệu vào KV:

Cloudflare Dashboard → **Workers & Pages** → **KV** → namespace `SETTINGS` → **View / Add entry**
- **Key**: `site-settings`
- **Value**: dán **toàn bộ** nội dung file `deploy/kv-site-settings.min.json` (1 dòng, đã nén gọn)
- **Add entry**.

Xong. Tải lại `https://stemlab-web.pages.dev` → nội dung khớp với bản bạn đang test ở máy.

> Từ giờ, mọi chỉnh sửa trong `/admin` trên bản live sẽ tự ghi vào KV này. Không cần dán lại.

---

## Bước 6 — (tuỳ chọn) Nhận thông tin liên hệ

Mặc định form Liên hệ chỉ ghi log. Muốn nhận thật, thêm biến ở **Settings → Variables and Secrets**:
- `CONTACT_WEBHOOK_URL` (đẩy về Google Sheet/Zapier/Slack…), hoặc
- `RESEND_API_KEY` + `MAIL_TO` + `MAIL_FROM` (gửi email qua Resend).

---

## Cập nhật sau này

Mỗi lần sửa code: `git add -A && git commit -m "..." && git push` → Cloudflare tự deploy lại.
Mỗi Pull Request có 1 URL preview riêng để xem thử trước khi lên chính thức.

## Gắn tên miền riêng
Project → **Custom domains** → **Set up a domain** → nhập tên miền của bạn.
