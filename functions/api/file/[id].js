/**
 * GET /api/file/<id> — phục vụ file đã tải lên (đọc từ KV). Công khai.
 * PDF/ảnh/text mở ngay trong trình duyệt; file khác thì tải về.
 */
export async function onRequestGet({ params, env }) {
  if (!env.SETTINGS) return new Response("Not found", { status: 404 });
  const id = Array.isArray(params.id) ? params.id.join("/") : params.id;
  const buf = await env.SETTINGS.get("file:" + id, "arrayBuffer");
  if (!buf) return new Response("Not found", { status: 404 });

  let meta = {};
  try { meta = (await env.SETTINGS.get("filemeta:" + id, "json")) || {}; } catch (e) {}
  const type = meta.type || "application/octet-stream";
  const inline = /^(application\/pdf|image\/|text\/)/i.test(type);

  const headers = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=3600",
  };
  if (meta.name) {
    headers["Content-Disposition"] = (inline ? "inline" : "attachment") +
      '; filename="' + String(meta.name).replace(/["\r\n]/g, "") + '"';
  }
  return new Response(buf, { headers });
}
