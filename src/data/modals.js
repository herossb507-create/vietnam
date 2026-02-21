// 모달 콘텐츠 데이터 (나중에 Supabase guides 테이블로 교체 예정)
const modals = {
  'modal-salary': {
    title: '💰 Mức lương tối thiểu 2024',
    body: `<strong>9.860 won/giờ</strong> (tăng 2.5% so với 2023)<br/><br/>
<strong>Ví dụ tính lương tháng:</strong><br/>
• 8 giờ/ngày × 5 ngày/tuần × 4 tuần = 160 giờ<br/>
• 160 × 9.860 = <strong>1.577.600 won</strong>/tháng tối thiểu<br/><br/>
<strong>Thực tế:</strong> Nhiều công ty trả 2.0 – 2.5 triệu won/tháng<br/><br/>
⚠️ Nếu chủ trả thấp hơn mức tối thiểu → báo ngay Bộ Lao động HQ: <strong>1350</strong>`,
  },
  'modal-insurance': {
    title: '🏥 Bảo hiểm 4 loại (4대보험)',
    body: `Lao động nước ngoài E-9 được hưởng đầy đủ 4 loại bảo hiểm:<br/><br/>
<ul>
  <li><strong>Bảo hiểm y tế</strong> — Trừ 3.545% lương, khám chữa bệnh rẻ hơn nhiều</li>
  <li><strong>Bảo hiểm hưu trí</strong> — Trừ 4.5%, hoàn lại khi về nước!</li>
  <li><strong>Bảo hiểm việc làm</strong> — Trừ 0.9%, hỗ trợ khi mất việc</li>
  <li><strong>Bảo hiểm tai nạn lao động</strong> — Chủ đóng 100%, bạn không mất gì</li>
</ul><br/>
💡 <strong>Mẹo:</strong> Khi về VN, nhớ xin hoàn lại bảo hiểm hưu trí — có thể nhận lại vài triệu won!`,
  },
  'modal-scam': {
    title: '🚨 Cảnh báo lừa đảo',
    body: `<strong>Dấu hiệu "cò" bất hợp pháp:</strong><br/><br/>
<ul>
  <li>Yêu cầu trả tiền để "đăng ký EPS" hoặc "chạy hồ sơ"</li>
  <li>Hứa hẹn tìm việc nhanh, không cần thi</li>
  <li>Giả mạo nhân viên HRD Korea hoặc đại sứ quán</li>
  <li>Thu phí "bảo lãnh" hay "đặt cọc"</li>
</ul><br/>
<strong>Nhớ rõ:</strong> Chương trình EPS hoàn toàn <strong>MIỄN PHÍ</strong>!<br/><br/>
📞 Đường dây tố giác: <strong>1644-0644</strong> (HRD Korea tiếng Việt)`,
  },
  'modal-step1': {
    title: '📝 Bước 1: Thi EPS-TOPIK',
    body: `<strong>EPS-TOPIK là gì?</strong><br/>
Kỳ thi tiếng Hàn dành riêng cho người muốn sang làm việc theo chương trình EPS.<br/><br/>
<strong>Nội dung thi:</strong><br/>
<ul>
  <li>Tiếng Hàn cơ bản (đọc hiểu)</li>
  <li>Kiến thức pháp luật lao động HQ</li>
</ul><br/>
<strong>Đăng ký:</strong> Website COLAB Vietnam (colab.org.vn)<br/>
<strong>Lệ phí:</strong> Miễn phí hoàn toàn<br/>
<strong>Tổ chức:</strong> 1–2 lần/năm tại các tỉnh thành<br/><br/>
💡 <strong>Mẹo ôn thi:</strong> Tải app "EPS TOPIK" trên Play Store, học miễn phí!`,
  },
  'modal-step2': {
    title: '📑 Bước 2: Đăng ký hồ sơ',
    body: `Sau khi có kết quả thi, đến cơ quan COLAB hoặc Trung tâm dịch vụ việc làm được ủy quyền để:<br/><br/>
<ul>
  <li>Nộp hồ sơ xin việc chuẩn</li>
  <li>Chụp ảnh và đo các chỉ số (cho nhà máy)</li>
  <li>Khai báo ngành nghề mong muốn</li>
</ul><br/>
<strong>Giấy tờ cần:</strong> CMND/Hộ chiếu, bằng tốt nghiệp, kết quả thi EPS-TOPIK<br/><br/>
⏳ Thời gian chờ: 6 tháng – 2 năm (tùy ngành, tùy năm)`,
  },
  'modal-step3': {
    title: '🤝 Bước 3: Được chủ chọn',
    body: `Chủ lao động Hàn xem danh sách ứng viên và chọn bạn.<br/><br/>
<strong>Quá trình:</strong><br/>
<ul>
  <li>Chủ lao động liên hệ qua COLAB</li>
  <li>Bạn có quyền từ chối <strong>1 lần</strong> (từ chối lần 2 bị treo 1 năm)</li>
  <li>Ký hợp đồng lao động tiêu chuẩn 3 năm</li>
</ul><br/>
<strong>Hợp đồng cần có:</strong> Lương, giờ làm, nơi ở, loại công việc<br/><br/>
⚠️ Đọc kỹ hợp đồng trước khi ký! Có thể nhờ COLAB giải thích.`,
  },
  'modal-step4': {
    title: '🏥 Bước 4: Khám sức khỏe & Visa',
    body: `<strong>Khám sức khỏe:</strong><br/>
Tại cơ sở được HRD Korea chỉ định. Kiểm tra sức khỏe tổng quát, phổi, mắt.<br/><br/>
<strong>Xin visa E-9:</strong><br/>
<ul>
  <li>Nộp hồ sơ tại Đại sứ quán Hàn Quốc tại Hà Nội hoặc TP.HCM</li>
  <li>Kết quả sau 3–5 ngày làm việc</li>
</ul><br/>
<strong>Chi phí visa:</strong> Miễn phí<br/>
<strong>Hiệu lực:</strong> Visa E-9 có giá trị 3 năm, có thể gia hạn thêm 1 năm 10 tháng`,
  },
  'modal-step5': {
    title: '📚 Bước 5: Đào tạo trước nhập cảnh',
    body: `Khóa học bắt buộc 16 giờ do COLAB tổ chức:<br/><br/>
<ul>
  <li>Văn hóa và xã hội Hàn Quốc</li>
  <li>Pháp luật lao động (giờ làm, nghỉ phép, lương)</li>
  <li>An toàn lao động</li>
  <li>Cuộc sống hàng ngày (ngân hàng, bệnh viện, giao thông)</li>
</ul><br/>
<strong>Thời gian:</strong> 2–3 ngày tập trung<br/>
<strong>Chi phí:</strong> Miễn phí<br/><br/>
💡 Học kỹ phần này sẽ giúp bạn rất nhiều khi sang HQ!`,
  },
  'modal-step6': {
    title: '🎉 Bước 6: Sang Hàn & Làm việc!',
    body: `<strong>Khi đến sân bay Incheon:</strong><br/>
<ul>
  <li>Nhân viên HRD Korea đón tại sảnh đến</li>
  <li>Đào tạo thêm 3 ngày tại trung tâm</li>
  <li>Đến nơi làm việc</li>
</ul><br/>
<strong>Việc cần làm trong 2 tuần đầu:</strong><br/>
<ul>
  <li>Đăng ký thẻ ngoại kiều (ARC) tại đồn cảnh sát</li>
  <li>Mở tài khoản ngân hàng</li>
  <li>Đăng ký bảo hiểm y tế</li>
</ul><br/>
🎊 Chúc mừng! Hành trình mới bắt đầu!`,
  },
  'modal-house': {
    title: '🏘️ Tìm nhà ở tại Hàn',
    body: `<strong>3 lựa chọn phổ biến:</strong><br/><br/>
🏢 <strong>Ký túc xá công ty</strong> — Tốt nhất! Công ty trừ 100–300K won/tháng, gần nơi làm, không lo tìm nhà<br/><br/>
🛏️ <strong>고시원 (Gosiwon)</strong> — Phòng nhỏ ~250–400K won/tháng, có đồ dùng, gần trung tâm<br/><br/>
🏠 <strong>Thuê phòng (원룸)</strong> — Tự do hơn, 300–600K won/tháng, cần đặt cọc (보증금)<br/><br/>
💡 <strong>App tìm nhà:</strong> Zigbang (직방), Dabang (다방)`,
  },
  'modal-hospital': {
    title: '🏥 Y tế & Khẩn cấp',
    body: `<strong>Số khẩn cấp:</strong><br/>
• Cấp cứu: <strong>119</strong><br/>
• Cảnh sát: <strong>112</strong><br/>
• Tư vấn lao động: <strong>1350</strong> (có tiếng Việt)<br/><br/>
<strong>Trung tâm y tế có tiếng Việt:</strong><br/>
• Seoul: Trung tâm y tế Seoul (서울의료원)<br/>
• Gyeonggi: BV Ansan — đông người Việt nhất<br/><br/>
💡 Với thẻ bảo hiểm y tế, bạn chỉ trả 20–30% chi phí khám!`,
  },
  'modal-bank': {
    title: '🏦 Mở tài khoản ngân hàng',
    body: `<strong>Ngân hàng dễ nhất cho người nước ngoài:</strong><br/><br/>
🏦 <strong>KEB Hana Bank</strong> — App có tiếng Việt, chuyển tiền về VN rẻ<br/>
🏦 <strong>Shinhan Bank</strong> — Nhiều chi nhánh, nhân viên biết tiếng Anh<br/>
🏦 <strong>IBK기업은행</strong> — Tốt cho công nhân EPS<br/><br/>
<strong>Giấy tờ cần:</strong> Hộ chiếu + Thẻ ARC (ngoại kiều)<br/><br/>
💡 Mở tài khoản trong 2 tuần đầu nhé, cần để nhận lương!`,
  },
  'modal-rights': {
    title: '⚖️ Quyền lao động của bạn',
    body: `<strong>Bạn có quyền:</strong><br/><br/>
<ul>
  <li>✅ Làm tối đa <strong>52 giờ/tuần</strong> (kể cả tăng ca)</li>
  <li>✅ Tăng ca được trả thêm <strong>50%</strong> lương</li>
  <li>✅ <strong>15 ngày</strong> nghỉ phép/năm (đủ 1 năm)</li>
  <li>✅ Được đổi nơi làm việc (tối đa 3 lần trong 3 năm)</li>
  <li>✅ Tiền lương phải được trả <strong>đúng hạn</strong> mỗi tháng</li>
</ul><br/>
📞 Bị vi phạm quyền lợi? Gọi ngay: <strong>1350</strong> (miễn phí, có tiếng Việt)`,
  },
  'modal-food': {
    title: '🍜 Ẩm thực Việt tại Hàn',
    body: `<strong>Tìm đồ ăn Việt ở đâu?</strong><br/><br/>
🛒 <strong>Siêu thị:</strong> Ansan (안산) Wonkok-dong — "Phố Việt Nam" tại Hàn<br/>
🍜 <strong>App tìm nhà hàng:</strong> Naver Map → tìm "베트남 음식"<br/><br/>
<strong>Mua đồ nấu ăn:</strong><br/>
• Cửa hàng Việt Nam tại Ansan, Incheon, Changwon<br/>
• Order online: Coupang, 11Street giao hàng toàn quốc<br/><br/>
💡 Nấu ăn tại nhà tiết kiệm được 300–500K won/tháng so với ăn ngoài!`,
  },
  'modal-remit': {
    title: '💸 Gửi tiền về Việt Nam',
    body: `<strong>So sánh phí chuyển tiền:</strong><br/><br/>
🏦 <strong>KEB Hana Bank</strong> — Phí ~10K won, tỷ giá tốt, có app tiếng Việt<br/>
💳 <strong>Western Union</strong> — Nhanh (vài giờ), phí 15–25K won<br/>
📱 <strong>Wise (TransferWise)</strong> — Tỷ giá thị trường, phí thấp nhất<br/>
🏪 <strong>Cửa hàng đổi tiền Việt tại Ansan</strong> — Nhanh nhưng kiểm tra kỹ tỷ giá<br/><br/>
💡 <strong>Mẹo:</strong> Chuyển số tiền lớn một lần sẽ tiết kiệm phí hơn chuyển nhiều lần nhỏ!`,
  },
  'modal-korean': {
    title: '🇰🇷 Tiếng Hàn cơ bản',
    body: `<strong>Những câu dùng hàng ngày tại công ty:</strong><br/><br/>
• 안녕하세요 (An-nyeong-ha-se-yo) — Xin chào<br/>
• 감사합니다 (Gam-sa-ham-ni-da) — Cảm ơn<br/>
• 모르겠어요 (Mo-reu-ge-sseo-yo) — Tôi không hiểu<br/>
• 화장실이 어디예요? — Nhà vệ sinh ở đâu?<br/>
• 병원에 가야 해요 — Tôi cần đi bệnh viện<br/>
• 도와주세요 (Do-wa-ju-se-yo) — Giúp tôi với!<br/><br/>
📱 <strong>App học tiếng Hàn miễn phí:</strong> Duolingo, TTMIK, EPS TOPIK`,
  },
  'modal-review1': {
    title: '⭐ Kinh nghiệm của Văn Tuấn',
    body: `<strong>Nguyễn Văn Tuấn — Nhà máy điện tử, Gyeonggi-do</strong><br/>
Làm việc: 2 năm | Visa: E-9<br/><br/>
"Tôi vào nhà máy sản xuất linh kiện điện tử. Công việc cần sự tỉ mỉ, đứng nhiều. Lương tháng đầu 2.3 triệu won, sau 1 năm tăng lên 2.6 triệu.<br/><br/>
Ký túc xá do công ty lo, rất tiện. Trừ 200K/tháng tiền phòng. Bạn cùng phòng có người Việt nên không cô đơn.<br/><br/>
Lời khuyên: Học tiếng Hàn trước khi sang, ít nhất là đủ để giao tiếp cơ bản. Chủ sẽ quý hơn nhiều!"`,
  },
  'modal-review2': {
    title: '⭐ Kinh nghiệm của Thị Lan',
    body: `<strong>Trần Thị Lan — Nông trại, Chungcheongnam-do</strong><br/>
Làm việc: 1.5 năm | Visa: E-9<br/><br/>
"Làm nông nghiệp không như tôi tưởng. Mùa thu hoạch bận lắm, làm 10-12 tiếng/ngày. Nhưng chủ trại tốt, lo cả cơm ăn.<br/><br/>
Mùa đông ít việc hơn, có thời gian nghỉ ngơi. Lương tháng bình quân 2.1 triệu won sau khi trừ hết.<br/><br/>
Lời khuyên: Chuẩn bị sức khỏe tốt, và học cách nấu ăn Hàn vì không phải lúc nào cũng có đồ Việt!"`,
  },
  'modal-review3': {
    title: '⭐ Kinh nghiệm của Minh Hoàng',
    body: `<strong>Lê Minh Hoàng — Xây dựng, Seoul</strong><br/>
Làm việc: 3 năm | Visa: E-9<br/><br/>
"Xây dựng lương cao nhất trong các ngành EPS, tháng tốt có thể 3–3.5 triệu won. Nhưng phải chịu được nắng mưa, công việc nặng nhọc.<br/><br/>
Tiếng Hàn rất quan trọng trong ngành này. Tôi tự học thêm buổi tối, 1 năm sau đã giao tiếp được. Từ đó chủ tin tưởng hơn, còn cho làm tổ trưởng nhóm.<br/><br/>
Lời khuyên: Tích lũy tiền ngay từ đầu, đừng chi tiêu quá nhiều. 3 năm có thể tiết kiệm 150-200 triệu VND!"`,
  },
  'modal-write': {
    title: '✏️ Chia sẻ kinh nghiệm',
    body: `Cảm ơn bạn muốn chia sẻ!<br/><br/>
Tính năng đăng bài đang được phát triển 🚧<br/><br/>
Hiện tại bạn có thể tham gia cộng đồng Facebook:<br/>
<strong>"Người Việt làm việc tại Hàn Quốc"</strong><br/><br/>
Chúng tôi sẽ sớm ra mắt tính năng đăng bài ngay trong app! 🙏`,
  },
}

export default modals
