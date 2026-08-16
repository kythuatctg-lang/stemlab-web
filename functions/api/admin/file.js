/**
 * POST /api/admin/file — tải 1 file (PDF/Word/...) lên (cần đăng nhập).
 * Gửi file ở BODY thô, kèm header:
 *   X-File-Name: <tên file đã encodeURIComponent>
 *   Content-Type: <mime của file>
 *
 * Lưu trữ:
 *  - Nếu có R2 (binding tên FILES) -> lưu vào R2 (hỗ trợ file lớn, tới GB).
 *  - Nếu không -> lưu KV (khoá "file:<id>"), giới hạn ~24MB theo hạn mức KV (25 MiB).
 * Không nhét vào settings để trang không bị nặng. Trả về { url: "/api/file/<id>" }.
 */
import { isAuthed, jsonResponse } from "../../../lib/auth.js";

const MAX = 30 * 1024 * 1024;      // 30MB (áp dụng khi có R2)
const KV_MAX = 24 * 1024 * 1024;   // an toàn dưới hạn mức KV 25 MiB

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return jsonResponse({ ok: false, error: "not_configured" }, 503);
  if (!(await isAuthed(request, env))) return jsonResponse({ ok: false, error: "unauthorized" }, 401);

  let name = "file";
  try { name = decodeURIComponent(request.headers.get("x-file-name") || "file"); } catch (e) {}
  const type = request.headers.get("content-type") || "application/octet-stream";
  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength === 0) return jsonResponse({ ok: false, error: "empty" }, 400);
  if (buf.byteLength > MAX) return jsonResponse({ ok: false, error: "too_large", message: "File tối đa 30MB." }, 413);

  const ext = (name.match(/\.[a-z0-9]{1,8}$/i) || [""])[0].toLowerCase();
  const id = ((crypto.randomUUID && crypto.randomUUID()) || (Date.now() + "-" + Math.round(Math.random() * 1e6))) + ext;

  // Ưu tiên R2 nếu đã gắn (binding FILES)
  if (env.FILES) {
    await env.FILES.put(id, buf, {
      httpMetadata: { contentType: type },
      customMetadata: { name },
    });
    return jsonResponse({ ok: true, url: "/api/file/" + id, name, store: "r2" });
  }

  // Nếu không có R2 -> dùng KV (giới hạn ~24MB)
  if (!env.SETTINGS) return jsonResponse({ ok: false, error: "no_storage" }, 501);
  if (buf.byteLength > KV_MAX) {
    return jsonResponse({
      ok: false, error: "kv_too_large",
      message: "File lớn hơn ~24MB cần bật R2. Vui lòng nén file dưới 24MB hoặc gắn R2 cho website.",
    }, 413);
  }
  await env.SETTINGS.put("file:" + id, buf);
  await env.SETTINGS.put("filemeta:" + id, JSON.stringify({ name, type }));
  return jsonResponse({ ok: true, url: "/api/file/" + id, name, store: "kv" });
}
