#!/usr/bin/env python3
"""
DEV SERVER — chạy thử toàn bộ website + trang quản trị /admin trên máy local
KHÔNG cần cài Node hay Wrangler. Mô phỏng đầy đủ các Cloudflare Pages Functions:
  - POST /api/admin/login   (đăng nhập)
  - POST /api/admin/logout
  - GET/PUT /api/admin/settings  (đọc/lưu cấu hình — lưu vào tools/.dev-data.json)
  - GET  /api/settings           (cấu hình công khai cho website đọc)
  - POST /api/contact            (nhận form + lưu hộp thư)
  - GET/DELETE /api/admin/inbox  (hộp thư liên hệ)

Chạy:
    python3 tools/dev_server.py
Rồi mở:
    http://127.0.0.1:8899/         (website)
    http://127.0.0.1:8899/admin/   (quản trị — mật khẩu mặc định: stemlab@2026)

Đổi mật khẩu:  ADMIN_PASSWORD=matkhau python3 tools/dev_server.py
Dữ liệu lưu ở tools/.dev-data.json và tools/.dev-inbox.json (đã .gitignore).

⚠️ Đây CHỈ là công cụ chạy thử local. Khi deploy lên Cloudflare, các Functions
thật trong thư mục functions/ mới được dùng (xem README).
"""
import http.server, json, os, pathlib, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
DATA = ROOT / "tools" / ".dev-data.json"
INBOX = ROOT / "tools" / ".dev-inbox.json"
REVIEWS = ROOT / "tools" / ".dev-reviews.json"
PASSFILE = ROOT / "tools" / ".dev-pass.json"
BACKUP_DIR = ROOT / "tools" / ".dev-backups"
MAX_BACKUPS = 30
DEFAULT_PASSWORD = os.environ.get("ADMIN_PASSWORD", os.environ.get("DEV_ADMIN_PW", "stemlab@2026"))


def current_password():
    try:
        return json.loads(PASSFILE.read_text(encoding="utf-8")).get("password") or DEFAULT_PASSWORD
    except Exception:
        return DEFAULT_PASSWORD
TOKEN = "dev-session-ok"   # token phiên đơn giản cho môi trường local


def load(path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def backup_settings(settings):
    """Ghi 1 bản sao lưu có mốc thời gian mỗi lần lưu cấu hình; giữ MAX_BACKUPS bản mới nhất."""
    if not settings:  # bỏ qua khi rỗng để tránh backup rác
        return
    import datetime
    BACKUP_DIR.mkdir(exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    save(BACKUP_DIR / ("settings-" + stamp + ".json"), settings)
    files = sorted(BACKUP_DIR.glob("settings-*.json"))
    for old in files[:-MAX_BACKUPS]:      # xoá các bản cũ vượt giới hạn
        try:
            old.unlink()
        except Exception:
            pass


def latest_backup():
    if not BACKUP_DIR.exists():
        return None
    files = sorted(BACKUP_DIR.glob("settings-*.json"))
    return files[-1] if files else None


def restore_if_missing():
    """Nếu file dữ liệu chính bị mất mà còn bản sao lưu -> tự khôi phục bản mới nhất."""
    if DATA.exists():
        return
    b = latest_backup()
    if b:
        save(DATA, load(b, {}))
        print("  ↺ Đã khôi phục dữ liệu từ bản sao lưu:", b.name)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(PUBLIC), **kw)

    # ---------- tiện ích ----------
    def _json(self, obj, code=200, cookie=None):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        n = int(self.headers.get("content-length", 0) or 0)
        raw = self.rfile.read(n) if n else b""
        try:
            return json.loads(raw or b"{}")
        except Exception:
            return {}

    def _authed(self):
        return TOKEN in (self.headers.get("cookie") or "")

    def log_message(self, *a):
        pass

    # ---------- GET ----------
    def do_GET(self):
        p = urllib.parse.urlparse(self.path).path
        if p == "/api/settings":
            return self._json({"ok": True, "settings": load(DATA, {})})
        if p == "/api/reviews":
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            product = (qs.get("product") or [""])[0]
            items = load(REVIEWS, [])
            if product:
                items = [r for r in items if r.get("productId") == product]
            pub = [{"id": r.get("id"), "name": r.get("name"), "rating": r.get("rating"),
                    "comment": r.get("comment"), "submittedAt": r.get("submittedAt")} for r in items]
            return self._json({"ok": True, "items": pub})
        if p == "/api/admin/reviews":
            if not self._authed():
                return self._json({"ok": False, "error": "unauthorized"}, 401)
            return self._json({"ok": True, "items": load(REVIEWS, [])})
        if p == "/api/admin/settings":
            if not self._authed():
                return self._json({"ok": False, "error": "unauthorized"}, 401)
            return self._json({"ok": True, "settings": load(DATA, {}), "storage": "kv"})
        if p == "/api/admin/inbox":
            if not self._authed():
                return self._json({"ok": False, "error": "unauthorized"}, 401)
            return self._json({"ok": True, "items": load(INBOX, [])})
        # URL sạch: /ten-muc.html không phải file thật -> phục vụ router.html
        if p.endswith(".html"):
            fs = PUBLIC / p.lstrip("/")
            if not fs.exists():
                html = (PUBLIC / "router.html").read_text(encoding="utf-8").encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(html)))
                self.end_headers()
                self.wfile.write(html)
                return
        # tệp tĩnh
        return super().do_GET()

    # ---------- POST ----------
    def do_POST(self):
        p = urllib.parse.urlparse(self.path).path
        if p == "/api/admin/login":
            body = self._read_json()
            if (body.get("password") or "") == current_password():
                return self._json({"ok": True}, cookie=f"{TOKEN}=1; Path=/; SameSite=Strict; Max-Age=28800")
            return self._json({"ok": False, "error": "invalid_password"}, 401)
        if p == "/api/admin/logout":
            return self._json({"ok": True}, cookie=f"{TOKEN}=1; Path=/; Max-Age=0")
        if p == "/api/contact":
            body = self._read_json()
            if (body.get("website") or "").strip():
                return self._json({"ok": True})  # bẫy spam
            email = (body.get("email") or "").strip()
            if "@" not in email:
                return self._json({"ok": False, "error": "invalid_email"}, 400)
            items = load(INBOX, [])
            import datetime
            body["submittedAt"] = datetime.datetime.now().isoformat()
            items.insert(0, body)
            save(INBOX, items[:300])
            return self._json({"ok": True})
        if p == "/api/reviews":
            body = self._read_json()
            if (body.get("website") or "").strip():
                return self._json({"ok": True, "skipped": True})  # bẫy spam
            product_id = (body.get("productId") or "").strip()
            name = (body.get("name") or "").strip()
            comment = (body.get("comment") or "").strip()
            try:
                rating = int(body.get("rating") or 0)
            except Exception:
                rating = 0
            rating = min(5, max(1, rating))
            if not product_id or not name or not comment:
                return self._json({"ok": False, "error": "missing_fields"}, 400)
            import datetime, uuid
            review = {"id": uuid.uuid4().hex, "productId": product_id,
                      "productName": (body.get("productName") or "").strip()[:160],
                      "name": name[:120], "rating": rating, "comment": comment[:3000],
                      "submittedAt": datetime.datetime.now().isoformat()}
            items = load(REVIEWS, [])
            items.insert(0, review)
            save(REVIEWS, items[:2000])
            pub = {"id": review["id"], "name": review["name"], "rating": review["rating"],
                   "comment": review["comment"], "submittedAt": review["submittedAt"]}
            return self._json({"ok": True, "review": pub})
        if p == "/api/admin/password":
            if not self._authed():
                return self._json({"ok": False, "error": "unauthorized"}, 401)
            body = self._read_json()
            if (body.get("current") or "") != current_password():
                return self._json({"ok": False, "error": "wrong_current"}, 400)
            nxt = body.get("next") or ""
            if len(nxt) < 6:
                return self._json({"ok": False, "error": "weak"}, 400)
            save(PASSFILE, {"password": nxt})
            return self._json({"ok": True})
        return self._json({"ok": False, "error": "not_found"}, 404)

    # ---------- PUT ----------
    def do_PUT(self):
        p = urllib.parse.urlparse(self.path).path
        if p == "/api/admin/settings":
            if not self._authed():
                return self._json({"ok": False, "error": "unauthorized"}, 401)
            body = self._read_json()
            settings = body.get("settings", body)
            save(DATA, settings)
            backup_settings(settings)   # tự động sao lưu mỗi lần lưu
            return self._json({"ok": True, "settings": settings})
        return self._json({"ok": False, "error": "not_found"}, 404)

    # ---------- DELETE ----------
    def do_DELETE(self):
        p = urllib.parse.urlparse(self.path).path
        if p == "/api/admin/inbox":
            if not self._authed():
                return self._json({"ok": False, "error": "unauthorized"}, 401)
            save(INBOX, [])
            return self._json({"ok": True})
        if p == "/api/admin/reviews":
            if not self._authed():
                return self._json({"ok": False, "error": "unauthorized"}, 401)
            body = self._read_json()
            items = load(REVIEWS, [])
            if body.get("all") is True:
                items = []
            else:
                rid = str(body.get("id") or "")
                if not rid:
                    return self._json({"ok": False, "error": "missing_id"}, 400)
                items = [r for r in items if str(r.get("id")) != rid]
            save(REVIEWS, items)
            return self._json({"ok": True, "items": items})
        return self._json({"ok": False, "error": "not_found"}, 404)


def main():
    port = int(os.environ.get("PORT", "8899"))
    restore_if_missing()   # khôi phục nếu file dữ liệu chính bị mất
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
    n_bak = len(list(BACKUP_DIR.glob("settings-*.json"))) if BACKUP_DIR.exists() else 0
    print("─" * 60)
    print("  DEV SERVER STEM Lab đang chạy")
    print(f"  Website :  http://127.0.0.1:{port}/")
    print(f"  Quản trị:  http://127.0.0.1:{port}/admin/")
    print(f"  Mật khẩu:  {current_password()}")
    print(f"  Sao lưu :  tools/.dev-backups/ ({n_bak} bản, tự lưu mỗi lần Lưu)")
    print("  Dừng: Ctrl + C")
    print("─" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã dừng dev server.")


if __name__ == "__main__":
    main()
