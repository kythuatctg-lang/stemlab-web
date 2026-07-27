#!/usr/bin/env python3
"""
Ghép các trang con từ header/footer dùng chung trong index.html + phần thân
trong tools/parts/*.body.html.

Chạy:  python3 tools/build_pages.py
Lưu ý: đây KHÔNG phải build step bắt buộc để deploy — các file .html sinh ra
đã nằm sẵn trong repo và deploy trực tiếp lên Cloudflare Pages.
Chỉ chạy lại khi bạn sửa header/footer trong index.html và muốn đồng bộ.
"""
import re, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "public"
PARTS = ROOT / "tools" / "parts"

index = (SITE / "index.html").read_text(encoding="utf-8")

def slice_between(text, start_marker, end_marker):
    i = text.index(start_marker)
    j = text.index(end_marker) + len(end_marker)
    return text[i:j]

HEADER = slice_between(index, '<a class="skip-link"', '<div class="nav-backdrop" data-nav-backdrop></div>')
FOOTER = slice_between(index, '<!-- ============ FOOTER ============ -->', '</html>')

PAGES = [
    dict(file="san-pham.html", title="Sản phẩm STEM – Robot, kit thí nghiệm & thiết bị IoT",
         desc="Danh mục robot lập trình, STEM kit, cảm biến thí nghiệm và thiết bị IoT cho trường học từ mầm non đến đại học.",
         canonical="san-pham"),
    dict(file="chi-tiet-san-pham.html", title="Robot ORC K3 – Kit Robotics cho học tập & thi đấu",
         desc="Robot ORC K3: hơn 300 chi tiết cơ khí, lập trình kéo thả hoặc MicroPython, sẵn sàng cho giải đấu Robotics học đường.",
         canonical="chi-tiet-san-pham"),
    dict(file="tin-tuc.html", title="Tin tức & dự án STEM tại các địa phương",
         desc="Giải đấu Robotics, ngày hội STEM, chương trình tập huấn giáo viên và các dự án cộng đồng trên khắp cả nước.",
         canonical="tin-tuc"),
    dict(file="ve-chung-toi.html", title="Về chúng tôi – Đưa giáo dục STEM đến mọi lớp học",
         desc="Câu chuyện, giá trị cốt lõi, các cột mốc và đội ngũ đứng sau chương trình giáo dục STEM.",
         canonical="ve-chung-toi"),
    dict(file="lien-he.html", title="Liên hệ & nhận tư vấn giải pháp STEM",
         desc="Gửi yêu cầu báo giá, đặt lịch demo tại trường hoặc nhận tư vấn chương trình STEM. Phản hồi trong 24 giờ làm việc.",
         canonical="lien-he"),
    dict(file="gioi-thieu.html", title="Giới thiệu",
         desc="Giới thiệu về STEM Lab: tầm nhìn, sứ mệnh và giá trị cốt lõi.",
         canonical="gioi-thieu"),
    dict(file="giai-phap.html", title="Giải pháp STEM Lab",
         desc="Giải pháp phòng STEM trọn gói cho Tiểu học, THCS, THPT và lớp học thông minh.",
         canonical="giai-phap"),
    dict(file="chuyen-muc.html", title="Danh mục",
         desc="Chương trình đào tạo, dự án hoạt động và tài nguyên STEM.",
         canonical="chuyen-muc"),
    dict(file="bai-viet.html", title="Bài viết",
         desc="Nội dung bài viết STEM Lab.",
         canonical="bai-viet"),
    dict(file="router.html", title="Đang tải",
         desc="Trang nội dung STEM Lab.",
         canonical="router", noindex=True),
    dict(file="404.html", title="Không tìm thấy trang", desc="Trang bạn tìm không tồn tại.",
         canonical="404", noindex=True),
]

TEMPLATE = """<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | STEM Lab</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0699d4">
{robots}<link rel="canonical" href="https://stemlab.vn/{canonical}.html">
<link rel="icon" href="assets/img/logo.svg" type="image/svg+xml">

<meta property="og:type" content="website">
<meta property="og:title" content="{title} | STEM Lab">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/img/news-1.svg">
<meta name="twitter:card" content="summary_large_image">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
{header}

{body}

{footer}
"""

written = []
for page in PAGES:
    body_file = PARTS / (page["file"].replace(".html", ".body.html"))
    body = body_file.read_text(encoding="utf-8").rstrip()
    html = TEMPLATE.format(
        title=page["title"],
        desc=page["desc"],
        canonical=page["canonical"],
        robots='<meta name="robots" content="noindex">\n' if page.get("noindex") else "",
        header=HEADER,
        body=body,
        footer=FOOTER,
    )
    (SITE / page["file"]).write_text(html, encoding="utf-8")
    written.append(page["file"])

print("Đã tạo:", ", ".join(written))
