/**
 * Đọc/ghi cấu hình website (thương hiệu, logo, bảng màu, liên hệ) trên
 * Cloudflare KV. Binding KV tên là SETTINGS — xem hướng dẫn tạo trong README.
 *
 * Cấu hình lưu ở đây chỉ *ghi đè* lên assets/js/site.config.js, nên nếu KV
 * trống hoặc chưa cấu hình thì website vẫn chạy bình thường với giá trị mặc định.
 */

export const KV_KEY = "site-settings";

const HEX = /^#[0-9a-fA-F]{6}$/;
const DATA_URI = /^data:image\/(png|jpe?g|gif|webp|svg\+xml|x-icon);base64,[A-Za-z0-9+/=]+$/;
const MAX_LOGO_BYTES = 900 * 1024;    // ~900KB (logo)
const MAX_BANNER_BYTES = 2.4 * 1024 * 1024; // ~2.4MB (ảnh banner)
const MAX_SLIDES = 8;

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const hex = (v) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim().toLowerCase() : undefined);
const bool = (v) => (typeof v === "boolean" ? v : undefined);

function image(v, maxBytes = MAX_LOGO_BYTES) {
  if (typeof v !== "string") return undefined;
  const val = v.trim();
  if (!val) return undefined;
  if (DATA_URI.test(val)) return val.length <= maxBytes ? val : undefined;
  // đường dẫn tương đối hoặc URL https
  if (/^(assets\/|\/|https:\/\/)[\w\-./%?=&#:]+$/i.test(val)) return val.slice(0, 500);
  return undefined;
}

/** Chỉ giữ lại đúng các khoá được phép, đúng kiểu — chống ghi rác vào KV. */
export function sanitize(input) {
  if (!input || typeof input !== "object") return {};
  const src = input.settings && typeof input.settings === "object" ? input.settings : input;
  const out = {};

  const put = (obj, k, v) => { if (v !== undefined) obj[k] = v; };
  const group = (name, build) => {
    const g = {};
    build(g, src[name] || {});
    if (Object.keys(g).length) out[name] = g;
  };

  group("brand", (g, b) => {
    put(g, "name", str(b.name, 120));
    put(g, "short", str(b.short, 60));
    put(g, "tagline", str(b.tagline, 160));
    put(g, "slogan", str(b.slogan, 240));
    put(g, "logo", image(b.logo));
    put(g, "logoFull", image(b.logoFull));
    put(g, "favicon", image(b.favicon));
    put(g, "showBrandText", bool(b.showBrandText));
    put(g, "domain", str(b.domain, 120));
  });

  group("seo", (g, s) => {
    put(g, "homeTitle", str(s.homeTitle, 200));
    put(g, "homeDescription", str(s.homeDescription, 400));
    put(g, "ogImage", image(s.ogImage, MAX_BANNER_BYTES));
  });

  group("theme", (g, t) => {
    ["primary", "primaryDark", "accent", "cyan", "green", "yellow"].forEach((k) => put(g, k, hex(t[k])));
  });

  // Banner (hero) — mảng slide ảnh
  if (src.hero && typeof src.hero === "object") {
    const h = {};
    if (Array.isArray(src.hero.slides)) {
      h.slides = src.hero.slides
        .slice(0, MAX_SLIDES)
        .map((s) => {
          if (!s || typeof s !== "object") return null;
          const img = image(s.image, MAX_BANNER_BYTES);
          if (!img) return null;
          const slide = { image: img };
          const link = str(s.link, 500);
          const alt = str(s.alt, 200);
          if (link) slide.link = link;
          if (alt) slide.alt = alt;
          return slide;
        })
        .filter(Boolean);
    }
    if (src.hero.fit === "cover" || src.hero.fit === "contain") h.fit = src.hero.fit;
    const ap = parseInt(src.hero.autoplay, 10);
    if (ap >= 2000 && ap <= 15000) h.autoplay = ap;
    // Slide chữ (banner mặc định khi chưa dùng ảnh)
    if (Array.isArray(src.hero.textSlides)) {
      h.textSlides = src.hero.textSlides.slice(0, 8).map((s) => {
        if (!s || typeof s !== "object") return null;
        const title = str(s.title, 240);
        if (!title) return null;
        return {
          eyebrow: str(s.eyebrow, 120) || "",
          accent: s.accent === true,
          title,
          lead: str(s.lead, 600) || "",
          points: (Array.isArray(s.points) ? s.points : []).slice(0, 6).map((p) => str(p, 240) || "").filter(Boolean),
          btn1: str(s.btn1, 80) || "",
          btn1Link: str(s.btn1Link, 500) || "",
          btn2: str(s.btn2, 80) || "",
          btn2Link: str(s.btn2Link, 500) || "",
          image: image(s.image, MAX_BANNER_BYTES) || "",
          bg: image(s.bg, MAX_BANNER_BYTES) || "",
        };
      }).filter(Boolean);
    }
    out.hero = h;
  }

  group("company", (g, c) => {
    put(g, "legalName", str(c.legalName, 200));
    put(g, "taxCode", str(c.taxCode, 40));
    put(g, "address", str(c.address, 300));
    put(g, "workingHours", str(c.workingHours, 160));
    put(g, "founded", str(c.founded, 20));
    put(g, "footerIntro", str(c.footerIntro, 600));
  });

  group("contact", (g, c) => {
    put(g, "phone", str(c.phone, 40));
    put(g, "phoneHref", str(c.phoneHref, 80));
    put(g, "hotline", str(c.hotline, 40));
    put(g, "hotlineHref", str(c.hotlineHref, 80));
    put(g, "email", str(c.email, 160));
    put(g, "emailHref", str(c.emailHref, 200));
    put(g, "zalo", str(c.zalo, 300));
    put(g, "messenger", str(c.messenger, 300));
    put(g, "mapEmbed", str(c.mapEmbed, 800));
  });

  group("social", (g, s) => {
    ["facebook", "youtube", "tiktok", "github"].forEach((k) => put(g, k, str(s[k], 300)));
  });

  // Số liệu (stats)
  if (Array.isArray(src.stats)) {
    out.stats = src.stats.slice(0, 8).map((s) => ({
      value: Math.max(0, parseInt((s && s.value) || 0, 10) || 0),
      suffix: str((s && s.suffix) || "", 8) || "",
      label: str((s && s.label) || "", 80) || "",
    })).filter((s) => s.label);
  }

  // Nội dung trang chủ
  if (src.home && typeof src.home === "object") out.home = sanitizeHome(src.home);

  // Danh sách sản phẩm & bài viết (trang /admin có thể nhập)
  if (Array.isArray(src.products)) out.products = src.products.slice(0, 60).map(sanitizeProduct).filter(Boolean);
  if (Array.isArray(src.posts)) out.posts = src.posts.slice(0, 120).map(sanitizePost).filter(Boolean);
  if (Array.isArray(src.pages)) out.pages = src.pages.slice(0, 20).map(sanitizePage).filter(Boolean);
  if (Array.isArray(src.solutions)) out.solutions = src.solutions.slice(0, 40).map(sanitizeSolution).filter(Boolean);
  if (Array.isArray(src.articles)) out.articles = src.articles.slice(0, 200).map(sanitizeArticle).filter(Boolean);
  if (Array.isArray(src.categories)) out.categories = src.categories.slice(0, 100).map(sanitizeCategory).filter(Boolean);

  // Chân trang (footer): cột liên kết, đăng ký nhận tin, link chính sách
  if (src.footer && typeof src.footer === "object") out.footer = sanitizeFooter(src.footer);

  // Trang Giới thiệu (landing)
  if (src.about && typeof src.about === "object") out.about = sanitizeAbout(src.about);

  // Câu hỏi thường gặp (trang Liên hệ)
  if (Array.isArray(src.faq)) {
    out.faq = src.faq.slice(0, 40).map((f) => ({
      q: str(f && f.q, 300) || "",
      a: str(f && f.a, 2000) || "",
    })).filter((f) => f.q);
  }

  return out;
}

function sanitizeAbout(a) {
  const out = {};
  const intro = a.intro && typeof a.intro === "object" ? a.intro : {};
  out.intro = {
    eyebrow: str(intro.eyebrow, 120) || "",
    title: str(intro.title, 200) || "",
    quote: str(intro.quote, 600) || "",
    text: safeHtml(intro.text),
    image: image(intro.image, MAX_BANNER_BYTES) || "",
    gallery: imageList(intro.gallery),
  };
  const mission = a.mission && typeof a.mission === "object" ? a.mission : {};
  out.mission = {
    title: str(mission.title, 200) || "",
    items: (Array.isArray(mission.items) ? mission.items : []).slice(0, 12).map((it) => ({
      image: image(it && it.image, MAX_BANNER_BYTES) || "",
      title: str(it && it.title, 200) || "",
      desc: str(it && it.desc, 800) || "",
    })).filter((it) => it.title || it.desc),
  };
  const values = a.values && typeof a.values === "object" ? a.values : {};
  out.values = {
    title: str(values.title, 200) || "",
    subtitle: str(values.subtitle, 600) || "",
    items: (Array.isArray(values.items) ? values.items : []).slice(0, 12).map((it) => ({
      image: image(it && it.image, MAX_BANNER_BYTES) || "",
      title: str(it && it.title, 200) || "",
    })).filter((it) => it.title),
  };
  const leaders = a.leaders && typeof a.leaders === "object" ? a.leaders : {};
  out.leaders = {
    title: str(leaders.title, 200) || "",
    items: (Array.isArray(leaders.items) ? leaders.items : []).slice(0, 30).map((it) => ({
      photo: image(it && it.photo, MAX_BANNER_BYTES) || "",
      name: str(it && it.name, 160) || "",
      role: str(it && it.role, 200) || "",
    })).filter((it) => it.name),
  };
  return out;
}

function sanitizeLinkList(arr, max) {
  if (!Array.isArray(arr)) return undefined;
  return arr.slice(0, max).map((l) => {
    if (!l || typeof l !== "object") return null;
    const label = str(l.label, 120);
    if (!label) return null;
    return { label, url: str(l.url, 500) || "#" };
  }).filter(Boolean);
}

function sanitizeFooter(f) {
  const out = {};
  const connectTitle = str(f.connectTitle, 120);
  if (connectTitle !== undefined) out.connectTitle = connectTitle;
  const contactTitle = str(f.contactTitle, 120);
  if (contactTitle !== undefined) out.contactTitle = contactTitle;

  if (Array.isArray(f.cols)) {
    out.cols = f.cols.slice(0, 4).map((c) => {
      if (!c || typeof c !== "object") return null;
      const col = { title: str(c.title, 120) || "" };
      const links = sanitizeLinkList(c.links, 20);
      if (links) col.links = links;
      return col;
    }).filter(Boolean);
  }

  if (f.newsletter && typeof f.newsletter === "object") {
    const n = {};
    ["title", "placeholder", "button"].forEach((k) => {
      const v = str(f.newsletter[k], 120);
      if (v !== undefined) n[k] = v;
    });
    out.newsletter = n;
  }

  const policies = sanitizeLinkList(f.policies, 12);
  if (policies) out.policies = policies;

  return out;
}

const CAT_TYPES = ["product", "news", "custom"];

function sanitizeCategory(c) {
  if (!c || typeof c !== "object") return null;
  const name = str(c.name, 160);
  if (!name) return null;
  return Object.assign({
    id: str(c.id, 60) || slugify(name),
    name,
    parent: str(c.parent, 60) || "",
    type: CAT_TYPES.includes(c.type) ? c.type : "custom",
    image: image(c.image, MAX_BANNER_BYTES) || "",
    link: str(c.link, 500) || "",
    excerpt: safeHtml(c.excerpt),
    content: safeHtml(c.content),
    showOnHome: c.showOnHome === true,
    status: c.status === "hide" ? "hide" : "show",
  }, seoOf(c));
}

// Cho phép HTML do quản trị viên (đã xác thực) nhập, nhưng loại bỏ script/handler nguy hiểm
function safeHtml(v, max = 20000) {
  if (typeof v !== "string") return "";
  return v
    .slice(0, max)
    .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*style[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, "")
    .replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function slugify(s) {
  return String(s || "").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "muc";
}

// Ba trường SEO chung cho mọi loại nội dung
function seoOf(src) {
  return {
    seoTitle: str(src.seoTitle, 200) || "",
    metaDescription: str(src.metaDescription, 400) || "",
    keywords: str(src.keywords, 300) || "",
  };
}
// Mảng id danh mục (1 mục có thể thuộc nhiều danh mục)
function catIds(src) {
  if (Array.isArray(src.categories)) return src.categories.map((x) => str(x, 60)).filter(Boolean).slice(0, 30);
  if (src.category) return [str(src.category, 60)].filter(Boolean);
  return [];
}
// Mảng ảnh (thư viện ảnh sản phẩm)
function imageList(src, max) {
  max = max || 12;
  if (!Array.isArray(src)) return [];
  return src.map(function (g) { return image(g, MAX_BANNER_BYTES); }).filter(Boolean).slice(0, max);
}

function sanitizePage(p) {
  if (!p || typeof p !== "object") return null;
  const title = str(p.title, 200);
  if (!title) return null;
  return Object.assign({
    slug: str(p.slug, 60) || slugify(title),
    title,
    subtitle: str(p.subtitle, 300) || "",
    image: image(p.image, MAX_BANNER_BYTES) || "",
    content: safeHtml(p.content),
  }, seoOf(p));
}

function sanitizeSolution(s) {
  if (!s || typeof s !== "object") return null;
  const name = str(s.name, 200);
  if (!name) return null;
  return Object.assign({
    id: str(s.id, 60) || slugify(name),
    name,
    image: image(s.image, MAX_BANNER_BYTES) || "assets/img/product-stemkit.svg",
    excerpt: safeHtml(s.excerpt),
    content: safeHtml(s.content),
  }, seoOf(s));
}

function sanitizeArticle(a) {
  if (!a || typeof a !== "object") return null;
  const title = str(a.title, 200);
  if (!title) return null;
  return Object.assign({
    id: str(a.id, 60) || slugify(title),
    group: str(a.group, 60) || "tai-nguyen",
    categories: catIds(a),
    title,
    image: image(a.image, MAX_BANNER_BYTES) || "assets/img/news-1.svg",
    excerpt: safeHtml(a.excerpt),
    externalLink: str(a.externalLink, 500) || "",
    badge: str(a.badge, 40) || "",
    dateLabel: str(a.dateLabel, 40) || "",
    date: str(a.date, 20) || "",
    content: safeHtml(a.content),
  }, seoOf(a));
}

const COLORS = ["plain", "yellow", "blue", "red", "green"];

// Bảng các nhóm text đơn giản của trang chủ: {nhóm: [khoá text]}
const HOME_TEXT = {
  kits: ["eyebrow", "title", "desc"],
  k2: ["badge", "title", "desc", "btn"],
  k3: ["badge", "title", "desc", "btn"],
  rio: ["eyebrow", "title", "desc", "btn", "mapsTitle", "category"],
  rover: ["eyebrow", "title", "desc", "btn", "category"],
  stemkit: ["title", "desc", "link"],
  innolab: ["title", "desc", "link"],
  products: ["eyebrow", "title", "desc", "btn"],
  clb: ["eyebrow", "title", "desc", "btn"],
  news: ["eyebrow", "title", "desc", "btn"],
  partners: ["caption"],
};

function sanitizeHome(src) {
  const out = {};

  if (src.announce && typeof src.announce === "object") {
    const a = {};
    if (typeof src.announce.enabled === "boolean") a.enabled = src.announce.enabled;
    ["text", "linkText", "link"].forEach((k) => {
      const v = str(src.announce[k], 400);
      if (v !== undefined) a[k] = v;
    });
    out.announce = a;
  }

  for (const grp in HOME_TEXT) {
    if (!src[grp] || typeof src[grp] !== "object") continue;
    const g = {};
    HOME_TEXT[grp].forEach((k) => {
      const v = str(src[grp][k], 600);
      if (v !== undefined) g[k] = v;
    });
    if (Object.keys(g).length) out[grp] = g;
  }

  if (src.support && typeof src.support === "object") {
    const sp = {};
    ["eyebrow", "title", "desc", "appEyebrow", "appTitle", "appDesc", "appBtn"].forEach((k) => {
      const v = str(src.support[k], 600);
      if (v !== undefined) sp[k] = v;
    });
    if (Array.isArray(src.support.items)) {
      sp.items = src.support.items.slice(0, 3).map((it) => {
        if (!it || typeof it !== "object") return {};
        const o = {};
        ["title", "desc", "link", "linkText"].forEach((k) => {
          const v = str(it[k], 600);
          if (v !== undefined) o[k] = v;
        });
        o.color = COLORS.includes(it.color) ? it.color : "plain";
        return o;
      });
    }
    out.support = sp;
  }

  if (src.cta && typeof src.cta === "object") {
    const c = {};
    ["title", "desc", "btn1", "btn1Link", "btn2", "btn2Link"].forEach((k) => {
      const v = str(src.cta[k], 400);
      if (v !== undefined) c[k] = v;
    });
    out.cta = c;
  }

  return out;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

function sanitizeProduct(p) {
  if (!p || typeof p !== "object") return null;
  const name = str(p.name, 160);
  if (!name) return null;
  const cats = catIds(p);
  return Object.assign({
    id: str(p.id, 60) || ("sp-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)),
    name,
    code: str(p.code, 60) || "",
    categories: cats,
    category: cats[0] || str(p.category, 60) || "khac",   // giữ tương thích lọc cũ
    categoryLabel: str(p.categoryLabel, 80) || "Sản phẩm",
    level: str(p.level, 120) || "",
    price: p.price == null || p.price === "" ? null : Math.max(0, parseInt(p.price, 10) || 0),
    oldPrice: p.oldPrice == null || p.oldPrice === "" ? null : Math.max(0, parseInt(p.oldPrice, 10) || 0),
    badge: str(p.badge, 40) || "",
    image: image(p.image, MAX_BANNER_BYTES) || "assets/img/product-k3.svg",
    gallery: imageList(p.gallery),
    excerpt: safeHtml(p.excerpt),
    content: safeHtml(p.content),
    specs: str(p.specs, 4000) || "",
    url: str(p.url, 200) || "",
  }, seoOf(p));
}

function sanitizePost(p) {
  if (!p || typeof p !== "object") return null;
  const title = str(p.title, 200);
  if (!title) return null;
  const cats = catIds(p);
  return Object.assign({
    id: parseInt(p.id, 10) || Math.abs(hashStr(title)) % 100000,
    title,
    categories: cats,
    category: cats[0] || str(p.category, 60) || "tin-tuc",
    categoryLabel: str(p.categoryLabel, 80) || "Tin tức",
    date: str(p.date, 20) || "",
    dateLabel: str(p.dateLabel, 40) || "",
    image: image(p.image, MAX_BANNER_BYTES) || "assets/img/news-1.svg",
    excerpt: safeHtml(p.excerpt),
    content: safeHtml(p.content),
    externalLink: str(p.externalLink, 500) || "",
    badge: str(p.badge, 40) || "",
    featured: p.featured === true,
  }, seoOf(p));
}

export async function readSettings(env) {
  if (!env.SETTINGS) return null; // chưa gắn KV
  const raw = await env.SETTINGS.get(KV_KEY, "json");
  return raw || {};
}

export async function writeSettings(env, settings) {
  if (!env.SETTINGS) throw new Error("kv_not_bound");
  await env.SETTINGS.put(
    KV_KEY,
    JSON.stringify({ ...settings, _updatedAt: new Date().toISOString() })
  );
}
