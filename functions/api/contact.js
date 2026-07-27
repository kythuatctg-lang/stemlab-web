/**
 * Cloudflare Pages Function — POST /api/contact
 * ---------------------------------------------------------------------------
 * Nhận dữ liệu từ form Liên hệ và form Đăng ký nhận tin.
 *
 * Biến môi trường (tuỳ chọn, khai báo trong Cloudflare Dashboard →
 * Workers & Pages → Settings → Variables and Secrets):
 *
 *   CONTACT_WEBHOOK_URL  Gửi payload JSON tới webhook (Google Apps Script,
 *                        Zapier, Make, n8n, Slack...). Đơn giản nhất.
 *   RESEND_API_KEY       Gửi email qua Resend (https://resend.com).
 *   MAIL_FROM            Email gửi đi, ví dụ: "Website <noreply@stemlab.vn>".
 *   MAIL_TO              Email nhận, ví dụ: "contact@stemlab.vn".
 *   TURNSTILE_SECRET     Bật kiểm tra Cloudflare Turnstile (nếu dùng captcha).
 *
 * Nếu không cấu hình biến nào, Function vẫn nhận và ghi log request rồi trả
 * về { ok: true } — hữu ích khi demo hoặc chưa nối kênh nhận thông báo.
 */

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(value, max = 2000) {
  return String(value ?? "").trim().slice(0, max);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  // 1. Bẫy spam: bot thường điền mọi trường, kể cả trường ẩn.
  if (clean(payload.website)) return json({ ok: true });

  const kind = clean(payload.type, 40) || "contact";
  const email = clean(payload.email, 200);

  if (!EMAIL_RE.test(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }

  const data = {
    kind,
    email,
    name: clean(payload.name, 120),
    phone: clean(payload.phone, 40),
    organization: clean(payload.organization, 200),
    topic: clean(payload.topic, 120),
    message: clean(payload.message, 4000),
    submittedAt: new Date().toISOString(),
    ip: request.headers.get("cf-connecting-ip") || "",
    country: request.cf?.country || "",
    userAgent: clean(request.headers.get("user-agent"), 300),
    referer: clean(request.headers.get("referer"), 300),
  };

  if (kind === "contact" && (!data.name || !data.message)) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }

  // 2. Kiểm tra Turnstile nếu đã bật.
  if (env.TURNSTILE_SECRET) {
    const token = clean(payload["cf-turnstile-response"], 2048);
    const verify = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: data.ip }),
      }
    ).then((r) => r.json()).catch(() => ({ success: false }));

    if (!verify.success) return json({ ok: false, error: "captcha_failed" }, 400);
  }

  const tasks = [];

  // 3. Chuyển tiếp tới webhook.
  if (env.CONTACT_WEBHOOK_URL) {
    tasks.push(
      fetch(env.CONTACT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    );
  }

  // 4. Gửi email qua Resend.
  if (env.RESEND_API_KEY && env.MAIL_TO) {
    const subject =
      kind === "newsletter"
        ? `[Website] Đăng ký nhận tin: ${data.email}`
        : `[Website] Liên hệ mới từ ${data.name || data.email}`;

    const rows = Object.entries(data)
      .filter(([, v]) => v !== "")
      .map(([k, v]) => `<tr><td style="padding:6px 12px;background:#f6fafc"><b>${k}</b></td><td style="padding:6px 12px">${String(v).replace(/</g, "&lt;")}</td></tr>`)
      .join("");

    tasks.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.MAIL_FROM || "Website <onboarding@resend.dev>",
          to: env.MAIL_TO.split(",").map((s) => s.trim()),
          reply_to: data.email,
          subject,
          html: `<h2>${subject}</h2><table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">${rows}</table>`,
        }),
      })
    );
  }

  // Lưu vào "hộp thư" trên KV để xem lại trong trang quản trị
  if (env.SETTINGS) {
    try {
      const INBOX_KEY = "contact-inbox";
      const inbox = (await env.SETTINGS.get(INBOX_KEY, "json")) || [];
      inbox.unshift({ ...data, id: (data.submittedAt || "") + "-" + (data.email || "") });
      await env.SETTINGS.put(INBOX_KEY, JSON.stringify(inbox.slice(0, 300)));
    } catch (err) {
      console.error("contact: không lưu được vào hộp thư", err);
    }
  }

  if (tasks.length) {
    const results = await Promise.allSettled(tasks);
    const failed = results.filter(
      (r) => r.status === "rejected" || (r.value && !r.value.ok)
    );
    if (failed.length === tasks.length) {
      console.error("contact: tất cả kênh gửi đều thất bại", data.kind);
      return json({ ok: false, error: "delivery_failed" }, 502);
    }
  } else {
    // Chưa cấu hình kênh nhận — ghi log để xem trong `wrangler pages deployment tail`.
    console.log("contact (chưa cấu hình kênh gửi):", JSON.stringify(data));
  }

  return json({ ok: true });
}

// Chặn các method khác (GET/HEAD... không được phép gọi endpoint này).
export async function onRequestGet() {
  return json({ ok: false, error: "method_not_allowed" }, 405);
}
