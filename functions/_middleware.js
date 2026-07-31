/**
 * Middleware:
 *  1) URL sạch: đường dẫn .html không phải file thật -> trả router.html (200).
 *  2) Chèn thẻ SEO/OG phía máy chủ cho từng trang (đọc từ KV) để Facebook/Zalo/
 *     Google thấy đúng tiêu đề/mô tả/ảnh — kể cả trang sản phẩm/tin tức động.
 */
import { readSettings } from "../lib/settings.js";

function slugify(s) {
  return String(s || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function stripTags(h) { return String(h || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
function itemSlug(x) { return x.slug || slugify(x.name || x.title) || String(x.id || ""); }
function catSlug(c) { return c.slug || slugify(c.name) || c.id; }

async function computeSeo(env, url) {
  let s = {};
  try { s = (await readSettings(env)) || {}; } catch (e) { return null; }
  const origin = url.origin;
  const path = url.pathname;
  const brand = (s.brand && s.brand.name) || "STEM Lab";
  const defImg = (s.seo && s.seo.ogImage) || "/assets/img/news-1.svg";

  const imgUrl = (img, ref) => {
    const v = img || defImg;
    if (/^data:/i.test(v)) return origin + "/api/og-image?" + ref;
    if (/^https?:\/\//i.test(v)) return v;
    return origin + "/" + String(v).replace(/^\/+/, "");
  };

  // Trang chủ
  if (path === "/" || path === "/index.html") {
    return {
      title: (s.seo && s.seo.homeTitle) || ("Giải pháp giáo dục STEM toàn diện | " + brand),
      desc: (s.seo && s.seo.homeDescription) || "",
      image: imgUrl(s.seo && s.seo.ogImage, "t=home"),
      url: origin + "/", type: "website",
    };
  }

  const m = /^\/([^\/]+)\.html?$/i.exec(path);
  if (!m) return null;
  const slug = m[1];

  const prod = (s.products || []).find((p) => itemSlug(p) === slug || String(p.id) === slug);
  if (prod) return {
    title: prod.seoTitle || (prod.name + " | " + brand),
    desc: prod.metaDescription || stripTags(prod.excerpt) || "",
    image: imgUrl(prod.image, "t=product&id=" + encodeURIComponent(prod.id)),
    url: origin + path, type: "product",
  };

  const post = (s.posts || []).find((p) => itemSlug(p) === slug || String(p.id) === slug);
  if (post) return {
    title: post.seoTitle || (post.title + " | " + brand),
    desc: post.metaDescription || stripTags(post.excerpt) || "",
    image: imgUrl(post.image, "t=post&id=" + encodeURIComponent(post.id)),
    url: origin + path, type: "article",
  };

  const cat = (s.categories || []).find((c) => catSlug(c) === slug);
  if (cat) return {
    title: cat.seoTitle || (cat.name + " | " + brand),
    desc: cat.metaDescription || stripTags(cat.excerpt) || "",
    image: imgUrl(defImg, "t=home"),
    url: origin + path, type: "website",
  };

  return null; // trang tĩnh khác -> giữ thẻ có sẵn
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // (1) URL sạch -> router.html
  let res = await context.next();
  if (res.status === 404 && /\.html?$/i.test(url.pathname)) {
    const router = await env.ASSETS.fetch(new URL("/router.html", url));
    res = new Response(router.body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // (2) Chèn OG cho HTML
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return res;

  const seo = await computeSeo(env, url);
  if (!seo) return res;

  const attr = (v, name) => ({ element(el) { if (v != null && v !== "") el.setAttribute(name || "content", v); } });
  return new HTMLRewriter()
    .on("title", { element(el) { el.setInnerContent(seo.title || ""); } })
    .on('meta[name="description"]', attr(seo.desc))
    .on('link[rel="canonical"]', attr(seo.url, "href"))
    .on('meta[property="og:url"]', attr(seo.url))
    .on('meta[property="og:type"]', attr(seo.type))
    .on('meta[property="og:title"]', attr(seo.title))
    .on('meta[property="og:description"]', attr(seo.desc))
    .on('meta[property="og:image"]', attr(seo.image))
    .on('meta[property="og:image:url"]', attr(seo.image))
    .on('meta[property="og:image:secure_url"]', attr(seo.image))
    .on('meta[name="twitter:title"]', attr(seo.title))
    .on('meta[name="twitter:description"]', attr(seo.desc))
    .on('meta[name="twitter:image"]', attr(seo.image))
    .transform(res);
}
