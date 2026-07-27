# STEM Lab — Website giáo dục STEM

Website giới thiệu & bán thiết bị giáo dục STEM, dựng bằng **HTML/CSS/JS thuần** (không build step),
triển khai trên **Cloudflare Pages**. Giao diện tham khảo bố cục các website giáo dục STEM
(kiểu ohstem.vn): thanh thông báo, header dính có mega-menu, hero carousel, khối sản phẩm chủ lực,
hệ sinh thái hỗ trợ, số liệu, lưới tin tức, CTA cộng đồng, footer nhiều cột và nút liên hệ nổi.

> ⚠️ Toàn bộ thương hiệu, nội dung, hình ảnh, số điện thoại, mã số thuế trong repo là **placeholder**.
> Thay bằng thông tin thật của bạn trước khi đưa lên tên miền chính thức (xem mục *Đổi thương hiệu*).

---

## 1. Cấu trúc thư mục

```
stem-edu-web/
├── public/                     # ← thư mục được deploy lên Cloudflare Pages
│   ├── index.html              # Trang chủ
│   ├── san-pham.html           # Danh sách sản phẩm (lọc theo danh mục + tìm kiếm)
│   ├── chi-tiet-san-pham.html  # Chi tiết sản phẩm (gallery, tabs, thông số)
│   ├── tin-tuc.html            # Tin tức & dự án (bài nổi bật + lọc + phân trang)
│   ├── ve-chung-toi.html       # Giới thiệu (câu chuyện, timeline, giá trị, đội ngũ)
│   ├── lien-he.html            # Liên hệ (form + bản đồ + FAQ)
│   ├── 404.html
│   ├── _headers                # Security headers + cache policy
│   ├── _redirects              # Luật chuyển hướng
│   ├── robots.txt · sitemap.xml
│   └── assets/
│       ├── css/style.css       # Toàn bộ design system (biến CSS ở :root)
│       ├── js/site.config.js   # ⭐ CẤU HÌNH THƯƠNG HIỆU + dữ liệu sản phẩm/tin tức
│       ├── js/main.js          # Carousel, menu, lọc, giỏ hàng, form, hiệu ứng…
│       └── img/                # Logo + ảnh minh hoạ SVG (placeholder)
│   └── admin/                  # 🔒 Trang quản trị (đổi logo/màu/nội dung)
├── functions/api/
│   ├── contact.js              # Xử lý form liên hệ
│   ├── settings.js             # GET cấu hình công khai cho website
│   └── admin/                  # login / logout / settings (cần đăng nhập)
├── lib/                        # auth.js (HMAC session) · settings.js (đọc/ghi KV)
├── tools/build_pages.py        # (tuỳ chọn) ghép header/footer dùng chung ra các trang con
├── wrangler.toml
└── package.json
```

## 2. Chạy thử ở máy

Cách nhanh nhất (không cần cài gì, nhưng form liên hệ sẽ không chạy vì thiếu Function):

```bash
python3 -m http.server 8899 --directory public
# mở http://127.0.0.1:8899
```

Chạy đúng như môi trường Cloudflare (có cả Pages Function `/api/contact`):

```bash
npm install          # cài wrangler
npm run dev          # = wrangler pages dev public
```

## 3. Deploy lên Cloudflare

### Cách A — Deploy trực tiếp bằng Wrangler (nhanh nhất)

```bash
npx wrangler login                 # đăng nhập tài khoản Cloudflare bằng trình duyệt
npx wrangler pages project create stemlab-web --production-branch main
npm run deploy                     # = wrangler pages deploy  (đọc wrangler.toml)
```

Sau vài giây bạn sẽ nhận URL dạng `https://stemlab-web.pages.dev`.
Mỗi lần sửa code, chỉ cần chạy lại `npm run deploy`.

Deploy bản xem thử (không đụng tới production):

```bash
npm run deploy:preview
```

### Cách B — Kết nối Git (tự động deploy mỗi lần push)

1. Đẩy repo lên GitHub/GitLab.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Chọn repo, rồi cấu hình build:
   - **Framework preset**: `None`
   - **Build command**: *(để trống)*
   - **Build output directory**: `public`
4. **Save and Deploy**. Từ đó mỗi commit vào nhánh `main` sẽ tự deploy production,
   mỗi Pull Request sẽ có một URL preview riêng.

### Gắn tên miền riêng

Cloudflare Dashboard → project vừa tạo → tab **Custom domains** → **Set up a domain**
→ nhập `stemlab.vn` (hoặc tên miền của bạn). Nếu tên miền đã trỏ nameserver về Cloudflare,
bản ghi DNS sẽ được tạo tự động và HTTPS bật sẵn.

## 4. Cấu hình form liên hệ

Form ở trang Liên hệ và ô đăng ký nhận tin gửi `POST /api/contact`
(xử lý bởi [`functions/api/contact.js`](functions/api/contact.js)).

Mặc định Function nhận dữ liệu, chặn spam bằng honeypot rồi **ghi log** và trả về `{ ok: true }`.
Để thật sự nhận được thông tin, thêm biến môi trường trong
**Cloudflare Dashboard → project → Settings → Variables and Secrets**:

| Biến | Tác dụng |
|---|---|
| `CONTACT_WEBHOOK_URL` | Đẩy JSON tới webhook (Google Apps Script → Google Sheet, Zapier, Make, n8n, Slack…). Đơn giản nhất. |
| `RESEND_API_KEY` + `MAIL_TO` + `MAIL_FROM` | Gửi email thông báo qua [Resend](https://resend.com). |
| `TURNSTILE_SECRET` | Bật kiểm tra captcha Cloudflare Turnstile (cần thêm widget vào form). |

Chạy thử ở local: sao chép `.dev.vars.example` thành `.dev.vars` rồi điền giá trị.
Xem log realtime của production: `npm run tail`.

## 5. Trang quản trị (đổi logo, màu, nội dung không cần sửa code)

Đường dẫn: **`/admin`** (ví dụ `https://stemlab.vn/admin` hoặc `http://localhost:8788/admin`
khi chạy `npm run dev`). Đây là trang quản trị nhẹ, cho phép:

- **Cấu hình** (1 trang gộp): logo + **favicon** + **ảnh SEO/OG**, tên công ty, slogan, hotline 1/2,
  email, địa chỉ, mã số thuế, giờ làm việc, Google Maps, Facebook/YouTube/TikTok/Zalo,
  **tiêu đề & mô tả SEO trang chủ**, giới thiệu chân trang — tất cả hiển thị động ra UI.
- **Đổi mật khẩu quản trị** (ở tab Hộp thư): lưu hash trên KV; sau khi đổi dùng mật khẩu mới.
- **Đổi bảng màu** bằng bảng chọn màu, có mẫu nhanh và khung xem trước.

- **Quản lý banner trang chủ**: tải nhiều ảnh banner (do bạn thiết kế) làm slider tự chạy,
  đặt link khi bấm, sắp xếp thứ tự, chọn kiểu hiển thị và tốc độ chuyển.
- **Nội dung trang chủ**: sửa tiêu đề, mô tả, nút của **mọi khối** (thông báo, các khối sản
  phẩm, 3 thẻ hỗ trợ + màu nền, số liệu nổi bật, CTA cộng đồng…) — không cần đụng code.
- **Sản phẩm & Tin tức**: thêm / sửa / xoá / sắp xếp, tải ảnh riêng cho từng mục;
  hiển thị ngay ở trang chủ và trang danh sách có lọc.
- **Trang giới thiệu**: mỗi mục (Về STEM Lab, Tầm nhìn – Sứ mệnh, Giá trị cốt lõi…) là
  một trang nội dung nhập trong quản trị; menu “Giới thiệu” tự cập nhật theo danh sách.
- **Giải pháp**: quản lý dạng sản phẩm (Phòng STEM Tiểu học/THCS/THPT, Smart Classroom…).
- **Bài viết** (Chương trình đào tạo / Dự án – Hoạt động / Tài nguyên): mỗi bài chọn danh
  mục; có **trường “Link ngoài”** — để trống thì dùng trang bài viết hệ thống tự sinh
  (`bai-viet.html?id=…`), có link thì mục menu trỏ thẳng sang link đó.
- **Danh mục (menu)**: quản lý danh mục dạng bảng cây; đây là nguồn sinh **menu chính** ngoài
  trang với **3 cấp** — cấp 1 nằm trên thanh menu, hover đổ cấp 2, cấp 2 đổ cấp 3 (flyout).
  Mỗi danh mục có: Thuộc danh mục (phân cấp), Loại (Sản phẩm/Tin tức/Liên kết), Ảnh,
  Liên kết (trống = tự sinh theo loại), Hiển thị ở trang chủ, Trạng thái (Hiện/Ẩn — Ẩn thì
  không lên menu). Danh mục loại Sản phẩm/Tin tức trỏ tới trang danh sách lọc theo `?cat=<id>`.
- **Hộp thư liên hệ**: xem lại mọi yêu cầu gửi từ form Liên hệ (lưu trên KV).

Các trường **Tóm tắt** và **Nội dung** (ở Trang giới thiệu, Giải pháp, Bài viết, Sản phẩm,
Tin tức) dùng **trình soạn thảo CKEditor** (định dạng chữ, chèn ảnh/bảng/liên kết, xem “Mã
HTML”). CKEditor tải từ CDN nên trang admin cần có internet; nếu offline, ô sẽ về dạng
textarea thường (vẫn nhập được, có thể gõ thẳng HTML).

### Điều hướng & các trang động

Menu header sinh **động** từ dữ liệu (thêm mục trong admin là menu tự cập nhật). Các trang
dùng chung 4 “template” + định tuyến bằng query string, không cần tạo file cho từng mục:

| Trang | Đường dẫn | Nội dung |
|---|---|---|
| Giới thiệu | `gioi-thieu.html?p=<slug>` | 1 trang nội dung |
| Giải pháp | `giai-phap.html` · `giai-phap.html?id=<slug>` | danh sách / chi tiết |
| Danh mục | `chuyen-muc.html?c=<nhóm>` | danh sách bài theo danh mục |
| Bài viết | `bai-viet.html?id=<slug>` | 1 bài (hoặc chuyển hướng nếu có link ngoài) |

### Trường SEO & dữ liệu mở rộng

Mỗi Danh mục / Sản phẩm / Tin tức / Bài viết / Trang / Giải pháp đều có **Từ khóa,
Mô tả (meta description), Tiêu đề SEO** — tự áp vào `<title>`, `<meta name=description/keywords>`
và thẻ Open Graph trên trang chi tiết. Ngoài ra:
- **Sản phẩm**: Mã sản phẩm, Ảnh đại diện + **Ảnh chi tiết (nhiều ảnh)**, Giá bán / Giá thị trường,
  Nhãn (Mới/Bán chạy/Nổi bật), **Thuộc nhiều danh mục** (checkbox), Tóm tắt + Nội dung (CKEditor).
- **Tin tức**: **Thuộc nhiều danh mục**, Nhãn, Link tùy chọn, Tóm tắt + Nội dung (CKEditor).
- **Danh mục**: Tóm tắt + Nội dung (CKEditor) hiển thị đầu trang danh sách; Hiện trang chủ / Hiện menu.

### URL sạch (/ten-muc.html)

Mọi link trên site dùng dạng **`/ten-san-pham.html`, `/ten-danh-muc.html`, `/ten-bai-viet.html`**
(slug tạo từ tên). Vì nội dung là động (admin nhập, lưu KV) nên không tạo sẵn file cho từng
mục; thay vào đó `functions/_middleware.js` bắt các đường dẫn `.html` không phải file thật và
trả về `public/router.html` (status 200). `router.html` đọc slug từ URL rồi render đúng loại
(sản phẩm / danh mục / bài viết / trang / giải pháp). Chạy local bằng `tools/dev_server.py`
đã mô phỏng đúng hành vi này.

### Liên hệ & bản đồ

Trang Liên hệ có form gửi về email/webhook (mục 4) **và** lưu vào hộp thư quản trị (KV).
Bản đồ nhúng **tự sinh theo Địa chỉ** công ty; nếu điền “Mã nhúng bản đồ” riêng trong tab
Liên hệ thì dùng mã đó.

Cấu hình lưu trên **Cloudflare KV** và *ghi đè* lên `site.config.js`, nên website vẫn
chạy bình thường kể cả khi chưa lưu gì. **Mỗi tab có nút lưu riêng** (ví dụ “Lưu liên hệ”,
“Lưu danh mục”…); thêm/sửa trong popup cũng lưu thẳng lên server. Thay đổi hiện trên toàn
site trong vài giây (không cần deploy lại).

> **Banner:** trong tab *Banner (slider ảnh)*, mỗi ảnh là một slide. Khi chưa có ảnh nào,
> trang chủ tự dùng banner chữ + robot mặc định. Ảnh nên đúng tỉ lệ **1920×720px** và nén
> nhẹ (< 400KB/ảnh) vì ảnh được lưu kèm cấu hình; tối đa 8 banner.

### Thiết lập một lần

**1. Đặt mật khẩu quản trị** (biến môi trường, trong Dashboard → project → Settings →
Variables and Secrets, hoặc file `.dev.vars` khi chạy local):

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `ADMIN_PASSWORD` | ✅ | Mật khẩu đăng nhập `/admin`. |
| `ADMIN_SESSION_SECRET` | nên có | Chuỗi ngẫu nhiên ký phiên đăng nhập. Không đặt thì tự dẫn xuất từ mật khẩu. |

**2. Tạo KV để lưu cấu hình:**

```bash
npx wrangler kv namespace create SETTINGS
```

Lệnh trả về một `id`. Mở `wrangler.toml`, bỏ ghi chú khối `[[kv_namespaces]]` và dán `id` vào:

```toml
[[kv_namespaces]]
binding = "SETTINGS"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

> Nếu dùng cách deploy qua Git (mục 3B), vào Dashboard → project → Settings → Functions →
> **KV namespace bindings**, thêm binding tên `SETTINGS` trỏ tới namespace vừa tạo.

**3. Deploy lại** (`npm run deploy` hoặc push Git). Xong — vào `/admin`, đăng nhập bằng
`ADMIN_PASSWORD`.

Chạy thử ở local: thêm `ADMIN_PASSWORD="matkhau"` vào `.dev.vars` rồi `npm run dev`,
truy cập `http://localhost:8788/admin`. (KV local do Wrangler tự mô phỏng.)

> Nếu chưa gắn KV, trang admin vẫn đăng nhập được và thay đổi được **lưu tạm trong trình
> duyệt** (localStorage) để bạn xem thử — nhưng chưa xuất bản cho người khác thấy.

---

## 6. Đổi thương hiệu bằng cách sửa code (thay cho trang admin)

**Bước 1 — Thông tin thương hiệu:** sửa `public/assets/js/site.config.js`.
Mọi phần tử có `data-site="..."` trong HTML sẽ tự động được điền lại:

```js
window.SITE = {
  brand:   { name: "Tên công ty của bạn", tagline: "Slogan ngắn", ... },
  company: { legalName: "...", taxCode: "...", address: "...", ... },
  contact: { phone: "...", email: "...", zalo: "...", ... },
  social:  { facebook: "...", youtube: "...", ... },
};
```

> Nội dung mặc định vẫn được viết cứng trong HTML để site hiển thị đầy đủ ngay cả khi
> tắt JavaScript (tốt cho SEO). Vì vậy sau khi đổi config, nên tìm–thay thế nốt các chuỗi
> mặc định trong `public/*.html`:
> ```bash
> cd public && grep -rl "STEM Lab" . | xargs sed -i '' 's/STEM Lab/Tên của bạn/g'
> ```

**Bước 2 — Màu sắc & bo góc:** đổi bảng màu ở `theme` trong `site.config.js` (hoặc dùng
trang admin). Muốn chỉnh sâu hơn thì sửa khối `:root` đầu file `public/assets/css/style.css`:

```css
--c-primary: #1273e6;   /* xanh chủ đạo (theo logo STEM Lab) */
--c-primary-900: #10306e; /* navy đậm: viền, chữ, chân trang */
--c-accent:  #ff9500;   /* cam nhấn cho nút CTA */
--r-lg: 20px;           /* độ bo góc thẻ */
```

**Bước 3 — Logo & hình ảnh:** thay các file trong `public/assets/img/`
(giữ nguyên tên file thì không cần sửa HTML). Nên dùng ảnh thật `.webp` cho sản phẩm/tin tức.

**Bước 4 — Sản phẩm & bài viết:** sửa hai mảng `window.PRODUCTS` và `window.POSTS`
ở cuối `site.config.js`. Trang danh sách tự render, tự lọc, tự tìm kiếm theo dữ liệu này.
Khi có CMS/API thật, chỉ cần thay mảng bằng dữ liệu `fetch` từ server.

## 7. Sửa header/footer dùng chung

Header và footer được viết trực tiếp trong từng file HTML (không cần JS để hiển thị).
Để không phải sửa 6 file bằng tay:

1. Sửa header/footer trong `public/index.html`.
2. Sửa phần thân riêng của từng trang trong `tools/parts/*.body.html`.
3. Chạy `npm run build` (`python3 tools/build_pages.py`) — script ghép lại toàn bộ trang con.

Đây **không** phải build step bắt buộc khi deploy: các file `.html` đã nằm sẵn trong `public/`.

## 8. Những gì đã có sẵn

- **Trang quản trị `/admin`**: đổi logo, bảng màu, thương hiệu, liên hệ — lưu trên Cloudflare KV.
- Responsive đầy đủ (desktop / tablet / mobile), menu dạng drawer trên mobile.
- Hero carousel tự chạy, có nút điều hướng, chấm chỉ mục, vuốt trên mobile, dừng khi hover.
- Bảng màu & logo **động**: nạp từ KV lúc tải trang, ghi đè `site.config.js`.
- Lọc + tìm kiếm sản phẩm và tin tức (client-side, không cần server).
- Giỏ hàng đếm số lượng lưu trong `localStorage` (chưa có thanh toán — xem mục 9).
- Hiệu ứng xuất hiện khi cuộn, số liệu đếm tăng dần, nút lên đầu trang.
- Tabs, accordion FAQ, gallery ảnh sản phẩm.
- SEO cơ bản: title/description riêng từng trang, canonical, Open Graph, JSON-LD, sitemap, robots.
- Accessibility: skip link, `aria-*`, focus ring rõ ràng, tôn trọng `prefers-reduced-motion`.
- Security headers và cache policy trong `public/_headers`; đăng nhập admin ký HMAC, cookie HttpOnly.

## 9. Gợi ý mở rộng

| Nhu cầu | Hướng làm |
|---|---|
| Bán hàng thật (giỏ hàng, thanh toán) | Nhúng Snipcart/Ecwid, hoặc viết Pages Function nối cổng thanh toán (VNPay, MoMo). |
| Quản trị nội dung | Thêm CMS headless (Sanity, Strapi, Contentful) rồi `fetch` trong `site.config.js`. |
| Nhiều bài viết | Chuyển sang Astro + Markdown, vẫn deploy Cloudflare Pages như hiện tại. |
| Đa ngôn ngữ | Nhân bản thư mục theo `vi/` và `en/`, dùng `_redirects` để định tuyến. |
| Chống spam mạnh hơn | Bật Cloudflare Turnstile (đã hỗ trợ sẵn trong `functions/api/contact.js`). |
| Thống kê truy cập | Bật Cloudflare Web Analytics (miễn phí, không cần cookie). |
