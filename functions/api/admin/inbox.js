/**
 * GET    /api/admin/inbox — danh sách liên hệ đã gửi (cần đăng nhập).
 * DELETE /api/admin/inbox — xoá toàn bộ hộp thư (cần đăng nhập).
 */
import { isAuthed, jsonResponse } from "../../../lib/auth.js";

const INBOX_KEY = "contact-inbox";

async function guard(request, env) {
  if (!env.ADMIN_PASSWORD) return jsonResponse({ ok: false, error: "not_configured" }, 503);
  if (!(await isAuthed(request, env))) return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  return null;
}

export async function onRequestGet({ request, env }) {
  const blocked = await guard(request, env);
  if (blocked) return blocked;
  if (!env.SETTINGS) return jsonResponse({ ok: true, items: [], storage: "none" });
  const items = (await env.SETTINGS.get(INBOX_KEY, "json")) || [];
  return jsonResponse({ ok: true, items });
}

export async function onRequestDelete({ request, env }) {
  const blocked = await guard(request, env);
  if (blocked) return blocked;
  if (env.SETTINGS) await env.SETTINGS.put(INBOX_KEY, JSON.stringify([]));
  return jsonResponse({ ok: true });
}
