/* ==========================================================================
   Trang quản trị STEM Lab — logic đăng nhập & chỉnh cấu hình
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var DEFAULTS = {
    logo: "../assets/img/logo.svg",
    logoFull: "../assets/img/logo-full.svg",
  };

  // Màu mặc định (đồng bộ với site.config.js)
  var THEME_FIELDS = [
    { key: "primary", label: "Xanh chủ đạo", desc: "Nút, liên kết, điểm nhấn", def: "#1273e6" },
    { key: "primaryDark", label: "Navy đậm", desc: "Viền, chữ, chân trang", def: "#10306e" },
    { key: "accent", label: "Cam nhấn", desc: "Nút kêu gọi hành động", def: "#ff9500" },
    { key: "cyan", label: "Cyan", desc: "Gạch trang trí", def: "#29c0f0" },
    { key: "green", label: "Xanh lá", desc: "Nhãn phụ", def: "#6fbe2b" },
    { key: "yellow", label: "Vàng", desc: "Chi tiết nhỏ", def: "#ffc107" },
  ];

  var PRESETS = {
    stemlab: { primary: "#1273e6", primaryDark: "#10306e", accent: "#ff9500", cyan: "#29c0f0", green: "#6fbe2b", yellow: "#ffc107" },
    ocean: { primary: "#0d97c4", primaryDark: "#083b52", accent: "#ff7a3d", cyan: "#3ccfe0", green: "#25b39a", yellow: "#ffcf3f" },
    forest: { primary: "#2f9e44", primaryDark: "#1b4332", accent: "#f08c00", cyan: "#38b6a5", green: "#82c91e", yellow: "#f2c400" },
    sunset: { primary: "#e8590c", primaryDark: "#5f2168", accent: "#f03e3e", cyan: "#ff922b", green: "#e64980", yellow: "#ffc93c" },
  };

  // Bản cấu hình đang chỉnh (chỉ chứa phần khác mặc định)
  var draft = {};
  var dirty = false;

  /* ---------- tiện ích đọc/ghi theo "đường.dẫn" ---------- */
  function getPath(obj, path) {
    return path.split(".").reduce(function (a, k) { return a == null ? undefined : a[k]; }, obj);
  }
  function setPath(obj, path, val) {
    var keys = path.split("."), o = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (typeof o[keys[i]] !== "object" || o[keys[i]] == null) o[keys[i]] = {};
      o = o[keys[i]];
    }
    var last = keys[keys.length - 1];
    if (val === "" || val == null) delete o[last]; else o[last] = val;
  }

  function markDirty() {
    dirty = true;
    $$(".panel-save__status").forEach(function (s) {
      s.textContent = "● Có thay đổi chưa lưu";
      s.className = "panel-save__status is-dirty";
    });
  }

  /* ---------- màu: preview realtime bằng cách gọi lại applyTheme của main.js ---------- */
  function currentTheme() {
    var t = {};
    THEME_FIELDS.forEach(function (f) {
      t[f.key] = getPath(draft, "theme." + f.key) || (window.SITE.theme && window.SITE.theme[f.key]) || f.def;
    });
    return t;
  }

  function previewTheme() {
    // Dùng lại hàm áp màu của website nếu đã tải; nếu không thì set biến cơ bản
    if (typeof window.applySiteTheme === "function") {
      window.applySiteTheme(currentTheme());
    } else {
      var t = currentTheme(), root = document.documentElement.style;
      root.setProperty("--c-primary", t.primary);
      root.setProperty("--c-primary-900", t.primaryDark);
      root.setProperty("--c-accent", t.accent);
      root.setProperty("--c-cyan", t.cyan);
      root.setProperty("--c-green", t.green);
      root.setProperty("--c-yellow", t.yellow);
    }
  }

  /* ---------- API ---------- */
  function api(path, opts) {
    return fetch(path, Object.assign({ headers: { "Content-Type": "application/json" }, credentials: "same-origin" }, opts))
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          return { status: res.status, body: body };
        });
      });
  }

  /* ---------- Đăng nhập ---------- */
  function showLogin(msg, isErr) {
    $("#login-view").hidden = false;
    $("#dash-view").hidden = true;
    if (msg) {
      var m = $("#login-msg");
      m.textContent = msg;
      m.className = "login__msg form-note " + (isErr ? "is-err" : "is-ok");
    }
    setTimeout(function () { $("#password").focus(); }, 50);
  }

  function showDash() {
    $("#login-view").hidden = true;
    $("#dash-view").hidden = false;
  }

  $("#login-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = $("#login-btn");
    btn.disabled = true; btn.textContent = "Đang kiểm tra...";
    api("/api/admin/login", { method: "POST", body: JSON.stringify({ password: $("#password").value }) })
      .then(function (r) {
        if (r.body.ok) { start(); }
        else if (r.body.error === "not_configured") {
          showLogin(r.body.message || "Chưa cấu hình mật khẩu quản trị.", true);
        } else {
          showLogin("Mật khẩu không đúng. Vui lòng thử lại.", true);
        }
      })
      .catch(function () { showLogin("Không kết nối được máy chủ. Bạn đã chạy bằng Wrangler chưa?", true); })
      .finally(function () { btn.disabled = false; btn.textContent = "Đăng nhập"; });
  });

  $("#logout-btn").addEventListener("click", function () {
    api("/api/admin/logout", { method: "POST" }).finally(function () {
      location.reload();
    });
  });

  /* ---------- Điều hướng tab ---------- */
  $("#dash-nav").addEventListener("click", function (e) {
    var tab = e.target.closest(".dash__tab");
    if (!tab) return;
    $$(".dash__tab").forEach(function (t) { t.classList.remove("is-active"); });
    $$(".panel").forEach(function (p) { p.classList.remove("is-active"); });
    tab.classList.add("is-active");
    var panel = $('.panel[data-panel="' + tab.dataset.tab + '"]');
    panel.classList.add("is-active");
    // Cập nhật tiêu đề + breadcrumb ở topbar
    var label = (tab.querySelector("span") || tab).textContent.trim();
    var title = $("#dash-title"), crumb = $("#dash-crumb");
    if (title) title.textContent = label;
    if (crumb) crumb.textContent = label;
    // cuộn vùng nội dung lên đầu khi đổi tab
    var main = $(".dash__main"); if (main) main.scrollTop = 0;
    // Khởi tạo CKEditor cho panel vừa mở (lazy để tránh init khi đang ẩn)
    initEditorsIn(panel);
  });

  /* ---------- Điền form từ cấu hình ---------- */
  function fillForm() {
    // Render các phần động TRƯỚC để vòng lặp data-key bên dưới điền được giá trị
    renderContent();
    renderItemList("category");
    renderItemList("product");
    renderItemList("post");
    renderItemList("page");
    renderItemList("solution");
    renderItemList("article");

    $$("[data-key]").forEach(function (el) {
      var val = getPath(draft, el.dataset.key);
      if (val === undefined) val = getPath(window.SITE, el.dataset.key);
      if (el.type === "checkbox") el.checked = val !== false;
      else el.value = val == null ? "" : val;
    });

    // logo preview
    $("#logo-preview").src = getPath(draft, "brand.logo") || DEFAULTS.logo;
    $("#logofull-preview").src = getPath(draft, "brand.logoFull") || DEFAULTS.logoFull;
    var fav = $("#favicon-preview"); if (fav) fav.src = adminSrc(getPath(draft, "brand.favicon") || getPath(window.SITE, "brand.favicon") || DEFAULTS.logo);
    var og = $("#og-preview"); if (og) og.src = adminSrc(getPath(draft, "seo.ogImage") || getPath(window.SITE, "seo.ogImage") || "assets/img/news-1.svg");

    // banner
    var fit = getPath(draft, "hero.fit") || (window.SITE.hero && window.SITE.hero.fit) || "cover";
    $("#hero-fit").value = fit;
    var ap = getPath(draft, "hero.autoplay") || (window.SITE.hero && window.SITE.hero.autoplay) || 6000;
    $("#hero-autoplay").value = Math.round(ap / 1000);
    renderSlides();

    renderFooterEditor();
    renderAboutEditor();
    renderFaqEditor();
    renderColors();
    previewTheme();
  }

  // Nghe thay đổi ở mọi input text/checkbox
  $("#settings-form").addEventListener("input", function (e) {
    var el = e.target.closest("[data-key]");
    if (!el) return;
    if (el.type === "checkbox") setPath(draft, el.dataset.key, el.checked);
    else setPath(draft, el.dataset.key, el.value.trim());
    markDirty();
  });

  /* ---------- Bảng màu ---------- */
  function renderColors() {
    var grid = $("#color-grid");
    var t = currentTheme();
    grid.innerHTML = THEME_FIELDS.map(function (f) {
      return (
        '<div class="color-item">' +
        '<div class="color-item__label">' + f.label + "</div>" +
        '<div class="color-item__desc">' + f.desc + "</div>" +
        '<div class="color-item__row">' +
        '<input class="color-item__swatch" type="color" data-color="' + f.key + '" value="' + t[f.key] + '">' +
        '<input class="color-item__hex" type="text" data-hex="' + f.key + '" value="' + t[f.key] + '" maxlength="7">' +
        "</div></div>"
      );
    }).join("");
  }

  function setColor(key, value) {
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) return false;
    setPath(draft, "theme." + key, value.toLowerCase());
    var sw = $('[data-color="' + key + '"]'), hx = $('[data-hex="' + key + '"]');
    if (sw) sw.value = value;
    if (hx) hx.value = value.toUpperCase();
    previewTheme();
    markDirty();
    return true;
  }

  $("#color-grid").addEventListener("input", function (e) {
    if (e.target.dataset.color) setColor(e.target.dataset.color, e.target.value);
    else if (e.target.dataset.hex) {
      var v = e.target.value.trim();
      if (v[0] !== "#") v = "#" + v;
      if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(e.target.dataset.hex, v);
    }
  });

  $$(".preset").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var p = PRESETS[btn.dataset.preset];
      if (!p) return;
      Object.keys(p).forEach(function (k) { setPath(draft, "theme." + k, p[k]); });
      renderColors();
      previewTheme();
      markDirty();
    });
  });

  /* ---------- Tải logo (đọc thành data URI) ---------- */
  function bindUploader(pickId, fileId, resetId, previewId, key, def) {
    $(pickId).addEventListener("click", function () { $(fileId).click(); });
    $(resetId).addEventListener("click", function () {
      setPath(draft, key, "");            // xoá -> dùng mặc định
      $(previewId).src = def;
      markDirty();
    });
    $(fileId).addEventListener("change", function () {
      var file = this.files && this.files[0];
      if (!file) return;
      if (file.size > 850 * 1024) {
        alert("Ảnh quá lớn (tối đa ~850KB). Vui lòng dùng ảnh nhẹ hơn hoặc file SVG.");
        this.value = ""; return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        setPath(draft, key, reader.result);
        $(previewId).src = reader.result;
        markDirty();
      };
      reader.readAsDataURL(file);
      this.value = "";
    });
  }

  bindUploader("#logo-pick", "#logo-file", "#logo-reset", "#logo-preview", "brand.logo", DEFAULTS.logo);
  bindUploader("#logofull-pick", "#logofull-file", "#logofull-reset", "#logofull-preview", "brand.logoFull", DEFAULTS.logoFull);
  bindUploader("#favicon-pick", "#favicon-file", "#favicon-reset", "#favicon-preview", "brand.favicon", DEFAULTS.logo);
  bindUploader("#og-pick", "#og-file", "#og-reset", "#og-preview", "seo.ogImage", "../assets/img/news-1.svg");

  /* ---------- Banner (slider ảnh) ---------- */
  var MAX_SLIDES = 8;
  var slideUploadIndex = -1;

  function heroSlides() {
    if (!draft.hero) draft.hero = {};
    if (!Array.isArray(draft.hero.slides)) draft.hero.slides = [];
    return draft.hero.slides;
  }

  function renderSlides() {
    var slides = heroSlides();
    var list = $("#slides-list");
    $("#banner-empty").hidden = slides.length > 0;

    list.innerHTML = slides.map(function (s, i) {
      var preview = s.image
        ? '<div class="slide-item__preview"><img src="' + s.image + '" alt=""></div>'
        : '<div class="slide-item__preview is-empty">Chưa có ảnh</div>';
      return (
        '<div class="slide-item" data-i="' + i + '">' +
        preview +
        '<div class="slide-item__fields">' +
          '<span class="slide-item__num">Banner ' + (i + 1) + "</span>" +
          '<input type="text" data-sfield="link" placeholder="Link khi bấm vào ảnh (tuỳ chọn)" value="' + (s.link ? s.link.replace(/"/g, "&quot;") : "") + '">' +
          '<input type="text" data-sfield="alt" placeholder="Mô tả ảnh cho SEO (tuỳ chọn)" value="' + (s.alt ? s.alt.replace(/"/g, "&quot;") : "") + '">' +
          '<button class="btn btn--primary btn--sm" type="button" data-sop="upload" style="align-self:flex-start">' + (s.image ? "Đổi ảnh" : "Tải ảnh lên") + "</button>" +
        "</div>" +
        '<div class="slide-item__ops">' +
          '<button class="slide-op" type="button" data-sop="up" title="Lên"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
          '<button class="slide-op" type="button" data-sop="down" title="Xuống"' + (i === slides.length - 1 ? " disabled" : "") + ">↓</button>" +
          '<button class="slide-op slide-op--del" type="button" data-sop="del" title="Xoá">✕</button>' +
        "</div>" +
        "</div>"
      );
    }).join("");

    $("#add-slide").disabled = slides.length >= MAX_SLIDES;
  }

  $("#slides-list").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-sop]");
    if (!btn) return;
    var i = +btn.closest(".slide-item").dataset.i;
    var slides = heroSlides();
    var op = btn.dataset.sop;

    if (op === "upload") {
      slideUploadIndex = i;
      $("#slide-file").click();
    } else if (op === "del") {
      if (confirm("Xoá banner này?")) { slides.splice(i, 1); renderSlides(); markDirty(); }
    } else if (op === "up" && i > 0) {
      slides.splice(i - 1, 0, slides.splice(i, 1)[0]); renderSlides(); markDirty();
    } else if (op === "down" && i < slides.length - 1) {
      slides.splice(i + 1, 0, slides.splice(i, 1)[0]); renderSlides(); markDirty();
    }
  });

  $("#slides-list").addEventListener("input", function (e) {
    var el = e.target.closest("[data-sfield]");
    if (!el) return;
    var i = +el.closest(".slide-item").dataset.i;
    var slides = heroSlides();
    if (!slides[i]) return;
    var v = el.value.trim();
    if (v) slides[i][el.dataset.sfield] = v; else delete slides[i][el.dataset.sfield];
    markDirty();
  });

  $("#add-slide").addEventListener("click", function () {
    var slides = heroSlides();
    if (slides.length >= MAX_SLIDES) return;
    slides.push({ image: "" });
    renderSlides();
    // mở luôn hộp thoại chọn ảnh cho banner vừa thêm
    slideUploadIndex = slides.length - 1;
    $("#slide-file").click();
  });

  $("#slide-file").addEventListener("change", function () {
    var file = this.files && this.files[0];
    var idx = slideUploadIndex;
    this.value = "";
    if (!file || idx < 0) return;
    if (file.size > 2.3 * 1024 * 1024) {
      alert("Ảnh quá lớn (tối đa ~2.3MB). Vui lòng nén nhẹ ảnh banner trước khi tải lên.");
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var slides = heroSlides();
      if (!slides[idx]) slides[idx] = {};
      slides[idx].image = reader.result;
      renderSlides();
      markDirty();
    };
    reader.readAsDataURL(file);
  });

  // Ô "cách hiển thị" và "thời gian mỗi slide"
  $("#hero-fit").addEventListener("change", function () {
    if (!draft.hero) draft.hero = {};
    draft.hero.fit = this.value;
    markDirty();
  });
  $("#hero-autoplay").addEventListener("input", function () {
    if (!draft.hero) draft.hero = {};
    var sec = Math.min(15, Math.max(2, +this.value || 6));
    draft.hero.autoplay = sec * 1000;
    markDirty();
  });

  /* ---------- Nội dung trang chủ (schema-driven) ---------- */
  var clone = function (o) { return JSON.parse(JSON.stringify(o || null)); };
  // Ảnh mặc định dùng đường dẫn tương đối từ gốc site -> thêm "../" để xem trong /admin/
  function adminSrc(img) {
    if (!img) return "";
    if (/^(data:|https?:|\/)/.test(img)) return img;
    return "../" + img;
  }
  var escAttr = function (v) { return String(v == null ? "" : v).replace(/"/g, "&quot;"); };
  var escHtml = function (v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };

  /* ---------- Chân trang (Footer) ---------- */
  function ensureFooter() {
    var def = (window.SITE && window.SITE.footer) || {};
    if (!draft.footer || typeof draft.footer !== "object") draft.footer = clone(def) || {};
    var f = draft.footer;
    if (!Array.isArray(f.cols)) f.cols = clone(def.cols) || [];
    f.cols.forEach(function (c) { if (!Array.isArray(c.links)) c.links = []; });
    if (!f.newsletter || typeof f.newsletter !== "object") f.newsletter = {};
    if (!Array.isArray(f.policies)) f.policies = [];
    return f;
  }
  function footerScopeArr(scope) {
    var f = ensureFooter();
    if (scope === "pol") return f.policies;
    var m = /^col(\d+)$/.exec(scope || "");
    return (m && f.cols[+m[1]]) ? f.cols[+m[1]].links : null;
  }
  function footerLinkRows(items) {
    return items.map(function (l, i) {
      return '<div class="frow" data-fi="' + i + '">' +
        '<input type="text" data-ff="label" placeholder="Nhãn hiển thị" value="' + escAttr(l.label) + '">' +
        '<input type="text" data-ff="url" placeholder="Đường dẫn (vd /gioi-thieu.html)" value="' + escAttr(l.url) + '">' +
        '<button class="slide-op" type="button" data-fop="up" title="Lên"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
        '<button class="slide-op" type="button" data-fop="down" title="Xuống"' + (i === items.length - 1 ? " disabled" : "") + ">↓</button>" +
        '<button class="slide-op slide-op--del" type="button" data-fop="del" title="Xoá">✕</button>' +
        "</div>";
    }).join("");
  }
  function renderFooterEditor() {
    var wrap = $("#footer-editor");
    if (!wrap) return;
    var f = ensureFooter();
    var h = "";
    h += '<div class="fbox"><h4 class="fbox__h">Khối mạng xã hội</h4>' +
      '<div class="field"><label>Tiêu đề (trên các icon mạng xã hội)</label>' +
      '<input type="text" data-ff-scalar="connectTitle" value="' + escAttr(f.connectTitle) + '"></div></div>';

    f.cols.forEach(function (c, ci) {
      h += '<div class="fbox fcol" data-fscope="col' + ci + '">' +
        '<div class="field"><label>Tiêu đề cột ' + (ci + 1) + "</label>" +
        '<input type="text" data-ff-col="' + ci + '" value="' + escAttr(c.title) + '"></div>' +
        '<div class="frows">' + footerLinkRows(c.links) + "</div>" +
        '<button class="btn btn--ghost btn--sm" type="button" data-fadd="col' + ci + '">＋ Thêm liên kết</button>' +
        "</div>";
    });

    var cfg = function (path) { var v = getPath(draft, path); if (v === undefined) v = getPath(window.SITE, path); return v == null ? "" : v; };
    h += '<div class="fbox"><h4 class="fbox__h">Thông tin liên hệ</h4>' +
      '<div class="field"><label>Tiêu đề khối</label><input type="text" data-ff-scalar="contactTitle" value="' + escAttr(f.contactTitle) + '"></div>' +
      '<div class="field"><label>Địa chỉ</label><textarea data-key="company.address" rows="2">' + escHtml(cfg("company.address")) + "</textarea></div>" +
      '<div class="field"><label>Điện thoại (hiển thị)</label><input type="text" data-key="contact.phone" value="' + escAttr(cfg("contact.phone")) + '"></div>' +
      '<div class="field"><label>Email</label><input type="text" data-key="contact.email" value="' + escAttr(cfg("contact.email")) + '"></div>' +
      '<div class="field"><label>Giờ làm việc</label><input type="text" data-key="company.workingHours" value="' + escAttr(cfg("company.workingHours")) + '"></div>' +
      '<p class="hint" style="margin:2px 0 0">Các trường này dùng chung với tab <strong>Cấu hình</strong> — sửa ở đâu cũng cập nhật cùng một chỗ.</p></div>';

    h += '<div class="fbox"><h4 class="fbox__h">Khối “Đăng ký nhận thông tin”</h4>' +
      '<div class="field"><label>Tiêu đề</label><input type="text" data-ff-scalar="newsletter.title" value="' + escAttr(f.newsletter.title) + '"></div>' +
      '<div class="field"><label>Chữ gợi ý trong ô email</label><input type="text" data-ff-scalar="newsletter.placeholder" value="' + escAttr(f.newsletter.placeholder) + '"></div>' +
      '<div class="field"><label>Chữ trên nút</label><input type="text" data-ff-scalar="newsletter.button" value="' + escAttr(f.newsletter.button) + '"></div></div>';

    h += '<div class="fbox" data-fscope="pol"><h4 class="fbox__h">Liên kết chính sách (đáy trang)</h4>' +
      '<div class="frows">' + footerLinkRows(f.policies) + "</div>" +
      '<button class="btn btn--ghost btn--sm" type="button" data-fadd="pol">＋ Thêm liên kết</button></div>';

    wrap.innerHTML = h;
  }
  (function bindFooterEditor() {
    var wrap = document.getElementById("footer-editor");
    if (!wrap) return;
    wrap.addEventListener("input", function (e) {
      var el = e.target;
      if (el.dataset.ffScalar !== undefined) { setPath(draft, "footer." + el.dataset.ffScalar, el.value); markDirty(); return; }
      if (el.dataset.ffCol !== undefined) { var f = ensureFooter(); if (f.cols[+el.dataset.ffCol]) f.cols[+el.dataset.ffCol].title = el.value; markDirty(); return; }
      if (el.dataset.ff !== undefined) {
        var row = el.closest(".frow"), sc = el.closest("[data-fscope]");
        if (!row || !sc) return;
        var arr = footerScopeArr(sc.dataset.fscope); if (!arr || !arr[+row.dataset.fi]) return;
        arr[+row.dataset.fi][el.dataset.ff] = el.value; markDirty();
      }
    });
    wrap.addEventListener("click", function (e) {
      var add = e.target.closest("[data-fadd]");
      if (add) { var arr = footerScopeArr(add.dataset.fadd); if (arr) { arr.push({ label: "", url: "#" }); renderFooterEditor(); markDirty(); } return; }
      var op = e.target.closest("[data-fop]");
      if (!op) return;
      var row = op.closest(".frow"), sc = op.closest("[data-fscope]");
      var arr = footerScopeArr(sc && sc.dataset.fscope); if (!arr) return;
      var i = +row.dataset.fi, o = op.dataset.fop;
      if (o === "del") arr.splice(i, 1);
      else if (o === "up" && i > 0) arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
      else if (o === "down" && i < arr.length - 1) arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
      renderFooterEditor(); markDirty();
    });
  })();

  /* ---------- Trang Giới thiệu (about) ---------- */
  var aboutUpload = null;
  function ensureAbout() {
    var def = (window.SITE && window.SITE.about) || {};
    if (!draft.about || typeof draft.about !== "object") draft.about = clone(def) || {};
    var a = draft.about;
    ["intro", "mission", "values", "leaders"].forEach(function (k) {
      if (!a[k] || typeof a[k] !== "object") a[k] = clone(def[k]) || {};
    });
    if (!Array.isArray(a.intro.gallery)) a.intro.gallery = [];
    ["mission", "values", "leaders"].forEach(function (k) { if (!Array.isArray(a[k].items)) a[k].items = []; });
    return a;
  }
  function aboutThumb(src, list, idx, field) {
    return '<button type="button" class="about-thumb" data-about-img="' + list + '" data-ai="' + idx + '" data-af="' + field + '">' +
      (src ? '<img src="' + escAttr(adminSrc(src)) + '" alt="">' : "<span>＋ Ảnh</span>") + "</button>";
  }
  function renderAboutEditor() {
    if (!document.querySelector('[data-panel="about"]')) return;
    var a = ensureAbout();
    var g = $("#about-gallery");
    if (g) g.innerHTML = a.intro.gallery.map(function (src, i) {
      return '<div class="about-gcell"><img src="' + escAttr(adminSrc(src)) + '" alt=""><button type="button" class="gthumb__x" data-about-gdel="' + i + '">✕</button></div>';
    }).join("") + '<button type="button" class="gadd" data-about-gadd>＋ Thêm ảnh</button>';

    var m = $("#about-mission");
    if (m) m.innerHTML = a.mission.items.map(function (it, i) {
      return '<div class="about-item">' + aboutThumb(it.image, "mission", i, "image") +
        '<div class="about-item__fields"><input type="text" data-aedit="mission" data-af="title" data-ai="' + i + '" placeholder="Tiêu đề" value="' + escAttr(it.title) + '">' +
        '<textarea data-aedit="mission" data-af="desc" data-ai="' + i + '" placeholder="Mô tả">' + escHtml(it.desc) + "</textarea></div>" +
        '<button type="button" class="slide-op slide-op--del" data-about-del="mission" data-ai="' + i + '" title="Xoá">✕</button></div>';
    }).join("");

    var v = $("#about-values");
    if (v) v.innerHTML = a.values.items.map(function (it, i) {
      return '<div class="about-item">' + aboutThumb(it.image, "values", i, "image") +
        '<div class="about-item__fields"><input type="text" data-aedit="values" data-af="title" data-ai="' + i + '" placeholder="Tên giá trị" value="' + escAttr(it.title) + '"></div>' +
        '<button type="button" class="slide-op slide-op--del" data-about-del="values" data-ai="' + i + '" title="Xoá">✕</button></div>';
    }).join("");

    var l = $("#about-leaders");
    if (l) l.innerHTML = a.leaders.items.map(function (it, i) {
      return '<div class="about-item">' + aboutThumb(it.photo, "leaders", i, "photo") +
        '<div class="about-item__fields"><input type="text" data-aedit="leaders" data-af="name" data-ai="' + i + '" placeholder="Họ tên" value="' + escAttr(it.name) + '">' +
        '<input type="text" data-aedit="leaders" data-af="role" data-ai="' + i + '" placeholder="Chức danh" value="' + escAttr(it.role) + '"></div>' +
        '<button type="button" class="slide-op slide-op--del" data-about-del="leaders" data-ai="' + i + '" title="Xoá">✕</button></div>';
    }).join("");
  }
  (function bindAboutEditor() {
    var panel = document.querySelector('[data-panel="about"]');
    if (!panel) return;
    panel.addEventListener("input", function (e) {
      var el = e.target.closest("[data-aedit]");
      if (!el) return;
      var a = ensureAbout(), list = el.dataset.aedit, i = +el.dataset.ai, f = el.dataset.af;
      if (a[list] && a[list].items[i]) { a[list].items[i][f] = el.value; markDirty(); }
    });
    panel.addEventListener("click", function (e) {
      var add = e.target.closest("[data-about-add]");
      if (add) {
        var a = ensureAbout(), k = add.dataset.aboutAdd;
        var blank = k === "leaders" ? { photo: "", name: "", role: "" } : (k === "values" ? { image: "", title: "" } : { image: "", title: "", desc: "" });
        a[k].items.push(blank); renderAboutEditor(); markDirty(); return;
      }
      var del = e.target.closest("[data-about-del]");
      if (del) { ensureAbout()[del.dataset.aboutDel].items.splice(+del.dataset.ai, 1); renderAboutEditor(); markDirty(); return; }
      var gadd = e.target.closest("[data-about-gadd]");
      if (gadd) { aboutUpload = { gallery: true }; $("#about-file").click(); return; }
      var gdel = e.target.closest("[data-about-gdel]");
      if (gdel) { ensureAbout().intro.gallery.splice(+gdel.dataset.aboutGdel, 1); renderAboutEditor(); markDirty(); return; }
      var img = e.target.closest("[data-about-img]");
      if (img) { aboutUpload = { list: img.dataset.aboutImg, i: +img.dataset.ai, f: img.dataset.af }; $("#about-file").click(); return; }
    });
    var file = $("#about-file");
    if (file) file.addEventListener("change", function () {
      var f = this.files && this.files[0]; this.value = "";
      if (!f || !aboutUpload) return;
      if (f.size > 2.3 * 1024 * 1024) { alert("Ảnh quá lớn (tối đa ~2.3MB). Vui lòng nén nhẹ trước khi tải."); return; }
      var r = new FileReader();
      r.onload = function () {
        var a = ensureAbout();
        if (aboutUpload.gallery) a.intro.gallery.push(r.result);
        else if (a[aboutUpload.list] && a[aboutUpload.list].items[aboutUpload.i]) a[aboutUpload.list].items[aboutUpload.i][aboutUpload.f] = r.result;
        renderAboutEditor(); markDirty();
      };
      r.readAsDataURL(f);
    });
  })();

  /* ---------- Câu hỏi thường gặp (FAQ) ---------- */
  function ensureFaq() {
    if (!Array.isArray(draft.faq)) draft.faq = clone((window.SITE && window.SITE.faq) || []) || [];
    return draft.faq;
  }
  function renderFaqEditor() {
    var wrap = $("#faq-editor");
    if (!wrap) return;
    var list = ensureFaq();
    wrap.innerHTML = list.map(function (it, i) {
      return '<div class="about-item">' +
        '<div class="about-item__fields">' +
          '<input type="text" data-faq="q" data-fi="' + i + '" placeholder="Câu hỏi" value="' + escAttr(it.q) + '">' +
          '<textarea data-faq="a" data-fi="' + i + '" rows="3" placeholder="Câu trả lời">' + escHtml(it.a) + "</textarea>" +
        "</div>" +
        '<div class="slide-item__ops">' +
          '<button type="button" class="slide-op" data-faqop="up" title="Lên"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
          '<button type="button" class="slide-op" data-faqop="down" title="Xuống"' + (i === list.length - 1 ? " disabled" : "") + ">↓</button>" +
          '<button type="button" class="slide-op slide-op--del" data-faqop="del" title="Xoá">✕</button>' +
        "</div></div>";
    }).join("");
  }
  (function bindFaqEditor() {
    var wrap = document.getElementById("faq-editor");
    if (!wrap) return;
    wrap.addEventListener("input", function (e) {
      var el = e.target.closest("[data-faq]");
      if (!el) return;
      var list = ensureFaq(), i = +el.dataset.fi;
      if (list[i]) { list[i][el.dataset.faq] = el.value; markDirty(); }
    });
    wrap.addEventListener("click", function (e) {
      var op = e.target.closest("[data-faqop]");
      if (!op) return;
      var list = ensureFaq(), i = +op.closest(".about-item").querySelector("[data-fi]").dataset.fi, o = op.dataset.faqop;
      if (o === "del") list.splice(i, 1);
      else if (o === "up" && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]);
      else if (o === "down" && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
      renderFaqEditor(); markDirty();
    });
    var add = document.getElementById("faq-add");
    if (add) add.addEventListener("click", function () {
      ensureFaq().push({ q: "", a: "" }); renderFaqEditor(); markDirty();
    });
  })();

  // đọc giá trị home: ưu tiên draft, fallback SITE mặc định
  function homeVal(path) {
    var v = getPath(draft, "home." + path);
    if (v === undefined) v = getPath(window.SITE, "home." + path);
    return v == null ? "" : v;
  }

  var CONTENT_SCHEMA = [
    { key: "announce", label: "Thanh thông báo trên cùng", fields: [
      { k: "enabled", l: "Hiện thanh thông báo", t: "check" },
      { k: "text", l: "Nội dung", t: "text" },
      { k: "linkText", l: "Chữ liên kết", t: "text" },
      { k: "link", l: "Đường dẫn liên kết", t: "text" },
    ]},
    { key: "kits", label: "Khối “Bộ kit lí tưởng”", fields: [
      { k: "eyebrow", l: "Nhãn nhỏ", t: "text" }, { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" },
    ]},
    { key: "k2", label: "Thẻ Robot ORC K2", fields: [
      { k: "badge", l: "Nhãn", t: "text" }, { k: "title", l: "Tên", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "btn", l: "Chữ nút", t: "text" },
    ]},
    { key: "k3", label: "Thẻ Robot ORC K3", fields: [
      { k: "badge", l: "Nhãn", t: "text" }, { k: "title", l: "Tên", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "btn", l: "Chữ nút", t: "text" },
    ]},
    { key: "rio", label: "Khối Robot Rio", fields: [
      { k: "eyebrow", l: "Nhãn nhỏ", t: "text" }, { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "btn", l: "Chữ nút", t: "text" }, { k: "mapsTitle", l: "Tiêu đề dải bản đồ", t: "text" },
      { k: "category", l: "Danh mục nguồn (lấy 3 SP mới nhất)", t: "catselect" },
    ]},
    { key: "rover", label: "Khối Kit nhập môn (Rover)", fields: [
      { k: "eyebrow", l: "Nhãn nhỏ", t: "text" }, { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "btn", l: "Chữ nút", t: "text" },
      { k: "category", l: "Danh mục nguồn (lấy 3 SP mới nhất)", t: "catselect" },
    ]},
    { key: "stemkit", label: "Thẻ STEM Kit", fields: [
      { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "link", l: "Chữ liên kết", t: "text" },
    ]},
    { key: "innolab", label: "Thẻ InnoLab", fields: [
      { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "link", l: "Chữ liên kết", t: "text" },
    ]},
    { key: "products", label: "Khối “Sản phẩm nổi bật”", fields: [
      { k: "eyebrow", l: "Nhãn nhỏ", t: "text" }, { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "btn", l: "Chữ nút", t: "text" },
    ]},
    { key: "support", label: "Khối “Hỗ trợ đầy đủ” (gồm 3 thẻ màu)", support: true, fields: [
      { k: "eyebrow", l: "Nhãn nhỏ", t: "text" }, { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" },
      { k: "appEyebrow", l: "Nhãn khối phần mềm", t: "text" }, { k: "appTitle", l: "Tiêu đề phần mềm", t: "text" }, { k: "appDesc", l: "Mô tả phần mềm", t: "area" }, { k: "appBtn", l: "Chữ nút phần mềm", t: "text" },
    ]},
    { key: "clb", label: "Khối Câu lạc bộ", fields: [
      { k: "eyebrow", l: "Nhãn nhỏ", t: "text" }, { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "btn", l: "Chữ nút", t: "text" },
    ]},
    { key: "news", label: "Khối Tin tức", fields: [
      { k: "eyebrow", l: "Nhãn nhỏ", t: "text" }, { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" }, { k: "btn", l: "Chữ nút", t: "text" },
    ]},
    { key: "partners", label: "Dòng đối tác", fields: [ { k: "caption", l: "Câu giới thiệu", t: "text" } ]},
    { key: "cta", label: "Khối kêu gọi cộng đồng (CTA)", fields: [
      { k: "title", l: "Tiêu đề", t: "text" }, { k: "desc", l: "Mô tả", t: "area" },
      { k: "btn1", l: "Nút 1 – chữ", t: "text" }, { k: "btn1Link", l: "Nút 1 – link", t: "text" },
      { k: "btn2", l: "Nút 2 – chữ", t: "text" }, { k: "btn2Link", l: "Nút 2 – link", t: "text" },
    ]},
  ];

  var COLOR_OPTS = [
    ["plain", "Trắng (mặc định)"], ["yellow", "Vàng"], ["blue", "Xanh dương"], ["red", "Đỏ"], ["green", "Xanh lá"],
  ];

  // Dropdown chọn danh mục loại "Sản phẩm" cho khối trang chủ
  function productCatSelect(path, selected) {
    var opts = '<option value="">— Chọn danh mục sản phẩm —</option>';
    catList().filter(function (c) { return c.type === "product" && c.id; }).forEach(function (c) {
      opts += '<option value="' + escAttr(c.id) + '"' + (String(selected) === String(c.id) ? " selected" : "") + ">" +
        (catDepth(c) ? "— " : "") + escHtml(c.name) + "</option>";
    });
    return '<select data-key="home.' + path + '">' + opts + "</select>";
  }

  function field(path, f) {
    var id = "c_" + path.replace(/\./g, "_");
    var val = homeVal(path);
    if (f.t === "check") {
      return '<label class="switch" style="margin-top:0"><input type="checkbox" data-key="home.' + path + '"' +
        (val === false ? "" : " checked") + '><span>' + f.l + "</span></label>";
    }
    if (f.t === "catselect") {
      return '<div class="field"><label>' + f.l + "</label>" + productCatSelect(path, val) + "</div>";
    }
    var input = f.t === "area"
      ? '<textarea id="' + id + '" data-key="home.' + path + '">' + escHtml(val) + "</textarea>"
      : '<input id="' + id + '" type="text" data-key="home.' + path + '" value="' + escAttr(val) + '">';
    return '<div class="field"><label for="' + id + '">' + f.l + "</label>" + input + "</div>";
  }

  function renderContent() {
    var wrap = $("#content-groups");
    if (!wrap) return;
    ensureSupportItems();

    wrap.innerHTML = CONTENT_SCHEMA.map(function (g, gi) {
      var body = g.fields.map(function (f) { return field(g.key + "." + f.k, f); }).join("");

      // 3 thẻ hỗ trợ màu
      if (g.support) {
        var items = getPath(draft, "home.support.items") || [];
        body += '<h4 style="margin:18px 0 8px">3 thẻ hỗ trợ</h4>';
        body += items.slice(0, 3).map(function (it, i) {
          var opts = COLOR_OPTS.map(function (o) {
            return '<option value="' + o[0] + '"' + (it.color === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
          }).join("");
          return '<div class="field" style="border:1px solid var(--c-line);border-radius:10px;padding:12px">' +
            '<strong style="display:block;margin-bottom:8px">Thẻ ' + (i + 1) + "</strong>" +
            '<label>Tiêu đề</label><input type="text" data-si="' + i + '.title" value="' + escAttr(it.title) + '">' +
            '<label style="margin-top:6px">Mô tả</label><textarea data-si="' + i + '.desc">' + escHtml(it.desc) + "</textarea>" +
            '<label style="margin-top:6px">Chữ liên kết</label><input type="text" data-si="' + i + '.linkText" value="' + escAttr(it.linkText) + '">' +
            '<label style="margin-top:6px">Đường dẫn</label><input type="text" data-si="' + i + '.link" value="' + escAttr(it.link) + '">' +
            '<label style="margin-top:6px">Màu nền</label><select data-si="' + i + '.color">' + opts + "</select>" +
            "</div>";
        }).join("");
      }

      return '<div class="cgroup" data-cg="' + gi + '">' +
        '<button class="cgroup__head" type="button"><span>' + g.label + "</span>" +
        '<svg width="16" height="16" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1.5L6 6.5l5-5"/></svg></button>' +
        '<div class="cgroup__body">' + body + "</div></div>";
    }).join("");

    // + editor số liệu (stats)
    wrap.insertAdjacentHTML("beforeend", renderStatsEditor());
  }

  function ensureSupportItems() {
    if (!draft.home) draft.home = {};
    if (!draft.home.support) draft.home.support = {};
    if (!Array.isArray(draft.home.support.items)) {
      var def = getPath(window.SITE, "home.support.items") || [];
      draft.home.support.items = clone(def);
    }
  }

  function renderStatsEditor() {
    var stats = draft.stats || (draft.stats = clone(window.SITE.stats || []));
    var rows = stats.map(function (s, i) {
      return '<div style="display:grid;grid-template-columns:110px 70px 1fr;gap:8px;margin-bottom:8px">' +
        '<input type="number" data-stat="' + i + '.value" value="' + escAttr(s.value) + '" placeholder="Số">' +
        '<input type="text" data-stat="' + i + '.suffix" value="' + escAttr(s.suffix) + '" placeholder="+">' +
        '<input type="text" data-stat="' + i + '.label" value="' + escAttr(s.label) + '" placeholder="Nhãn">' +
        "</div>";
    }).join("");
    return '<div class="cgroup" data-cg="stats"><button class="cgroup__head" type="button"><span>Số liệu nổi bật</span>' +
      '<svg width="16" height="16" viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1.5L6 6.5l5-5"/></svg></button>' +
      '<div class="cgroup__body">' + rows + "</div></div>";
  }

  // đóng/mở nhóm
  document.addEventListener("click", function (e) {
    var head = e.target.closest(".cgroup__head");
    if (head) head.closest(".cgroup").classList.toggle("is-open");
  });

  // thẻ hỗ trợ + stats (không dùng data-key vì là mảng)
  $("#content-groups").addEventListener("input", function (e) {
    var si = e.target.closest("[data-si]");
    if (si) {
      ensureSupportItems();
      var parts = si.dataset.si.split("."); var i = +parts[0], f = parts[1];
      if (!draft.home.support.items[i]) draft.home.support.items[i] = {};
      draft.home.support.items[i][f] = si.value;
      markDirty();
      return;
    }
    var st = e.target.closest("[data-stat]");
    if (st) {
      if (!draft.stats) draft.stats = clone(window.SITE.stats || []);
      var p = st.dataset.stat.split("."); var idx = +p[0], key = p[1];
      if (!draft.stats[idx]) draft.stats[idx] = { value: 0, suffix: "", label: "" };
      draft.stats[idx][key] = key === "value" ? (+st.value || 0) : st.value;
      markDirty();
    }
  });

  /* ---------- CRUD Sản phẩm & Tin tức ---------- */
  var itemUpload = null; // {type, index}

  function articleGroupOptions(sel) {
    return (window.SITE.articleGroups || []).map(function (g) {
      return '<option value="' + g.id + '"' + (g.id === sel ? " selected" : "") + ">" + escHtml(g.label) + "</option>";
    }).join("");
  }

  // Cấu hình từng loại danh sách quản trị
  function fmtVND(n) { try { return new Intl.NumberFormat("vi-VN").format(n) + "₫"; } catch (e) { return n + "₫"; } }
  function stripHtml(h) { var d = document.createElement("div"); d.innerHTML = String(h || ""); return (d.textContent || "").trim(); }
  function groupName(id) { var g = (window.SITE.articleGroups || []).filter(function (x) { return x.id === id; })[0]; return g ? g.label : id; }
  var COL_IMG = { th: "Ảnh", cls: "col-img", get: function (it) { return it.image ? '<img class="tbl-thumb" src="' + escAttr(adminSrc(it.image)) + '" alt="">' : '<span class="tbl-noimg">—</span>'; } };

  function clientSlug(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  }

  /* ---------- Danh mục: tiện ích cây ---------- */
  function catList() { return listData("category"); }
  function catById(id) { return catList().filter(function (c) { return c.id === id; })[0]; }
  function catName(id) { var c = catById(id); return c ? c.name : id; }
  // Tên các danh mục mà 1 sản phẩm/tin đang thuộc (theo ô "Thuộc mục")
  function itemCatNames(it) {
    var ids = Array.isArray(it.categories) && it.categories.length
      ? it.categories : (it.category ? [it.category] : []);
    var names = ids.map(catName).filter(Boolean);
    return names.length ? names.join(", ") : (it.categoryLabel || "—");
  }
  function catTypeLabel(t) { var m = { product: "Sản phẩm", news: "Tin tức", custom: "Liên kết" }; return m[t] || t; }
  function catDepth(it) {
    var d = 0, p = it.parent, g = 0;
    while (p && g++ < 10) { var par = catById(p); if (!par) break; d++; p = par.parent; }
    return d;
  }
  // Trả về [{item, i}] theo thứ tự cây (cha rồi tới con), i = chỉ số gốc trong mảng
  // Chỉ số các "anh em" (cùng danh mục cha) theo thứ tự mảng gốc
  function siblingIndexes(list, i) {
    var pid = (list[i] && list[i].parent) || "";
    var sib = [];
    list.forEach(function (it, idx) { if (((it && it.parent) || "") === pid) sib.push(idx); });
    return sib;
  }
  // Đổi chỗ mục i với anh em liền kề theo hướng up/down (di chuyển cả nhánh con)
  function moveSibling(list, i, dir) {
    var sib = siblingIndexes(list, i);
    var pos = sib.indexOf(i);
    var target = dir === "up" ? sib[pos - 1] : sib[pos + 1];
    if (target == null) return false;
    var tmp = list[i]; list[i] = list[target]; list[target] = tmp;
    return true;
  }

  function catTreeOrder(list) {
    var byParent = {};
    list.forEach(function (it, i) { var k = it.parent || ""; (byParent[k] = byParent[k] || []).push({ it: it, i: i }); });
    var out = [], seen = {};
    (function walk(pid, depth) {
      (byParent[pid] || []).forEach(function (n) {
        if (seen[n.i] || depth > 4) return;
        seen[n.i] = 1; out.push(n); walk(n.it.id, depth + 1);
      });
    })("", 0);
    list.forEach(function (it, i) { if (!seen[i]) out.push({ it: it, i: i }); });
    return out;
  }
  // Tùy chọn "danh mục cha" (loại trừ chính nó)
  function parentOptions(item) {
    var opts = [["", "— (cấp 1)"]];
    catList().forEach(function (c) {
      if (c.id && c.id !== item.id) opts.push([c.id, (catDepth(c) ? "— " : "") + c.name]);
    });
    return opts;
  }
  // Danh sách danh mục theo loại (dùng cho checkbox "Thuộc mục")
  function catsByType(t) {
    return catList().filter(function (c) { return c.type === t && c.id; }).map(function (c) { return [c.id, c.name]; });
  }
  // Ba trường SEO chung
  var SEO_FIELDS = [
    { k: "keywords", l: "Từ khóa (cách nhau bằng dấu phẩy)", c2: true },
    { k: "metaDescription", l: "Mô tả (meta description)", type: "area", c2: true },
    { k: "seoTitle", l: "Tiêu đề SEO (để trống sẽ dùng tên)", c2: true },
  ];
  var BADGE_OPTS = [["", "(không)"], ["Mới", "Mới"], ["Bán chạy", "Bán chạy"], ["Nổi bật", "Nổi bật"]];

  var LIST_CONFIGS = {
    category: {
      wrap: "#categories-list", draftKey: "categories", defaults: function () { return window.CATEGORIES; }, max: 100,
      imgDefault: "",
      orderFn: catTreeOrder,
      fields: [
        { k: "name", l: "Tên danh mục", c2: true },
        { k: "parent", l: "Mục cha (để trống = cấp 1)", type: "select", optionsFn: parentOptions },
        { k: "type", l: "Loại danh mục", type: "select", options: [["product", "Sản phẩm"], ["news", "Tin tức"], ["custom", "Liên kết tuỳ chọn"]] },
        { k: "link", l: "Link liên kết (để trống = tự sinh)", c2: true },
      ].concat(SEO_FIELDS).concat([
        { k: "excerpt", l: "Tóm tắt", type: "area", rich: true, c2: true },
        { k: "content", l: "Nội dung", type: "area", big: true, rich: true, c2: true },
        { k: "showOnHome", l: "Hiện ở trang chủ", type: "check" },
        { k: "status", l: "Hiện trên menu", type: "select", options: [["show", "Hiện"], ["hide", "Ẩn"]] },
      ]),
      newItem: function () { return { id: "", name: "Danh mục mới", parent: "", type: "product", image: "", link: "", keywords: "", metaDescription: "", seoTitle: "", excerpt: "", content: "", showOnHome: false, status: "show" }; },
      columns: [
        { th: "Ảnh", cls: "col-img", get: function (it) { return it.image ? '<img class="tbl-thumb" src="' + escAttr(adminSrc(it.image)) + '" alt="">' : '<span class="tbl-noimg">—</span>'; } },
        { th: "Tên", get: function (it) { var d = catDepth(it); return (d ? '<span class="cat-indent" style="--d:' + d + '">└</span>' : "") + escHtml(it.name); } },
        { th: "Thuộc danh mục", get: function (it) { return it.parent ? escHtml(catName(it.parent)) : '<span class="pill">(cấp 1)</span>'; } },
        { th: "Loại", get: function (it) { return catTypeLabel(it.type); } },
        { th: "Trang chủ", get: function (it) { return it.showOnHome ? '<span class="pill pill--ok">Có</span>' : "—"; } },
        { th: "Trạng thái", get: function (it) { return it.status === "hide" ? '<span class="pill">Ẩn</span>' : '<span class="pill pill--ok">Hiện</span>'; } },
      ],
    },
    product: {
      wrap: "#products-list", draftKey: "products", defaults: function () { return window.PRODUCTS; }, max: 60,
      imgDefault: "assets/img/product-k3.svg",
      fields: [
        { k: "name", l: "Tên sản phẩm", c2: true },
        { k: "code", l: "Mã sản phẩm" }, { k: "categoryLabel", l: "Nhãn danh mục (hiển thị)" },
        { k: "categories", l: "Thuộc mục (chọn nhiều)", type: "checks", optionsFn: function () { return catsByType("product"); } },
        { k: "level", l: "Cấp học phù hợp", c2: true },
      ].concat(SEO_FIELDS).concat([
        { k: "price", l: "Giá bán (số)", type: "number" }, { k: "oldPrice", l: "Giá thị trường / gạch (số)", type: "number" },
        { k: "badge", l: "Nhãn sản phẩm", type: "select", options: BADGE_OPTS },
        { k: "url", l: "Link tùy chọn (để trống = link hệ thống)" },
        { k: "gallery", l: "Ảnh chi tiết (tải nhiều ảnh)", type: "gallery", c2: true },
        { k: "excerpt", l: "Tóm tắt", type: "area", rich: true, c2: true },
        { k: "content", l: "Nội dung", type: "area", big: true, rich: true, c2: true },
        { k: "specs", l: "Thông số kỹ thuật (mỗi dòng: Tên: Giá trị)", type: "area", big: true, c2: true },
      ]),
      newItem: function () { return { name: "Sản phẩm mới", code: "", categories: [], category: "khac", categoryLabel: "Sản phẩm", level: "", keywords: "", metaDescription: "", seoTitle: "", price: null, oldPrice: null, badge: "", image: "assets/img/product-k3.svg", gallery: [], excerpt: "", content: "", specs: "", url: "" }; },
      columns: [COL_IMG, { th: "Tên", get: function (it) { return escHtml(it.name); } }, { th: "Danh mục", get: function (it) { return escHtml(itemCatNames(it)); } }, { th: "Giá", get: function (it) { return it.price ? fmtVND(it.price) : "Liên hệ"; } }, { th: "Nổi bật", get: function (it) { return it.badge ? '<span class="pill pill--ok">' + escHtml(it.badge) + "</span>" : "—"; } }],
    },
    post: {
      wrap: "#posts-list", draftKey: "posts", defaults: function () { return window.POSTS; }, max: 120,
      imgDefault: "assets/img/news-1.svg",
      fields: [
        { k: "title", l: "Tên bài tin", c2: true },
        { k: "categoryLabel", l: "Nhãn chuyên mục (hiển thị)" }, { k: "dateLabel", l: "Ngày hiển thị" },
        { k: "categories", l: "Thuộc mục (chọn nhiều)", type: "checks", optionsFn: function () { return catsByType("news"); }, c2: true },
      ].concat(SEO_FIELDS).concat([
        { k: "badge", l: "Nhãn", type: "select", options: BADGE_OPTS },
        { k: "externalLink", l: "Link tùy chọn (để trống = link hệ thống tự sinh)", c2: true },
        { k: "featured", l: "Bài nổi bật (hiện ở khối trang chủ)", type: "check", c2: true },
        { k: "excerpt", l: "Tóm tắt", type: "area", rich: true, c2: true },
        { k: "content", l: "Nội dung", type: "area", big: true, rich: true, c2: true },
      ]),
      newItem: function () { return { title: "Bài viết mới", categories: [], category: "tin-tuc", categoryLabel: "Tin tức", date: "", dateLabel: "", keywords: "", metaDescription: "", seoTitle: "", badge: "", externalLink: "", image: "assets/img/news-1.svg", excerpt: "", content: "", featured: false }; },
      columns: [COL_IMG, { th: "Tiêu đề", get: function (it) { return escHtml(it.title); } }, { th: "Chuyên mục", get: function (it) { return escHtml(itemCatNames(it)); } }, { th: "Ngày", get: function (it) { return escHtml(it.dateLabel) || "—"; } }, { th: "Nổi bật", get: function (it) { return it.featured ? '<span class="pill pill--ok">Có</span>' : '<span class="pill">Không</span>'; } }],
    },
    page: {
      wrap: "#pages-list", draftKey: "pages", defaults: function () { return window.SITE.pages; }, max: 20,
      imgDefault: "",
      fields: [
        { k: "title", l: "Tiêu đề trang", c2: true },
        { k: "slug", l: "Đường dẫn (slug)" }, { k: "subtitle", l: "Phụ đề" },
      ].concat(SEO_FIELDS).concat([
        { k: "content", l: "Nội dung", type: "area", big: true, rich: true, c2: true },
      ]),
      newItem: function () { return { title: "Trang mới", slug: "", subtitle: "", image: "", keywords: "", metaDescription: "", seoTitle: "", content: "<p>Nội dung…</p>" }; },
      columns: [{ th: "Tiêu đề", get: function (it) { return escHtml(it.title); } }, { th: "Đường dẫn", get: function (it) { return '<code>' + escHtml(it.slug || "(tự sinh)") + "</code>"; } }, { th: "Phụ đề", get: function (it) { return escHtml(it.subtitle) || "—"; } }],
    },
    solution: {
      wrap: "#solutions-list", draftKey: "solutions", defaults: function () { return window.SOLUTIONS; }, max: 40,
      imgDefault: "assets/img/product-stemkit.svg",
      fields: [
        { k: "name", l: "Tên giải pháp", c2: true },
      ].concat(SEO_FIELDS).concat([
        { k: "excerpt", l: "Tóm tắt", type: "area", rich: true, c2: true },
        { k: "content", l: "Nội dung", type: "area", big: true, rich: true, c2: true },
      ]),
      newItem: function () { return { name: "Giải pháp mới", image: "assets/img/product-stemkit.svg", keywords: "", metaDescription: "", seoTitle: "", excerpt: "", content: "<p>Nội dung…</p>" }; },
      columns: [COL_IMG, { th: "Tên giải pháp", get: function (it) { return escHtml(it.name); } }, { th: "Tóm tắt", get: function (it) { return escHtml(stripHtml(it.excerpt)).slice(0, 80); } }],
    },
    article: {
      wrap: "#articles-list", draftKey: "articles", defaults: function () { return window.ARTICLES; }, max: 200,
      imgDefault: "assets/img/news-1.svg",
      fields: [
        { k: "title", l: "Tiêu đề", c2: true },
        { k: "group", l: "Danh mục", type: "select" }, { k: "dateLabel", l: "Ngày hiển thị" },
        { k: "externalLink", l: "Link ngoài (để trống = link hệ thống tự sinh)", c2: true },
      ].concat(SEO_FIELDS).concat([
        { k: "excerpt", l: "Tóm tắt", type: "area", rich: true, c2: true },
        { k: "content", l: "Nội dung", type: "area", big: true, rich: true, c2: true },
      ]),
      newItem: function () { return { title: "Bài viết mới", group: (window.SITE.articleGroups[0] || {}).id || "tai-nguyen", image: "assets/img/news-1.svg", keywords: "", metaDescription: "", seoTitle: "", excerpt: "", externalLink: "", dateLabel: "", content: "<p>Nội dung…</p>" }; },
      columns: [COL_IMG, { th: "Tiêu đề", get: function (it) { return escHtml(it.title); } }, { th: "Danh mục", get: function (it) { return escHtml(groupName(it.group)); } }, { th: "Link ngoài", get: function (it) { return it.externalLink ? '<span class="pill pill--warn">↗ Link</span>' : '<span class="pill">Tự sinh</span>'; } }],
    },
  };

  function listData(type) {
    var cfg = LIST_CONFIGS[type];
    if (!draft[cfg.draftKey]) draft[cfg.draftKey] = clone(cfg.defaults() || []);
    return draft[cfg.draftKey];
  }

  function fieldHtml(f, item) {
    var v = item[f.k];
    var inp;
    if (f.type === "check") {
      inp = '<label class="switch" style="margin-top:2px"><input type="checkbox" data-if="' + f.k + '"' + (v ? " checked" : "") + '><span>' + f.l + "</span></label>";
      return '<div class="col-2">' + inp + "</div>";
    }
    if (f.type === "checks") {
      var copts = f.optionsFn ? f.optionsFn(item) : (f.options || []);
      var vals = Array.isArray(item[f.k]) ? item[f.k] : (item.category ? [item.category] : []);
      var boxes = copts.length ? copts.map(function (o) {
        return '<label class="chk"><input type="checkbox" data-check="' + f.k + '" value="' + escAttr(o[0]) + '"' +
          (vals.indexOf(o[0]) > -1 ? " checked" : "") + "> " + escHtml(o[1]) + "</label>";
      }).join("") : '<span class="hint">Chưa có danh mục loại này — tạo ở tab “Danh mục”.</span>';
      return '<div' + (f.c2 ? ' class="col-2"' : "") + "><label>" + f.l + '</label><div class="check-grid" data-checks="' + f.k + '">' + boxes + "</div></div>";
    }
    if (f.type === "gallery") {
      var imgs = Array.isArray(item[f.k]) ? item[f.k] : [];
      var thumbs = imgs.map(function (src, i) {
        return '<div class="gthumb"><img src="' + escAttr(adminSrc(src)) + '" alt=""><button type="button" class="gthumb__x" data-gremove="' + i + '">✕</button></div>';
      }).join("");
      return '<div class="col-2"><label>' + f.l + '</label><div class="gallery-edit" data-gallery="' + f.k + '">' + thumbs +
        '<button type="button" class="gadd" data-gadd>＋ Thêm ảnh</button></div></div>';
    }
    if (f.type === "select") {
      var opts;
      if (f.optionsFn) opts = f.optionsFn(item);
      else if (f.options) opts = f.options;
      if (opts) {
        inp = '<select data-if="' + f.k + '">' + opts.map(function (o) {
          return '<option value="' + escAttr(o[0]) + '"' + (String(v) === String(o[0]) ? " selected" : "") + ">" + escHtml(o[1]) + "</option>";
        }).join("") + "</select>";
      } else {
        inp = '<select data-if="' + f.k + '">' + articleGroupOptions(v) + "</select>";
      }
    }
    else if (f.type === "area") {
      var cls = f.rich ? ' class="rich-editor"' : "";
      var big = f.big ? ' data-big="1"' : "";
      var st = f.big && !f.rich ? ' style="min-height:120px"' : "";
      inp = "<textarea data-if='" + f.k + "'" + cls + big + st + ">" + escHtml(v) + "</textarea>";
    }
    else inp = '<input type="' + (f.type || "text") + '" data-if="' + f.k + '" value="' + escAttr(v) + '">';
    return '<div' + (f.c2 ? ' class="col-2"' : "") + "><label>" + f.l + "</label>" + inp + "</div>";
  }

  // Bảng liệt kê (thay cho các thẻ inline) — sửa/xoá mở popup
  function renderItemList(type) {
    var cfg = LIST_CONFIGS[type];
    var wrap = $(cfg.wrap);
    if (!wrap) return;
    var list = listData(type);
    var cols = cfg.columns || [{ th: "Tên", get: function (it) { return escHtml(it.name || it.title); } }];

    if (!list.length) {
      wrap.innerHTML = '<p class="table-empty">Chưa có mục nào. Bấm “＋ Thêm mới” để tạo.</p>';
      return;
    }

    var head = "<tr>" + cols.map(function (c) { return "<th" + (c.cls ? ' class="' + c.cls + '"' : "") + ">" + c.th + "</th>"; }).join("") +
      '<th class="col-act">Thao tác</th></tr>';

    var order = cfg.orderFn ? cfg.orderFn(list) : list.map(function (it, i) { return { it: it, i: i }; });
    var rows = order.map(function (node) {
      var item = node.it, i = node.i;
      var sib = siblingIndexes(list, i);
      var isFirst = sib[0] === i, isLast = sib[sib.length - 1] === i;
      var cells = cols.map(function (c) { return "<td" + (c.cls ? ' class="' + c.cls + '"' : "") + ">" + c.get(item) + "</td>"; }).join("");
      var acts =
        '<td class="col-act"><div class="row-acts">' +
        '<button class="rbtn" type="button" data-rop="up" title="Lên"' + (isFirst ? " disabled" : "") + "><svg viewBox=\"0 0 24 24\"><path d=\"M12 19V5M5 12l7-7 7 7\"/></svg></button>" +
        '<button class="rbtn" type="button" data-rop="down" title="Xuống"' + (isLast ? " disabled" : "") + "><svg viewBox=\"0 0 24 24\"><path d=\"M12 5v14M19 12l-7 7-7-7\"/></svg></button>" +
        '<button class="rbtn rbtn--edit" type="button" data-rop="edit" title="Sửa"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>' +
        '<button class="rbtn rbtn--del" type="button" data-rop="del" title="Xoá"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button>' +
        "</div></td>";
      return '<tr data-i="' + i + '">' + cells + acts + "</tr>";
    }).join("");

    wrap.innerHTML = '<table class="tbl"><thead>' + head + "</thead><tbody>" + rows + "</tbody></table>";
  }

  /* ---------- CKEditor cho trường Tóm tắt / Nội dung ---------- */
  function ckConfig(ta) {
    return {
      versionCheck: false,
      allowedContent: true,          // giữ nguyên HTML người dùng nhập
      language: "vi",
      height: ta.getAttribute("data-big") ? 260 : 110,
      removeButtons: "",
    };
  }

  function initEditorsIn(container) {
    if (!window.CKEDITOR) return;                 // CDN chưa tải (offline) -> giữ textarea thường
    $$(".rich-editor", container).forEach(function (ta) {
      if (ta.__ck) return;
      try {
        var ed = window.CKEDITOR.replace(ta, ckConfig(ta));
        ta.__ck = ed;
        ed.on("change", function () {
          ta.value = ed.getData();
          ta.dispatchEvent(new Event("input", { bubbles: true })); // tái dùng logic cập nhật draft
        });
      } catch (e) { /* bỏ qua nếu lỗi khởi tạo */ }
    });
  }

  function destroyEditorsIn(container) {
    if (!window.CKEDITOR) return;
    $$(".rich-editor", container).forEach(function (ta) {
      if (ta.__ck) { try { ta.__ck.destroy(true); } catch (e) {} ta.__ck = null; }
    });
  }

  // Đồng bộ dữ liệu tất cả editor về draft trước khi lưu
  function syncEditors() {
    if (!window.CKEDITOR) return;
    $$(".rich-editor").forEach(function (ta) {
      if (ta.__ck) { ta.value = ta.__ck.getData(); ta.dispatchEvent(new Event("input", { bubbles: true })); }
    });
  }

  /* ---------- Popup thêm/sửa mục ---------- */
  var editing = null; // { type, index (null=thêm), item }

  function openItemModal(type, index) {
    var cfg = LIST_CONFIGS[type];
    var item = index == null ? cfg.newItem() : clone(listData(type)[index]);
    editing = { type: type, index: index, item: item };

    var typeLabel = { product: "sản phẩm", post: "tin tức", page: "trang giới thiệu", solution: "giải pháp", article: "bài viết", category: "danh mục" }[type] || "mục";
    $("#modal-title").textContent = (index == null ? "Thêm " : "Chỉnh sửa ") + typeLabel;

    var media = cfg.imgDefault !== undefined
      ? '<div class="modal-media"><div class="modal-media__preview"><img id="modal-img" src="' + escAttr(adminSrc(item.image)) + '" alt=""></div>' +
        '<button class="btn btn--ghost btn--sm" type="button" id="modal-img-btn">Chọn ảnh đại diện</button></div>'
      : "";
    var fields = '<div class="modal-fields">' + cfg.fields.map(function (f) { return fieldHtml(f, item); }).join("") + "</div>";
    $("#modal-body").innerHTML = media + fields;

    modalShow();
    initEditorsIn($("#modal-body"));
  }

  function modalShow() { $("#item-modal").hidden = false; document.body.style.overflow = "hidden"; }
  function modalClose() {
    destroyEditorsIn($("#modal-body"));
    $("#item-modal").hidden = true;
    $("#modal-body").innerHTML = "";
    document.body.style.overflow = "";
    editing = null;
  }

  // Cập nhật editing.item khi gõ trong popup
  $("#modal-body").addEventListener("input", function (e) {
    if (!editing) return;
    // checkbox "Thuộc mục" (nhiều danh mục)
    var chk = e.target.closest("[data-check]");
    if (chk) {
      var ck = chk.dataset.check, grid = chk.closest("[data-checks]");
      editing.item[ck] = $$('input[data-check]', grid).filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
      return;
    }
    var el = e.target.closest("[data-if]");
    if (!el) return;
    var key = el.dataset.if;
    if (el.type === "checkbox") editing.item[key] = el.checked;
    else if (el.type === "number") editing.item[key] = el.value === "" ? null : (+el.value || 0);
    else editing.item[key] = el.value;
  });

  // Thư viện ảnh trong popup: thêm/xoá
  var galleryTarget = null;
  function refreshGallery(key) {
    var wrap = $('[data-gallery="' + key + '"]', $("#modal-body"));
    if (!wrap || !editing) return;
    var imgs = editing.item[key] || [];
    wrap.innerHTML = imgs.map(function (src, i) {
      return '<div class="gthumb"><img src="' + escAttr(adminSrc(src)) + '" alt=""><button type="button" class="gthumb__x" data-gremove="' + i + '">✕</button></div>';
    }).join("") + '<button type="button" class="gadd" data-gadd>＋ Thêm ảnh</button>';
  }
  $("#modal-body").addEventListener("click", function (e) {
    if (e.target.closest("#modal-img-btn")) { itemUpload = { modal: true }; $("#item-file").click(); return; }
    var add = e.target.closest("[data-gadd]");
    if (add) { galleryTarget = add.closest("[data-gallery]").dataset.gallery; $("#gallery-file").click(); return; }
    var rm = e.target.closest("[data-gremove]");
    if (rm && editing) {
      var key = rm.closest("[data-gallery]").dataset.gallery;
      (editing.item[key] || []).splice(+rm.dataset.gremove, 1);
      refreshGallery(key);
    }
  });
  $("#gallery-file").addEventListener("change", function () {
    var files = this.files ? Array.prototype.slice.call(this.files) : []; this.value = "";
    if (!files.length || !editing || !galleryTarget) return;
    var key = galleryTarget;
    if (!Array.isArray(editing.item[key])) editing.item[key] = [];
    files.forEach(function (f) {
      if (f.size > 2.3 * 1024 * 1024) return;
      var r = new FileReader();
      r.onload = function () { editing.item[key].push(r.result); refreshGallery(key); };
      r.readAsDataURL(f);
    });
  });

  $("#item-file").addEventListener("change", function () {
    var file = this.files && this.files[0]; this.value = "";
    if (!file || !itemUpload || !editing) return;
    if (file.size > 2.3 * 1024 * 1024) { alert("Ảnh quá lớn (tối đa ~2.3MB)."); return; }
    var reader = new FileReader();
    reader.onload = function () {
      editing.item.image = reader.result;
      var img = $("#modal-img"); if (img) img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // Lưu mục trong popup
  $("#modal-save").addEventListener("click", function () {
    if (!editing) return;
    // đồng bộ nội dung từ CKEditor trong popup
    $$(".rich-editor", $("#modal-body")).forEach(function (ta) {
      if (ta.__ck) editing.item[ta.getAttribute("data-if")] = ta.__ck.getData();
    });
    var cfg = LIST_CONFIGS[editing.type];
    // Danh mục: tự tạo id (slug từ tên) nếu chưa có, để phân cấp & link hoạt động
    if (editing.type === "category" && !editing.item.id) {
      var base = clientSlug(editing.item.name) || "danh-muc";
      var id = base, n = 2;
      while (catList().some(function (c, idx) { return c.id === id && idx !== editing.index; })) id = base + "-" + (n++);
      editing.item.id = id;
    }
    var list = listData(editing.type);
    if (editing.index == null) {
      if (list.length >= cfg.max) return alert("Đã đạt giới hạn tối đa.");
      list.push(editing.item);
    } else {
      list[editing.index] = editing.item;
    }
    var type = editing.type;
    modalClose();
    renderItemList(type);
    markDirty();
    saveAll();   // lưu thẳng lên server ngay khi thêm/sửa xong trong popup
  });

  // Đóng popup (nút ✕, nút Huỷ, nền mờ)
  $$("[data-modal-close]").forEach(function (el) { el.addEventListener("click", modalClose); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("#item-modal").hidden) modalClose(); });

  // Hành động trên bảng (lên/xuống/sửa/xoá) + nút Thêm mới
  Object.keys(LIST_CONFIGS).forEach(function (type) {
    var wrap = $(LIST_CONFIGS[type].wrap);
    if (wrap) wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-rop]"); if (!btn) return;
      var i = +btn.closest("tr").dataset.i;
      var list = listData(type); var op = btn.dataset.rop;
      if (op === "edit") openItemModal(type, i);
      else if (op === "del") { if (confirm("Xoá mục này?")) { list.splice(i, 1); renderItemList(type); markDirty(); saveAll(); } }
      else if (op === "up" || op === "down") { if (moveSibling(list, i, op)) { renderItemList(type); markDirty(); saveAll(); } }
    });
    var addBtn = $("#add-" + type);
    if (addBtn) addBtn.addEventListener("click", function () { openItemModal(type, null); });
  });

  /* ---------- Hộp thư liên hệ ---------- */
  function renderInbox(items) {
    var wrap = $("#inbox-list");
    var count = $("#inbox-count");
    if (count) count.textContent = items.length ? items.length + " liên hệ" : "";
    if (!items.length) { wrap.innerHTML = '<p class="hint">Chưa có liên hệ nào.</p>'; return; }
    wrap.innerHTML = items.map(function (it) {
      var when = it.submittedAt ? new Date(it.submittedAt).toLocaleString("vi-VN") : "";
      var row = function (l, v) { return v ? '<div><span>' + l + ':</span> ' + escHtml(v) + "</div>" : ""; };
      return '<div class="inbox-item">' +
        '<div class="inbox-item__head"><strong>' + escHtml(it.name || it.email || "(không tên)") + "</strong>" +
        '<span class="inbox-item__time">' + escHtml(when) + "</span></div>" +
        '<div class="inbox-item__body">' +
          row("Email", it.email) + row("Điện thoại", it.phone) + row("Đơn vị", it.organization) +
          row("Chủ đề", it.topic) + row("Loại", it.kind) +
          (it.message ? '<div class="inbox-item__msg">' + escHtml(it.message) + "</div>" : "") +
        "</div></div>";
    }).join("");
  }

  function loadInbox() {
    var wrap = $("#inbox-list");
    if (wrap) wrap.innerHTML = '<p class="hint">Đang tải…</p>';
    api("/api/admin/inbox", { method: "GET" }).then(function (r) {
      if (r.status === 401) { showLogin(); return; }
      if (r.body && r.body.ok) renderInbox(r.body.items || []);
      else if (wrap) wrap.innerHTML = '<p class="hint">Không tải được hộp thư.</p>';
    }).catch(function () { if (wrap) wrap.innerHTML = '<p class="hint">Không kết nối được máy chủ.</p>'; });
  }

  var inboxBtn = $("#inbox-refresh");
  if (inboxBtn) inboxBtn.addEventListener("click", loadInbox);
  var inboxClear = $("#inbox-clear");
  if (inboxClear) inboxClear.addEventListener("click", function () {
    if (!confirm("Xoá toàn bộ liên hệ đã lưu?")) return;
    api("/api/admin/inbox", { method: "DELETE" }).then(function () { loadInbox(); });
  });
  // Tải hộp thư khi bấm vào tab
  $("#dash-nav").addEventListener("click", function (e) {
    var t = e.target.closest('.dash__tab[data-tab="inbox"]');
    if (t) loadInbox();
  });

  /* ---------- Đánh giá sản phẩm ---------- */
  function reviewStars(n) { n = Math.round(n || 0); var s = ""; for (var i = 1; i <= 5; i++) s += (i <= n ? "★" : "☆"); return s; }
  function renderReviewsAdmin(items) {
    var wrap = $("#reviews-list"), count = $("#reviews-count");
    if (count) count.textContent = items.length ? items.length + " đánh giá" : "";
    if (!items.length) { wrap.innerHTML = '<p class="table-empty">Chưa có đánh giá nào.</p>'; return; }
    var rows = items.map(function (r) {
      var when = r.submittedAt ? new Date(r.submittedAt).toLocaleString("vi-VN") : "";
      return "<tr>" +
        "<td>" + escHtml(r.productName || r.productId || "") + "</td>" +
        "<td>" + escHtml(r.name || "") + "</td>" +
        '<td style="white-space:nowrap;color:#f5a623;font-size:1rem">' + reviewStars(r.rating) + "</td>" +
        "<td>" + escHtml(r.comment || "") + "</td>" +
        '<td style="white-space:nowrap">' + escHtml(when) + "</td>" +
        '<td class="col-act"><div class="row-acts"><button class="rbtn rbtn--del" type="button" data-review-del="' + escAttr(r.id) +
          '" title="Xoá"><svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg></button></div></td>' +
        "</tr>";
    }).join("");
    wrap.innerHTML = '<table class="tbl"><thead><tr><th>Sản phẩm</th><th>Người gửi</th><th>Sao</th><th>Nội dung</th><th>Ngày</th><th class="col-act">Xoá</th></tr></thead><tbody>' + rows + "</tbody></table>";
  }
  function loadReviewsAdmin() {
    var wrap = $("#reviews-list");
    if (wrap) wrap.innerHTML = '<p class="hint">Đang tải…</p>';
    api("/api/admin/reviews", { method: "GET" }).then(function (r) {
      if (r.status === 401) { showLogin(); return; }
      if (r.body && r.body.ok) renderReviewsAdmin(r.body.items || []);
      else if (wrap) wrap.innerHTML = '<p class="hint">Không tải được đánh giá.</p>';
    }).catch(function () { if (wrap) wrap.innerHTML = '<p class="hint">Không kết nối được máy chủ.</p>'; });
  }
  var rvRefresh = $("#reviews-refresh");
  if (rvRefresh) rvRefresh.addEventListener("click", loadReviewsAdmin);
  var rvClear = $("#reviews-clear");
  if (rvClear) rvClear.addEventListener("click", function () {
    if (!confirm("Xoá toàn bộ đánh giá đã lưu?")) return;
    api("/api/admin/reviews", { method: "DELETE", body: JSON.stringify({ all: true }) }).then(function () { loadReviewsAdmin(); });
  });
  var rvList = $("#reviews-list");
  if (rvList) rvList.addEventListener("click", function (e) {
    var b = e.target.closest("[data-review-del]");
    if (!b) return;
    if (!confirm("Xoá đánh giá này?")) return;
    api("/api/admin/reviews", { method: "DELETE", body: JSON.stringify({ id: b.getAttribute("data-review-del") }) }).then(function () { loadReviewsAdmin(); });
  });
  $("#dash-nav").addEventListener("click", function (e) {
    var t = e.target.closest('.dash__tab[data-tab="reviews"]');
    if (t) loadReviewsAdmin();
  });

  /* ---------- Đổi mật khẩu ---------- */
  var pwdForm = $("#pwd-form");
  if (pwdForm) pwdForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var cur = $("#pwd-current").value, next = $("#pwd-next").value;
    var st = $("#pwd-status");
    if (!next || next.length < 6) { st.textContent = "Mật khẩu mới cần tối thiểu 6 ký tự."; st.className = "panel-save__status is-err"; return; }
    var btn = $("#pwd-save"); btn.disabled = true; st.textContent = "Đang cập nhật…"; st.className = "panel-save__status";
    api("/api/admin/password", { method: "POST", body: JSON.stringify({ current: cur, next: next }) })
      .then(function (r) {
        if (r.body && r.body.ok) { st.textContent = "✓ Đã đổi mật khẩu."; st.className = "panel-save__status is-ok"; pwdForm.reset(); }
        else if (r.body && r.body.error === "kv_not_bound") { st.textContent = "Chưa gắn KV nên chưa lưu được mật khẩu."; st.className = "panel-save__status is-err"; }
        else if (r.status === 401 || (r.body && r.body.error === "wrong_current")) { st.textContent = "Mật khẩu hiện tại không đúng."; st.className = "panel-save__status is-err"; }
        else { st.textContent = "Không đổi được mật khẩu."; st.className = "panel-save__status is-err"; }
      })
      .catch(function () { st.textContent = "Không kết nối được máy chủ."; st.className = "panel-save__status is-err"; })
      .finally(function () { btn.disabled = false; });
  });

  /* ---------- Lưu theo từng phần (nút lưu riêng ở mỗi tab) ---------- */
  function setStatus(text, cls) {
    // Cập nhật trạng thái cho thanh lưu của panel đang mở
    $$(".panel-save__status").forEach(function (s) {
      s.textContent = text || "";
      s.className = "panel-save__status" + (cls ? " " + cls : "");
    });
  }

  var saving = false;
  // Lưu toàn bộ bản nháp lên server (dùng chung cho mọi nút lưu + popup)
  function saveAll(done) {
    if (saving) return;
    saving = true;
    syncEditors();
    setStatus("Đang lưu…", "");
    $$(".panel-save__btn").forEach(function (b) { b.disabled = true; });
    api("/api/admin/settings", { method: "PUT", body: JSON.stringify({ settings: draft }) })
      .then(function (r) {
        if (r.body && r.body.ok) {
          draft = r.body.settings || draft;
          dirty = false;
          try { localStorage.setItem("stemlab:settings", JSON.stringify(draft)); } catch (e) {}
          setStatus("✓ Đã lưu lúc " + new Date().toLocaleTimeString("vi-VN"), "is-ok");
          fillForm();
          if (done) done(true);
        } else if (r.body && r.body.error === "kv_not_bound") {
          try { localStorage.setItem("stemlab:settings", JSON.stringify(draft)); } catch (e) {}
          dirty = false;
          setStatus("Đã lưu tạm ở trình duyệt (chưa gắn KV).", "is-err");
          if (done) done(true);
        } else if (r.status === 401) {
          showLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", true);
          if (done) done(false);
        } else {
          setStatus("Lưu thất bại: " + ((r.body && (r.body.message || r.body.error)) || "lỗi không rõ"), "is-err");
          if (done) done(false);
        }
      })
      .catch(function () { setStatus("Không kết nối được máy chủ.", "is-err"); if (done) done(false); })
      .finally(function () { saving = false; $$(".panel-save__btn").forEach(function (b) { b.disabled = false; }); });
  }

  // Gắn thanh "Lưu thay đổi" riêng vào cuối mỗi tab
  function addPanelSaveBars() {
    var labels = {
      brand: "Lưu cấu hình", banner: "Lưu banner", categories: "Lưu danh mục",
      content: "Lưu nội dung", about: "Lưu trang giới thiệu", faq: "Lưu câu hỏi", footer: "Lưu chân trang", pages: "Lưu trang giới thiệu", solutions: "Lưu giải pháp",
      products: "Lưu sản phẩm", articles: "Lưu bài viết", posts: "Lưu tin tức",
      theme: "Lưu bảng màu",
    };
    $$(".panel").forEach(function (p) {
      if (p.querySelector(".panel-save") || p.dataset.panel === "inbox") return;
      var label = labels[p.dataset.panel] || "Lưu thay đổi";
      var bar = document.createElement("div");
      bar.className = "panel-save";
      bar.innerHTML = '<span class="panel-save__status"></span>' +
        '<button class="btn btn--primary panel-save__btn" type="button">' + label + "</button>";
      p.appendChild(bar);
      bar.querySelector(".panel-save__btn").addEventListener("click", function () { saveAll(); });
    });
  }

  window.addEventListener("beforeunload", function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---------- Nạp cấu hình hiện tại ---------- */
  function loadSettings() {
    return api("/api/admin/settings", { method: "GET" }).then(function (r) {
      if (r.status === 401) { showLogin(); return false; }
      if (r.body && r.body.error === "not_configured") {
        showLogin(r.body.message || "Chưa đặt biến môi trường ADMIN_PASSWORD.", true);
        return false;
      }
      if (!r.body || r.body.ok !== true) {
        // Bất kỳ lỗi nào khác (kể cả 404 khi chạy server tĩnh không có Function)
        showLogin("Không gọi được API quản trị. Hãy chạy bằng `npm run dev` (Wrangler) hoặc deploy lên Cloudflare.", true);
        return false;
      }
      draft = r.body.settings || {};
      dirty = false;
      setStatus(r.body.storage === "none"
        ? "Chưa gắn KV — thay đổi sẽ lưu tạm ở trình duyệt." : "Sẵn sàng.");
      fillForm();
      showDash();
      return true;
    });
  }

  function start() {
    addPanelSaveBars();   // gắn nút "Lưu" riêng cho từng tab
    loadSettings().catch(function () {
      showLogin("Không kết nối được máy chủ. Hãy chạy bằng `npm run dev` (Wrangler).", true);
    });
  }

  // Mở sẵn tab theo ?tab= (tiện thao tác nhanh)
  (function(){var t=new URLSearchParams(location.search).get("tab");
    if(t){var b=document.querySelector('.dash__tab[data-tab="'+t+'"]');if(b)b.click();}})();

  // Kiểm tra phiên khi mở trang
  start();
})();
