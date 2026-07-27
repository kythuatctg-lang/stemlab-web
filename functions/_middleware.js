/**
 * Middleware URL sạch: khi một đường dẫn .html không phải file thật (ví dụ
 * /robot-orc-k3.html, /robotics.html do người dùng tạo động), trả về nội dung
 * router.html (status 200). router.html đọc slug từ URL rồi render đúng loại.
 * Tài nguyên (.css/.js/.png…) và các trang thật vẫn được phục vụ bình thường.
 */
export async function onRequest(context) {
  const res = await context.next();
  if (res.status === 404) {
    const url = new URL(context.request.url);
    if (/\.html?$/i.test(url.pathname)) {
      const router = await context.env.ASSETS.fetch(new URL("/router.html", url));
      return new Response(router.body, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  }
  return res;
}
