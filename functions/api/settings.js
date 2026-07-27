/**
 * GET /api/settings — cấu hình công khai cho website đọc khi tải trang.
 * Trả về {} nếu chưa gắn KV hoặc chưa lưu gì (site dùng giá trị mặc định).
 */
import { readSettings } from "../../lib/settings.js";

export async function onRequestGet({ env }) {
  let settings = {};
  try {
    settings = (await readSettings(env)) || {};
  } catch (err) {
    console.error("settings: không đọc được KV", err);
  }
  return new Response(JSON.stringify({ ok: true, settings }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Cache ngắn ở CDN để trang tải nhanh nhưng vẫn cập nhật gần như tức thì
      "Cache-Control": "public, max-age=30, s-maxage=60",
    },
  });
}
