/**
 * Xác thực cho khu vực quản trị.
 *
 * Cơ chế: đăng nhập bằng mật khẩu (biến môi trường ADMIN_PASSWORD) → phát ra
 * một token có chữ ký HMAC-SHA256 kèm hạn dùng, lưu trong cookie HttpOnly.
 * Không dùng thư viện ngoài, chỉ Web Crypto có sẵn của Cloudflare Workers.
 */

const encoder = new TextEncoder();

export const SESSION_COOKIE = "stemlab_admin";
export const SESSION_TTL = 8 * 60 * 60; // 8 giờ

function b64urlEncode(bytes) {
  let bin = "";
  new Uint8Array(bytes).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  const pad = str.length % 4 ? "=".repeat(4 - (str.length % 4)) : "";
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function key(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** So sánh chuỗi trong thời gian hằng số để tránh lộ thông tin qua thời gian phản hồi. */
export function safeEqual(a, b) {
  const x = encoder.encode(String(a));
  const y = encoder.encode(String(b));
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function sessionSecret(env) {
  // Ưu tiên secret riêng; nếu không có thì dẫn xuất từ mật khẩu quản trị.
  return env.ADMIN_SESSION_SECRET || `session:${env.ADMIN_PASSWORD || ""}`;
}

export async function createToken(env, ttl = SESSION_TTL) {
  const payload = b64urlEncode(
    encoder.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + ttl }))
  );
  const sig = await crypto.subtle.sign("HMAC", await key(sessionSecret(env)), encoder.encode(payload));
  return `${payload}.${b64urlEncode(sig)}`;
}

export async function verifyToken(env, token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify(
      "HMAC",
      await key(sessionSecret(env)),
      b64urlDecode(sig),
      encoder.encode(payload)
    );
    if (!ok) return false;
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    return typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function readCookie(request, name) {
  const raw = request.headers.get("cookie") || "";
  const found = raw.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

export function sessionCookie(token, { maxAge = SESSION_TTL, secure = true } = {}) {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    secure ? "Secure" : "",
    `Max-Age=${maxAge}`,
  ].filter(Boolean).join("; ");
}

/** Trả về true nếu request mang session hợp lệ. */
export async function isAuthed(request, env) {
  return verifyToken(env, readCookie(request, SESSION_COOKIE));
}

/* ---------- Mật khẩu: ưu tiên bản đã đổi lưu trên KV (hash SHA-256) ---------- */
const PWD_KEY = "admin-password";

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", encoder.encode(String(s)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getStoredPasswordHash(env) {
  if (!env.SETTINGS) return null;
  return (await env.SETTINGS.get(PWD_KEY)) || null;
}

/** So khớp mật khẩu nhập vào với hash trên KV (nếu có) hoặc ADMIN_PASSWORD. */
export async function verifyPassword(env, input) {
  const hash = await getStoredPasswordHash(env);
  if (hash) return safeEqual(await sha256Hex(input), hash);
  return env.ADMIN_PASSWORD ? safeEqual(input, env.ADMIN_PASSWORD) : false;
}

export async function setPassword(env, next) {
  if (!env.SETTINGS) throw new Error("kv_not_bound");
  await env.SETTINGS.put(PWD_KEY, await sha256Hex(next));
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}
