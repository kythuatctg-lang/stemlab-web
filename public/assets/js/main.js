/* ==========================================================================
   NovaSTEM Education — JavaScript chính (vanilla, không phụ thuộc thư viện)
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ---------- 0. Tiện ích ---------- */
  function get(obj, path) {
    return path.split(".").reduce(function (acc, key) {
      return acc == null ? undefined : acc[key];
    }, obj);
  }

  function formatVND(n) {
    if (n == null) return "Liên hệ";
    return new Intl.NumberFormat("vi-VN").format(n) + "₫";
  }

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Bỏ thẻ HTML để hiển thị đoạn tóm tắt dạng văn bản thuần (tóm tắt giờ có thể chứa HTML)
  function stripTags(html) {
    if (html == null || html === "") return "";
    var d = document.createElement("div");
    d.innerHTML = String(html);
    return (d.textContent || d.innerText || "").trim();
  }
  function escText(html) { return esc(stripTags(html)); }

  /* ---------- URL sạch dạng /ten-muc.html ---------- */
  function slugify(s) {
    return String(s || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  // slug của một mục: ưu tiên slug/id có sẵn, ngược lại tạo từ tên/tiêu đề
  function itemSlug(x) { return (x.slug || slugify(x.name || x.title) || String(x.id || "")); }
  function itemUrl(x) { return "/" + itemSlug(x) + ".html"; }
  // Slug danh mục lấy theo TÊN hiện tại (đổi tên -> đổi link); c.slug nếu bạn đặt riêng
  function catSlug(c) { return c.slug || slugify(c.name) || c.id; }
  // slug lấy từ đường dẫn hiện tại: "/robot-orc-k3.html" -> "robot-orc-k3"
  function slugFromPath() {
    var last = location.pathname.split("/").pop() || "";
    return last.replace(/\.html?$/i, "");
  }

  /* ---------- 0b. Tiện ích màu (dùng cho bảng màu động) ---------- */
  function hexToRgb(hex) {
    var h = String(hex || "").replace("#", "").trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbToHex(rgb) {
    return "#" + rgb.map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    }).join("");
  }

  // t = 0 -> màu a, t = 1 -> màu b
  function mix(a, b, t) {
    var ra = hexToRgb(a), rb = hexToRgb(b);
    if (!ra || !rb) return a;
    return rgbToHex([0, 1, 2].map(function (i) { return ra[i] + (rb[i] - ra[i]) * t; }));
  }

  /* ---------- 1. Gắn thương hiệu + bảng màu từ cấu hình ---------- */

  /**
   * Ghi bảng màu vào các biến CSS ở :root.
   * Chỉ cần 6 màu gốc lấy từ logo — các sắc độ phụ được suy ra tự động.
   */
  function applyTheme(theme) {
    if (!theme) return;
    var root = document.documentElement.style;
    var primary = theme.primary || "#1273e6";
    var dark = theme.primaryDark || "#10306e";
    var accent = theme.accent || "#ff9500";

    var pRgb = hexToRgb(primary) || [18, 115, 230];
    var dRgb = hexToRgb(dark) || [16, 48, 110];
    var aRgb = hexToRgb(accent) || [255, 149, 0];

    root.setProperty("--c-primary", primary);
    root.setProperty("--c-primary-600", mix(primary, "#000000", 0.16));
    root.setProperty("--c-primary-700", mix(primary, dark, 0.55));
    root.setProperty("--c-primary-900", dark);
    root.setProperty("--c-primary-soft", mix(primary, "#ffffff", 0.92));
    root.setProperty("--c-primary-soft-2", mix(primary, "#ffffff", 0.82));
    root.setProperty("--c-primary-rgb", pRgb.join(", "));
    root.setProperty("--c-primary-900-rgb", dRgb.join(", "));

    root.setProperty("--c-accent", accent);
    root.setProperty("--c-accent-600", mix(accent, "#000000", 0.12));
    root.setProperty("--c-accent-rgb", aRgb.join(", "));

    if (theme.cyan) root.setProperty("--c-cyan", theme.cyan);
    if (theme.green) root.setProperty("--c-green", theme.green);
    if (theme.yellow) root.setProperty("--c-yellow", theme.yellow);

    root.setProperty("--c-footer", mix(dark, "#000000", 0.22));

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", primary);
  }

  function applyBranding() {
    var SITE = window.SITE;
    if (!SITE) return;

    applyTheme(SITE.theme);

    // Tự suy ra link gọi/email từ số hiển thị (người dùng chỉ cần nhập số & email)
    if (SITE.contact) {
      var digits = function (s) { return String(s || "").replace(/[^0-9+]/g, ""); };
      if (SITE.contact.phone) SITE.contact.phoneHref = "tel:" + digits(SITE.contact.phone);
      if (SITE.contact.hotline) SITE.contact.hotlineHref = "tel:" + digits(SITE.contact.hotline);
      if (SITE.contact.email) SITE.contact.emailHref = "mailto:" + SITE.contact.email;
    }

    // Ẩn/hiện chữ cạnh logo (khi logo tải lên đã có sẵn tên thương hiệu)
    if (SITE.brand && SITE.brand.showBrandText === false) {
      $$(".brand__text").forEach(function (el) { el.style.display = "none"; });
    }

    // Dựng lại hero theo cấu hình banner (ảnh) — an toàn khi gọi nhiều lần
    setupHero();
    applySupportColors();
    renderStats();
    applyAnnounce();
    applyMap();

    $$("[data-site]").forEach(function (el) {
      var val = get(SITE, el.getAttribute("data-site"));
      if (val != null && val !== "") el.textContent = val;
    });

    $$("[data-site-href]").forEach(function (el) {
      var val = get(SITE, el.getAttribute("data-site-href"));
      if (val) el.setAttribute("href", val);
    });

    renderFooter();

    $$("[data-site-src]").forEach(function (el) {
      var val = get(SITE, el.getAttribute("data-site-src"));
      if (val) el.setAttribute("src", val);
    });

    $$("[data-site-attr]").forEach(function (el) {
      // định dạng: data-site-attr="title:brand.name"
      el.getAttribute("data-site-attr").split(",").forEach(function (pair) {
        var parts = pair.split(":");
        var val = get(SITE, parts.slice(1).join(":").trim());
        if (val) el.setAttribute(parts[0].trim(), val);
      });
    });

    // Tiêu đề trang: thay chuỗi {brand}
    if (document.title.indexOf("{brand}") > -1) {
      document.title = document.title.replace("{brand}", SITE.brand.name);
    }

    applySeo();
  }

  // Favicon, ảnh chia sẻ (OG), tiêu đề & mô tả SEO cho trang chủ
  function applySeo() {
    var SITE = window.SITE;
    // Favicon
    var fav = get(SITE, "brand.favicon");
    if (fav) {
      var link = document.querySelector('link[rel="icon"]');
      if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
      link.setAttribute("href", fav);
    }
    var setMeta = function (sel, val) {
      if (!val) return;
      var m = document.querySelector(sel);
      if (m) m.setAttribute("content", val);
    };
    // Ảnh OG (áp mọi trang)
    setMeta('meta[property="og:image"]', get(SITE, "seo.ogImage"));
    // Tiêu đề & mô tả — chỉ áp cho TRANG CHỦ (đánh dấu bằng thẻ hero)
    if ($(".hero")) {
      var t = get(SITE, "seo.homeTitle");
      if (t) { document.title = t; setMeta('meta[property="og:title"]', t); }
      var d = get(SITE, "seo.homeDescription");
      if (d) { setMeta('meta[name="description"]', d); setMeta('meta[property="og:description"]', d); }
    }
  }

  // Tạo/lấy thẻ meta theo tên
  function metaEnsure(name, attr) {
    attr = attr || "name";
    var m = document.querySelector("meta[" + attr + '="' + name + '"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute(attr, name); document.head.appendChild(m); }
    return m;
  }
  // Áp SEO (title, description, keywords, OG) cho trang chi tiết từ dữ liệu mục
  function applyItemSeo(item) {
    var brand = (window.SITE.brand && window.SITE.brand.name) || "";
    var title = item.seoTitle || ((item.name || item.title || "") + (brand ? " | " + brand : ""));
    document.title = title;
    var desc = item.metaDescription || stripTags(item.excerpt || "") || "";
    if (desc) { metaEnsure("description").setAttribute("content", desc); }
    if (item.keywords) metaEnsure("keywords").setAttribute("content", item.keywords);
    var ogt = document.querySelector('meta[property="og:title"]'); if (ogt) ogt.setAttribute("content", title);
    var ogd = document.querySelector('meta[property="og:description"]'); if (ogd && desc) ogd.setAttribute("content", desc);
    var ogi = document.querySelector('meta[property="og:image"]'); if (ogi && item.image) ogi.setAttribute("content", item.image);
  }
  // 1 sản phẩm/bài có thể thuộc nhiều danh mục
  function inCategory(x, catId) {
    return (Array.isArray(x.categories) && x.categories.indexOf(catId) > -1) ||
      x.category === catId || x.group === catId;
  }
  // Chuẩn hoá "danh mục nguồn" (nhập id / slug / tên) về đúng id danh mục
  function resolveCatId(key) {
    if (!key) return key;
    var cats = window.CATEGORIES || [];
    var m = cats.filter(function (c) { return c.id === key; })[0]
         || cats.filter(function (c) { return catSlug(c) === key; })[0]
         || cats.filter(function (c) { return c.name === key; })[0];
    return m ? m.id : key;
  }

  /* ---------- 1b. Nội dung động của trang chủ ---------- */

  // Đổ màu nền cho 3 thẻ "Hỗ trợ" theo cấu hình (yellow / blue / red / green / plain)
  function applySupportColors() {
    var items = get(window.SITE, "home.support.items") || [];
    $$("[data-support]").forEach(function (card) {
      var it = items[+card.getAttribute("data-support")];
      if (!it) return;
      card.classList.remove(
        "support-card--filled", "support-card--yellow", "support-card--blue",
        "support-card--red", "support-card--green"
      );
      if (it.color && it.color !== "plain") {
        card.classList.add("support-card--filled", "support-card--" + it.color);
      }
    });
  }

  // Dựng lại lưới số liệu từ SITE.stats rồi cho chạy hiệu ứng đếm
  // Chân trang động (cột liên kết + link chính sách) — dữ liệu từ SITE.footer
  function renderFooter() {
    var f = (window.SITE && window.SITE.footer) || {};
    var linkHtml = function (arr) {
      return (arr || []).filter(function (l) { return l && l.label; })
        .map(function (l) { return '<a href="' + esc(l.url || "#") + '">' + esc(l.label) + "</a>"; });
    };
    (f.cols || []).forEach(function (col, i) {
      var box = $('[data-footer-col="' + i + '"]');
      if (!box) return;
      var h = box.querySelector("[data-footer-title]");
      var ul = box.querySelector("[data-footer-list]");
      if (h && col.title) h.textContent = col.title;
      if (ul) ul.innerHTML = linkHtml(col.links).map(function (a) { return "<li>" + a + "</li>"; }).join("");
    });
    var pol = $("#footer-policies");
    if (pol && Array.isArray(f.policies) && f.policies.length) pol.innerHTML = linkHtml(f.policies).join("");
  }

  // Trang Giới thiệu (landing) — dựng các section từ SITE.about
  function renderAbout() {
    var A = window.SITE && window.SITE.about;
    var galleryEl = $("[data-about-gallery]");
    if (!A || !galleryEl) return; // chỉ chạy trên trang gioi-thieu.html
    $$("[data-about]").forEach(function (el) {
      var v = get(A, el.getAttribute("data-about"));
      if (v != null && v !== "") el.textContent = v;
    });
    $$("[data-about-html]").forEach(function (el) {
      var v = get(A, el.getAttribute("data-about-html"));
      if (v != null) el.innerHTML = v;
    });
    var imgs = [].concat(A.intro && A.intro.image ? [A.intro.image] : [], (A.intro && A.intro.gallery) || []).filter(Boolean);
    galleryEl.innerHTML = imgs.map(function (src) {
      return '<div class="about-gallery__cell"><img src="' + esc(src) + '" alt="" loading="lazy"></div>';
    }).join("");

    var m = $("[data-about-mission]");
    if (m) m.innerHTML = ((A.mission && A.mission.items) || []).map(function (it) {
      return '<article class="mission-card reveal">' +
        (it.image ? '<div class="mission-card__ico"><img src="' + esc(it.image) + '" alt="" loading="lazy"></div>' : "") +
        "<h3>" + esc(it.title) + "</h3><p>" + escText(it.desc) + "</p></article>";
    }).join("");

    var v = $("[data-about-values]");
    if (v) v.innerHTML = ((A.values && A.values.items) || []).map(function (it) {
      return '<div class="value-card reveal">' +
        (it.image ? '<div class="value-card__ico"><img src="' + esc(it.image) + '" alt=""></div>' : "") +
        "<span>" + esc(it.title) + "</span></div>";
    }).join("");

    var l = $("[data-about-leaders]");
    if (l) l.innerHTML = ((A.leaders && A.leaders.items) || []).map(function (it) {
      return '<article class="leader-card reveal"><div class="leader-card__photo"><img src="' + esc(it.photo) +
        '" alt="' + esc(it.name) + '" loading="lazy"></div><h4>' + esc(it.name) + "</h4>" +
        (it.role ? "<p>" + esc(it.role) + "</p>" : "") + "</article>";
    }).join("");

    initReveal();
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "start" }); }, 80);
    }
  }

  function renderStats() {
    var grid = $("[data-stats-grid]");
    if (!grid) return;
    var stats = (window.SITE && window.SITE.stats) || [];
    if (stats.length) {
      grid.innerHTML = stats.map(function (s) {
        return '<div class="reveal"><div class="stats__num"><span data-count="' + (+s.value || 0) +
          '">0</span>' + esc(s.suffix || "") + '</div><div class="stats__label">' + esc(s.label || "") + "</div></div>";
      }).join("");
    }
    initCounters();
  }

  // Bật/tắt thanh thông báo trên cùng
  function applyAnnounce() {
    var box = $("[data-announce-box]");
    if (!box) return;
    if (get(window.SITE, "home.announce.enabled") === false) box.style.display = "none";
  }

  // Bản đồ nhúng: ưu tiên mã nhúng riêng, nếu trống thì sinh từ địa chỉ công ty
  function applyMap() {
    var frame = $("[data-map-embed]");
    if (!frame) return;
    var embed = get(window.SITE, "contact.mapEmbed");
    var addr = get(window.SITE, "company.address");
    var src = embed && embed.trim()
      ? embed.trim()
      : (addr ? "https://www.google.com/maps?q=" + encodeURIComponent(addr) + "&output=embed" : null);
    if (src && frame.getAttribute("src") !== src) frame.setAttribute("src", src);
  }

  /* ---------- 1c. Menu điều hướng động (nhiều cấp) ---------- */
  function articlesOf(group) {
    return (window.ARTICLES || []).filter(function (a) { return a.group === group; });
  }
  // Link của một bài: externalLink nếu có, ngược lại link hệ thống sinh
  function articleHref(a) { return a.externalLink ? a.externalLink : itemUrl(a); }

  // Link của một danh mục: dùng link riêng nếu có, ngược lại URL sạch /slug.html
  function categoryHref(c) {
    if (c.link) return c.link;
    return "/" + catSlug(c) + ".html";
  }

  // Dựng cây menu từ CATEGORIES (chỉ mục status=show), tối đa 3 cấp
  function buildNavModel() {
    var cats = (window.CATEGORIES || []).filter(function (c) { return c.status !== "hide"; });
    var byParent = {};
    cats.forEach(function (c) { var k = c.parent || ""; (byParent[k] = byParent[k] || []).push(c); });

    function nodesOf(pid, depth, parentIsAbout) {
      return (byParent[pid] || []).map(function (c) {
        // Nhánh "Giới thiệu" (slug gioi-thieu) trỏ tới trang landing + cuộn tới section
        var isAbout = depth === 1 && catSlug(c) === "gioi-thieu";
        var kids = depth < 3 ? nodesOf(c.id, depth + 1, isAbout) : [];
        var node;
        if (isAbout) node = { label: c.name, href: "/gioi-thieu.html" };
        else if (parentIsAbout) node = { label: c.name, href: "/gioi-thieu.html#" + catSlug(c) };
        else node = { label: c.name, href: categoryHref(c), ext: /^https?:/i.test(c.link || "") };
        if (kids.length) node.children = kids;
        return node;
      });
    }

    // Bỏ "Trang chủ" (bấm logo là về trang chủ)
    return nodesOf("", 1, false)
      .concat([{ label: "Liên hệ", href: "lien-he.html" }]);
  }

  var NAV_CARET = '<svg class="nav__caret" width="10" height="10" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1.5L6 6.5l5-5"/></svg>';

  // Đệ quy các mục con của dropdown (cấp 2, cấp 3…)
  function navSubItems(children) {
    return children.map(function (c) {
      var attr = c.ext ? ' target="_blank" rel="noopener"' : "";
      if (c.children && c.children.length) {
        return '<li class="nav__item nav__item--has-sub">' +
          '<a href="' + esc(c.href) + '"' + attr + ' aria-haspopup="true">' + esc(c.label) +
          '<svg class="nav__caret nav__caret--right" width="9" height="9" viewBox="0 0 8 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1.5 1l5 5-5 5"/></svg></a>' +
          '<ul class="nav__sub nav__sub--flyout">' + navSubItems(c.children) + "</ul></li>";
      }
      return '<li><a href="' + esc(c.href) + '"' + attr + ">" + esc(c.label) + (c.ext ? " ↗" : "") + "</a></li>";
    }).join("");
  }

  function buildNav() {
    var list = $("#primary-nav .nav__list");
    if (!list) return;
    list.innerHTML = buildNavModel().map(function (item) {
      if (!item.children || !item.children.length) {
        return '<li><a class="nav__link" href="' + esc(item.href) + '">' + esc(item.label) + "</a></li>";
      }
      return '<li class="nav__item nav__item--has-sub">' +
        '<a class="nav__link" href="' + esc(item.href || "#") + '" aria-expanded="false" aria-haspopup="true">' + esc(item.label) + NAV_CARET + "</a>" +
        '<ul class="nav__sub">' + navSubItems(item.children) + "</ul></li>";
    }).join("");
  }

  /* ---------- 1d. Router cho các trang template động ---------- */
  function qp(name) { return new URLSearchParams(location.search).get(name); }
  function byId(arr, id) { return (arr || []).filter(function (x) { return x.id === id; })[0]; }
  function groupLabel(gid) {
    var g = (window.SITE.articleGroups || []).filter(function (x) { return x.id === gid; })[0];
    return g ? g.label : "Bài viết";
  }

  function fill(root, data) {
    // Điền các phần tử [data-route-title/subtitle/content/image/crumb]
    var t = $("[data-route-title]", root); if (t && data.title != null) { t.textContent = data.title; document.title = data.title + " | " + (window.SITE.brand.name || ""); }
    var s = $("[data-route-subtitle]", root); if (s) s.textContent = stripTags(data.subtitle || "");
    var c = $("[data-route-content]", root); if (c && data.content != null) c.innerHTML = data.content;
    var im = $("[data-route-image]", root);
    if (im) { if (data.image) { im.src = data.image; im.removeAttribute("hidden"); } else { im.setAttribute("hidden", ""); } }
    var cr = $("[data-route-crumb]", root); if (cr) cr.textContent = data.crumb || data.title || "";
  }

  function notFound(root, msg) {
    var c = $("[data-route-content]", root);
    fill(root, { title: "Không tìm thấy nội dung", subtitle: "", crumb: "Không tìm thấy" });
    if (c) c.innerHTML = '<p>' + esc(msg || "Nội dung bạn tìm không tồn tại hoặc đã bị xoá.") +
      ' <a href="index.html">Về trang chủ</a>.</p>';
  }

  function solutionCard(s) {
    var u = itemUrl(s);
    return '<article class="card product-card reveal"><div class="card__media">' +
      '<a href="' + esc(u) + '"><img src="' + esc(s.image) + '" alt="' + esc(s.name) + '" loading="lazy"></a></div>' +
      '<div class="card__body"><h3 class="card__title"><a href="' + esc(u) + '">' + esc(s.name) + '</a></h3>' +
      '<p class="card__text">' + escText(s.excerpt || "") + '</p>' +
      '<div class="card__foot"><a class="link-more" href="' + esc(u) + '">Tìm hiểu</a></div></div></article>';
  }
  function articleCard(a) {
    var href = articleHref(a), ext = !!a.externalLink;
    var attr = ext ? ' target="_blank" rel="noopener"' : "";
    return '<article class="card news-card reveal"><div class="card__media">' +
      '<a href="' + esc(href) + '"' + attr + '><img src="' + esc(a.image || "assets/img/news-1.svg") + '" alt="' + esc(a.title) + '" loading="lazy"></a></div>' +
      '<div class="card__body"><p class="news-card__date"><span class="badge">' + esc(groupLabel(a.group)) + "</span>" + (a.dateLabel ? " " + esc(a.dateLabel) : "") + "</p>" +
      '<h3 class="card__title news-card__title"><a href="' + esc(href) + '"' + attr + ">" + esc(a.title) + (ext ? " ↗" : "") + "</a></h3>" +
      '<p class="card__text">' + escText(a.excerpt || "") + '</p>' +
      '<div class="card__foot"><a class="link-more" href="' + esc(href) + '"' + attr + ">Xem chi tiết</a></div></div></article>";
  }

  /* ---------- Router URL sạch: /ten-muc.html ---------- */
  function renderRouterPage() {
    var root = $("[data-router]");
    if (!root) return;
    var slug = slugFromPath();
    var SITE = window.SITE;
    var crumbs = $("[data-router-crumbs]", root), titleEl = $("[data-router-title]", root),
        subEl = $("[data-router-sub]", root), body = $("[data-router-body]", root);

    function setHead(title, sub, crumbHtml) {
      if (titleEl) titleEl.textContent = title;
      document.title = title + " | " + (SITE.brand.name || "");
      if (subEl) subEl.textContent = sub || "";
      if (crumbs) crumbs.innerHTML = '<li><a href="index.html">Trang chủ</a></li>' + (crumbHtml || "");
    }
    function proseView(container, opts) {
      setHead(opts.title, stripTags(opts.sub || ""), opts.crumb);
      if (opts.item) applyItemSeo(opts.item);
      body.innerHTML = '<div class="container container--narrow section">' +
        (opts.image ? '<img src="' + esc(opts.image) + '" alt="" style="width:100%;border-radius:20px;margin-bottom:24px" loading="lazy">' : "") +
        '<div class="prose">' + (opts.content || "<p>" + escText(opts.sub || "") + "</p>") + "</div>" +
        (opts.cta || "") + "</div>";
      initReveal();
    }

    // 1. Danh mục -> trang liệt kê
    var cat = (window.CATEGORIES || []).filter(function (c) { return catSlug(c) === slug; })[0];
    if (cat) {
      setHead(cat.name, stripTags(cat.excerpt || ""), "<li>" + esc(cat.name) + "</li>");
      applyItemSeo(cat);
      var cards, intro = cat.content ? '<div class="prose" style="margin-bottom:28px">' + cat.content + "</div>" : "";
      if (cat.type === "news") {
        var news = (window.POSTS || []).filter(function (p) { return inCategory(p, cat.id); })
          .concat((window.ARTICLES || []).filter(function (a) { return inCategory(a, cat.id); }));
        cards = news.length ? news.map(function (x) { return x.group !== undefined ? articleCard(x) : newsCard(x); })
                            : (window.POSTS || []).map(newsCard);
      } else {
        var prods = (window.PRODUCTS || []).filter(function (p) { return inCategory(p, cat.id); });
        cards = (prods.length ? prods : (window.PRODUCTS || [])).map(productCard);
      }
      body.innerHTML = '<div class="container section">' + intro + '<div class="grid grid--3">' + cards.join("") + "</div></div>";
      initReveal();
      return;
    }
    // 2. Sản phẩm
    var prod = (window.PRODUCTS || []).filter(function (p) { return itemSlug(p) === slug; })[0];
    if (prod) {
      setHead(prod.name, prod.categoryLabel, '<li><a href="san-pham.html">Sản phẩm</a></li><li>' + esc(prod.name) + "</li>");
      applyItemSeo(prod);
      var gallery = [prod.image].concat(Array.isArray(prod.gallery) ? prod.gallery : []).filter(Boolean);
      var thumbs = gallery.length > 1 ? '<div class="pd-gallery__thumbs">' + gallery.map(function (src, i) {
        return '<button type="button" data-pdthumb="' + esc(src) + '"' + (i === 0 ? ' class="is-active"' : "") + '><img src="' + esc(src) + '" alt=""></button>';
      }).join("") + "</div>" : "";
      // --- Khối tab: Mô tả chi tiết / Thông số kỹ thuật / Đánh giá ---
      var specsRows = String(prod.specs || "").split(/\r?\n/).map(function (line) {
        line = line.trim(); if (!line) return null;
        var idx = line.indexOf(":"); if (idx < 0) idx = line.indexOf("|");
        return idx < 0 ? { name: line, value: "" } : { name: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
      }).filter(Boolean);
      var descHtml = prod.content || (prod.excerpt || "<p>Đang cập nhật nội dung chi tiết.</p>");
      var specsHtml = specsRows.length
        ? '<table class="pd-specs"><tbody>' + specsRows.map(function (r) {
            return "<tr><th>" + esc(r.name) + "</th><td>" + esc(r.value) + "</td></tr>"; }).join("") + "</tbody></table>"
        : '<p class="pd-empty">Thông số kỹ thuật đang được cập nhật.</p>';
      var tabsHtml = '<section class="pd-tabs">' +
        '<div class="pd-tabs__nav" role="tablist">' +
          '<button type="button" class="pd-tab is-active" data-pdtab="desc">Mô tả chi tiết</button>' +
          '<button type="button" class="pd-tab" data-pdtab="specs">Thông số kỹ thuật</button>' +
          '<button type="button" class="pd-tab" data-pdtab="reviews">Đánh giá (0)</button>' +
        "</div>" +
        '<div class="pd-panel is-active" data-pdpanel="desc"><div class="prose">' + descHtml + "</div></div>" +
        '<div class="pd-panel" data-pdpanel="specs">' + specsHtml + "</div>" +
        '<div class="pd-panel" data-pdpanel="reviews" data-reviews-root></div>' +
        "</section>";

      // --- Sản phẩm liên quan (cùng danh mục, bù thêm SP mới nếu thiếu) ---
      var relCat = (Array.isArray(prod.categories) && prod.categories[0]) || prod.category || prod.group;
      var related = (window.PRODUCTS || []).filter(function (p) { return p.id !== prod.id && inCategory(p, relCat); });
      (window.PRODUCTS || []).slice().reverse().forEach(function (p) {
        if (related.length < 4 && p.id !== prod.id && related.indexOf(p) < 0) related.push(p);
      });
      var relItems = related.slice(0, 4);
      var relatedHtml = relItems.length
        ? '<section class="pd-related"><h2>Sản phẩm liên quan</h2><div class="grid grid--4">' +
            relItems.map(productCard).join("") + "</div></section>"
        : "";

      body.innerHTML = '<div class="container section"><div class="pd-grid">' +
        '<div class="pd-gallery"><div class="pd-gallery__main"><img src="' + esc(prod.image) + '" alt="' + esc(prod.name) + '"></div>' + thumbs + "</div>" +
        '<div class="pd-info">' + (prod.badge ? '<span class="badge badge--accent">' + esc(prod.badge) + "</span>" : "") +
          '<h1 style="margin:10px 0 8px">' + esc(prod.name) + "</h1>" +
          '<p style="color:var(--c-muted)">' + esc(prod.categoryLabel) + (prod.level ? " · " + esc(prod.level) : "") + "</p>" +
          '<div class="pd-price"><strong>' + formatVND(prod.price) + "</strong>" + (prod.oldPrice ? "<del>" + formatVND(prod.oldPrice) + "</del>" : "") + "</div>" +
          (prod.excerpt ? '<div class="prose" style="margin:16px 0">' + prod.excerpt + "</div>" : "") +
          '<div class="pd-actions"><button class="btn btn--primary" type="button" data-add-to-cart="' + esc(prod.id) + '">Thêm vào giỏ hàng</button>' +
          '<a class="btn btn--accent" href="lien-he.html">Yêu cầu báo giá</a></div>' +
          productMetaHtml(prod) +
        "</div></div>" + tabsHtml + relatedHtml + "</div>";
      $$("[data-pdthumb]", body).forEach(function (b) {
        b.addEventListener("click", function () {
          var m = $(".pd-gallery__main img", body); if (m) m.src = b.getAttribute("data-pdthumb");
          $$("[data-pdthumb]", body).forEach(function (x) { x.classList.remove("is-active"); });
          b.classList.add("is-active");
        });
      });
      $$("[data-pdtab]", body).forEach(function (t) {
        t.addEventListener("click", function () {
          var key = t.getAttribute("data-pdtab");
          $$("[data-pdtab]", body).forEach(function (x) { x.classList.toggle("is-active", x === t); });
          $$("[data-pdpanel]", body).forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-pdpanel") === key); });
        });
      });
      var copyBtn = $("[data-copy-link]", body);
      if (copyBtn) copyBtn.addEventListener("click", function () {
        var url = copyBtn.getAttribute("data-copy-link");
        if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
        copyBtn.classList.add("is-copied");
        setTimeout(function () { copyBtn.classList.remove("is-copied"); }, 1400);
      });
      setupReviews(prod, body);
      initReveal();
      return;
    }
    // 3. Bài viết (Chương trình/Dự án/Tài nguyên)
    var art = (window.ARTICLES || []).filter(function (a) { return itemSlug(a) === slug; })[0];
    if (art) {
      if (art.externalLink) { location.replace(art.externalLink); return; }
      proseView(body, { item: art, title: art.title, sub: art.excerpt, content: art.content, image: art.image,
        crumb: '<li><a href="/' + encodeURIComponent(art.group) + '.html">' + esc(groupLabel(art.group)) + "</a></li><li>" + esc(art.title) + "</li>" });
      return;
    }
    // 4. Tin tức (POSTS)
    var post = (window.POSTS || []).filter(function (p) { return itemSlug(p) === slug; })[0];
    if (post) {
      if (post.externalLink) { location.replace(post.externalLink); return; }
      proseView(body, { item: post, title: post.title, sub: post.excerpt, content: post.content, image: post.image,
        crumb: '<li><a href="tin-tuc.html">Tin tức</a></li><li>' + esc(post.title) + "</li>" });
      return;
    }
    // 5. Trang giới thiệu
    var pg = (SITE.pages || []).filter(function (p) { return p.slug === slug; })[0];
    if (pg) {
      proseView(body, { item: pg, title: pg.title, sub: pg.subtitle, content: pg.content, image: pg.image,
        crumb: "<li>Giới thiệu</li><li>" + esc(pg.title) + "</li>",
        cta: '<p style="margin-top:28px"><a class="btn btn--primary" href="lien-he.html">Liên hệ tư vấn</a></p>' });
      return;
    }
    // 6. Giải pháp
    var sol = (window.SOLUTIONS || []).filter(function (s) { return itemSlug(s) === slug; })[0];
    if (sol) {
      proseView(body, { item: sol, title: sol.name, sub: sol.excerpt, content: sol.content, image: sol.image,
        crumb: '<li><a href="giai-phap.html">Giải pháp STEM Lab</a></li><li>' + esc(sol.name) + "</li>",
        cta: '<p style="margin-top:28px"><a class="btn btn--primary" href="lien-he.html">Yêu cầu tư vấn giải pháp</a></p>' });
      return;
    }
    // Không tìm thấy
    setHead("Không tìm thấy trang", "", "<li>Không tìm thấy</li>");
    body.innerHTML = '<div class="container section"><p>Nội dung bạn tìm không tồn tại hoặc đã bị xoá. <a href="index.html">Về trang chủ</a>.</p></div>';
  }

  function renderRoute() {
    renderRouterPage();
    var root = $("[data-route]");
    if (!root) return;
    var type = root.getAttribute("data-route");

    if (type === "page") {
      var pages = window.SITE.pages || [];
      var slug = qp("p") || (pages[0] && pages[0].slug);
      var pg = byId(pages, slug) || (pages || []).filter(function (p) { return p.slug === slug; })[0];
      if (!pg) return notFound(root, "Trang giới thiệu không tồn tại.");
      fill(root, { title: pg.title, subtitle: pg.subtitle, content: pg.content, image: pg.image, crumb: pg.title });

    } else if (type === "solution") {
      var id = qp("id");
      var list = $("[data-route-list]", root);
      if (id) {
        var sol = byId(window.SOLUTIONS, id);
        if (!sol) return notFound(root, "Giải pháp không tồn tại.");
        if (list) list.closest("[data-route-listwrap]") && list.closest("[data-route-listwrap]").setAttribute("hidden", "");
        var detail = $("[data-route-detail]", root); if (detail) detail.removeAttribute("hidden");
        fill(root, { title: sol.name, subtitle: sol.excerpt, content: sol.content, image: sol.image, crumb: sol.name });
      } else {
        var dtl = $("[data-route-detail]", root); if (dtl) dtl.setAttribute("hidden", "");
        var lw = $("[data-route-listwrap]", root); if (lw) lw.removeAttribute("hidden");
        fill(root, { title: "Giải pháp STEM Lab", subtitle: "Giải pháp phòng STEM trọn gói cho từng cấp học.", crumb: "Giải pháp STEM Lab" });
        if (list) list.innerHTML = (window.SOLUTIONS || []).map(solutionCard).join("");
      }

    } else if (type === "category") {
      var gid = qp("c");
      var arts = articlesOf(gid);
      fill(root, { title: groupLabel(gid), subtitle: "", crumb: groupLabel(gid) });
      var cl = $("[data-route-list]", root);
      if (cl) cl.innerHTML = arts.length ? arts.map(articleCard).join("") :
        '<p style="grid-column:1/-1;color:var(--c-muted)">Chưa có bài viết trong mục này.</p>';

    } else if (type === "article") {
      var aid = qp("id");
      var art = byId(window.ARTICLES, aid);
      if (!art) return notFound(root, "Bài viết không tồn tại.");
      if (art.externalLink) { location.replace(art.externalLink); return; }
      fill(root, { title: art.title, subtitle: art.excerpt, content: art.content, image: art.image, crumb: art.title });
      var gl = $("[data-route-grouplink]", root);
      if (gl) { gl.textContent = groupLabel(art.group); gl.href = "chuyen-muc.html?c=" + encodeURIComponent(art.group); }
    }
    initReveal();
  }

  /* ---------- 2. Thanh thông báo ---------- */
  function initAnnounce() {
    var bar = $("[data-announce]");
    if (!bar) return;
    var key = "novastem:announce-dismissed";
    try {
      if (localStorage.getItem(key) === bar.dataset.announce) bar.hidden = true;
    } catch (e) { /* chế độ riêng tư */ }

    var btn = $(".announce__close", bar);
    if (btn) {
      btn.addEventListener("click", function () {
        bar.hidden = true;
        try { localStorage.setItem(key, bar.dataset.announce); } catch (e) {}
      });
    }
  }

  /* ---------- 3. Header dính + menu mobile + dropdown ---------- */
  function initHeader() {
    var header = $(".site-header");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-stuck", window.scrollY > 8);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    var nav = $("#primary-nav");
    var toggle = $("[data-nav-toggle]");
    var closeBtn = $("[data-nav-close]");
    var backdrop = $("[data-nav-backdrop]");

    function setNav(open) {
      if (!nav) return;
      nav.classList.toggle("is-open", open);
      if (backdrop) backdrop.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
      if (toggle) toggle.setAttribute("aria-expanded", String(open));
    }

    if (toggle) toggle.addEventListener("click", function () { setNav(!nav.classList.contains("is-open")); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setNav(false); });
    if (backdrop) backdrop.addEventListener("click", function () { setNav(false); });

    // Dropdown: hover trên desktop (CSS lo), click trên mobile / khi href="#".
    // Dùng uỷ quyền sự kiện để menu dựng động vẫn hoạt động không cần gắn lại.
    var isDesktop = function () { return window.matchMedia("(min-width: 1081px)").matches; };

    if (nav && !nav.__dropdownBound) {
      nav.addEventListener("click", function (e) {
        var link = e.target.closest(".nav__item--has-sub > a");
        if (!link) return;
        var item = link.parentElement;
        // Trên desktop: hover lo dropdown; nếu link có href thật thì cho đi tới trang.
        if (isDesktop() && link.getAttribute("href") !== "#") return;
        e.preventDefault();
        var open = item.classList.contains("is-open");
        if (!isDesktop()) {
          // chỉ đóng các mục CÙNG CẤP (không đóng cha)
          $$(":scope > .nav__item--has-sub", item.parentElement).forEach(function (o) {
            if (o !== item) o.classList.remove("is-open");
          });
        }
        item.classList.toggle("is-open", !open);
        link.setAttribute("aria-expanded", String(!open));
      });
      nav.__dropdownBound = true;
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        setNav(false);
        $$(".nav__item--has-sub").forEach(function (i) { i.classList.remove("is-open"); });
      }
    });

    window.addEventListener("resize", function () {
      if (isDesktop()) setNav(false);
    });
  }

  /* ---------- 4. Hero carousel ----------
     Hai chế độ:
       • Mặc định: các slide chữ + robot viết sẵn trong index.html.
       • Chế độ ẢNH: khi SITE.hero.slides có ảnh (do trang /admin upload) thì
         thay toàn bộ slide bằng ảnh banner. setupHero() gọi lại được nhiều lần
         (lúc tải trang và sau khi nạp cấu hình) mà không nhân đôi bộ đếm giờ. */
  var HERO = { timer: null, defaultHTML: null, bound: false, go: null, restart: null };

  function heroImageSlide(s) {
    var img = '<img class="hero__img" src="' + esc(s.image) + '" alt="' + esc(s.alt || "") + '">';
    return '<div class="hero__slide">' +
      (s.link ? '<a class="hero__imglink" href="' + esc(s.link) + '">' + img + "</a>" : img) +
      "</div>";
  }

  function slidesSignature(slides) {
    return slides.map(function (s) { return (s.image || "").slice(0, 40) + "|" + (s.link || "") + "|" + (s.alt || ""); }).join("~");
  }

  function setupHero() {
    var hero = $("[data-carousel]");
    if (!hero) return;
    var track = $(".hero__track", hero);
    if (!track) return;

    // Lưu lại DOM chữ mặc định một lần để có thể khôi phục nếu xoá hết ảnh
    if (HERO.defaultHTML === null) HERO.defaultHTML = track.innerHTML;

    var cfg = (window.SITE && window.SITE.hero) || {};
    var slides = Array.isArray(cfg.slides)
      ? cfg.slides.filter(function (s) { return s && s.image; })
      : [];

    if (slides.length) {
      var sig = slidesSignature(slides);
      if (hero.dataset.heroSig !== sig) {
        track.innerHTML = slides.map(heroImageSlide).join("");
        hero.dataset.heroSig = sig;
      }
      hero.classList.add("hero--image");
      hero.classList.toggle("hero--contain", cfg.fit === "contain");
    } else {
      // Không có ảnh -> trả về giao diện chữ mặc định
      if (hero.classList.contains("hero--image")) {
        track.innerHTML = HERO.defaultHTML;
        hero.removeAttribute("data-hero-sig");
      }
      hero.classList.remove("hero--image", "hero--contain");
    }

    if (cfg.autoplay) hero.setAttribute("data-carousel", cfg.autoplay);
    initCarousel(hero);
  }

  function initCarousel(hero) {
    var slides = $$(".hero__slide", hero);
    var dotsWrap = $(".hero__dots", hero);
    var delay = parseInt(hero.dataset.carousel, 10) || 6000;

    clearInterval(HERO.timer);
    if (dotsWrap) dotsWrap.innerHTML = "";
    var index = 0;

    hero.classList.toggle("hero--single", slides.length < 2);
    if (!slides.length) return;

    slides.forEach(function (s, i) {
      s.classList.toggle("is-active", i === 0);
      s.setAttribute("aria-hidden", String(i !== 0));
    });

    var dots = [];
    if (dotsWrap && slides.length > 1) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.className = "hero__dot" + (i === 0 ? " is-active" : "");
        b.type = "button";
        b.setAttribute("aria-label", "Ảnh " + (i + 1));
        b.addEventListener("click", function () { go(i); restart(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }

    function go(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        s.classList.toggle("is-active", i === index);
        s.setAttribute("aria-hidden", String(i !== index));
      });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === index); });
    }

    function restart() {
      clearInterval(HERO.timer);
      if (slides.length > 1) HERO.timer = setInterval(function () { go(index + 1); }, delay);
    }

    // Cập nhật con trỏ để các listener gắn-một-lần dùng đúng phiên bản mới nhất
    HERO.next = function () { go(index + 1); restart(); };
    HERO.prev = function () { go(index - 1); restart(); };
    HERO.restart = restart;

    var prev = $(".hero__nav--prev", hero);
    var next = $(".hero__nav--next", hero);
    if (prev) prev.onclick = function () { HERO.prev(); };
    if (next) next.onclick = function () { HERO.next(); };

    if (!HERO.bound) {
      hero.addEventListener("mouseenter", function () { clearInterval(HERO.timer); });
      hero.addEventListener("mouseleave", function () { if (HERO.restart) HERO.restart(); });
      var startX = null;
      hero.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
      hero.addEventListener("touchend", function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 45) { (dx < 0 ? HERO.next : HERO.prev)(); }
        startX = null;
      });
      HERO.bound = true;
    }

    restart();
  }

  /* ---------- 5. Hiệu ứng xuất hiện khi cuộn ---------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
  }

  /* ---------- 6. Số liệu đếm ---------- */
  function initCounters() {
    var nums = $$("[data-count]");
    if (!nums.length || !("IntersectionObserver" in window)) {
      nums.forEach(function (el) {
        el.textContent = new Intl.NumberFormat("vi-VN").format(+el.dataset.count);
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = +el.dataset.count;
        var dur = 1400;
        var t0 = performance.now();
        (function tick(now) {
          var p = Math.min((now - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = new Intl.NumberFormat("vi-VN").format(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
        io.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 7. Nút lên đầu trang ---------- */
  function initBackToTop() {
    var btn = $("[data-to-top]");
    if (!btn) return;
    var onScroll = function () { btn.classList.toggle("is-visible", window.scrollY > 480); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- 8. Tabs ---------- */
  function initTabs() {
    $$("[data-tabs]").forEach(function (wrap) {
      var btns = $$(".tabs__btn", wrap);
      var panels = $$(".tabs__panel", wrap);
      btns.forEach(function (btn, i) {
        btn.addEventListener("click", function () {
          btns.forEach(function (b) { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
          panels.forEach(function (p) { p.classList.remove("is-active"); });
          btn.classList.add("is-active");
          btn.setAttribute("aria-selected", "true");
          if (panels[i]) panels[i].classList.add("is-active");
        });
      });
    });
  }

  /* ---------- 9. Accordion ---------- */
  function initAccordion() {
    $$(".acc__btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var acc = btn.closest(".acc");
        var open = acc.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /* ---------- 10. Giỏ hàng (đếm số lượng, lưu localStorage) ---------- */
  var CART_KEY = "novastem:cart";

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }

  function writeCart(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {}
    renderCartCount();
  }

  function renderCartCount() {
    var total = readCart().reduce(function (s, i) { return s + i.qty; }, 0);
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = total;
      el.style.display = total ? "" : "none";
    });
  }

  function initCart() {
    renderCartCount();
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add-to-cart]");
      if (!btn) return;
      e.preventDefault();
      var id = btn.getAttribute("data-add-to-cart");
      var qtyInput = $("[data-qty-input]");
      var qty = qtyInput ? Math.max(1, +qtyInput.value || 1) : 1;
      var cart = readCart();
      var found = cart.find(function (i) { return i.id === id; });
      if (found) found.qty += qty; else cart.push({ id: id, qty: qty });
      writeCart(cart);
      toast("Đã thêm vào giỏ hàng");
    });

    // bộ tăng/giảm số lượng
    $$("[data-qty]").forEach(function (wrap) {
      var input = $("[data-qty-input]", wrap);
      $$("[data-qty-step]", wrap).forEach(function (b) {
        b.addEventListener("click", function () {
          var step = +b.getAttribute("data-qty-step");
          input.value = Math.max(1, (+input.value || 1) + step);
        });
      });
    });
  }

  /* ---------- 11. Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.cssText =
        "position:fixed;left:50%;bottom:28px;transform:translate(-50%,20px);z-index:200;" +
        "background:#12232e;color:#fff;padding:12px 22px;border-radius:999px;font-size:.92rem;" +
        "box-shadow:0 12px 30px rgba(0,0,0,.24);opacity:0;transition:opacity .25s,transform .25s;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () {
      el.style.opacity = "1";
      el.style.transform = "translate(-50%,0)";
    });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.style.opacity = "0";
      el.style.transform = "translate(-50%,20px)";
    }, 2400);
  }

  /* ---------- 12. Render danh sách sản phẩm (trang Sản phẩm) ---------- */
  function productCard(p) {
    var u = itemUrl(p);
    return (
      '<article class="card product-card reveal">' +
        '<div class="card__media">' +
          (p.badge ? '<span class="badge badge--float">' + esc(p.badge) + "</span>" : "") +
          '<a href="' + esc(u) + '"><img src="' + esc(p.image) + '" alt="' + esc(p.name) +
            '" width="420" height="420" loading="lazy"></a>' +
        "</div>" +
        '<div class="card__body">' +
          '<p class="product-card__meta">' + esc(p.categoryLabel) + "</p>" +
          '<h3 class="card__title"><a href="' + esc(u) + '">' + esc(p.name) + "</a></h3>" +
          '<p class="card__text">' + escText(p.excerpt) + "</p>" +
          '<div class="card__foot">' +
            '<div class="price">' + formatVND(p.price) +
              (p.oldPrice ? "<small>" + formatVND(p.oldPrice) + "</small>" : "") +
            "</div>" +
            '<button class="btn btn--primary btn--sm" type="button" data-add-to-cart="' + esc(p.id) + '">Thêm vào giỏ</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ---------- Chia sẻ mạng xã hội ---------- */
  var SHARE_ICONS = {
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-7.1 8.1L22 21h-6.4l-4.6-5.9L5.7 21H2.6l7.6-8.7L2 3h6.6l4.1 5.4zM16.4 19.1h1.6L7.7 4.8H6z"/></svg>',
    pinterest: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3-2.3 3-5 0-2-1.4-3.6-3.9-3.6-2.8 0-4.6 2.1-4.6 4.5 0 .8.2 1.4.6 1.8.2.2.2.3.1.5l-.2.9c-.1.3-.3.4-.5.2-1-.4-1.6-1.9-1.6-3 0-2.5 1.8-5.7 6.4-5.7 3.7 0 6.1 2.7 6.1 5.6 0 3.8-2.1 6.6-5.2 6.6-1 0-2-.6-2.4-1.2l-.6 2.5c-.2.9-.8 1.9-1.2 2.6A10 10 0 1 0 12 2z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  };
  var SHARE_LABEL = { facebook: "Facebook", x: "X (Twitter)", pinterest: "Pinterest", email: "Email" };
  function shareBtn(net, href) {
    return '<a class="pd-share__btn" href="' + esc(href) + '" target="_blank" rel="noopener" aria-label="Chia sẻ ' +
      esc(SHARE_LABEL[net] || net) + '">' + SHARE_ICONS[net] + "</a>";
  }
  function productShareHtml(prod) {
    var u = location.origin + itemUrl(prod);
    var eu = encodeURIComponent(u), et = encodeURIComponent(prod.name);
    return '<div class="pd-share"><span class="pd-share__label">Chia sẻ:</span>' +
      shareBtn("facebook", "https://www.facebook.com/sharer/sharer.php?u=" + eu) +
      shareBtn("x", "https://twitter.com/intent/tweet?url=" + eu + "&text=" + et) +
      shareBtn("pinterest", "https://pinterest.com/pin/create/button/?url=" + eu + "&media=" +
        encodeURIComponent(location.origin + "/" + prod.image) + "&description=" + et) +
      '<button type="button" class="pd-share__btn" data-copy-link="' + esc(u) + '" aria-label="Sao chép liên kết">' + SHARE_ICONS.copy + "</button>" +
      shareBtn("email", "mailto:?subject=" + et + "&body=" + eu) +
      "</div>";
  }
  function productMetaHtml(prod) {
    var ids = Array.isArray(prod.categories) && prod.categories.length ? prod.categories : (prod.category ? [prod.category] : []);
    var links = ids.map(function (id) { return (window.CATEGORIES || []).filter(function (c) { return c.id === id; })[0]; })
      .filter(Boolean).map(function (c) { return '<a href="' + esc(categoryHref(c)) + '">' + esc(c.name) + "</a>"; });
    var catInner = links.length ? links.join(", ") : (prod.categoryLabel ? esc(prod.categoryLabel) : "");
    var sku = prod.code ? '<div class="pd-meta__row"><span>SKU:</span> ' + esc(prod.code) + "</div>" : "";
    var cat = catInner ? '<div class="pd-meta__row"><span>Danh mục:</span> ' + catInner + "</div>" : "";
    return '<div class="pd-meta">' + sku + cat + "</div>" + productShareHtml(prod);
  }

  /* ---------- Đánh giá sản phẩm ---------- */
  function starsFilled(n) {
    n = Math.round(n || 0);
    var s = "";
    for (var i = 1; i <= 5; i++) s += '<span class="star' + (i <= n ? " is-on" : "") + '">★</span>';
    return '<span class="stars" aria-label="' + n + '/5">' + s + "</span>";
  }
  function reviewItemHtml(r) {
    var when = r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("vi-VN") : "";
    return '<div class="review"><div class="review__head"><strong>' + esc(r.name) + "</strong>" +
      starsFilled(r.rating) + '<span class="review__date">' + esc(when) + "</span></div>" +
      '<p class="review__body">' + escText(r.comment) + "</p></div>";
  }
  function reviewsSkeleton() {
    var stars = [1, 2, 3, 4, 5].map(function (i) {
      return '<button type="button" class="rv-star" data-val="' + i + '" aria-label="' + i + ' sao">★</button>';
    }).join("");
    return '<div class="pd-reviews">' +
      '<div class="pd-reviews__summary" data-rv-summary></div>' +
      '<div class="pd-reviews__list" data-rv-list><p class="pd-empty">Đang tải đánh giá…</p></div>' +
      '<form class="review-form" data-rv-form novalidate>' +
        "<h3>Viết đánh giá của bạn</h3>" +
        '<div class="review-form__stars" data-rv-stars>' + stars + "</div>" +
        '<input type="text" name="name" placeholder="Họ và tên *" autocomplete="name">' +
        '<textarea name="comment" rows="4" placeholder="Chia sẻ cảm nhận của bạn về sản phẩm *"></textarea>' +
        '<input type="text" name="website" class="rv-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<div class="review-form__foot"><button class="btn btn--primary" type="submit">Gửi đánh giá</button>' +
        '<span class="form-note" data-rv-note role="status"></span></div>' +
      "</form></div>";
  }
  function updateReviewSummary(root, scope, items) {
    var n = items.length;
    var avg = n ? items.reduce(function (a, r) { return a + (+r.rating || 0); }, 0) / n : 0;
    var sum = $("[data-rv-summary]", root);
    if (sum) sum.innerHTML = n
      ? '<span class="pd-reviews__avg">' + avg.toFixed(1) + "</span>" + starsFilled(avg) +
        '<span class="pd-reviews__count">' + n + " đánh giá</span>"
      : '<p class="pd-empty">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>';
    var tab = scope && $('[data-pdtab="reviews"]', scope);
    if (tab) tab.textContent = "Đánh giá (" + n + ")";
  }
  function loadReviews(prod, root, scope) {
    fetch("/api/reviews?product=" + encodeURIComponent(prod.id), { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var items = (d && d.items) || [];
        root.__items = items;
        var list = $("[data-rv-list]", root);
        if (list) list.innerHTML = items.length ? items.map(reviewItemHtml).join("") : '<p class="pd-empty">Chưa có đánh giá nào.</p>';
        updateReviewSummary(root, scope, items);
      })
      .catch(function () {
        var list = $("[data-rv-list]", root);
        if (list) list.innerHTML = '<p class="pd-empty">Không tải được đánh giá.</p>';
      });
  }
  function setupReviews(prod, scope) {
    var root = $("[data-reviews-root]", scope);
    if (!root) return;
    root.innerHTML = reviewsSkeleton();
    var rating = 0;
    var starWrap = $("[data-rv-stars]", root);
    starWrap.addEventListener("click", function (e) {
      var b = e.target.closest(".rv-star"); if (!b) return;
      rating = +b.dataset.val;
      $$(".rv-star", starWrap).forEach(function (s) { s.classList.toggle("is-on", +s.dataset.val <= rating); });
    });
    var form = $("[data-rv-form]", root);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = $("[data-rv-note]", root);
      var name = form.name.value.trim(), comment = form.comment.value.trim();
      if (!name || !comment) { note.textContent = "Vui lòng nhập họ tên và nội dung."; note.className = "form-note is-err"; return; }
      if (!rating) { note.textContent = "Vui lòng chọn số sao."; note.className = "form-note is-err"; return; }
      if (form.website.value.trim()) return; // bẫy spam
      var btn = form.querySelector('[type="submit"]'); btn.disabled = true;
      note.textContent = "Đang gửi…"; note.className = "form-note";
      fetch("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: prod.id, productName: prod.name, name: name, comment: comment, rating: rating }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok && d.review) {
            var items = root.__items || [];
            items.unshift(d.review); root.__items = items;
            var list = $("[data-rv-list]", root);
            if (list) list.innerHTML = items.map(reviewItemHtml).join("");
            updateReviewSummary(root, scope, items);
            form.reset(); rating = 0;
            $$(".rv-star", starWrap).forEach(function (s) { s.classList.remove("is-on"); });
            note.textContent = "Cảm ơn bạn đã đánh giá!"; note.className = "form-note is-ok";
          } else {
            note.textContent = "Gửi không thành công. Vui lòng thử lại."; note.className = "form-note is-err";
          }
        })
        .catch(function () { note.textContent = "Không kết nối được máy chủ."; note.className = "form-note is-err"; })
        .finally(function () { btn.disabled = false; });
    });
    loadReviews(prod, root, scope);
  }

  function newsCard(p) {
    var u = p.externalLink ? p.externalLink : itemUrl(p);
    var ext = p.externalLink ? ' target="_blank" rel="noopener"' : "";
    return (
      '<article class="card news-card reveal">' +
        '<div class="card__media">' +
          '<a href="' + esc(u) + '"' + ext + '><img src="' + esc(p.image) + '" alt="' + esc(p.title) +
            '" width="560" height="350" loading="lazy"></a>' +
        "</div>" +
        '<div class="card__body">' +
          '<p class="news-card__date"><span class="badge">' + esc(p.categoryLabel) + "</span> " + esc(p.dateLabel) + "</p>" +
          '<h3 class="card__title news-card__title"><a href="' + esc(u) + '"' + ext + ">" + esc(p.title) + "</a></h3>" +
          '<p class="card__text">' + escText(p.excerpt) + "</p>" +
          '<div class="card__foot"><a class="link-more" href="' + esc(u) + '"' + ext + ">Xem chi tiết</a></div>" +
        "</div>" +
      "</article>"
    );
  }

  function initListing(config) {
    var grid = $(config.gridSel);
    if (!grid) return;

    var chipsWrap = $(config.chipsSel);
    var searchInput = $(config.searchSel);
    var empty = $(config.emptySel);
    // Lọc sẵn theo ?cat= (do menu danh mục truyền sang)
    var preCat = new URLSearchParams(location.search).get("cat") || "all";
    var state = { cat: preCat, q: "" };

    if (chipsWrap && config.categories) {
      chipsWrap.innerHTML = config.categories
        .map(function (c) {
          return '<button class="chip' + (c.id === state.cat ? " is-active" : "") +
            '" type="button" data-cat="' + esc(c.id) + '">' + esc(c.label) + "</button>";
        })
        .join("");
      chipsWrap.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        $$(".chip", chipsWrap).forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        state.cat = chip.dataset.cat;
        render();
      });
    }

    if (searchInput) {
      var t;
      searchInput.addEventListener("input", function () {
        clearTimeout(t);
        t = setTimeout(function () { state.q = searchInput.value.trim().toLowerCase(); render(); }, 180);
      });
    }

    function render() {
      var items = typeof config.items === "function" ? config.items() : config.items;
      var list = (items || []).filter(function (item) {
        var okCat = state.cat === "all" || item.category === state.cat;
        var haystack = (item.name || item.title || "") + " " + (item.excerpt || "");
        var okQ = !state.q || haystack.toLowerCase().indexOf(state.q) > -1;
        return okCat && okQ;
      });
      grid.innerHTML = list.map(config.template).join("");
      if (empty) empty.classList.toggle("is-visible", list.length === 0);
      var counter = $(config.countSel || "[data-result-count]");
      if (counter) counter.textContent = list.length;
      initReveal();
    }

    grid.__render = render;   // để refreshCatalog() gọi lại khi cấu hình đổi
    render();
  }

  // Đổ lại lưới sản phẩm/tin tức nổi bật + trang danh sách khi dữ liệu thay đổi
  // Thẻ kit lớn ở khối "Bộ kit lí tưởng" — dựng từ dữ liệu sản phẩm
  function kitCard(p, alt) {
    return '<article class="kit-card ' + (alt ? "kit-card--alt " : "") + 'reveal">' +
      '<img class="kit-card__img" src="' + esc(p.image) + '" alt="' + esc(p.name) + '" width="480" height="480" loading="lazy">' +
      "<div>" +
        (p.badge ? '<span class="badge ' + (alt ? "badge--accent" : "") + '">' + esc(p.badge) + "</span>" : "") +
        "<h3>" + esc(p.name) + "</h3>" +
        "<p>" + escText(p.excerpt) + "</p>" +
        '<a class="btn ' + (alt ? "btn--accent" : "btn--primary") + '" href="' + esc(itemUrl(p)) + '">Xem chi tiết</a>' +
      "</div></article>";
  }

  // Lấy 2 sản phẩm gắn nhãn "Nổi bật" mới nhất cho khối "Bộ kit lí tưởng"
  function renderFeaturedKits() {
    var wrap = $("#featured-kits");
    if (!wrap) return;
    var section = wrap.closest("section");
    var rev = (window.PRODUCTS || []).slice().reverse();      // mới nhất trước
    var feat = rev.filter(function (p) { return p.badge === "Nổi bật"; });
    if (feat.length < 2) rev.forEach(function (p) { if (feat.length < 2 && feat.indexOf(p) < 0) feat.push(p); });
    var two = feat.slice(0, 2);
    if (!two.length) { if (section) section.style.display = "none"; return; }
    if (section) section.style.display = "";
    wrap.innerHTML = two.map(function (p, i) { return kitCard(p, i === 1); }).join("");
  }

  // Khối "Robot phát triển tư duy Rio" — lấy 3 sản phẩm mới nhất trong danh mục nguồn
  function renderRioBlock() {
    var wrap = $("#rio-block");
    if (!wrap) return;
    var section = wrap.closest("section");
    var catId = resolveCatId(get(window.SITE, "home.rio.category") || "robotics");
    var list = (window.PRODUCTS || []).slice().reverse().filter(function (p) { return inCategory(p, catId); });
    if (list.length < 3) (window.PRODUCTS || []).slice().reverse().forEach(function (p) { if (list.length < 3 && list.indexOf(p) < 0) list.push(p); });
    var items = list.slice(0, 3);
    if (!items.length) { if (section) section.style.display = "none"; return; }
    if (section) section.style.display = "";

    var main = items[0];
    var mapsTitle = get(window.SITE, "home.rio.mapsTitle") || "Sản phẩm liên quan";
    var btn = get(window.SITE, "home.rio.btn") || "Tìm hiểu thêm";

    var thumbs = items.map(function (p) {
      return '<a class="rio-thumb reveal" href="' + esc(itemUrl(p)) + '">' +
        '<div class="rio-thumb__img"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
        "<span>" + esc(p.name) + "</span></a>";
    }).join("");

    wrap.innerHTML =
      '<div class="split rio-hero">' +
        '<div class="split__media reveal"><div class="feature__media"><img src="' + esc(main.image) + '" alt="' + esc(main.name) + '" loading="lazy"></div></div>' +
        '<div class="split__content reveal">' +
          '<div class="prose">' + (main.content || "<p>" + escText(main.excerpt || "") + "</p>") + "</div>" +
          '<a class="btn btn--accent" style="margin-top:22px" href="' + esc(itemUrl(main)) + '">' + esc(btn) + "</a>" +
        "</div>" +
      "</div>" +
      '<h3 class="rio-maps-title">' + esc(mapsTitle) + "</h3>" +
      '<div class="grid grid--3 rio-thumbs">' + thumbs + "</div>";
    initReveal();
  }

  // Khối "Kit Robot nhập môn" — 3 sản phẩm mới nhất của danh mục nguồn
  function renderRoverBlock() {
    var media = $("#rover-media"), grid = $("#rover-grid");
    if (!media || !grid) return;
    var section = media.closest("section");
    var catId = resolveCatId(get(window.SITE, "home.rover.category") || "smart-stem-classroom");
    var list = (window.PRODUCTS || []).slice().reverse().filter(function (p) { return inCategory(p, catId); });
    if (list.length < 3) (window.PRODUCTS || []).slice().reverse().forEach(function (p) { if (list.length < 3 && list.indexOf(p) < 0) list.push(p); });
    var items = list.slice(0, 3);
    if (!items.length) { if (section) section.style.display = "none"; return; }
    if (section) section.style.display = "";
    // Sản phẩm mới nhất -> ảnh lớn bên phải
    media.innerHTML = '<a href="' + esc(itemUrl(items[0])) + '"><img src="' + esc(items[0].image) + '" alt="' + esc(items[0].name) + '" width="480" height="480" loading="lazy"></a>';
    // 2 sản phẩm tiếp theo -> 2 thẻ kit
    grid.innerHTML = items.slice(1, 3).map(function (p, i) { return kitCard(p, i === 1); }).join("");
    initReveal();
  }

  function refreshCatalog() {
    renderFeaturedKits();
    renderRioBlock();
    renderRoverBlock();
    var fp = $("#featured-products");
    if (fp && window.PRODUCTS) fp.innerHTML = window.PRODUCTS.slice(0, 4).map(productCard).join("");
    var fn = $("#featured-news");
    if (fn && window.POSTS) {
      // Khối "Triển khai STEM" là slider -> hiển thị toàn bộ bài, trượt ngang
      fn.innerHTML = window.POSTS.map(newsCard).join("");
      setupNewsCarousel();
    }
    var pg = $("#product-grid"); if (pg && pg.__render) pg.__render();
    var ng = $("#news-grid"); if (ng && ng.__render) ng.__render();
    initReveal();
  }

  /* ---------- Slider tin tức (khối Triển khai STEM) ---------- */
  function setupNewsCarousel() {
    var root = $("[data-news-carousel]");
    var track = $("#featured-news");
    if (!root || !track) return;
    var dotsWrap = $("#featured-news-dots");
    var prev = $(".news-carousel__nav--prev", root);
    var next = $(".news-carousel__nav--next", root);

    // Trong slider ngang, các thẻ ngoài khung không "reveal" được -> hiện luôn
    $$(".reveal", track).forEach(function (el) { el.classList.add("is-in"); });

    var perView = function () { return window.matchMedia("(max-width: 760px)").matches ? 1 : 2; };
    var step = function () {
      var card = track.querySelector(".card");
      if (!card) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || "24") || 24;
      return (card.offsetWidth + gap) * perView();
    };
    var pageCount = function () {
      var card = track.querySelector(".card");
      if (!card) return 1;
      return Math.max(1, Math.ceil(track.children.length / perView()));
    };
    var current = function () { return Math.round(track.scrollLeft / step()); };

    function updateArrows() {
      var maxLeft = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= maxLeft;
    }

    function buildDots() {
      if (!dotsWrap) return;
      var n = pageCount();
      dotsWrap.innerHTML = "";
      if (n < 2) return;
      for (var i = 0; i < n; i++) {
        var b = document.createElement("button");
        b.className = "news-dot" + (i === 0 ? " is-active" : "");
        b.type = "button";
        b.setAttribute("aria-label", "Trang " + (i + 1));
        (function (idx) {
          b.addEventListener("click", function () { track.scrollTo({ left: idx * step(), behavior: "smooth" }); });
        })(i);
        dotsWrap.appendChild(b);
      }
    }

    function syncDots() {
      if (!dotsWrap) return;
      var idx = current();
      $$(".news-dot", dotsWrap).forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
    }

    if (prev) prev.onclick = function () { track.scrollBy({ left: -step(), behavior: "smooth" }); };
    if (next) next.onclick = function () { track.scrollBy({ left: step(), behavior: "smooth" }); };

    var raf = null;
    track.onscroll = function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; updateArrows(); syncDots(); });
    };

    buildDots();
    updateArrows();

    if (!root.__resizeBound) {
      window.addEventListener("resize", function () { buildDots(); updateArrows(); syncDots(); });
      root.__resizeBound = true;
    }
  }

  /* ---------- 13. Thư viện ảnh trang chi tiết sản phẩm ---------- */
  function initGallery() {
    var gallery = $("[data-gallery]");
    if (!gallery) return;
    var main = $(".pd-gallery__main img", gallery);
    var thumbs = $$(".pd-gallery__thumbs button", gallery);
    thumbs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        thumbs.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var img = $("img", btn);
        main.src = img.getAttribute("data-full") || img.src;
        main.alt = img.alt;
      });
    });
  }

  /* ---------- 14. Form (liên hệ + đăng ký nhận tin) ---------- */
  function initForms() {
    $$("[data-ajax-form]").forEach(function (form) {
      var note = $(".form-note", form);

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Kiểm tra hợp lệ phía client
        var valid = true;
        $$("[required]", form).forEach(function (input) {
          var field = input.closest(".field") || input.parentElement;
          var ok = input.checkValidity() && input.value.trim() !== "";
          if (field) field.classList.toggle("has-error", !ok);
          if (!ok && valid) { input.focus(); valid = false; }
        });
        if (!valid) return;

        var btn = $('[type="submit"]', form);
        var label = btn ? btn.textContent : "";
        if (btn) { btn.disabled = true; btn.textContent = "Đang gửi..."; }

        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });

        fetch(form.getAttribute("action") || "/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
          .then(function (res) { return res.json().catch(function () { return { ok: res.ok }; }); })
          .then(function (res) {
            if (res && res.ok) {
              if (note) {
                note.className = "form-note is-ok";
                note.textContent = form.dataset.successMessage ||
                  "Cảm ơn bạn! Chúng tôi đã nhận được thông tin và sẽ phản hồi trong 24 giờ làm việc.";
              }
              form.reset();
            } else {
              throw new Error((res && res.error) || "failed");
            }
          })
          .catch(function () {
            if (note) {
              note.className = "form-note is-err";
              note.textContent = "Gửi chưa thành công. Vui lòng thử lại hoặc liên hệ trực tiếp qua hotline.";
            }
          })
          .finally(function () {
            if (btn) { btn.disabled = false; btn.textContent = label; }
          });
      });

      $$("input, textarea, select", form).forEach(function (input) {
        input.addEventListener("input", function () {
          var field = input.closest(".field");
          if (field) field.classList.remove("has-error");
        });
      });
    });
  }

  /* ---------- 15. Đánh dấu mục menu đang xem ---------- */
  function initActiveNav() {
    // Chuẩn hoá để khớp cả URL có .html lẫn URL sạch của Cloudflare Pages
    var norm = function (p) {
      return (p || "").split("/").pop().split("#")[0].split("?")[0].replace(/\.html$/, "") || "index";
    };
    var here = norm(location.pathname);
    $$(".nav__link, .footer__list a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href === "#" || href.indexOf("http") === 0) return;
      if (norm(href) === here) a.setAttribute("aria-current", "page");
    });
  }

  /* ---------- 16. Năm hiện tại trong footer ---------- */
  function initYear() {
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- 17. Nạp cấu hình do trang /admin lưu ----------
     Thứ tự ưu tiên:
       1. site.config.js  (mặc định, luôn có -> site không bao giờ trắng)
       2. localStorage    (bản nháp/xem thử khi chạy tĩnh, áp dụng tức thì)
       3. GET /api/settings (bản chính thức lưu trên Cloudflare KV)
     Nhờ vậy trang vẫn hiển thị đúng ngay cả khi API lỗi hoặc chưa deploy. */
  var SETTINGS_CACHE_KEY = "stemlab:settings";

  function deepMerge(base, patch) {
    if (!patch || typeof patch !== "object") return base;
    Object.keys(patch).forEach(function (k) {
      var v = patch[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        base[k] = deepMerge(base[k] && typeof base[k] === "object" ? base[k] : {}, v);
      } else if (v !== undefined && v !== null && v !== "") {
        base[k] = v;
      }
    });
    return base;
  }

  function applySettings(settings) {
    if (!settings) return;
    deepMerge(window.SITE, settings);
    // Danh sách sản phẩm/tin tức nằm ngoài SITE -> ghi đè trực tiếp
    if (Array.isArray(settings.products) && settings.products.length) window.PRODUCTS = settings.products;
    if (Array.isArray(settings.posts) && settings.posts.length) window.POSTS = settings.posts;
    if (Array.isArray(settings.solutions) && settings.solutions.length) window.SOLUTIONS = settings.solutions;
    if (Array.isArray(settings.articles) && settings.articles.length) window.ARTICLES = settings.articles;
    if (Array.isArray(settings.pages) && settings.pages.length) window.SITE.pages = settings.pages;
    if (Array.isArray(settings.categories) && settings.categories.length) window.CATEGORIES = settings.categories;
    applyBranding();
    buildNav();
    initActiveNav();
    refreshCatalog();
    renderRoute();
    renderAbout();
  }

  function loadSettings() {
    // (2) áp dụng bản đã cache trước để tránh nháy giao diện
    try {
      var cached = JSON.parse(localStorage.getItem(SETTINGS_CACHE_KEY) || "null");
      if (cached) applySettings(cached);
    } catch (e) { /* bỏ qua */ }

    // (3) lấy bản chính thức từ server
    fetch("/api/settings", { headers: { Accept: "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (res) {
        if (!res || !res.settings) return;
        applySettings(res.settings);
        try { localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(res.settings)); } catch (e) {}
      })
      .catch(function () {
        /* Chạy trên server tĩnh (không có Pages Function) — dùng bản localStorage. */
      });
  }

  /* ---------- Khởi động ---------- */
  function boot() {
    applyBranding();
    buildNav();
    loadSettings();
    initAnnounce();
    initHeader();
    initActiveNav();
    renderRoute();
    renderAbout();
    // Hero + số liệu + màu thẻ hỗ trợ được dựng trong applyBranding(); không gọi riêng.
    initBackToTop();
    initTabs();
    initAccordion();
    initCart();
    initGallery();
    initForms();
    initYear();

    if ($("#product-grid")) {
      initListing({
        gridSel: "#product-grid",
        chipsSel: "#product-chips",
        searchSel: "#product-search",
        emptySel: "#product-empty",
        items: function () { return window.PRODUCTS || []; },
        categories: window.PRODUCT_CATEGORIES,
        template: productCard,
      });
    }

    if ($("#news-grid")) {
      initListing({
        gridSel: "#news-grid",
        chipsSel: "#news-chips",
        searchSel: "#news-search",
        emptySel: "#news-empty",
        items: function () { return window.POSTS || []; },
        categories: window.POST_CATEGORIES,
        template: newsCard,
      });
    }

    // Lưới sản phẩm/tin tức nổi bật trên trang chủ
    refreshCatalog();

    initReveal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
