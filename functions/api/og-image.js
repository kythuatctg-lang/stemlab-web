/**
 * GET /api/og-image?t=home|product|post&id=<id>
 * Trả về ảnh đại diện (OG) dưới dạng ẢNH THẬT để Facebook/Zalo tải được
 * (ảnh trong KV được lưu base64 -> giải mã tại đây). Nếu ảnh là đường dẫn
 * tĩnh thì chuyển hướng sang đường dẫn đó.
 */
import { readSettings } from "../../lib/settings.js";

function pick(s, t, id) {
  if (t === "product") { const p = (s.products || []).find((x) => String(x.id) === String(id)); return p && p.image; }
  if (t === "post") { const p = (s.posts || []).find((x) => String(x.id) === String(id)); return p && p.image; }
  return s.seo && s.seo.ogImage;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const t = url.searchParams.get("t") || "home";
  const id = url.searchParams.get("id") || "";
  let img = "";
  try {
    const s = (await readSettings(env)) || {};
    img = pick(s, t, id) || (s.seo && s.seo.ogImage) || "";
  } catch (e) { /* bỏ qua */ }

  const fallback = new URL("/assets/img/news-1.svg", url).toString();
  if (!img) return Response.redirect(fallback, 302);

  const m = /^data:([^;]+);base64,(.+)$/.exec(img);
  if (m) {
    const bin = atob(m[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(bytes, {
      headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=86400" },
    });
  }
  const abs = /^https?:\/\//i.test(img) ? img : new URL("/" + img.replace(/^\/+/, ""), url).toString();
  return Response.redirect(abs, 302);
}
