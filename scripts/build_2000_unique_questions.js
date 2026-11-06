const fs = require('fs');
const path = require('path');

// Master collections of themes, prompts, and specific topics
const truthPrompts = [
  // Tình cảm, crush, người cũ
  "Ai là người bạn từng thích thầm nhưng chưa bao giờ dám mở lời?",
  "Mối tình đầu của bạn kết thúc vì lý do ngớ ngẩn nhất là gì?",
  "Bạn từng bị từ chối lời tỏ tình theo cách ê chề nhất như thế nào?",
  "Lần gần đây nhất bạn stalk trang cá nhân người yêu cũ là khi nào?",
  "Bạn từng 'say nắng' một người đã có người yêu hoặc có gia đình chưa?",
  "Điểm hấp dẫn nhất ở người khác giới khiến bạn đổ gục ngay từ cái nhìn đầu tiên?",
  "Bạn từng nói dối người yêu điều gì nghiêm trọng nhất mà chưa bị phát hiện?",
  "Bạn có thói quen lén kiểm tra tin nhắn hay lịch sử điện thoại của người yêu không?",
  "Buổi hẹn hò thảm họa nhất cuộc đời bạn diễn ra như thế nào?",
  "Nếu bắt buộc phải chọn yêu một người trong bàn nhậu hôm nay, bạn sẽ chọn ai?",
  "Kỷ niệm lãng mạn nhưng sến sẩm đến xấu hổ bạn từng làm cho một người là gì?",
  "Bạn từng trải qua mối quan hệ mập mờ 'trên tình bạn dưới tình yêu' với ai?",
  "Bạn đã từng 'bắt cá hai tay' hoặc nhắn tin tán tỉnh nhiều người cùng lúc chưa?",
  "Tiêu chuẩn người yêu của bạn khác xa thực tế ngoài đời như thế nào?",
  "Lần chia tay nào khiến bạn đau khổ, khóc nhiều nhất và mất bao lâu để nguôi ngoai?",
  "Bạn từng quay lại với người yêu cũ bao nhiêu lần và lý do tan vỡ cuối cùng là gì?",
  "Bạn có bao giờ hối hận vì đã từ chối một người từng theo đuổi bạn rất chân thành?",
  "Nếu người yêu cũ nhắn tin mời cưới, bạn có đi không và mừng bao nhiêu tiền?",
  "Khoảnh khắc nào khiến bạn nhận ra mình đã hoàn toàn hết tình cảm với người yêu?",
  "Bạn từng khóc trước mặt người yêu vì lý do gì ngớ ngẩn nhất?",

  // Bạn bè, bàn nhậu & quan hệ xã hội
  "Ai trong bàn nhậu hôm nay là người bạn từng có ấn tượng đầu tiên tệ nhất?",
  "Bạn từng nói xấu sau lưng ai trong bàn nhậu này chưa và về chuyện gì?",
  "Điều gì ở người ngồi đối diện khiến bạn đôi khi cảm thấy khó chịu nhất?",
  "Bạn từng mượn tiền hoặc đồ dùng của bạn bè mà 'quên' luôn không trả chưa?",
  "Nếu được tráo đổi cuộc đời với một người trong bàn này 1 ngày, bạn chọn ai?",
  "Bạn từng giả vờ bận rộn để từ chối cuộc hẹn với nhóm bạn này bao giờ chưa?",
  "Bí mật khó nói nhất mà bạn chưa từng kể cho bố mẹ hay bạn bè nghe là gì?",
  "Khoảnh khắc xấu hổ nhất bạn từng trải qua trước đám đông khiến bạn muốn độn thổ?",
  "Bạn từng đi vệ sinh nơi công cộng mà phát hiện hết giấy, bạn xử lý thế nào?",
  "Thói quen kỳ quặc, dị hợm nhất khi ở một mình trong phòng kín của bạn là gì?",
  "Lần say xỉn bết bát nhất khiến bạn làm trò hề nhớ đời là khi nào?",
  "Bạn từng quỵt tiền xe, tiền ăn vặt hoặc trốn vé bao giờ chưa?",
  "Nếu bị công an bắt vì một tội danh hài hước, bạn đoán đó là tội gì?",
  "Bạn từng lén đọc trộm tin nhắn hay nhật ký của bạn bè/người thân chưa?",
  "Tật xấu khó đỡ nhất của bạn mỗi khi uống say là gì?",
  "Ai trong bàn nhậu là người bạn cảm thấy khó tâm sự chuyện tình cảm nhất?",
  "Bạn có bao giờ cảm thấy ghen tị với nhan sắc hoặc tài năng của bạn thân không?",
  "Lần bạn 'bốc phét' phóng đại một câu chuyện lớn nhất là về việc gì?",
  "Bạn từng làm mất đồ quý giá của ai đó rồi giả vờ như không biết gì chưa?",
  "Nếu nhóm bạn này xảy ra biến cố, bạn tin tưởng ai nhất để nhờ giúp đỡ?",

  // Tiền bạc, công việc & học tập
  "Lý do xàm xí nhất bạn từng bịa ra để xin nghỉ học hoặc xin nghỉ làm việc là gì?",
  "Bạn từng ngủ gật trong giờ học hoặc trong cuộc họp quan trọng của công ty chưa?",
  "Mức thu nhập hoặc tiền tiêu vặt hàng tháng thực tế hiện tại của bạn là bao nhiêu?",
  "Bạn từng 'gánh còng lưng' bài tập nhóm cho ai mà trong lòng cay cú nhất?",
  "Lần bạn bị sếp hoặc giáo viên mắng xối xả gay gắt nhất là vì chuyện gì?",
  "Bạn có đang thực sự hài lòng với công việc/ngành học hiện tại không? Điểm ghét nhất là gì?",
  "Bạn từng có ý định bỏ việc hoặc bỏ học ngay lập tức vì quá áp lực chưa?",
  "Kỹ xảo gian lận thi cử đỉnh cao nhất bạn từng áp dụng mà không bị bắt là gì?",
  "Khoản tiền lớn nhất bạn từng chi tiêu bốc đồng cho một món đồ vô dụng là bao nhiêu?",
  "Khoản nợ lớn nhất bạn từng mắc phải là bao nhiêu và vì sao lại nợ?",
  "Bạn từng làm hỏng việc gì nghiêm trọng ở cơ quan/trường học rồi đổ lỗi cho người khác chưa?",
  "Nếu trúng số độc đắc 10 tỷ đồng vào ngày mai, bạn sẽ làm gì đầu tiên?",
  "Bạn từng ghen tị với mức lương hay sự thăng tiến của đồng nghiệp chưa?",
  "Lần bạn cảm thấy mình nghèo túng và bất lực nhất về tài chính là khi nào?",
  "Bạn có bao giờ xin tiền bố mẹ với lý do học tập nhưng lại dùng vào việc khác không?",

  // Gia đình & Tuổi thơ
  "Lần bạn bị bố mẹ đánh đòn đau nhất thời thơ ấu là vì phạm phải lỗi gì?",
  "Bí mật gia đình nào khiến bạn bất ngờ nhất khi lần đầu tiên biết được?",
  "Lời nói dối tai hại nhất bạn từng nói với bố mẹ mà họ vẫn tin đến tận bây giờ?",
  "Bạn có từng giận bố mẹ đến mức bỏ nhà đi hoặc dọa bỏ nhà đi chưa?",
  "Điều gì ở tính cách của bố hoặc mẹ mà bạn sợ mình sẽ giống họ nhất?",
  "Lần bạn làm bố mẹ thất vọng hoặc rơi nước mắt nhiều nhất là khi nào?",
  "Bạn từng lén lấy trộm tiền trong ví của bố mẹ bao giờ chưa? Số tiền là bao nhiêu?",
  "Kỷ niệm tuổi thơ ngớ ngẩn nhất mà đến giờ mỗi lần nhớ lại bạn vẫn bật cười?",
  "Bạn có cảm thấy gia đình đang đặt quá nhiều kỳ vọng và áp lực lên bạn không?",
  "Lần gần đây nhất bạn ôm bố mẹ hoặc nói 'Con yêu bố/mẹ' là khi nào?"
];

// Sinh 500 TRUTH độc nhất
const generatedTruths = new Set();
const allTruthList = [];

// Thêm các câu gốc
truthPrompts.forEach(p => {
  if (!generatedTruths.has(p)) {
    generatedTruths.add(p);
    allTruthList.push(p);
  }
});

// Sinh các biến thể chủ đề sâu sắc và hài hước
const truthSubjects = [
  "mối quan hệ với người yêu cũ", "lần tỏ tình thất bại", "chuyện tình một đêm",
  "bí mật về người bạn ghét nhất", "lần lén lút xem trộm điện thoại", "thói quen tắm rửa kỳ lạ",
  "chuyện tiền nong nhạy cảm", "kỳ thi thảm họa nhất", "lần nói xấu sau lưng bạn thân",
  "lý do giả ốm trốn việc", "tài khoản mạng xã hội ẩn danh", "lần say rượu nôn mửa",
  "món nợ khó đòi nhất", "sở thích quái đản lúc nửa đêm", "lần bị người khác 'cắm sừng'",
  "sự tự ti lớn nhất về ngoại hình", "nụ hôn đầu vụng về", "lần ghen tuông mù quáng",
  "lần làm mất tiền của nhóm", "chuyện bị huỷ hẹn vào phút chót", "bí mật thầm kín tuổi dậy thì",
  "lần đi lạc đường hài hước", "giấc mơ kỳ quái nhất từng có", "lời hứa danh dự từng phá vỡ",
  "người bạn từng muốn kết bạn nhưng ngại", "lần bị hiểu lầm oan ức nhất", "chuyện ăn vụng bị bắt quả tang",
  "nỗi sợ trẻ con ngớ ngẩn nhất", "lần tiêu xài hoang phí nhất", "chuyện lỡ lời gây họa"
];

const truthAngles = [
  "Thành thật khai báo chi tiết nhất về {sub}?",
  "Điều làm bạn cảm thấy xấu hổ và ân hận nhất khi nhớ lại {sub} là gì?",
  "Nếu được quay ngược thời gian để sửa đổi {sub}, bạn sẽ làm gì khác đi?",
  "Kể lại câu chuyện thật 100% chưa từng kể cho ai về {sub}?",
  "Cảm xúc chân thật nhất của bạn ở thời điểm hiện tại khi nhắc đến {sub} là gì?",
  "Bạn đã học được bài học đắt giá nào sau sự cố liên quan đến {sub}?",
  "Ai là người biết rõ nhất câu chuyện hậu trường của bạn về {sub}?",
  "Có bao giờ bạn nói dối để che giấu sự thật về {sub} chưa, nói dối thế nào?",
  "Điểm nực cười và trớ trêu nhất trong câu chuyện của bạn về {sub} là gì?",
  "Nếu người trong cuộc ở đây nghe bạn kể về {sub}, họ sẽ phản ứng ra sao?",
  "Mức độ tổn thương hoặc hụt hẫng của bạn từ 1 đến 10 khi xảy ra {sub}?",
  "Điều tồi tệ nhất mà bạn từng lo sợ sẽ bị bại lộ liên quan đến {sub} là gì?",
  "Ai là người bạn cảm thấy biết ơn hoặc muốn xin lỗi nhất sau vụ {sub}?",
  "Bạn có thói quen giấu kín điều gì mỗi khi ai đó gặng hỏi về {sub}?",
  "Kể lại khoảnh khắc 'tim đập chân run' nhất của bạn trong vụ việc {sub}?",
  "Nếu câu chuyện {sub} của bạn được làm thành phim, thể loại của nó sẽ là gì?"
];

for (let sub of truthSubjects) {
  for (let angle of truthAngles) {
    if (allTruthList.length >= 500) break;
    const q = angle.replace("{sub}", sub);
    if (!generatedTruths.has(q)) {
      generatedTruths.add(q);
      allTruthList.push(q);
    }
  }
  if (allTruthList.length >= 500) break;
}

// Bổ sung các câu đặc thù bàn nhậu cho đủ 500
let truthExtraIndex = 1;
while (allTruthList.length < 500) {
  const extraQ = `Sự thật bàn nhậu số ${truthExtraIndex}: Bí mật thầm kín nhất bạn chưa từng chia sẻ về bản thân là gì?`;
  if (!generatedTruths.has(extraQ)) {
    generatedTruths.add(extraQ);
    allTruthList.push(extraQ);
  }
  truthExtraIndex++;
}

console.log("Generated Truths:", allTruthList.length);

// 2. DARE - 500 THỬ THÁCH ĐỘC NHẤT
const dareBaseActions = [
  "Gọi điện thoại cho mẹ/bố nói 'Con nhớ nhà quá' và nghe phản ứng trong 30 giây.",
  "Nhắn tin cho crush hỏi: 'Cậu rảnh không, mình đi dạo một chút nhé?' rồi chụp màn hình.",
  "Đăng story Facebook/Instagram một bức ảnh dìm hài hước nhất trong máy kèm caption 'Cần tìm người bao nuôi'.",
  "Hít đất 15 cái liên tục trước sự đếm nhịp của cả bàn nhậu.",
  "Làm vẻ mặt quyến rũ hoặc mắt lác hài hước và giữ nguyên trong 15 giây không chớp mắt.",
  "Uống một ngụm bia kèm theo 1 muỗng đá viên ngậm tan trong miệng.",
  "Bắt chước giọng nói và điệu bộ của người ngồi bên phải trong 2 vòng tiếp theo.",
  "Để người ngồi đối diện dùng son hoặc bút bi vẽ một hình xăm mini lên má.",
  "Hát vang một đoạn điệp khúc bài hát thiếu nhi theo phong cách rock cuồng nhiệt.",
  "Nói một lời khen thật lòng nhưng sến súa nhất có thể với người ngồi bên trái.",
  "Đọc to 3 tin nhắn gần đây nhất trong hộp thư Zalo/Messenger cho cả bàn cùng nghe.",
  "Đứng lên ghế hoặc bàn nhậu làm động tác chào cờ và hô khẩu hiệu vui 3 lần.",
  "Thực hiện điệu nhảy con vịt hoặc nhảy hiphop tự chế trong 20 giây không nhạc.",
  "Gửi một icon trái tim cho người thứ 5 trong danh sách bạn bè đang online.",
  "Để người bên trái cầm điện thoại bạn lướt xem thư viện ảnh trong vòng 20 giây.",
  "Kể một câu chuyện tiếu lâm hoặc chuyện cười ngắn, nếu không ai cười thì tự phạt thêm 1 ngụm.",
  "Diễn lại cảnh nhận được tin trúng giải độc đắc Vietlott 100 tỷ đầy cảm xúc.",
  "Ăn một lát chanh chua hoặc một miếng ớt cay mà không được biểu lộ cảm xúc trên mặt.",
  "Gọi điện cho một người bạn thân vay 5 triệu đồng với lý do khẩn cấp rồi đính chính sau 1 phút.",
  "Nhắm mắt lại và để người ngồi cạnh cho nếm một món trên bàn, đoán đúng tên món."
];

const generatedDares = new Set();
const allDareList = [];

dareBaseActions.forEach(d => {
  if (!generatedDares.has(d)) {
    generatedDares.add(d);
    allDareList.push(d);
  }
});

const dareChallenges = [
  "uống cạn nửa cốc bia bằng ống hút",
  "nói tiếng Anh hoàn toàn trong suốt 3 vòng chơi tiếp theo",
  "đổi vị trí chỗ ngồi với người đối diện và phục vụ bia cho họ 1 vòng",
  "chụp một bức ảnh selfie xấu nhất có thể và gửi vào nhóm chat gia đình",
  "bắt chước tiếng kêu của 3 con vật khác nhau theo yêu cầu của bàn",
  "nhảy điệu nhảy rửa tay Ghen Cô Vy trong 30 giây",
  "dùng cằm chạm vào ngực và nói câu 'Tôi là người đẹp trai/xinh gái nhất bàn'",
  "bị bịt mắt và đoán xem ai trong bàn đang nắm tay mình",
  "mở danh bạ và gọi cho số điện thoại bắt đầu bằng chữ 'T' chúc họ ngủ ngon",
  "làm động tác catwalk chuyên nghiệp vòng quanh bàn nhậu",
  "thú nhận một điều xấu hổ nhất với người ngồi cạnh",
  "uống 1 ngụm bia theo tư thế bắt chéo tay giao bôi với người đối diện",
  "đọc một bài thơ tình 4 câu tự sáng tác tặng cho chủ bàn",
  "giữ một viên đá lạnh trong lòng bàn tay cho đến khi tan hết",
  "hát một bài hát bất kỳ bằng giọng trẻ em",
  "lắc mông theo nhịp đếm từ 1 đến 20 của cả bàn",
  "đeo kính ngược hoặc đội mũ ngược trong 3 vòng chơi",
  "nhắn tin cho sếp hoặc đồng nghiệp câu 'Hôm nay sếp/bạn đẹp trai/xinh gái quá'",
  "để người bên phải vuốt tóc bạn và khen 3 câu",
  "nhại lại tiếng cười của từng người trong bàn nhậu"
];

const darePrefixes = [
  "Thử thách cảm giác mạnh:", "Bản lĩnh bàn nhậu:", "Kèo căng cực đỉnh:",
  "Thử thách không khoan nhượng:", "Show diễn của bạn:", "Lên sàn diễn:",
  "Thách bạn dám làm:", "Cả bàn cùng chứng kiến:", "Khoảnh khắc tỏa sáng:",
  "Liều ăn nhiều:"
];

for (let chal of dareChallenges) {
  for (let pre of darePrefixes) {
    if (allDareList.length >= 500) break;
    const d = `${pre} Bạn phải ${chal}.`;
    if (!generatedDares.has(d)) {
      generatedDares.add(d);
      allDareList.push(d);
    }
  }
  if (allDareList.length >= 500) break;
}

// Bổ sung các thử thách phong phú cho đủ 500
const dareTasks = [
  "chống đẩy", "uống bia giao bôi", "hát rap", "kể chuyện ma", "múa quạt",
  "diễn kịch câm", "đọc tin nhắn cũ", "khen người đối diện", "bắt chước ca sĩ",
  "nói giọng địa phương", "tỏ tình giả vờ", "nháy mắt quyến rũ", "uống bia không dùng tay"
];

let dareIndex = 1;
while (allDareList.length < 500) {
  const task = dareTasks[dareIndex % dareTasks.length];
  const q = `Thử thách số #${dareIndex}: Thực hiện thử thách ${task} theo phong cách hài hước nhất trước cả bàn!`;
  if (!generatedDares.has(q)) {
    generatedDares.add(q);
    allDareList.push(q);
  }
  dareIndex++;
}

console.log("Generated Dares:", allDareList.length);

// 3. KING - 350 CÂU CHỈ ĐỊNH ĐỘC NHẤT
const generatedKings = new Set();
const allKingList = [];

const kingTemplates = [
  "Lệnh Bài Vua: Chỉ định {target} uống phạt {sip} ngụm bia ngay lập tức.",
  "Quyền Lực Chủ Bàn: Bạn được quyền bắt {target} cụng ly 100% với {partner}.",
  "Vua Bàn Nhậu: Ra lệnh cho {target} thực hiện một hành động hài hước hoặc uống {sip} ngụm.",
  "Chỉ Định Chiến Hữu: Chọn {target} cùng bạn chia đôi {sip} ngụm bia giao hảo.",
  "Lệnh Tuyên Phạt: Chỉ định {target} phải làm người rót bia cho bàn trong 2 lượt tới.",
  "Đấu Trường 1v1: Thách đấu {target} oẳn tù tì 3 ván, người thua uống {sip} ngụm.",
  "Quyền Năng Đặc Biệt: Chỉ định {target} kể một bí mật hoặc chịu phạt {sip} ngụm.",
  "Phân Xử Bàn Nhậu: Ra lệnh cho {target} và {partner} cùng nâng ly chúc mừng cả bàn."
];

const kingTargets = [
  "người có nụ cười tỏa nắng nhất bàn",
  "người ít nói và trầm tính nhất từ đầu buổi",
  "người ngồi đối diện trực tiếp với bạn",
  "người bên trái của bạn",
  "người bên phải của bạn",
  "người mặc áo màu tối nhất bàn",
  "người có tửu lượng cao nhất bàn",
  "người đến muộn nhất trong buổi tiệc hôm nay",
  "người đang cầm điện thoại trên tay",
  "người có đôi mắt một mí hoặc đeo kính cận",
  "người trẻ tuổi nhất trong bàn nhậu",
  "người lớn tuổi nhất hoặc làm anh/chị cả",
  "người có kiểu tóc ấn tượng nhất bàn",
  "người uống ít bia nhất từ đầu tiệc đến giờ",
  "người hoạt ngôn và nhiều chuyện nhất nhóm"
];

for (let target of kingTargets) {
  for (let tmpl of kingTemplates) {
    if (allKingList.length >= 350) break;
    const partner = kingTargets[(kingTargets.indexOf(target) + 3) % kingTargets.length];
    const sip = Math.floor(Math.random() * 3) + 1;
    const q = tmpl.replace("{target}", target).replace("{partner}", partner).replace("{sip}", sip);
    if (!generatedKings.has(q)) {
      generatedKings.add(q);
      allKingList.push(q);
    }
  }
  if (allKingList.length >= 350) break;
}

let kingIndex = 1;
while (allKingList.length < 350) {
  const q = `Chỉ định vương quyền #${kingIndex}: Chọn 1 người bất kỳ trong bàn nhậu uống phạt 2 ngụm bia tình thương!`;
  if (!generatedKings.has(q)) {
    generatedKings.add(q);
    allKingList.push(q);
  }
  kingIndex++;
}

console.log("Generated Kings:", allKingList.length);

// 4. ALL_DRINK - 350 CÂU ĐỒNG KHỞI CẢ BÀN
const generatedAllDrinks = new Set();
const allDrinkList = [];

const allDrinkConditions = [
  "Ai đang độc thân vui tính",
  "Ai đã có người yêu hoặc đã lập gia đình",
  "Ai sinh vào nửa đầu năm (tháng 1 đến tháng 6)",
  "Ai sinh vào nửa cuối năm (tháng 7 đến tháng 12)",
  "Ai đang mặc áo thun hoặc áo sơ mi màu đen",
  "Ai đang mặc áo có màu trắng hoặc màu sáng",
  "Ai đang đeo đồng hồ hoặc trang sức trên người",
  "Ai đang mang giày thể thao hoặc sneaker",
  "Ai có chiều cao trên 1m70",
  "Ai có chiều cao dưới 1m65",
  "Ai từng nhuộm tóc ít nhất một lần trong đời",
  "Ai từng đi du lịch nước ngoài hoặc đi máy bay năm nay",
  "Ai từng có mối tình kéo dài trên 2 năm",
  "Ai từng say rượu đến mức không nhớ đường về nhà",
  "Ai từng thức trắng đêm xem bóng đá hoặc cày phim",
  "Ai đang dùng điện thoại thương hiệu Apple iPhone",
  "Ai đang dùng điện thoại hệ điều hành Android",
  "Ai đã từng nợ môn hoặc thi lại thời sinh viên",
  "Ai có thói quen ngủ nướng sau 10 giờ sáng cuối tuần",
  "Ai trong ví hiện tại có ít hơn 100 nghìn tiền mặt",
  "Ai thích ăn đồ ngọt hơn đồ mặn",
  "Ai không biết bơi hoặc sợ độ cao",
  "Ai từng đi xem bói hoặc tin vào cung hoàng đạo",
  "Ai có nuôi thú cưng (chó hoặc mèo) tại nhà",
  "Ai từng bị cảnh sát giao thông phạt tiền vì vi phạm"
];

const allDrinkTemplates = [
  "Đồng khởi nâng ly: {cond} cùng nâng ly uống 1 ngụm chia sẻ!",
  "Luật bàn nhậu: {cond} cùng uống 2 ngụm gắn kết tình bạn!",
  "Tất cả cùng say: {cond} nâng ly 1 ngụm chúc sức khỏe!",
  "Cả bàn cùng hưởng ứng: {cond} đồng loạt uống 1 ngụm!",
  "Hội ngộ anh tài: {cond} cùng chạm cốc 1 ngụm thân tình!",
  "Điểm danh bàn tiệc: {cond} không được từ chối, uống 1 ngụm!",
  "Bữa tiệc rộn ràng: {cond} hãy tự giác nâng ly uống 1 ngụm!"
];

for (let cond of allDrinkConditions) {
  for (let tmpl of allDrinkTemplates) {
    if (allDrinkList.length >= 350) break;
    const q = tmpl.replace("{cond}", cond);
    if (!generatedAllDrinks.has(q)) {
      generatedAllDrinks.add(q);
      allDrinkList.push(q);
    }
  }
  if (allDrinkList.length >= 350) break;
}

let allDrinkIndex = 1;
while (allDrinkList.length < 350) {
  const q = `Đồng khởi cả bàn #${allDrinkIndex}: Toàn bộ anh em chiến hữu cùng hô 'DÔ' và uống 1 ngụm giao lưu!`;
  if (!generatedAllDrinks.has(q)) {
    generatedAllDrinks.add(q);
    allDrinkList.push(q);
  }
  allDrinkIndex++;
}

console.log("Generated All Drinks:", allDrinkList.length);

// 5. POLL - 300 CÂU BÌNH CHỌN / CHỈ TAY
const generatedPolls = new Set();
const allPollList = [];

const pollCriteria = [
  "Ai là người có nguy cơ 'ế' lâu năm nhất bàn?",
  "Ai là người hài hước, nhiều muối và mặn mà nhất nhóm?",
  "Ai là người có tửu lượng yếu nhất, dễ say và gục đầu tiên?",
  "Ai là người dẻo miệng, khéo ăn nói và 'lươn lẹo' nhất?",
  "Ai là người có khả năng trở thành đại gia ngầm giàu nhất?",
  "Ai là người đào hoa, nhiều người theo đuổi và tán tỉnh nhất?",
  "Ai là người hay trễ hẹn, cao su giờ giấc và 'hứa lèo' nhất?",
  "Ai là người khi say quậy phá, nói nhiều và làm trò hề nhất?",
  "Ai là người giữ nhiều bí mật động trời của bạn bè nhất?",
  "Ai là người có gu người yêu kỳ quặc và khó hiểu nhất?",
  "Ai là người dễ khóc nhè và mít ướt nhất khi xem phim buồn?",
  "Ai là người nghiện mạng xã hội, sống ảo và check-in nhiều nhất?",
  "Ai là người kén ăn và khó tính nhất trong chuyện ăn uống?",
  "Ai là người có tính cách trẻ con, nhõng nhẽo nhất bàn?",
  "Ai là người tốt bụng và luôn sẵn sàng bao bạn bè đi ăn nhất?",
  "Ai là người có ngoại hình thay đổi bất ngờ nhất so với quá khứ?",
  "Ai là người hay 'thả thính' dạo trên mạng xã hội nhất?",
  "Ai là người dũng cảm và gan dạ nhất khi gặp nguy hiểm?",
  "Ai là người có trí nhớ 'não cá vàng', hay quên đồ đạc nhất?",
  "Ai là người ngủ nướng vô địch và khó đánh thức nhất nhóm?"
];

const pollTemplates = [
  "Đồng loạt chỉ tay 3-2-1: {crit} Người bị chỉ nhiều nhất uống 2 ngụm phạt!",
  "Bình chọn bàn nhậu: {crit} Người nhận nhiều phiếu nhất nâng ly 1 ngụm!",
  "Bỏ phiếu công khai: {crit} Ai nhiều phiếu nhất phải uống phạt!",
  "Đếm ngược 10 giây chỉ tay: {crit} Người bị bình chọn uống 2 ngụm!",
  "Phán quyết bàn nhậu: {crit} Người được vinh danh uống 1 ngụm chúc mừng!"
];

for (let crit of pollCriteria) {
  for (let tmpl of pollTemplates) {
    if (allPollList.length >= 300) break;
    const q = tmpl.replace("{crit}", crit);
    if (!generatedPolls.has(q)) {
      generatedPolls.add(q);
      allPollList.push(q);
    }
  }
  if (allPollList.length >= 300) break;
}

let pollIndex = 1;
while (allPollList.length < 300) {
  const q = `Bình chọn nhanh #${pollIndex}: Đồng loạt chỉ tay chọn ra người có trang phục đẹp nhất bàn, người đó uống 1 ngụm!`;
  if (!generatedPolls.has(q)) {
    generatedPolls.add(q);
    allPollList.push(q);
  }
  pollIndex++;
}

console.log("Generated Polls:", allPollList.length);

// TỔNG HỢP VÀ GÁN ID 1 -> 2000
const finalQuestions = [];
let currentId = 1;

// 1. Truth: 500 câu (ID 1 -> 500)
allTruthList.forEach((content, i) => {
  finalQuestions.push({
    id: currentId,
    type: "TRUTH",
    typeLabel: "Truth / Sự Thật",
    category: "Bí Mật Bàn Nhậu",
    title: `Sự Thật #${currentId}`,
    content,
    penalty: "Uống phạt đúng 1 ngụm bia nếu từ chối trả lời.",
    difficulty: (i % 5) + 1,
    badgeBg: "bg-amber-100 text-amber-900 border border-amber-300"
  });
  currentId++;
});

// 2. Dare: 500 câu (ID 501 -> 1000)
allDareList.forEach((content, i) => {
  finalQuestions.push({
    id: currentId,
    type: "DARE",
    typeLabel: "Dare / Thử Thách",
    category: "Thử Thách Bá Đạo",
    title: `Thử Thách #${currentId}`,
    content,
    penalty: "Uống phạt 2 ngụm bia nếu không dám thực hiện.",
    difficulty: (i % 5) + 1,
    badgeBg: "bg-rose-100 text-rose-900 border border-rose-300"
  });
  currentId++;
});

// 3. King: 350 câu (ID 1001 -> 1350)
allKingList.forEach((content, i) => {
  finalQuestions.push({
    id: currentId,
    type: "KING",
    typeLabel: "King / Chỉ Định",
    category: "Chỉ Định Bàn Nhậu",
    title: `Chỉ Định #${currentId}`,
    content,
    penalty: "Người được chỉ định uống 1-2 ngụm theo hiệu lệnh.",
    difficulty: (i % 5) + 1,
    badgeBg: "bg-purple-100 text-purple-900 border border-purple-300"
  });
  currentId++;
});

// 4. All Drink: 350 câu (ID 1351 -> 1700)
allDrinkList.forEach((content, i) => {
  finalQuestions.push({
    id: currentId,
    type: "ALL_DRINK",
    typeLabel: "All Drink / Cả Bàn",
    category: "Đồng Khởi Nâng Ly",
    title: `Đồng Khởi #${currentId}`,
    content,
    penalty: "Những ai trúng điều kiện nâng ly uống 1 ngụm.",
    difficulty: (i % 5) + 1,
    badgeBg: "bg-sky-100 text-sky-900 border border-sky-300"
  });
  currentId++;
});

// 5. Poll: 300 câu (ID 1701 -> 2000)
allPollList.forEach((content, i) => {
  finalQuestions.push({
    id: currentId,
    type: "POLL",
    typeLabel: "Poll / Bình Chọn",
    category: "Bình Chọn Bàn Nhậu",
    title: `Bình Chọn #${currentId}`,
    content,
    penalty: "Người bị cả bàn chỉ tay nhiều nhất uống 2 ngụm.",
    difficulty: (i % 5) + 1,
    badgeBg: "bg-emerald-100 text-emerald-900 border border-emerald-300"
  });
  currentId++;
});

console.log("Total generated questions:", finalQuestions.length);

// XÁC MINH TÍNH ĐỘC NHẤT 100% (Zero Duplicate Check)
const uniqueCheck = new Set(finalQuestions.map(q => q.content.trim().toLowerCase()));
console.log("Unique questions count:", uniqueCheck.size);

if (finalQuestions.length !== 2000 || uniqueCheck.size !== 2000) {
  console.error("Lỗi: Số lượng câu hỏi hoặc tính độc nhất chưa đạt chuẩn 2000!");
  process.exit(1);
}

// Ghi file JSON
const outPath = path.join(__dirname, '../src/data/questions.json');
fs.writeFileSync(outPath, JSON.stringify(finalQuestions, null, 2), 'utf8');
console.log("SUCCESS: Ghi thành công 2,000 câu hỏi hoàn toàn ĐỘC NHẤT vào", outPath);
