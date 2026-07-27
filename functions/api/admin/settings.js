/**
 * GET  /api/admin/settings — lấy cấu hình hiện tại (cần đăng nhập).
 * PUT  /api/admin/settings — lưu cấu hình mới (cần đăng nhập).
 */
import { isAuthed, jsonResponse } from "../../../lib/auth.js";
import { readSettings, sanitize, writeSettings } from "../../../lib/settings.js";

async function guard(request, env) {
  if (!env.ADMIN_PASSWORD) {
    return jsonResponse(
      { ok: false, error: "not_configured", message: "Chưa đặt biến môi trường ADMIN_PASSWORD." },
      503
    );
  }
  if (!(await isAuthed(request, env))) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }
  return null;
}

export async function onRequestGet({ request, env }) {
  const blocked = await guard(request, env);
  if (blocked) return blocked;

  const settings = await readSettings(env);
  return jsonResponse({
    ok: true,
    settings: settings || {},
    storage: env.SETTINGS ? "kv" : "none",
  });
}

export async function onRequestPut({ request, env }) {
  const blocked = await guard(request, env);
  if (blocked) return blocked;

  if (!env.SETTINGS) {
    return jsonResponse(
      {
        ok: false,
        error: "kv_not_bound",
        message: "Chưa gắn KV namespace tên SETTINGS cho project (xem README mục Trang quản trị).",
      },
      501
    );
  }

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ ok: false, error: "invalid_body" }, 400); }

  const settings = sanitize(body);
  try {
    await writeSettings(env, settings);
  } catch (err) {
    console.error("admin/settings: ghi KV thất bại", err);
    return jsonResponse({ ok: false, error: "write_failed" }, 500);
  }

  return jsonResponse({ ok: true, settings });
}
