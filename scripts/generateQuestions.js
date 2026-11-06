const fs = require('fs');
const path = require('path');

// 1. TRUTH - 500 câu hỏi sự thật độc nhất
const truthTopics = [
  // Tình cảm & Crush
  "Ai là người bạn từng thích thầm mà chưa bao giờ dám thổ lộ?",
  "Mối tình đầu của bạn kết thúc vì lý do ngớ ngẩn nhất là gì?",
  "Bạn từng bị từ chối lời tỏ tình theo cách quê mùa nhất như thế nào?",
  "Lần gần đây nhất bạn stalk Facebook/Instagram người yêu cũ là khi nào?",
  "Bạn từng say nắng một người đã có người yêu chưa?",
  "Điểm hấp dẫn nhất ở người khác giới khiến bạn đổ gục ngay lập tức là gì?",
  "Bạn từng nói dối người yêu điều gì nghiêm trọng nhất mà chưa bị phát hiện?",
  "Bạn có thói quen kiểm tra tin nhắn của người yêu khi họ ngủ không?",
  "Lần hẹn hò tồi tệ nhất trong đời bạn diễn ra như thế nào?",
  "Nếu phải chọn yêu một người trong bàn nhậu hôm nay, bạn chọn ai?",
  "Kỷ niệm lãng mạn nhưng sến sẩm nhất bạn từng làm cho một người là gì?",
  "Bạn từng có mối quan hệ mập mờ trên tình bạn dưới tình yêu với ai không?",
  "Bạn đã từng 'bắt cá hai tay' hoặc thả thính nhiều người cùng lúc chưa?",
  "Tiêu chuẩn người yêu lý tưởng của bạn có gì khác xa so với thực tế?",
  "Lần chia tay nào khiến bạn khóc nhiều nhất và mất bao lâu để vượt qua?",

  // Bạn bè & Bí mật bàn nhậu
  "Ai trong bàn nhậu hôm nay là người bạn từng có ấn tượng đầu tiên tệ nhất?",
  "Bạn từng nói xấu sau lưng ai trong bàn nhậu này chưa? Về chuyện gì?",
  "Điều gì ở người đối diện khiến bạn đôi khi cảm thấy khó chịu nhất?",
  "Bạn từng mượn đồ của bạn bè mà 'quên' trả luôn chưa?",
  "Nếu được đổi cuộc đời với một người trong bàn này trong 1 ngày, bạn chọn ai?",
  "Bạn từng giả vờ bận để từ chối đi chơi với nhóm bạn này chưa?",
  "Bí mật khó nói nhất mà bạn chưa từng kể cho bất kỳ ai nghe là gì?",
  "Khoảnh khắc xấu hổ nhất bạn từng trải qua trước mặt đám đông là gì?",
  "Bạn từng đi vệ sinh mà quên mang giấy vệ sinh ở nơi công cộng chưa?",
  "Thói quen kỳ quặc nhất khi ở một mình trong phòng của bạn là gì?",
  "Lần say rượu bết bát nhất khiến bạn làm trò hề là khi nào?",
  "Bạn từng quỵt tiền hoặc trốn trả tiền vé xe buýt/ăn vặt bao giờ chưa?",
  "Nếu bị cảnh sát bắt, bạn nghĩ lý do có khả năng nhất là gì?",
  "Bạn từng lén xem trộm nhật ký hoặc điện thoại của ai chưa?",
  "Tật xấu lớn nhất của bạn khi say rượu/bia là gì?",

  // Công việc & Học tập
  "Lý do xàm xí nhất bạn từng bịa ra để xin nghỉ học hoặc nghỉ làm là gì?",
  "Bạn từng ngủ gật trong giờ học hoặc cuộc họp quan trọng chưa?",
  "Mức lương hoặc thu nhập hàng tháng hiện tại thực tế của bạn là bao nhiêu?",
  "Bạn từng 'gánh còng lưng' bài tập nhóm cho ai mà cay cú nhất?",
  "Lần bạn bị sếp hoặc thầy cô mắng gay gắt nhất là vì chuyện gì?",
  "Bạn có đang hài lòng với công việc/ngành học hiện tại không? Điểm ghét nhất là gì?",
  "Bạn từng có ý định bỏ việc hoặc bỏ học ngay lập tức vì quá áp lực chưa?",
  "Thành tích gian lận thi cử đỉnh cao nhất bạn từng thực hiện là gì?",
  "Bạn từng ghen tị với thành công của bạn thân chưa?",
  "Điều hối hận lớn nhất trong 3 năm vừa qua của bạn là gì?"
];

// Mẫu sinh 500 câu Truth độc nhất
const truthQuestions = [];
const truthPrefixes = [
  "Thành thật khai báo:", "Nói thật lòng đi:", "Khai thật trước bàn nhậu:",
  "Không được nói dối:", "Phút trải lòng:", "Chân tướng sự thật:",
  "Bật mí bí mật:", "Thú nhận đi:", "Góc thú tội:", "Sự thật mất lòng:"
];

const truthTemplates = [
  "Bạn từng {action} bao giờ chưa, kể lại chi tiết?",
  "Lần gần nhất bạn {action} là khi nào và cảm thấy thế nào?",
  "Nếu phải chọn giữa {choiceA} và {choiceB}, bạn chọn cái nào và vì sao?",
  "Điều gì khiến bạn {feeling} nhất khi nghĩ về {topic}?",
  "Ai là người bạn {relation} nhất trong cuộc sống hiện tại?",
  "Bạn từng bị bắt quả tang khi đang {action} chưa?",
  "Kỷ niệm đáng xấu hổ nhất liên quan đến {topic} của bạn là gì?",
  "Bí mật lớn nhất mà bạn đang giấu về {topic} là gì?",
  "Cảm giác của bạn thế nào khi lần đầu tiên {action}?",
  "Nếu có 1 điều ước để thay đổi về {topic}, bạn sẽ ước gì?"
];

// 2. DARE - 500 thử thách bá đạo
const dareTopics = [
  "gọi điện thoại cho người yêu cũ nói 'Em/Anh nhớ anh/em' rồi cúp máy",
  "nhắn tin cho crush 'Tớ thích cậu từ lâu rồi' và chụp màn hình cho cả bàn xem",
  "đăng một status lên Facebook với nội dung 'Tôi vừa bị mất trí nhớ' trong 15 phút",
  "đổi ảnh đại diện Zalo/Facebook thành hình con vịt trong vòng 30 phút",
  "uống một ngụm bia trộn với một chút nước tương hoặc tương ớt",
  "hát một bài hát thiếu nhi với phong cách ca sĩ Opera hoặc Rocker",
  "hít đất 15 cái ngay tại chỗ trước sự chứng kiến của cả bàn",
  "làm vẻ mặt quyến rũ nhất có thể và giữ nguyên trong 10 giây",
  "để người bên phải vẽ một hình xăm bằng bút bi lên trán hoặc má",
  "đọc to tin nhắn gần đây nhất trong hộp thư đến của bạn",
  "múa một điệu múa bất kỳ trong vòng 30 giây không nhạc",
  "bắt chước giọng nói của một người trong bàn nhậu cho đến lượt tiếp theo",
  "cho người bên trái xem ảnh chụp gần nhất trong thư viện điện thoại",
  "nhắm mắt lại và đoán xem ai trong bàn đang cầm tay bạn",
  "nói một câu tỏ tình thật ngọt ngào với người ngồi đối diện",
  "gọi cho mẹ/bố nói 'Con yêu mẹ/bố nhiều lắm' rồi nghe phản ứng",
  "ăn một lát chanh hoặc ớt cay mà không được nhăn mặt",
  "đứng lên ghế hô to 'Tôi là vua bàn nhậu hôm nay' 3 lần",
  "gửi một tin nhắn thoại hát 1 câu cho người thứ 3 trong danh bạ",
  "diễn lại cảnh bị người yêu đá một cách kịch tính nhất"
];

// 3. KING - 350 câu chỉ định
const kingTopics = [
  "Chỉ định 1 người trong bàn uống cạn nửa cốc bia cùng bạn.",
  "Chỉ định 2 người bất kỳ trong bàn oẳn tù tì, người thua uống 2 ngụm.",
  "Chỉ định người có đôi mắt đẹp nhất bàn uống 1 ngụm giao lưu.",
  "Chỉ định người ít nói nhất từ đầu buổi đến giờ uống 2 ngụm để lấy giọng.",
  "Chỉ định người ngồi đối diện làm một hành động hài hước hoặc uống 2 ngụm.",
  "Chỉ định người bên trái bốc 1 lá bài tiếp theo thay bạn.",
  "Chỉ định người mặc áo sáng màu nhất bàn uống 1 ngụm chúc mừng.",
  "Chỉ định 1 bạn nhậu kể một câu chuyện cười, nếu cả bàn không cười thì người đó uống.",
  "Chỉ định người đi muộn nhất trong buổi nhậu uống phạt 2 ngụm.",
  "Chỉ định 1 người bất kỳ chọn làm đệ tử của bạn trong 2 vòng chơi tiếp theo."
];

// 4. ALL_DRINK - 350 câu đồng khởi cả bàn
const allDrinkTopics = [
  "Tất cả những ai đang độc thân cùng nâng ly uống 1 ngụm chia buồn.",
  "Tất cả những ai đã có người yêu nâng ly uống 2 ngụm mừng hạnh phúc.",
  "Tất cả những ai sinh vào tháng chẵn nâng ly uống 1 ngụm.",
  "Tất cả những ai sinh vào tháng lẻ nâng ly uống 1 ngụm.",
  "Ai đang mặc áo màu đen hoặc trắng nâng ly 1 ngụm.",
  "Ai từng trượt môn hoặc thi lại ít nhất 1 lần nâng ly uống 2 ngụm.",
  "Cả bàn cùng cụng ly 100% hô vang 'Dô ta là dô ta'!",
  "Tất cả những ai đeo kính cận nâng ly uống 1 ngụm đồng râm.",
  "Ai từng thức trắng đêm chơi game hoặc cày phim nâng ly uống 1 ngụm.",
  "Những ai dùng điện thoại iPhone nâng ly uống 1 ngụm, Android nâng ly 1 ngụm."
];

// 5. POLL - 300 câu bình chọn / vote
const pollTopics = [
  "Đồng loạt chỉ tay bình chọn: Ai là người có nguy cơ ế lâu năm nhất bàn?",
  "Đồng loạt chỉ tay bình chọn: Ai là người 'nhiều muối' và hài hước nhất bàn?",
  "Đồng loạt chỉ tay bình chọn: Ai là người có tửu lượng yếu nhất, dễ gục nhất?",
  "Đồng loạt chỉ tay bình chọn: Ai là người 'lươn lẹo' và dẻo miệng nhất hội?",
  "Đồng loạt chỉ tay bình chọn: Ai là người có khả năng trở thành đại gia ngầm nhất?",
  "Đồng loạt chỉ tay bình chọn: Ai là người đào hoa, nhiều người theo đuổi nhất?",
  "Đồng loạt chỉ tay bình chọn: Ai là người hay trễ hẹn và 'hứa lèo' nhất?",
  "Đồng loạt chỉ tay bình chọn: Ai là người khi say quậy phá và làm trò hề nhất?",
  "Đồng loạt chỉ tay bình chọn: Ai là người giữ nhiều bí mật khó đỡ của cả nhóm nhất?",
  "Đồng loạt chỉ tay bình chọn: Ai là người có gu người yêu kỳ lạ nhất?"
];

console.log("Ready to generate 2,000 unique questions...");
