/* ==========================================================================
   CẤU HÌNH THƯƠNG HIỆU — SỬA DUY NHẤT FILE NÀY ĐỂ ĐỔI TOÀN BỘ WEBSITE
   --------------------------------------------------------------------------
   Mọi phần tử HTML có thuộc tính data-site="đường.dẫn.khoá" sẽ được
   assets/js/main.js tự động điền giá trị tương ứng bên dưới.
   Ví dụ: <span data-site="brand.name"></span>
          <a data-site-href="contact.phoneHref" data-site="contact.phone"></a>
   Nội dung mặc định vẫn được viết sẵn trong HTML nên site vẫn hiển thị
   đầy đủ kể cả khi tắt JavaScript (tốt cho SEO).
   ========================================================================== */

window.SITE = {
  brand: {
    name: "STEM Lab",
    short: "STEM Lab",
    tagline: "Học – Thí nghiệm – Sáng tạo",
    slogan: "Cung cấp giải pháp toàn diện cho giáo dục STEM",
    logo: "assets/img/logo.svg",        // biểu tượng dùng ở header/footer
    logoFull: "assets/img/logo-full.svg", // logo đầy đủ có chữ (màn đăng nhập)
    favicon: "assets/img/logo.svg",     // biểu tượng tab trình duyệt
    showBrandText: true,                // hiện chữ cạnh logo (tắt nếu logo đã có sẵn chữ)
    domain: "stemlab.vn",
  },

  /* SEO & chia sẻ mạng xã hội cho trang chủ */
  seo: {
    homeTitle: "Giải pháp giáo dục STEM toàn diện tại trường học và tại nhà | STEM Lab",
    homeDescription: "STEM Lab cung cấp giải pháp giáo dục STEM toàn diện: robot lập trình, kit thí nghiệm, giáo trình, tập huấn giáo viên và giải đấu Robotics cho học sinh từ mầm non đến đại học.",
    ogImage: "assets/img/news-1.svg",
  },

  /* Banner (hero) — slider ẢNH do người dùng thiết kế và tải lên trong trang /admin.
     Để trống -> trang chủ dùng banner chữ + robot mặc định (viết sẵn trong index.html).
     Mỗi slide: { image: "<url hoặc data URI>", link: "<tuỳ chọn>", alt: "<mô tả>" }.
     fit: "cover" (lấp đầy, có thể cắt mép) | "contain" (hiện trọn ảnh).
     Kích thước ảnh khuyến nghị: 1920×720 px, đã nén nhẹ (< 400KB/ảnh). */
  hero: {
    slides: [],
    fit: "cover",
    autoplay: 6000,
  },

  /* Bảng màu nhận diện — lấy từ logo STEM Lab.
     Các giá trị này được ghi đè trực tiếp vào biến CSS khi trang tải,
     nên đổi ở đây (hoặc trong trang /admin) là đổi màu toàn site. */
  theme: {
    primary: "#1273e6",      // xanh dương chủ đạo (dung dịch, mạch điện)
    primaryDark: "#10306e",  // navy đậm (viền, chữ STEM, footer)
    accent: "#ff9500",       // cam bóng đèn (nút CTA)
    cyan: "#29c0f0",         // cyan vòng cung
    green: "#6fbe2b",        // xanh lá hạt nguyên tử
    yellow: "#ffc107",       // vàng tia sáng
  },

  company: {
    legalName: "Công ty TNHH Giáo dục STEM Lab",
    taxCode: "0100000000",
    address: "Số 12, Đường số 3, Khu đô thị Sáng tạo, TP. Thủ Đức, TP. Hồ Chí Minh",
    workingHours: "Thứ 2 – Thứ 7, 08:00 – 17:30",
    founded: "2019",
    footerIntro: "Chúng tôi xây dựng giải pháp giáo dục STEM toàn diện cho nhà trường Việt Nam: thiết bị, giáo trình, tập huấn và sân chơi công nghệ cho học sinh.",
  },

  contact: {
    phone: "1900 0000",
    phoneHref: "tel:19000000",
    hotline: "090 000 0000",
    hotlineHref: "tel:0900000000",
    email: "contact@stemlab.vn",
    emailHref: "mailto:contact@stemlab.vn",
    zalo: "https://zalo.me/0900000000",
    messenger: "https://m.me/novastem",
    mapEmbed:
      "https://www.google.com/maps?q=Khu%20c%C3%B4ng%20ngh%E1%BB%87%20cao%20TP%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c&output=embed",
  },

  social: {
    facebook: "https://facebook.com/",
    youtube: "https://youtube.com/",
    tiktok: "https://tiktok.com/",
    github: "https://github.com/",
  },

  // Trang Giới thiệu (landing) — chỉnh trong Quản trị › Trang Giới thiệu
  // Các section có id cố định: ve-stemlab, tam-nhin-su-menh, gia-tri-cot-loi, ban-lanh-dao
  about: {
    intro: {
      eyebrow: "Về STEM Lab",
      title: "Về STEM Lab",
      quote: "Khơi nguồn sáng tạo thế hệ trẻ — Xây dựng tương lai tốt đẹp hơn trong kỷ nguyên số.",
      text: "<p>STEM Lab mong muốn góp phần khơi dậy niềm đam mê sáng tạo của thế hệ trẻ, giúp các em có sự chuẩn bị tốt nhất cho tương lai trong kỷ nguyên số.</p><p>Chúng tôi đang từng bước hiện thực hoá điều đó bằng cách phát triển sản phẩm phần cứng và phần mềm học tập thú vị, biên soạn giáo trình mở, tập huấn giáo viên và xây dựng cộng đồng giáo dục STEM.</p>",
      image: "assets/img/illus-classroom.svg",
      gallery: ["assets/img/news-1.svg", "assets/img/news-2.svg", "assets/img/news-3.svg", "assets/img/news-4.svg", "assets/img/news-5.svg", "assets/img/news-6.svg"],
    },
    mission: {
      title: "Sứ mệnh của chúng tôi",
      items: [
        { image: "assets/img/illus-app.svg", title: "Truyền cảm hứng", desc: "Thúc đẩy và truyền cảm hứng cho tất cả mọi người tham gia vào thế giới công nghệ đầy thú vị, bất kể bạn là ai." },
        { image: "assets/img/illus-classroom.svg", title: "Làm việc học trở nên đơn giản hơn", desc: "Tạo ra các công cụ giúp việc học trở nên trực quan, dễ dàng và thú vị để phát triển tư duy sáng tạo." },
        { image: "assets/img/illus-club.svg", title: "Hỗ trợ giáo viên", desc: "Hợp tác và hết sức chăm lo cho giáo viên để tạo ra các chương trình và hoạt động giảng dạy hiệu quả, sinh động." },
        { image: "assets/img/illus-app.svg", title: "Hỗ trợ cộng đồng", desc: "Xây dựng và hỗ trợ cộng đồng, khuyến khích chia sẻ và hợp tác để xoá bỏ mọi rào cản về kiến thức." },
      ],
    },
    values: {
      title: "Giá trị cốt lõi",
      subtitle: "Đây là các giá trị cốt lõi và là kim chỉ nam cho mọi hoạt động mà chúng tôi thực hiện.",
      items: [
        { image: "assets/img/avatar-1.svg", title: "Tin tưởng" },
        { image: "assets/img/avatar-2.svg", title: "Thấu hiểu" },
        { image: "assets/img/avatar-3.svg", title: "Đơn giản" },
        { image: "assets/img/avatar-4.svg", title: "Đam mê" },
      ],
    },
    leaders: {
      title: "Ban lãnh đạo",
      items: [
        { photo: "assets/img/avatar-1.svg", name: "Ông Hà Văn Minh", role: "Giám đốc điều hành" },
        { photo: "assets/img/avatar-2.svg", name: "TS. Lê Trọng Nhân", role: "Giám đốc chương trình và đào tạo" },
        { photo: "assets/img/avatar-3.svg", name: "TS. Nguyễn Tấn Ý", role: "Giám đốc Cuộc thi ORC Toàn Quốc" },
      ],
    },
  },

  // Câu hỏi thường gặp (trang Liên hệ) — chỉnh trong Quản trị › Câu hỏi thường gặp
  faq: [
    { q: "Nhà trường có được dùng thử thiết bị trước khi mua không?", a: "Có. Chúng tôi hỗ trợ demo trực tiếp tại trường và cho mượn thiết bị trong các ngày hội STEM hoặc buổi dạy thử. Vui lòng gửi yêu cầu kèm thời gian dự kiến để chúng tôi sắp xếp." },
    { q: "Có xuất hoá đơn và hồ sơ đấu thầu cho trường công lập không?", a: "Có. Chúng tôi cung cấp đầy đủ báo giá, hồ sơ năng lực, chứng nhận xuất xứ – chất lượng và hoá đơn điện tử theo quy định." },
    { q: "Giáo viên chưa biết lập trình có dạy được không?", a: "Hoàn toàn được. Mỗi bộ thiết bị đi kèm giáo trình từng bước, slide bài giảng và video hướng dẫn. Ngoài ra, chúng tôi tổ chức tập huấn miễn phí cho trường mua thiết bị và có nhóm hỗ trợ riêng cho giáo viên." },
    { q: "Chính sách bảo hành và hỗ trợ kỹ thuật như thế nào?", a: "Bảo hành 12 tháng cho lỗi kỹ thuật, đổi mới trong 7 ngày đầu nếu sản phẩm lỗi từ nhà sản xuất. Hỗ trợ kỹ thuật qua hotline và Zalo trong suốt quá trình sử dụng, kể cả sau khi hết hạn bảo hành." },
    { q: "Có chương trình hỗ trợ cho trường vùng khó khăn không?", a: "Có. Hằng năm chúng tôi dành một phần ngân sách để tặng thiết bị, tổ chức lớp học miễn phí và cho mượn robot tại các địa bàn còn thiếu điều kiện. Nhà trường có thể gửi hồ sơ đề xuất qua form liên hệ." },
  ],

  // Nội dung chân trang (footer) — chỉnh trong Quản trị › Footer
  footer: {
    connectTitle: "Kết nối với chúng tôi",
    contactTitle: "Thông tin liên hệ",
    cols: [
      {
        title: "Sản phẩm",
        links: [
          { label: "Robot ORC K3", url: "/robot-orc-k3.html" },
          { label: "Robot ORC K2", url: "/robot-orc-k2.html" },
          { label: "Robot Rover", url: "/robot-rover-v2.html" },
          { label: "Robot Rio", url: "/robot-tu-duy-rio.html" },
          { label: "InnoLab", url: "/innolab-bo-cam-bien-do-luong.html" },
          { label: "STEM Kit", url: "san-pham.html" },
        ],
      },
      {
        title: "Tài nguyên",
        links: [
          { label: "Phần mềm lập trình", url: "#" },
          { label: "Cài đặt driver", url: "#" },
          { label: "Cập nhật firmware", url: "#" },
          { label: "Tài liệu hướng dẫn", url: "#" },
          { label: "Giáo trình STEM", url: "#" },
          { label: "Khoá học online", url: "#" },
        ],
      },
      {
        title: "Thông tin",
        links: [
          { label: "Về chúng tôi", url: "ve-chung-toi.html" },
          { label: "Tin tức", url: "tin-tuc.html" },
          { label: "Giải đấu Robotics", url: "#" },
          { label: "Khuyến mãi", url: "#" },
          { label: "Thanh toán – Vận chuyển", url: "#" },
          { label: "Bảo hành – Đổi trả", url: "#" },
        ],
      },
    ],
    newsletter: {
      title: "Đăng ký nhận thông tin",
      placeholder: "Email của bạn",
      button: "Đăng ký",
    },
    policies: [
      { label: "Chính sách bảo mật", url: "#" },
      { label: "Điều khoản sử dụng", url: "#" },
      { label: "Chính sách bảo hành", url: "#" },
      { label: "Liên hệ", url: "lien-he.html" },
    ],
  },

  // Link tới các hệ thống vệ tinh (shop, tài liệu, học online...)
  links: {
    shop: "san-pham.html",
    docs: "#",
    learn: "#",
    app: "#",
    competition: "#",
    community: "#",
  },

  stats: [
    { value: 1200, suffix: "+", label: "Trường học đồng hành" },
    { value: 65, suffix: "", label: "Tỉnh thành triển khai" },
    { value: 25000, suffix: "+", label: "Học sinh trải nghiệm" },
    { value: 300, suffix: "+", label: "Giải đấu & ngày hội STEM" },
  ],

  /* ==================================================================
     NHÓM DANH MỤC BÀI VIẾT — dùng cho menu "Chương trình đào tạo",
     "Dự án / Hoạt động", "Tài nguyên". Mỗi nhóm là một danh mục.
     ================================================================== */
  articleGroups: [
    { id: "chuong-trinh-dao-tao", label: "Chương trình đào tạo" },
    { id: "du-an-hoat-dong", label: "Dự án / Hoạt động" },
    { id: "tai-nguyen", label: "Tài nguyên" },
  ],

  /* ------------------------------------------------------------------
     NỘI DUNG TRANG CHỦ — mọi tiêu đề & mô tả của từng khối.
     Gắn vào HTML qua data-site="home.<khoá>". Sửa ở đây hoặc trong /admin.
     ------------------------------------------------------------------ */
  home: {
    /* Thanh thông báo trên cùng — bật/tắt, đổi nội dung trong /admin */
    announce: {
      enabled: true,
      text: "🎉 Ưu đãi đầu năm học: giảm đến 20% cho bộ kit Robotics dành cho nhà trường & câu lạc bộ",
      linkText: "xem ngay",
      link: "san-pham.html",
    },
    kits: {
      eyebrow: "Sản phẩm chủ lực",
      title: "Bộ kit lí tưởng để học & thi đấu Robotics",
      desc: "Hai dòng robot cơ khí chuẩn hoá, lắp ráp nhanh, lập trình bằng kéo thả hoặc Python — dùng được cả trong tiết học lẫn trên sân đấu.",
    },
    k2: { badge: "Dành cho THCS trở lên", title: "Robot ORC K2", desc: "Cách lắp ráp đơn giản hơn với các thanh kim loại chuẩn hoá, giúp học sinh hoàn thiện robot đầu tiên chỉ trong một buổi học.", btn: "Xem chi tiết" },
    k3: { badge: "Dành cho THPT & đại học", title: "Robot ORC K3", desc: "Kích thước lớn và mạnh mẽ, giúp học sinh THCS, THPT hoặc cao hơn học tập, sáng tạo và thi đấu Robotics ở cấp khu vực.", btn: "Xem chi tiết" },
    rio: {
      eyebrow: "Mầm non & đầu tiểu học",
      title: "Robot phát triển tư duy Rio",
      desc: "Điều khiển bằng nút nhấn trực quan, không cần dùng đến điện thoại hay laptop. Giúp bé phát triển tư duy sáng tạo và trí thông minh từ sớm thông qua nhiều loại bản đồ với các kiến thức khoa học thú vị.",
      btn: "Tìm hiểu thêm",
      mapsTitle: "Đa dạng bản đồ cho bé khám phá",
      category: "robotics",   // ID danh mục nguồn (lấy 3 sản phẩm mới nhất) — đổi trong /admin
    },
    rover: {
      eyebrow: "Nhập môn",
      title: "Kit Robot cho người mới bắt đầu",
      desc: "Bộ kit robot có thể lập trình được, giúp làm quen thế giới Robotics và lập trình một cách thú vị, đơn giản. Học sinh chỉ mất 15 phút để robot đầu tiên chạy được trên bàn học.",
      btn: "Xem tất cả kit nhập môn",
      category: "smart-stem-classroom",
    },
    stemkit: { title: "STEM Kit cho giảng dạy Tiểu học", desc: "25+ dự án sáng tạo giúp học sinh dễ dàng khám phá và học hỏi STEM qua trải nghiệm thực tế: đèn giao thông, quạt thông minh, chuông báo mưa…", link: "Xem bộ kit" },
    innolab: { title: "InnoLab – Công cụ đo cho thí nghiệm khoa học", desc: "Bộ cảm biến đo nhiệt độ, ánh sáng, độ ẩm, pH, khoảng cách… kết nối máy tính để vẽ đồ thị dữ liệu ngay trong tiết Khoa học tự nhiên.", link: "Xem InnoLab" },
    products: {
      eyebrow: "Cửa hàng",
      title: "Sản phẩm được nhà trường chọn nhiều nhất",
      desc: "",
      btn: "Xem toàn bộ sản phẩm",
    },
    support: {
      eyebrow: "Hệ sinh thái",
      title: "Hỗ trợ đầy đủ cho giáo dục STEM",
      desc: "Không chỉ bán thiết bị — chúng tôi đồng hành từ phần mềm, cộng đồng đến giải pháp giảng dạy trọn gói cho nhà trường.",
      items: [
        { title: "Phần mềm lập trình", desc: "Bắt đầu học và thực hành lập trình STEM dễ dàng với giao diện kéo thả, chuyển đổi sang Python chỉ bằng một cú nhấp.", linkText: "Tải phần mềm", link: "#", color: "yellow" },
        { title: "Cộng đồng sáng tạo STEAM", desc: "Cùng học hỏi và chia sẻ các bài thực hành thú vị với hơn 8.000 giáo viên, phụ huynh và học sinh trên cả nước.", linkText: "Tham gia cộng đồng", link: "#", color: "blue" },
        { title: "Giải pháp cho giảng dạy", desc: "Cung cấp đầy đủ giáo cụ STEM hỗ trợ hoạt động giảng dạy tại trường và trung tâm, kèm kế hoạch bài dạy theo từng khối lớp.", linkText: "Nhận tư vấn", link: "lien-he.html", color: "red" },
      ],
      appEyebrow: "Phần mềm",
      appTitle: "Một ứng dụng cho mọi thiết bị trong lớp",
      appDesc: "Cùng một môi trường lập trình cho robot, cảm biến và mạch IoT — học sinh không phải học lại từ đầu khi chuyển sang thiết bị mới.",
      appBtn: "Tải về miễn phí",
    },
    clb: {
      eyebrow: "Câu lạc bộ",
      title: "CLB STEM & Robotics trong nhà trường",
      desc: "Sân chơi khoa học công nghệ cho học sinh, phát triển tư duy sáng tạo và xây dựng kỹ năng nền tảng cho tương lai. Chúng tôi cung cấp mô hình CLB kiểu mẫu để trường học và đối tác tham khảo.",
      btn: "Đăng ký thành lập CLB",
    },
    news: {
      eyebrow: "Hoạt động",
      title: "Triển khai STEM tại các địa phương",
      desc: "Những giải đấu, ngày hội và chương trình tập huấn chúng tôi đã đồng hành cùng nhà trường trên khắp cả nước.",
      btn: "Xem tất cả tin tức",
    },
    partners: { caption: "Được tin dùng bởi các trường học & đối tác giáo dục" },
    cta: {
      title: "Tham gia cộng đồng giáo viên STEM",
      desc: "Cùng học hỏi, chia sẻ giáo án và nhận thông tin tập huấn STEM định kỳ hoàn toàn miễn phí.",
      btn1: "Vào nhóm cộng đồng",
      btn1Link: "#",
      btn2: "Liên hệ tư vấn",
      btn2Link: "lien-he.html",
    },
  },

  /* ==================================================================
     TRANG GIỚI THIỆU — mỗi mục là một trang nội dung do admin nhập.
     Hiển thị qua gioi-thieu.html?p=<slug>.
     ================================================================== */
  pages: [
    {
      slug: "ve-stem-lab",
      title: "Về STEM Lab",
      subtitle: "Đơn vị cung cấp giải pháp giáo dục STEM toàn diện",
      image: "assets/img/illus-classroom.svg",
      content:
        "<p>STEM Lab là đơn vị chuyên cung cấp giải pháp giáo dục STEM toàn diện cho nhà trường: thiết bị, giáo trình, tập huấn giáo viên và sân chơi công nghệ cho học sinh.</p>" +
        "<p>Chúng tôi đồng hành cùng hơn 1.200 trường học trên 65 tỉnh thành, mang trải nghiệm học tập qua thực hành đến cho hàng chục nghìn học sinh.</p>",
    },
    {
      slug: "tam-nhin-su-menh",
      title: "Tầm nhìn – Sứ mệnh",
      subtitle: "Đưa giáo dục STEM đến gần hơn với mọi lớp học",
      image: "assets/img/illus-app.svg",
      content:
        "<h2>Tầm nhìn</h2><p>Trở thành đối tác giáo dục STEM tin cậy hàng đầu, giúp mọi học sinh Việt Nam được tiếp cận công nghệ từ sớm.</p>" +
        "<h2>Sứ mệnh</h2><p>Làm cho việc dạy và học STEM trở nên khả thi với bất kỳ giáo viên và ngôi trường nào, kể cả nơi còn thiếu điều kiện.</p>",
    },
    {
      slug: "gia-tri-cot-loi",
      title: "Giá trị cốt lõi",
      subtitle: "Bốn nguyên tắc chúng tôi không đánh đổi",
      image: "assets/img/illus-club.svg",
      content:
        "<ul><li><strong>Dễ bắt đầu</strong> — sản phẩm dùng được ngay trong tiết học đầu tiên.</li>" +
        "<li><strong>Bền &amp; an toàn</strong> — thiết bị chịu được hàng trăm lượt sử dụng mỗi năm.</li>" +
        "<li><strong>Đồng hành lâu dài</strong> — hỗ trợ giáo viên là phần việc chính của chúng tôi.</li>" +
        "<li><strong>Không bỏ ai lại phía sau</strong> — ưu tiên chương trình miễn phí ở địa bàn khó khăn.</li></ul>",
    },
  ],
};

/* ==================================================================
   DANH MỤC — nguồn sinh MENU CHÍNH (phân cấp tối đa 3 cấp).
   Mỗi danh mục: {
     id, name, parent (id danh mục cha, "" = cấp 1),
     type ("product" | "news" | "custom"),
     image, link (tuỳ chọn — trống thì hệ thống tự sinh theo type),
     showOnHome (hiện ở trang chủ hay không),
     status ("show" hiện trên menu | "hide" ẩn)
   }
   Menu ngoài trang: cấp 1 status=show nằm trên thanh; hover đổ cấp 2; cấp 2 đổ cấp 3.
   ================================================================== */
window.CATEGORY_TYPES = [
  { id: "product", label: "Sản phẩm" },
  { id: "news", label: "Tin tức" },
  { id: "custom", label: "Liên kết tuỳ chọn" },
];

window.CATEGORIES = [
  { id: "gioi-thieu", name: "Giới thiệu", parent: "", type: "custom", image: "", link: "/ve-stem-lab.html", showOnHome: false, status: "show" },
  { id: "san-pham", name: "Sản phẩm", parent: "", type: "product", image: "", link: "", showOnHome: false, status: "show" },
  { id: "robotics", name: "Robotics", parent: "san-pham", type: "product", image: "assets/img/product-k3.svg", link: "", showOnHome: true, status: "show" },
  { id: "orc-k3", name: "Robot ORC K3", parent: "robotics", type: "product", image: "", link: "", showOnHome: false, status: "show" },
  { id: "orc-k2", name: "Robot ORC K2", parent: "robotics", type: "product", image: "", link: "", showOnHome: false, status: "show" },
  { id: "stem-kit", name: "STEM Kit", parent: "san-pham", type: "product", image: "assets/img/product-stemkit.svg", link: "", showOnHome: true, status: "show" },
  { id: "thi-nghiem", name: "Thí nghiệm & InnoLab", parent: "san-pham", type: "product", image: "", link: "", showOnHome: false, status: "show" },
  { id: "giai-phap", name: "Giải pháp STEM", parent: "", type: "custom", image: "", link: "giai-phap.html", showOnHome: false, status: "show" },
  { id: "tin-tuc", name: "Tin tức", parent: "", type: "news", image: "", link: "tin-tuc.html", showOnHome: false, status: "show" },
  { id: "trien-khai", name: "Triển khai STEM", parent: "tin-tuc", type: "news", image: "", link: "", showOnHome: false, status: "show" },
  { id: "tuyen-dung", name: "Tuyển dụng", parent: "tin-tuc", type: "news", image: "", link: "", showOnHome: false, status: "hide" },
];

/* ==================================================================
   GIẢI PHÁP STEM LAB — quản lý dạng "sản phẩm".
   Danh sách: giai-phap.html · Chi tiết: giai-phap.html?id=<slug>
   ================================================================== */
window.SOLUTIONS = [
  { id: "phong-stem-tieu-hoc", name: "Phòng STEM Tiểu học", image: "assets/img/product-stemkit.svg", excerpt: "Trọn gói thiết bị & giáo trình STEM cho bậc Tiểu học, thiết kế theo chương trình GDPT 2018.",
    content: "<p>Giải pháp phòng STEM cho Tiểu học bao gồm bộ kit thực hành, giáo trình 35 tiết, bàn ghế module và tập huấn giáo viên.</p><h2>Bao gồm</h2><ul><li>STEM Kit cho 20–40 học sinh</li><li>Giáo trình &amp; phiếu học tập</li><li>Tập huấn 2 ngày</li></ul>" },
  { id: "phong-stem-thcs", name: "Phòng STEM THCS", image: "assets/img/product-k2.svg", excerpt: "Robotics, IoT và thí nghiệm khoa học gắn với môn Khoa học tự nhiên và Công nghệ.",
    content: "<p>Phòng STEM THCS tập trung vào Robotics ORC K2, cảm biến InnoLab và mạch IoT, phù hợp hoạt động trải nghiệm và câu lạc bộ.</p>" },
  { id: "phong-stem-thpt", name: "Phòng STEM THPT", image: "assets/img/product-k3.svg", excerpt: "Robotics nâng cao, AI và IoT phục vụ nghiên cứu khoa học kỹ thuật và khởi nghiệp.",
    content: "<p>Phòng STEM THPT trang bị Robot ORC K3, AI Camera và nền tảng dashboard IoT cho các dự án nghiên cứu.</p>" },
  { id: "smart-stem-classroom", name: "Smart STEM Classroom", image: "assets/img/illus-app.svg", excerpt: "Lớp học STEM thông minh tích hợp thiết bị, phần mềm quản lý và màn hình tương tác.",
    content: "<p>Mô hình lớp học STEM thông minh kết nối thiết bị, phần mềm lập trình và hệ thống quản lý lớp học tập trung.</p>" },
  { id: "quy-trinh-trien-khai", name: "Quy trình triển khai", image: "assets/img/illus-classroom.svg", excerpt: "Từ khảo sát, thiết kế, lắp đặt đến tập huấn và bàn giao — quy trình 5 bước rõ ràng.",
    content: "<h2>5 bước triển khai</h2><ol><li>Khảo sát nhu cầu &amp; cơ sở vật chất</li><li>Thiết kế phòng &amp; đề xuất thiết bị</li><li>Lắp đặt &amp; cấu hình</li><li>Tập huấn giáo viên</li><li>Bàn giao &amp; hỗ trợ vận hành</li></ol>" },
];

/* ==================================================================
   BÀI VIẾT ĐA DANH MỤC — dùng cho Chương trình đào tạo, Dự án/Hoạt động,
   Tài nguyên. Mỗi bài: group (danh mục), externalLink (link ngoài tuỳ chọn).
   - externalLink RỖNG  -> link hệ thống sinh: bai-viet.html?id=<slug>
   - externalLink CÓ    -> mở đúng đường link đó.
   ================================================================== */
window.ARTICLES = [
  // Chương trình đào tạo
  { id: "stem-ptcs", group: "chuong-trinh-dao-tao", title: "STEM PTCS", image: "assets/img/news-3.svg", excerpt: "Chương trình STEM cho bậc Trung học cơ sở.", externalLink: "", content: "<p>Nội dung chương trình STEM PTCS…</p>" },
  { id: "stem-ptth", group: "chuong-trinh-dao-tao", title: "STEM PTTH", image: "assets/img/news-2.svg", excerpt: "Chương trình STEM cho bậc Trung học phổ thông.", externalLink: "", content: "<p>Nội dung chương trình STEM PTTH…</p>" },
  { id: "robotics", group: "chuong-trinh-dao-tao", title: "Robotics", image: "assets/img/product-k3.svg", excerpt: "Lộ trình học Robotics từ cơ bản đến thi đấu.", externalLink: "", content: "<p>Lộ trình Robotics…</p>" },
  { id: "ai-iot", group: "chuong-trinh-dao-tao", title: "AI - IoT", image: "assets/img/product-ai.svg", excerpt: "Trí tuệ nhân tạo và Internet vạn vật cho học sinh phổ thông.", externalLink: "", content: "<p>Chương trình AI - IoT…</p>" },
  { id: "coding", group: "chuong-trinh-dao-tao", title: "Coding", image: "assets/img/illus-app.svg", excerpt: "Lập trình kéo thả và Python cho mọi lứa tuổi.", externalLink: "", content: "<p>Chương trình Coding…</p>" },
  { id: "3d-design", group: "chuong-trinh-dao-tao", title: "3D Design", image: "assets/img/product-innolab.svg", excerpt: "Thiết kế và in 3D trong giáo dục STEM.", externalLink: "", content: "<p>Chương trình 3D Design…</p>" },
  // Dự án / Hoạt động
  { id: "hoat-dong-lop-hoc", group: "du-an-hoat-dong", title: "Hoạt động lớp học", image: "assets/img/news-5.svg", excerpt: "Những tiết học STEM sinh động tại các trường.", externalLink: "", content: "<p>Hoạt động lớp học…</p>" },
  { id: "du-an-hoc-sinh", group: "du-an-hoat-dong", title: "Dự án học sinh", image: "assets/img/news-7.svg", excerpt: "Sản phẩm sáng tạo do chính học sinh thực hiện.", externalLink: "", content: "<p>Dự án học sinh…</p>" },
  { id: "hinh-anh-stem-lab", group: "du-an-hoat-dong", title: "Hình ảnh STEM Lab", image: "assets/img/news-1.svg", excerpt: "Thư viện hình ảnh hoạt động của STEM Lab.", externalLink: "", content: "<p>Hình ảnh STEM Lab…</p>" },
  // Tài nguyên
  { id: "giao-an-mau", group: "tai-nguyen", title: "Giáo án mẫu", image: "assets/img/illus-classroom.svg", excerpt: "Bộ giáo án STEM soạn sẵn theo chủ đề.", externalLink: "", content: "<p>Giáo án mẫu…</p>" },
  { id: "checklist-phong-stem", group: "tai-nguyen", title: "Checklist phòng STEM", image: "assets/img/product-innolab.svg", excerpt: "Danh mục kiểm tra khi thiết lập phòng STEM.", externalLink: "", content: "<p>Checklist phòng STEM…</p>" },
  { id: "noi-quy-phong-lab", group: "tai-nguyen", title: "Nội quy phòng Lab", image: "assets/img/news-9.svg", excerpt: "Mẫu nội quy sử dụng phòng Lab an toàn.", externalLink: "", content: "<p>Nội quy phòng Lab…</p>" },
  { id: "quy-trinh-su-dung-phong-lab", group: "tai-nguyen", title: "Quy trình sử dụng phòng Lab", image: "assets/img/illus-app.svg", excerpt: "Hướng dẫn quy trình vận hành phòng Lab.", externalLink: "", content: "<p>Quy trình sử dụng phòng Lab…</p>" },
  { id: "poster-infographic", group: "tai-nguyen", title: "Poster / Infographic", image: "assets/img/news-4.svg", excerpt: "Kho poster và infographic STEM tải miễn phí.", externalLink: "", content: "<p>Poster / Infographic…</p>" },
];

/* ==========================================================================
   DỮ LIỆU NỘI DUNG — sản phẩm & tin tức dùng cho trang danh sách có lọc.
   Khi có CMS/API thật, chỉ cần thay mảng này bằng dữ liệu fetch từ server.
   ========================================================================== */

window.PRODUCTS = [
  {
    id: "orc-k3",
    name: "Robot ORC K3",
    category: "robotics",
    categoryLabel: "Robotics thi đấu",
    level: "THCS – THPT – Đại học",
    price: 4990000,
    oldPrice: 5590000,
    badge: "Nổi bật",
    image: "assets/img/product-k3.svg",
    excerpt:
      "Kích thước lớn và mạnh mẽ, giúp học sinh THCS, THPT hoặc cao hơn học tập, sáng tạo và thi đấu Robotics.",
    url: "chi-tiet-san-pham.html",
  },
  {
    id: "orc-k2",
    name: "Robot ORC K2",
    category: "robotics",
    categoryLabel: "Robotics thi đấu",
    level: "THCS trở lên",
    price: 3290000,
    oldPrice: 3690000,
    badge: "Nổi bật",
    image: "assets/img/product-k2.svg",
    excerpt:
      "Cách lắp ráp đơn giản hơn với các thanh kim loại chuẩn hoá, phù hợp cấp THCS trở lên.",
    url: "chi-tiet-san-pham.html",
  },
  {
    id: "rover",
    name: "Robot Rover V2",
    categories: ["robotics", "smart-stem-classroom"],
    category: "robotics",
    categoryLabel: "Robotics nhập môn",
    level: "Tiểu học – THCS",
    price: 1890000,
    oldPrice: null,
    badge: null,
    image: "assets/img/product-rover.svg",
    excerpt:
      "Bộ kit robot lập trình được, giúp làm quen thế giới Robotics và lập trình một cách thú vị, đơn giản.",
    url: "chi-tiet-san-pham.html",
  },
  {
    id: "rio",
    name: "Robot tư duy Rio",
    category: "mam-non",
    categoryLabel: "Mầm non",
    level: "4 – 8 tuổi",
    price: 1490000,
    oldPrice: 1690000,
    badge: "Cho bé",
    image: "assets/img/product-rio.svg",
    excerpt:
      "Điều khiển bằng nút nhấn trực quan, không cần điện thoại hay laptop. Đa dạng bản đồ khám phá cho bé.",
    url: "chi-tiet-san-pham.html",
  },
  {
    id: "stem-kit",
    name: "STEM Starter Kit",
    categories: ["stem-kit", "smart-stem-classroom"],
    category: "stem-kit",
    categoryLabel: "Kit giảng dạy",
    level: "Tiểu học",
    price: 2390000,
    oldPrice: null,
    badge: null,
    image: "assets/img/product-stemkit.svg",
    excerpt:
      "25+ dự án sáng tạo, giúp học sinh dễ dàng khám phá và học hỏi STEM qua trải nghiệm thực tế.",
    url: "chi-tiet-san-pham.html",
  },
  {
    id: "innolab",
    name: "InnoLab – Bộ cảm biến đo lường",
    categories: ["thi-nghiem", "smart-stem-classroom"],
    category: "thi-nghiem",
    categoryLabel: "Thí nghiệm khoa học",
    level: "THCS – THPT",
    price: 3590000,
    oldPrice: 3990000,
    badge: null,
    image: "assets/img/product-innolab.svg",
    excerpt:
      "Công cụ đo cho thí nghiệm khoa học sáng tạo: nhiệt độ, ánh sáng, độ ẩm, pH, khoảng cách…",
    url: "chi-tiet-san-pham.html",
  },
  {
    id: "iot-uno",
    name: "Mạch lập trình IoT Uno",
    category: "iot",
    categoryLabel: "IoT & AI",
    level: "THCS – Đại học",
    price: 890000,
    oldPrice: null,
    badge: null,
    image: "assets/img/product-iot.svg",
    excerpt:
      "Mạch vi điều khiển Wi-Fi tích hợp, lập trình kéo thả hoặc Python, kết nối dashboard IoT chỉ trong vài phút.",
    url: "chi-tiet-san-pham.html",
  },
  {
    id: "ai-camera",
    name: "AI Camera Kit",
    category: "iot",
    categoryLabel: "IoT & AI",
    level: "THPT – Đại học",
    price: 2790000,
    oldPrice: 2990000,
    badge: "Mới",
    image: "assets/img/product-ai.svg",
    excerpt:
      "Nhận diện khuôn mặt, vật thể, biển báo… đưa AI vào lớp học một cách trực quan và dễ hiểu.",
    url: "chi-tiet-san-pham.html",
  },
];

window.PRODUCT_CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "robotics", label: "Robotics" },
  { id: "mam-non", label: "Mầm non" },
  { id: "stem-kit", label: "Kit giảng dạy" },
  { id: "thi-nghiem", label: "Thí nghiệm" },
  { id: "iot", label: "IoT & AI" },
];

window.POSTS = [
  {
    id: 1,
    title: "Gần 110 đội thi tranh tài tại giải Robocon khu vực miền Trung 2026",
    category: "giai-dau",
    categoryLabel: "Giải đấu",
    date: "2026-05-18",
    dateLabel: "18/05/2026",
    image: "assets/img/news-1.svg",
    excerpt:
      "Giải đấu quy tụ các đội thi đến từ 12 tỉnh thành, chia làm ba bảng Tiểu học, THCS và THPT với tổng giải thưởng gần 100 triệu đồng.",
    featured: true,
  },
  {
    id: 2,
    title: "Robocon khu vực Đông Nam Bộ: không chỉ là một giải đấu Robotics",
    category: "giai-dau",
    categoryLabel: "Giải đấu",
    date: "2026-04-02",
    dateLabel: "02/04/2026",
    image: "assets/img/news-2.svg",
    excerpt:
      "Phía sau đường đua robot là hành trình các em học sinh học cách làm việc nhóm, kiên trì và chấp nhận thất bại để đi tiếp.",
  },
  {
    id: 3,
    title: "Khi Robotics trở thành một phần của hoạt động dạy học chính khoá",
    category: "trien-khai",
    categoryLabel: "Triển khai",
    date: "2026-03-11",
    dateLabel: "11/03/2026",
    image: "assets/img/news-3.svg",
    excerpt:
      "Câu chuyện từ một trường THCS đưa nội dung Robotics vào tiết học công nghệ và hoạt động trải nghiệm hướng nghiệp.",
  },
  {
    id: 4,
    title: "Trao tặng 120 bộ kit lập trình cho các trường vùng khó khăn",
    category: "cong-dong",
    categoryLabel: "Cộng đồng",
    date: "2026-02-24",
    dateLabel: "24/02/2026",
    image: "assets/img/news-4.svg",
    excerpt:
      "Chương trình nằm trong chuỗi hoạt động phổ cập kỹ năng số, hướng tới học sinh tại các địa bàn còn thiếu thiết bị dạy học.",
  },
  {
    id: 5,
    title: "Ngày hội STEM Robotics & Smart Home cho 1.000 học sinh",
    category: "su-kien",
    categoryLabel: "Sự kiện",
    date: "2026-01-15",
    dateLabel: "15/01/2026",
    image: "assets/img/news-5.svg",
    excerpt:
      "Hơn 20 gian trải nghiệm với robot dò line, nhà thông minh, in 3D và lập trình AI dành cho học sinh phổ thông.",
  },
  {
    id: 6,
    title: "Gần 200 đội thi toả sáng tại giải Robotics Online cuối năm",
    category: "giai-dau",
    categoryLabel: "Giải đấu",
    date: "2025-12-20",
    dateLabel: "20/12/2025",
    image: "assets/img/news-6.svg",
    excerpt:
      "Hình thức thi trực tuyến giúp các đội ở xa vẫn có thể tham gia, nộp video vòng loại và thi chung kết qua livestream.",
  },
  {
    id: 7,
    title: "Tập huấn STEAM cho cán bộ quản lý, giáo viên đến từ 100 trường",
    category: "tap-huan",
    categoryLabel: "Tập huấn",
    date: "2025-11-08",
    dateLabel: "08/11/2025",
    image: "assets/img/news-7.svg",
    excerpt:
      "Ba ngày tập huấn tập trung vào thiết kế bài học STEM theo chủ đề và cách tổ chức câu lạc bộ trong nhà trường.",
  },
  {
    id: 8,
    title: "Mở lớp Robotics miễn phí cho học sinh tại huyện ngoại thành",
    category: "cong-dong",
    categoryLabel: "Cộng đồng",
    date: "2025-10-02",
    dateLabel: "02/10/2025",
    image: "assets/img/news-8.svg",
    excerpt:
      "Lớp học kéo dài 12 buổi, kết thúc bằng một hackathon nhỏ để các em trình bày sản phẩm trước phụ huynh và thầy cô.",
  },
  {
    id: 9,
    title: "Hợp tác xây dựng phòng LAB STEM cùng trường đại học kỹ thuật",
    category: "trien-khai",
    categoryLabel: "Triển khai",
    date: "2025-09-12",
    dateLabel: "12/09/2025",
    image: "assets/img/news-9.svg",
    excerpt:
      "Phòng LAB được trang bị đồng bộ thiết bị IoT, robot và bàn thí nghiệm, phục vụ đào tạo sinh viên sư phạm kỹ thuật.",
  },
];

window.POST_CATEGORIES = [
  { id: "all", label: "Tất cả" },
  { id: "giai-dau", label: "Giải đấu" },
  { id: "trien-khai", label: "Triển khai" },
  { id: "tap-huan", label: "Tập huấn" },
  { id: "su-kien", label: "Sự kiện" },
  { id: "cong-dong", label: "Cộng đồng" },
];
