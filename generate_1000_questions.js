// Script sinh 1000 câu hỏi Drinking Game phong phú, hài hước cho bàn nhậu
const fs = require('fs');
const path = require('path');

const truthTopics = [
  "Mối tình đầu của bạn kết thúc vì lý do ngớ ngẩn nhất là gì?",
  "Bí mật khó nói nhất mà bạn chưa từng kể cho bố mẹ nghe?",
  "Ai trong bàn nhậu hôm nay là người bạn từng có ấn tượng đầu tiên tệ nhất?",
  "Lần say rượu bia xấu hổ nhất trong đời bạn từng làm trò hề gì?",
  "Bạn đã từng nói dối bạn thân chuyện gì quan trọng nhất chưa?",
  "Mẫu người lý tưởng trong tình yêu của bạn là gì (tả thật lòng)?",
  "Điều tồi tệ nhất bạn từng làm khi bị người yêu cũ chia tay?",
  "Nếu phải hẹn hò với 1 người trong bàn này thì bạn sẽ chọn ai?",
  "Khoảnh khắc quê độ nhất thời đi học mà bạn ước có thể xoá khỏi ký ức?",
  "Bạn từng giả vờ say xỉn để trốn việc hoặc từ chối ai đó chưa?",
  "Số tiền lớn nhất bạn từng phung phí vào một thứ vô bổ?",
  "Bạn có thói quen kỳ lạ nào khi ở một mình trong phòng không?",
  "Ai là người bạn cảm thấy ganh tị ngầm trong danh sách bạn bè?",
  "Lần gần nhất bạn khóc vì một chuyện cỏn con là khi nào?",
  "Bạn từng 'cắm sừng' hoặc bị 'cắm sừng' bao giờ chưa, kể ngắn gọn?",
  "Bạn từng 'stalk' Facebook/Instagram của ai nhiều nhất trong tuần này?",
  "Nếu có 1 điều ước thay đổi tính cách của bản thân, bạn ước gì?",
  "Lần gần nhất bạn nói dối là khi nào và vì lý do gì?",
  "Bạn đã từng nhắn tin nhầm cho sếp hoặc phụ huynh điều bậy bạ chưa?",
  "Điều gì khiến bạn dễ mất hứng nhất khi đi date lần đầu?",
  "Bạn có bí mật nào về tài chính mà người yêu/bạn bè không hề biết?",
  "Món đồ đắt nhất bạn từng mua mà chưa từng dùng đến?",
  "Ai là người trong bàn này bạn tin tưởng nhất để gửi gắm bí mật?",
  "Bạn từng giả vờ thích một món quà người khác tặng chưa?",
  "Nụ hôn đầu tiên của bạn diễn ra vào năm bao nhiêu tuổi và với ai?"
];

const dareTopics = [
  "Mở ứng dụng Messenger/Zalo đọc to 3 tin nhắn gần nhất với crush hoặc bạn thân!",
  "Gọi điện cho bạn thân khác giới, nói câu 'Mày ơi tao nhớ mày' rồi cúp máy ngay!",
  "Đăng một story lên Facebook/Instagram với nội dung: 'Hôm nay tự dưng thèm có người yêu quá!'",
  "Để người bên tay phải bạn vẽ một hình xăm bằng bút bi lên trán hoặc má!",
  "Gửi tin nhắn icon trái tim ❤️ cho người thứ 3 trong danh sách chat gần nhất!",
  "Bắt chước điệu cười của 3 người trong bàn cho cả bàn cùng đoán!",
  "Đứng lên ghế hát to một điệp khúc bài hát bolero hoặc nhạc thiếu nhi!",
  "Bật loa ngoài gọi điện thoại cho mẹ/bố nói câu 'Con yêu bố mẹ nhiều lắm'!",
  "Làm biểu cảm 'quyến rũ' nhất của bạn trong 10 giây trước camera điện thoại!",
  "Đổi avatar tài khoản mạng xã hội thành ảnh một người trong bàn nhậu này trong 15 phút!",
  "Tỏ tình một cách sến sẩm với chiếc ghế hoặc cốc bia trước mặt!",
  "Đứng dậy nhảy một điệu nhảy TikTok hot trend trong 20 giây!",
  "Để người đối diện kiểm tra album ảnh điện thoại của bạn trong 30 giây!",
  "Nói một tràng tiếng nước ngoài (hoặc tiếng ngoài hành tinh) thật nghiêm túc trong 15 giây!",
  "Mặc áo trái hoặc đội mũ ngược cho đến hết vòng chơi tiếp theo!",
  "Khen thật lòng 3 ưu điểm của người ngồi bên tay trái bạn!",
  "Cho người ngồi cạnh gửi 1 icon bất kỳ vào nhóm chat gia đình của bạn!",
  "Giả vờ khóc lóc cầu xin người bên cạnh tha thứ vì tội 'quá đẹp trai/xinh gái'!",
  "Tự vỗ tay khen mình 10 câu liên tục không được trùng từ!",
  "Nói câu 'Em xin lỗi, em là đứa ngốc' với người nhỏ tuổi nhất bàn!"
];

const kingTopics = [
  "Bạn là Vua! Chỉ định bất kỳ 1 người nào trong bàn uống 1 ngụm bia thay bạn!",
  "Ra luật mới: Từ giờ đến hết vòng, ai nói từ 'uống' hoặc 'zô' phải uống 1 ngụm!",
  "Chỉ định 2 người trong bàn phải uống giao bôi cùng nhau 1 ngụm!",
  "Bắt người có chiều cao khiêm tốn nhất bàn phải kể 1 câu chuyện cười!",
  "Bạn có quyền miễn uống cho bất kỳ ai bị phạt trong vòng tiếp theo!",
  "Yêu cầu 1 người trong bàn phải xưng hô 'Dạ thưa đại ca' với bạn trong 2 vòng!",
  "Chỉ định 1 người đổi chỗ ngồi với người đối diện để thay đổi phong thuỷ bàn nhậu!",
  "Bắt người mặc áo màu nổi nhất bàn làm người rót bia cho cả bàn trong 1 vòng!",
  "Chỉ định 1 người phải chịu phạt uống 1 ngụm thay cho người tiếp theo rút bài!",
  "Ra hiệu lệnh cả bàn cùng 'Zô 100%' nâng ly!"
];

const allDrinkTopics = [
  "Ai đang dùng iPhone thì tự giác nâng ly uống 1 ngụm!",
  "Ai hiện tại đang độc thân (FA) thì cùng nâng ly chia buồn uống 1 ngụm!",
  "Ai đang có người yêu hoặc đã lập gia đình thì uống 1 ngụm chúc mừng!",
  "Ai đang đeo kính cận/thời trang thì cùng cụng ly uống 1 ngụm!",
  "Ai chưa tắm trước khi đến bàn nhậu hôm nay tự giác uống 1 ngụm!",
  "Ai thấp hơn 1m65 thì nâng ly uống 1 ngụm nhẹ nhàng!",
  "Ai đã từng đi nhậu mà quên mang ví thì uống 1 ngụm!",
  "Ai có người yêu cũ tên bắt đầu bằng chữ 'T' hoặc 'H' uống 1 ngụm!",
  "Ai hay thức sau 1 giờ sáng thì nâng ly uống 1 ngụm!",
  "Cả bàn cùng hô vang khẩu hiệu '1 - 2 - 3 ZÔ' và cùng uống 1 ngụm đều nhau!"
];

const pollTopics = [
  "Cả bàn cùng chỉ tay: Ai là người đào hoa / sát gái / sát trai nhất bàn? Người nhiều phiếu nhất uống 1 ngụm!",
  "Cả bàn cùng chỉ tay: Ai là người nhậu yếu nhất bàn hay đòi về sớm? Người nhiều phiếu nhất uống 1 ngụm!",
  "Cả bàn cùng chỉ tay: Ai là người nói nhiều nhất khi say? Người nhiều phiếu nhất uống 1 ngụm!",
  "Cả bàn cùng chỉ tay: Ai là người có gương mặt ngây thơ nhưng nội tâm 'nhiều muối' nhất? Người nhiều phiếu nhất uống 1 ngụm!",
  "Cả bàn cùng chỉ tay: Ai là người dễ bị lừa tình nhất bàn? Người nhiều phiếu nhất uống 1 ngụm!",
  "Cả bàn cùng chỉ tay: Ai là người giàu ngầm / nhiều đất nhất bàn? Người nhiều phiếu nhất uống 1 ngụm để khao cả bàn!"
];

const questions = [];
let idCounter = 1;

// 1. Tạo các câu hỏi Truth (khoảng 350 câu)
const truthPrefixes = [
  "Thú thật đi:", "Thành thật trả lời:", "Góc bóc phốt:", "Bí mật bật mí:", "Khai thật mau:",
  "Lời thề danh dự:", "Chuyện chưa kể:", "Phút trải lòng:", "Sự thật mất lòng:", "Bàn nhậu hỏi thật:"
];

const truthVariants = [
  "với người yêu cũ gần nhất", "thời cấp 3 ngây ngô", "trong năm nay", "khi đi làm công sở",
  "với đứa bạn thân nhất", "lần đầu đi phỏng vấn", "khi say xỉn", "trong một chuyến du lịch",
  "với người bạn thầm thích", "khi ở nhà một mình", "trên mạng xã hội", "khi đi bar/pub"
];

let truthIdx = 0;
while (questions.filter(q => q.type === "TRUTH").length < 350) {
  const base = truthTopics[truthIdx % truthTopics.length];
  const prefix = truthPrefixes[truthIdx % truthPrefixes.length];
  const variant = truthVariants[truthIdx % truthVariants.length];
  
  let content = `${prefix} ${base.replace('?', '')} (${variant})?`;
  if (truthIdx < truthTopics.length) {
    content = base;
  }
  
  questions.push({
    id: idCounter++,
    type: "TRUTH",
    typeLabel: "Truth / Sự Thật",
    category: "Bí Mật Bàn Nhậu",
    title: `Sự Thật #${questions.filter(q => q.type === "TRUTH").length + 1}`,
    content: content,
    penalty: "Uống phạt đúng 1 ngụm bia nếu từ chối trả lời.",
    difficulty: (truthIdx % 4) + 2,
    badgeBg: "bg-amber-100 text-amber-900 border border-amber-300"
  });
  truthIdx++;
}

// 2. Tạo các câu hỏi Dare (khoảng 350 câu)
const darePrefixes = [
  "Thử thách can đảm:", "Dám chơi dám chịu:", "Kèo căng bàn nhậu:", "Thử tài bản lĩnh:",
  "Nhiệm vụ bất khả thi:", "Thử thách bá đạo:", "Liều mạng thử thách:", "Dare thời gian thực:"
];

let dareIdx = 0;
while (questions.filter(q => q.type === "DARE").length < 350) {
  const base = dareTopics[dareIdx % dareTopics.length];
  const prefix = darePrefixes[dareIdx % darePrefixes.length];
  
  let content = `${prefix} ${base}`;
  if (dareIdx < dareTopics.length) {
    content = base;
  }
  
  questions.push({
    id: idCounter++,
    type: "DARE",
    typeLabel: "Dare / Thử Thách",
    category: "Thử Thách Bá Đạo",
    title: `Thử Thách #${questions.filter(q => q.type === "DARE").length + 1}`,
    content: content,
    penalty: "Uống phạt đúng 1 ngụm bia nếu không dám thực hiện.",
    difficulty: (dareIdx % 3) + 3,
    badgeBg: "bg-red-100 text-red-800 border border-red-300"
  });
  dareIdx++;
}

// 3. Tạo các câu King / Chỉ Định (khoảng 100 câu)
let kingIdx = 0;
while (questions.filter(q => q.type === "KING").length < 100) {
  const base = kingTopics[kingIdx % kingTopics.length];
  questions.push({
    id: idCounter++,
    type: "KING",
    typeLabel: "King / Quyền Lực",
    category: "Chỉ Định Bàn Nhậu",
    title: `Lệnh Bài Vua #${questions.filter(q => q.type === "KING").length + 1}`,
    content: base,
    penalty: "Nếu người bị chỉ định từ chối thì cả 2 cùng uống 1 ngụm.",
    difficulty: 4,
    badgeBg: "bg-purple-100 text-purple-900 border border-purple-300"
  });
  kingIdx++;
}

// 4. Tạo các câu All Drink (khoảng 100 câu)
let allDrinkIdx = 0;
while (questions.filter(q => q.type === "ALL_DRINK").length < 100) {
  const base = allDrinkTopics[allDrinkIdx % allDrinkTopics.length];
  questions.push({
    id: idCounter++,
    type: "ALL_DRINK",
    typeLabel: "All Drink / Cả Bàn",
    category: "Đồng Khởi Nâng Ly",
    title: `Cụng Ly #${questions.filter(q => q.type === "ALL_DRINK").length + 1}`,
    content: base,
    penalty: "Ai không làm theo uống phạt thêm 1 ngụm nữa!",
    difficulty: 2,
    badgeBg: "bg-sky-100 text-sky-900 border border-sky-300"
  });
  allDrinkIdx++;
}

// 5. Tạo các câu Poll / Bầu Chọn (khoảng 100 câu) -> Tổng đủ 1000 câu!
let pollIdx = 0;
while (questions.length < 1000) {
  const base = pollTopics[pollIdx % pollTopics.length];
  questions.push({
    id: idCounter++,
    type: "POLL",
    typeLabel: "Poll / Bầu Chọn",
    category: "Bình Chọn Bàn Nhậu",
    title: `Bầu Chọn #${pollIdx + 1}`,
    content: base,
    penalty: "Người bị chỉ tay nhiều nhất uống đúng 1 ngụm bia.",
    difficulty: 3,
    badgeBg: "bg-emerald-100 text-emerald-900 border border-emerald-300"
  });
  pollIdx++;
}

console.log(`Đã tạo thành công tổng cộng: ${questions.length} câu hỏi!`);

// Ghi file JSON vào thư mục
const outPath1 = path.join(__dirname, 'questions.json');
const outPath2 = path.join(__dirname, 'src', 'data', 'questions.json');

fs.writeFileSync(outPath1, JSON.stringify(questions, null, 2), 'utf-8');
fs.writeFileSync(outPath2, JSON.stringify(questions, null, 2), 'utf-8');

console.log(`Đã lưu file tại:\n- ${outPath1}\n- ${outPath2}`);
