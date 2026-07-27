/**
 * Cloudflare Pages Function — Đánh giá sản phẩm (công khai)
 *   GET  /api/reviews?product=<id>  — danh sách đánh giá của 1 sản phẩm
 *   POST /api/reviews               — khách gửi đánh giá mới
 *
 * Đánh giá lưu trên KV (binding SETTINGS) ở khoá "product-reviews".
 * Quản trị viên xem & xoá tại /api/admin/reviews.
 */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};
const REVIEWS_KEY = "product-reviews";
const MAX_REVIEWS = 2000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
function clean(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}
function publicView(r) {
  return { id: r.id, name: r.name, rating: r.rating, comment: r.comment, submittedAt: r.submittedAt };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const product = clean(url.searchParams.get("product"), 60);
  if (!env.SETTINGS) return json({ ok: true, items: [] });
  let items = (await env.SETTINGS.get(REVIEWS_KEY, "json")) || [];
  if (product) items = items.filter((r) => r.productId === product);
  return json({ ok: true, items: items.map(publicView) });
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    const type = request.headers.get("content-type") || "";
    payload = type.includes("application/json")
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: "invalid_body" }, 400);
  }

  // Bẫy spam: bot thường điền cả trường ẩn.
  if (clean(payload.website)) return json({ ok: true, skipped: true });

  const productId = clean(payload.productId, 60);
  const name = clean(payload.name, 120);
  const comment = clean(payload.comment, 3000);
  let rating = parseInt(payload.rating, 10) || 0;
  rating = Math.min(5, Math.max(1, rating));

  if (!productId || !name || !comment) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }

  const review = {
    id: (crypto.randomUUID && crypto.randomUUID()) || (Date.now() + "-" + Math.round(Math.random() * 1e6)),
    productId,
    productName: clean(payload.productName, 160),
    name,
    rating,
    comment,
    submittedAt: new Date().toISOString(),
    ip: request.headers.get("cf-connecting-ip") || "",
    country: request.cf?.country || "",
  };

  if (env.SETTINGS) {
    const list = (await env.SETTINGS.get(REVIEWS_KEY, "json")) || [];
    list.unshift(review);
    await env.SETTINGS.put(REVIEWS_KEY, JSON.stringify(list.slice(0, MAX_REVIEWS)));
  } else {
    return json({ ok: false, error: "kv_not_bound" }, 503);
  }

  return json({ ok: true, review: publicView(review) });
}
