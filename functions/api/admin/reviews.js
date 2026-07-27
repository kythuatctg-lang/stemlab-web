/**
 * GET    /api/admin/reviews — toàn bộ đánh giá sản phẩm (cần đăng nhập).
 * DELETE /api/admin/reviews — xoá 1 đánh giá theo {id}, hoặc {all:true} để xoá hết.
 */
import { isAuthed, jsonResponse } from "../../../lib/auth.js";

const REVIEWS_KEY = "product-reviews";

async function guard(request, env) {
  if (!env.ADMIN_PASSWORD) return jsonResponse({ ok: false, error: "not_configured" }, 503);
  if (!(await isAuthed(request, env))) return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  return null;
}

export async function onRequestGet({ request, env }) {
  const blocked = await guard(request, env);
  if (blocked) return blocked;
  if (!env.SETTINGS) return jsonResponse({ ok: true, items: [], storage: "none" });
  const items = (await env.SETTINGS.get(REVIEWS_KEY, "json")) || [];
  return jsonResponse({ ok: true, items });
}

export async function onRequestDelete({ request, env }) {
  const blocked = await guard(request, env);
  if (blocked) return blocked;
  let body = {};
  try { body = await request.json(); } catch {}
  if (!env.SETTINGS) return jsonResponse({ ok: true, items: [] });
  let list = (await env.SETTINGS.get(REVIEWS_KEY, "json")) || [];
  if (body.all === true) {
    list = [];
  } else {
    const id = String(body.id ?? "");
    if (!id) return jsonResponse({ ok: false, error: "missing_id" }, 400);
    list = list.filter((r) => String(r.id) !== id);
  }
  await env.SETTINGS.put(REVIEWS_KEY, JSON.stringify(list));
  return jsonResponse({ ok: true, items: list });
}
