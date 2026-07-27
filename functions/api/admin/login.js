/** POST /api/admin/login — đăng nhập quản trị bằng mật khẩu. */
import { createToken, getStoredPasswordHash, jsonResponse, sessionCookie, verifyPassword } from "../../../lib/auth.js";

export async function onRequestPost({ request, env }) {
  const hasStored = !!(await getStoredPasswordHash(env));
  if (!env.ADMIN_PASSWORD && !hasStored) {
    return jsonResponse(
      { ok: false, error: "not_configured", message: "Chưa đặt biến môi trường ADMIN_PASSWORD." },
      503
    );
  }

  let body = {};
  try { body = await request.json(); } catch { /* để rỗng */ }

  if (!(await verifyPassword(env, body.password || ""))) {
    await new Promise((r) => setTimeout(r, 400)); // trễ nhẹ để làm chậm việc dò mật khẩu
    return jsonResponse({ ok: false, error: "invalid_password" }, 401);
  }

  const token = await createToken(env);
  const secure = new URL(request.url).protocol === "https:";
  return jsonResponse({ ok: true }, 200, { "Set-Cookie": sessionCookie(token, { secure }) });
}
