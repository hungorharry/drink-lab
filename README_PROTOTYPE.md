# ✦ SIPCRAFT CELESTIAL CHEERS - BẢN PROTOTYPE ĐỒNG BỘ REAL-TIME

Đã thiết kế xong bản chạy thử nghiệm (Interactive Prototype) đúng chính xác **100% kịch bản bàn nhậu**:

## 🍻 4 Kịch bản đã được mô phỏng hoàn hảo:
1. **Tất cả nhìn chung 1 bàn bài:** 
   - Banner trên cùng của cả 2 máy đều hiển thị rõ: *"Đang là lượt của [Tên người chơi]"*.
   - Avatar của người đang tới lượt được đánh dấu vương miện 👑, viền sáng và chấm ping trạng thái *"Đang rút..."*.
2. **Chỉ người tới lượt mới bấm được:**
   - Khi là lượt của Nam: Nút trên máy Nam sáng bừng, bấm rút bài được ngay.
   - Trên máy của Mai Anh (Spectator): Nút bị làm mờ, hiện biểu tượng ổ khóa 🔒 *"Chỉ xem • Đang là lượt của Nam"*, bấm vào lá bài không phản hồi.
3. **Đồng bộ hiệu ứng lật bài 180° & Bung hạt sáng ma thuật:**
   - Khi Nam bấm nút "Rút bài" hoặc chạm vào thẻ bài:
   - Lá bài ở **cả 2 màn hình cùng xoay 180° 3D** mượt mà.
   - **Hạt sáng phép thuật (Celestial Canvas Star particles)** bung tỏa 360 độ từ tâm thẻ bài cùng âm thanh phép thuật ma mị và tiếng lật bài chân thực.
   - Cả 2 máy hiển thị cùng một nội dung câu hỏi, độ khó và hình phạt uống bia y hệt nhau.
4. **Chuyển lượt tự động:**
   - Khi Nam bấm *"Đã xong • Chuyển lượt"* (hoặc *"Đã uống (+2 ngụm)"*):
   - Cả 2 máy đồng loạt úp bài lại vào bộ bài.
   - Lượt tự động nhảy sang Mai Anh: Máy Mai Anh lập tức mở khóa nút rút bài, còn máy Nam chuyển sang chế độ Khán giả theo dõi!

---

## 🚀 Cách mở và dùng thử ngay:
1. Mở file [index.html](file:///D:/Experiment/stitch_celestial_cheers_drinking_game/index.html) bằng trình duyệt bất kỳ (Chrome, Edge, Cốc Cốc, Brave...).
2. Mặc định trang sẽ mở ở chế độ **"Mô phỏng 2 Máy Song Song"** (Điện thoại Nam bên trái & Điện thoại Mai Anh bên phải).
3. Bấm thử lá bài bên máy Nam để xem hiệu ứng xoay lật 180° + bung hạt sáng cùng lúc ở cả 2 màn hình!
4. Bấm nút **"Xem Code Firebase 100%"** trên thanh công cụ để lấy toàn bộ code mẫu Firestore đã chuẩn hóa sẵn.
