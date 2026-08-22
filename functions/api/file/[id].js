/**
 * GET /api/file/<id> — phục vụ file đã tải lên. Công khai.
 * Ưu tiên R2 (nếu gắn binding FILES), fallback KV.
 * PDF/ảnh/text mở ngay trong trình duyệt; file khác thì tải về.
 */
function disposition(type, name) {
  if (!name) return null;
  const inline = /^(application\/pdf|image\/|text\/)/i.test(type || "");
  return (inline ? "inline" : "attachment") + '; filename="' + String(name).replace(/["\r\n]/g, "") + '"';
}

export async function onRequestGet({ params, env }) {
  const id = Array.isArray(params.id) ? params.id.join("/") : params.id;

  // R2 trước
  if (env.FILES) {
    const obj = await env.FILES.get(id);
    if (obj) {
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      const type = headers.get("content-type") || "application/octet-stream";
      const name = obj.customMetadata && obj.customMetadata.name;
      const disp = disposition(type, name);
      if (disp) headers.set("Content-Disposition", disp);
      return new Response(obj.body, { headers });
    }
  }

  // KV fallback
  if (env.SETTINGS) {
    const buf = await env.SETTINGS.get("file:" + id, "arrayBuffer");
    if (buf) {
      let meta = {};
      try { meta = (await env.SETTINGS.get("filemeta:" + id, "json")) || {}; } catch (e) {}
      const type = meta.type || "application/octet-stream";
      const headers = { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" };
      const disp = disposition(type, meta.name);
      if (disp) headers["Content-Disposition"] = disp;
      return new Response(buf, { headers });
    }
  }

  return new Response("Not found", { status: 404 });
}
