/**
 * GET /api/settings — cấu hình công khai cho website đọc khi tải trang.
 * Đọc thẳng chuỗi JSON từ KV và bọc lại (KHÔNG parse + stringify để tránh tốn
 * CPU với cấu hình lớn -> tránh lỗi 1102 Worker exceeded resource limits).
 * Trả {} nếu chưa gắn KV hoặc chưa lưu gì (site dùng giá trị mặc định).
 */
import { KV_KEY } from "../../lib/settings.js";

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=30, s-maxage=60",
};

export async function onRequestGet({ env }) {
  let body = '{"ok":true,"settings":{}}';
  try {
    if (env.SETTINGS) {
      const raw = await env.SETTINGS.get(KV_KEY, "text"); // lấy text, không parse
      if (raw) body = '{"ok":true,"settings":' + raw + "}";
    }
  } catch (err) {
    console.error("settings: không đọc được KV", err);
  }
  return new Response(body, { headers: HEADERS });
}
