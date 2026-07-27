/** POST /api/admin/password — đổi mật khẩu quản trị (lưu hash trên KV). */
import { isAuthed, jsonResponse, setPassword, verifyPassword } from "../../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) return jsonResponse({ ok: false, error: "unauthorized" }, 401);

  let body = {};
  try { body = await request.json(); } catch { return jsonResponse({ ok: false, error: "invalid_body" }, 400); }

  const next = String(body.next || "");
  if (next.length < 6) return jsonResponse({ ok: false, error: "weak" }, 400);
  if (!(await verifyPassword(env, body.current || ""))) return jsonResponse({ ok: false, error: "wrong_current" }, 400);
  if (!env.SETTINGS) return jsonResponse({ ok: false, error: "kv_not_bound" }, 501);

  try { await setPassword(env, next); }
  catch (e) { return jsonResponse({ ok: false, error: "write_failed" }, 500); }
  return jsonResponse({ ok: true });
}
