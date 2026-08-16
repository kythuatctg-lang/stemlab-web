/**
 * POST /api/admin/file — tải 1 file (PDF/Word/...) lên (cần đăng nhập).
 * Gửi file ở BODY thô, kèm header:
 *   X-File-Name: <tên file đã encodeURIComponent>
 *   Content-Type: <mime của file>
 * Lưu vào KV (khoá riêng "file:<id>" + "filemeta:<id>") — KHÔNG nhét vào settings
 * để trang không bị nặng. Trả về { url: "/api/file/<id>" }.
 */
import { isAuthed, jsonResponse } from "../../../lib/auth.js";

const MAX = 20 * 1024 * 1024; // 20MB

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return jsonResponse({ ok: false, error: "not_configured" }, 503);
  if (!(await isAuthed(request, env))) return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  if (!env.SETTINGS) return jsonResponse({ ok: false, error: "kv_not_bound" }, 501);

  let name = "file";
  try { name = decodeURIComponent(request.headers.get("x-file-name") || "file"); } catch (e) {}
  const type = request.headers.get("content-type") || "application/octet-stream";
  const buf = await request.arrayBuffer();
  if (!buf || buf.byteLength === 0) return jsonResponse({ ok: false, error: "empty" }, 400);
  if (buf.byteLength > MAX) return jsonResponse({ ok: false, error: "too_large" }, 413);

  const ext = (name.match(/\.[a-z0-9]{1,8}$/i) || [""])[0].toLowerCase();
  const id = ((crypto.randomUUID && crypto.randomUUID()) || (Date.now() + "-" + Math.round(Math.random() * 1e6))) + ext;
  await env.SETTINGS.put("file:" + id, buf);
  await env.SETTINGS.put("filemeta:" + id, JSON.stringify({ name, type }));
  return jsonResponse({ ok: true, url: "/api/file/" + id, name });
}
