/** POST /api/admin/logout — xoá phiên đăng nhập. */
import { jsonResponse, sessionCookie } from "../../../lib/auth.js";

export async function onRequestPost({ request }) {
  const secure = new URL(request.url).protocol === "https:";
  return jsonResponse({ ok: true }, 200, {
    "Set-Cookie": sessionCookie("", { maxAge: 0, secure }),
  });
}
