const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rounds = [
  {
    id: 1,
    title: 'Vòng 1: Đêm Trước Đổi Mới (Bối cảnh lịch sử)',
    scenario: 'Đất nước đang ở cuối thập niên 1980, lạm phát phi mã, hàng hóa khan hiếm do cơ chế bao cấp, ngăn sông cấm chợ. Nhân dân thiếu gạo ăn.',
    options: [
      { id: 'A', text: 'Giữ nguyên cơ chế kế hoạch hóa tập trung, siết chặt kỷ luật phân phối.', effects: { economy: -20, social: -10, environment: 0 }, explanation: 'Giữ nguyên bao cấp chỉ làm trầm trọng thêm sự thiếu hụt hàng hóa và lạm phát phi mã.' },
      { id: 'B', text: 'Xóa bỏ ngăn sông cấm chợ, thừa nhận kinh tế hàng hóa, cho phép người dân tự do lưu thông nông sản.', effects: { economy: 20, social: 20, environment: 0 }, explanation: 'Đây là tiền đề đổi mới lịch sử, giải phóng sức sản xuất và lưu thông hàng hóa tự do.' },
      { id: 'C', text: 'Đóng cửa biên giới, tự cung tự cấp tuyệt đối.', effects: { economy: -40, social: -20, environment: 0 }, explanation: 'Tự cung tự cấp tuyệt đối đẩy nền kinh tế vào khủng hoảng cô lập nghiêm trọng hơn.' }
    ]
  },
  {
    id: 2,
    title: 'Vòng 2: Bản Nhạc Của Thị Trường (Cơ chế vận hành)',
    scenario: 'Nền kinh tế bắt đầu chuyển sang KTTT. Các nhóm muốn quyết định giá bán mặt hàng thiết yếu (như gạo, quần áo).',
    options: [
      { id: 'A', text: 'Nhà nước tiếp tục áp đặt một mức giá cố định cho toàn quốc.', effects: { economy: -20, social: 0, environment: 0 }, explanation: 'Mệnh lệnh hành chính triệt tiêu động lực sản xuất và làm phát sinh thị trường chợ đen.' },
      { id: 'B', text: 'Thả nổi hoàn toàn, để các thương lái tự do đẩy giá lên bao nhiêu tùy thích.', effects: { economy: 20, social: -30, environment: 0 }, explanation: 'Thả nổi cực đoan dẫn đến đầu cơ tích trữ, giá cả leo thang làm người nghèo kêu than.' },
      { id: 'C', text: 'Để giá cả hình thành tự do theo Quy luật Cung - Cầu, nhưng Nhà nước có quỹ dự trữ để can thiệp nếu giá biến động quá cực đoan.', effects: { economy: 20, social: 10, environment: 0 }, explanation: 'Vận dụng đúng quy luật cung cầu nhưng vẫn có sự điều tiết vĩ mô của Nhà nước để bảo vệ an sinh xã hội.' }
    ]
  },
  {
    id: 3,
    title: 'Vòng 3: Động Lực Từ Cạnh Tranh (Tính ưu việt của KTTT)',
    scenario: 'Các doanh nghiệp cũ sản xuất hàng hóa kém chất lượng, mẫu mã xấu vì không có ai thi đua. Khối tư nhân đề xuất xin phép tham gia sản xuất để cạnh tranh.',
    options: [
      { id: 'A', text: 'Cấm tư nhân để bảo hộ doanh nghiệp nhà nước.', effects: { economy: -20, social: 0, environment: 0 }, explanation: 'Bảo hộ độc quyền làm doanh nghiệp trì trệ, sản phẩm kém chất lượng và triệt tiêu động lực phát triển.' },
      { id: 'B', text: 'Cho phép tư nhân tham gia, thúc đẩy Quy luật Cạnh tranh để kích thích đổi mới công nghệ và giảm giá thành.', effects: { economy: 30, social: 0, environment: -10 }, explanation: 'Quy luật cạnh tranh kích thích đổi mới công nghệ và giảm giá thành, tuy nhiên việc sản xuất công nghiệp ồ ạt có thể gây áp lực lên môi trường.' },
      { id: 'C', text: 'Cho phép tư nhân tham gia nhưng đánh thuế kinh doanh 80% để họ không giàu hơn doanh nghiệp nhà nước.', effects: { economy: -10, social: 0, environment: 0 }, explanation: 'Đánh thuế quá cao triệt tiêu hoàn toàn động lực đầu tư và kinh doanh của khối tư nhân.' }
    ]
  },
  {
    id: 4,
    title: 'Vòng 4: Ai Giữ Vai Trò Chủ Đạo? (Tính chất sở hữu)',
    scenario: 'Hệ thống lưới điện quốc gia và nguồn cung nước sạch cần được đầu tư nâng cấp lớn.',
    options: [
      { id: 'A', text: 'Bán đứt toàn bộ hệ thống điện, nước cho các tập đoàn tư nhân nước ngoài quản lý.', effects: { economy: 30, social: -30, environment: 0 }, explanation: 'Tư nhân hóa hoàn toàn hạ tầng thiết yếu giúp tăng vốn đầu tư nhưng làm mất quyền kiểm soát giá, khiến giá điện nước tăng phi mã.' },
      { id: 'B', text: 'Để Kinh tế Nhà nước nắm giữ và đầu tư (giữ vai trò chủ đạo) nhằm điều tiết giá rẻ cho người dân, đồng thời kêu gọi tư nhân làm các dự án năng lượng phụ trợ.', effects: { economy: 10, social: 20, environment: 0 }, explanation: 'Kinh tế Nhà nước nắm các lĩnh vực then chốt (chủ đạo) bảo đảm an sinh, đồng thời huy động nguồn lực tư nhân hỗ trợ.' },
      { id: 'C', text: 'Không nâng cấp nữa, có bao nhiêu dùng bấy nhiêu.', effects: { economy: -20, social: 0, environment: 0 }, explanation: 'Hạ tầng yếu kém làm tê liệt các hoạt động kinh tế và sản xuất khác.' }
    ]
  },
  {
    id: 5,
    title: 'Vòng 5: Sức Mạnh Doanh Nghiệp Tư Nhân (Thành phần kinh tế)',
    scenario: 'Khối kinh tế tư nhân trong nước đang bùng nổ, tạo ra phần lớn việc làm mới nhưng đang vướng rào cản về cơ chế hành chính và tiếp cận nguồn lực đất đai, vốn.',
    options: [
      { id: 'A', text: 'Tập trung tối đa mọi nguồn lực, chính sách ưu đãi tài chính để xây dựng các Tập đoàn kinh tế tư nhân tư bản quy mô lớn làm "mũi nhọn" kéo nền kinh tế đi lên.', effects: { economy: 30, social: -20, environment: 0 }, explanation: 'Bẫy Chaebol: Tăng trưởng nhanh nhưng dễ dẫn đến bất bình đẳng và tài phiệt thao túng, đánh mất vai trò chủ đạo của kinh tế Nhà nước.' },
      { id: 'B', text: 'Thực hiện nhất quán chính sách kinh tế nhiều thành phần, hoàn thiện thể chế để kinh tế tư nhân là một động lực quan trọng, bình đẳng về quyền tiếp cận nguồn lực.', effects: { economy: 20, social: 10, environment: 0 }, explanation: 'Kinh tế tư nhân là động lực quan trọng, phát triển bình đẳng trong nền kinh tế nhiều thành phần theo đúng lý luận định hướng XHCN.' },
      { id: 'C', text: 'Quy định tỷ lệ trần về quy mô vốn và lao động đối với doanh nghiệp tư nhân nhằm ngăn chặn sự tích tụ tư bản quá mức, bảo đảm không làm phai nhạt định hướng XHCN.', effects: { economy: -30, social: 0, environment: 0 }, explanation: 'Bẫy tư duy bao cấp: Khống chế quy mô kìm hãm lực lượng sản xuất phát triển, gây suy thoái kinh tế vĩ mô.' }
    ]
  },
  {
    id: 6,
    title: 'Vòng 6: Ra Khơi Biển Lớn (Hội nhập quốc tế)',
    scenario: 'Đất nước đứng trước cơ hội ký kết Hiệp định Thương mại Tự do thế hệ mới (CPTPP/EVFTA). Việc này yêu cầu phải mở cửa hoàn toàn thị trường mua sắm công và công nhận các tiêu chuẩn lao động quốc tế.',
    options: [
      { id: 'A', text: 'Ký kết ngay lập tức, chấp nhận áp dụng liệu pháp "sốc" để thị trường tự do hóa toàn diện, buộc các doanh nghiệp trong nước phải tự bơi hoặc tự đào thái để trưởng thành.', effects: { economy: -10, social: -30, environment: 0 }, explanation: 'Tự do hóa toàn diện quá nhanh khiến doanh nghiệp nội địa chưa kịp chuẩn bị sẽ sụp đổ hàng loạt.' },
      { id: 'B', text: 'Ký kết có lộ trình, kết hợp chủ động hội nhập kinh tế quốc tế với nâng cao năng lực tự chủ của nền kinh tế, giữ vững độc lập tự chủ về chính trị và an ninh.', effects: { economy: 30, social: 0, environment: 0 }, explanation: 'Hội nhập quốc tế chủ động, đi đôi với tự chủ kinh tế là đường lối đúng đắn bảo đảm độc lập và phát triển vững chắc.' },
      { id: 'C', text: 'Tuyên bố hoãn ký kết, thiết lập các hàng rào thuế quan kỹ thuật bảo hộ nghiêm ngặt để xây dựng hoàn chỉnh chuỗi cung ứng nội địa trước khi ra biển lớn.', effects: { economy: -20, social: 0, environment: 0 }, explanation: 'Tư duy bế quan tỏa cảng làm đất nước bị cô lập, bỏ lỡ cơ hội vàng và tụt hậu so với thế giới.' }
    ]
  },
  {
    id: 7,
    title: 'Vòng 7: Bài Toán Phân Phối (Quan hệ lợi ích)',
    scenario: 'Tốc độ tăng trưởng GDP rất cao nhưng chỉ số bất bình đẳng (Gini) chạm mức báo động. Khoảng cách thu nhập giữa nhóm 20% giàu nhất và nhóm 20% nghèo nhất ngày càng giãn rộng.',
    options: [
      { id: 'A', text: 'Thực hiện mô hình "tăng trưởng trước, phân phối sau"; chấp nhận bất bình đẳng trong giai đoạn đầu để tích lũy tư bản, tạo động lực kéo con tàu kinh tế đi nhanh hơn.', effects: { economy: 0, social: -30, environment: 0 }, explanation: 'Bẫy tăng trưởng nóng (Đường cong Kuznets): Bất bình đẳng kéo dài gây xung đột xã hội, bất ổn chính trị, hủy hoại mục tiêu công bằng văn minh.' },
      { id: 'B', text: 'Thực hiện chế độ phân phối lấy phân phối theo kết quả lao động và hiệu quả kinh tế làm chủ yếu; gắn tăng trưởng kinh tế với tiến bộ và công bằng xã hội trong từng bước, từng chính sách phát triển.', effects: { economy: 10, social: 20, environment: 0 }, explanation: 'Gắn tăng trưởng kinh tế với công bằng xã hội là bản chất ưu việt của định hướng XHCN.' },
      { id: 'C', text: 'Áp dụng chính sách điều tiết thu nhập triệt để: Đánh thuế tài sản lũy tiến cực cao đối với giới thượng lưu và lập tức bao cấp toàn diện y tế, giáo dục, nhà ở miễn phí cho toàn dân.', effects: { economy: -40, social: 10, environment: 0 }, explanation: 'Bẫy cào bằng: Đánh thuế triệt tiêu động lực sáng tạo, đưa đất nước quay lại thời kỳ bao cấp nghèo nàn.' }
    ]
  },
  {
    id: 8,
    title: 'Vòng 8: Bóng Ma Độc Quyền (Khuyết tật thị trường)',
    scenario: 'Một Tập đoàn công nghệ - viễn thông lớn chiếm 75% thị phần trong nước, bắt đầu có biểu hiện tăng giá dịch vụ vô căn cứ và chèn ép, không cho các doanh nghiệp khởi nghiệp (Startup) kết nối vào hệ tầng hạ tầng của họ.',
    options: [
      { id: 'A', text: 'Tôn trọng quyền tự do kinh doanh và quy luật cạnh tranh của thị trường; Tập đoàn này mạnh lên là do họ giỏi, nhà nước không nên can thiệp làm méo mó dòng chảy thị trường.', effects: { economy: 0, social: -30, environment: 0 }, explanation: 'Dung túng độc quyền bóp nghẹt thị trường, khiến người dân chịu thiệt và chặn đứng cơ hội của các doanh nghiệp trẻ.' },
      { id: 'B', text: 'Sử dụng vai trò Nhà nước pháp quyền để quản lý, giám sát thông qua Luật Cạnh tranh; kiểm soát độc quyền, xử phạt hành vi lạm dụng vị trí thống lĩnh thị trường để bảo vệ môi trường cạnh tranh lành mạnh.', effects: { economy: 10, social: 20, environment: 0 }, explanation: 'Nhà nước quản lý thị trường bằng pháp luật cạnh tranh để kiến tạo sân chơi công bằng và lành mạnh cho tất cả các bên.' },
      { id: 'C', text: 'Tiến hành quốc hữu hóa tập đoàn này, chuyển toàn bộ cổ phần về cho Nhà nước quản lý trực tiếp nhằm bảo đảm quyền lợi tối cao cho nhân dân và giữ vững vai trò chủ đạo.', effects: { economy: -20, social: 0, environment: 0 }, explanation: 'Can thiệp thô bạo bằng cách hành chính hóa doanh nghiệp triệt tiêu tính cạnh tranh tự nhiên và đổi mới sáng tạo.' }
    ]
  },
  {
    id: 9,
    title: 'Vòng 9: Thảm Họa Sông Xanh (Khuyết tật môi trường)',
    scenario: 'Các dòng sông lớn gần khu công nghiệp bị ô nhiễm nặng do doanh nghiệp lén xả thải. Các tổ chức quốc tế đe dọa sẽ áp "thuế carbon" và tẩy chay hàng hóa xuất khẩu của nước bạn nếu không sửa đổi quy trình.',
    options: [
      { id: 'A', text: 'Chấp nhận giảm một phần tốc độ tăng trưởng kinh tế ngắn hạn; kiên quyết không đánh đổi môi trường lấy tăng trưởng kinh tế, áp dụng các chế tài kinh tế xanh và bắt buộc doanh nghiệp chuyển đổi công nghệ tuần hoàn.', effects: { economy: -10, social: 10, environment: 30 }, explanation: 'Phát triển bền vững đòi hỏi không đánh đổi môi trường lấy tăng trưởng kinh tế ngắn hạn, đáp ứng xu thế kinh tế xanh toàn cầu.' },
      { id: 'B', text: 'Thành lập quỹ ngân sách nhà nước để chi trả toàn bộ chi phí xử lý ô nhiễm và làm sạch các dòng sông, nhằm chia sẻ gánh nặng tài chính, giúp doanh nghiệp yên tâm tập trung sản xuất.', effects: { economy: -30, social: 0, environment: -10 }, explanation: 'Lấy tiền thuế của dân bù đắp sai phạm của doanh nghiệp xả thải tạo ra tiền lệ xấu và kìm hãm chuyển đổi xanh.' },
      { id: 'C', text: 'Tạm thời đình chỉ hoạt động của toàn bộ các ngành công nghiệp nặng có nguy cơ xả thải cao cho đến khi xây dựng xong hệ thống giám sát môi trường tự động trên toàn quốc.', effects: { economy: -40, social: 0, environment: 10 }, explanation: 'Tư duy cực đoan làm đứt gãy sản xuất công nghiệp đột ngột, gây thiệt hại nghiêm trọng cho nền kinh tế vĩ mô.' }
    ]
  },
  {
    id: 10,
    title: 'Vòng 10: Khủng Hoảng Toàn Cầu (Kiến tạo vĩ mô)',
    scenario: 'Một cuộc khủng hoảng tài chính toàn cầu nổ ra khiến thị trường xuất khẩu bị đóng băng. Hàng loạt doanh nghiệp thiếu dòng tiền, có nguy cơ phá sản dây chuyền, hệ thống ngân hàng đối mặt với nợ xấu tăng vọt.',
    options: [
      { id: 'A', text: 'Thực hiện chính sách "thắt lưng buộc bụng", thắt chặt tiền tệ và giảm chi tiêu công để bảo vệ an toàn ngân sách quốc gia, mặc cho thị trường tự thực hiện quy trình thanh lọc tự nhiên.', effects: { economy: -30, social: -30, environment: 0 }, explanation: 'Thắt lưng buộc bụng cực đoan đẩy doanh nghiệp vào thế phá sản hàng loạt và an sinh xã hội sụp đổ nhanh hơn.' },
      { id: 'B', text: 'Sử dụng các công cụ điều tiết vĩ mô: Thực hiện chính sách tiền tệ và tài khóa chủ động, linh hoạt (như giảm thuế, khoanh nợ, kích cầu đầu tư công) để giữ vững ổn định vĩ mô, đồng thời hỗ trợ an sinh xã hội cho người lao động.', effects: { economy: 20, social: 20, environment: 0 }, explanation: 'Nhà nước sử dụng chính sách tài khóa và tiền tệ chủ động để giải cứu thị trường, ổn định vĩ mô và duy trì an sinh.' },
      { id: 'C', text: 'Ban hành lệnh khẩn cấp áp đặt trần giá sỉ cho mọi loại hàng hóa và tạm thời cấm các doanh nghiệp sa thải lao động để bảo vệ tuyệt đối đời sống nhân dân trong khủng hoảng.', effects: { economy: -40, social: -20, environment: 0 }, explanation: 'Sử dụng mệnh lệnh hành chính triệt tiêu khả năng cân đối chi phí của doanh nghiệp, khiến họ sụp đổ nhanh hơn.' }
    ]
  }
];

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function createDefaultTeams(teamNames) {
  return teamNames
    .filter(Boolean)
    .slice(0, 10)
    .map((name, index) => ({
      id: `team-${index + 1}`,
      name: name.trim(),
      score: { economy: 50, social: 50, environment: 50 },
      answer: null,
      eliminated: false
    }));
}

function getTeamPlayers(room, teamId) {
  return room.players.filter((player) => player.teamId === teamId);
}

function recordPlayerAnswer(room, teamId, playerId, answer) {
  room.playerAnswers = room.playerAnswers || {};
  room.playerAnswers[teamId] = room.playerAnswers[teamId] || {};
  if (room.playerAnswers[teamId][playerId]) return false;
  room.playerAnswers[teamId][playerId] = answer;
  return true;
}

function resolveTeamAnswer(room, teamId) {
  const answers = room.playerAnswers?.[teamId] ? Object.values(room.playerAnswers[teamId]) : [];
  if (!answers.length) return null;

  const counts = answers.reduce((map, answer) => {
    map[answer] = (map[answer] || 0) + 1;
    return map;
  }, {});

  // Chọn đáp án có số vote nhiều nhất. Nếu có nhiều đáp án cùng số vote cao nhất thì chọn ngẫu nhiên.
  let maxCount = 0;
  Object.values(counts).forEach((count) => {
    if (count > maxCount) maxCount = count;
  });

  const topAnswers = Object.entries(counts)
    .filter(([, count]) => count === maxCount)
    .map(([answer]) => answer);

  return topAnswers[Math.floor(Math.random() * topAnswers.length)];
}

function getCorrectOption(roundData) {
  if (!roundData || !roundData.options) return null;
  // compute option with highest total effect (economy+social+environment)
  let best = null;
  let bestScore = -Infinity;
  roundData.options.forEach((opt) => {
    const score = (opt.effects?.economy || 0) + (opt.effects?.social || 0) + (opt.effects?.environment || 0);
    if (score > bestScore) {
      bestScore = score;
      best = opt.id;
    }
  });
  return best;
}

function allPlayersAnswered(room) {
  return room.players.every((player) => {
    return typeof room.playerAnswers?.[player.teamId]?.[player.id] === 'string';
  });
}

// Tóm tắt playerAnswers thành {teamId: {A:n, B:n, C:n}} để giảm payload
function summarizeAnswers(playerAnswers) {
  const summary = {};
  for (const teamId in playerAnswers) {
    const counts = { A: 0, B: 0, C: 0 };
    for (const ans of Object.values(playerAnswers[teamId])) {
      if (counts[ans] !== undefined) counts[ans]++;
    }
    summary[teamId] = counts;
  }
  return summary;
}

// Số lượng player đã trả lời trong mỗi team
function countAnswered(playerAnswers) {
  const result = {};
  for (const teamId in playerAnswers) {
    result[teamId] = Object.keys(playerAnswers[teamId]).length;
  }
  return result;
}

function serializeRoom(room, forSocket) {
  // Chỉ gửi round data khi cần (lần đầu join hoặc khi round thay đổi)
  const includeFullRound = forSocket === 'full';
  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    status: room.status,
    // Gửi teams dưới dạng compact: chỉ các field cần thiết
    teams: room.teams.map(t => ({
      id: t.id,
      name: t.name,
      score: t.score,
      answer: t.answer,
      eliminated: t.eliminated,
      correct: t.correct
    })),
    players: room.players,
    currentRound: room.currentRound,
    totalRounds: rounds.length,
    // Chỉ gửi round data đầy đủ khi join/rejoin; broadcast chỉ gửi roundIndex
    round: includeFullRound
      ? (room.currentRound > 0 ? rounds[room.currentRound - 1] : null)
      : undefined,
    roundIndex: room.currentRound, // client dùng để cache round data
    roundStartedAt: room.roundStartedAt,
    roundDuration: room.roundDuration,
    roundResult: room.roundResult,
    roundAnswers: room.roundAnswers,
    // Thay vì gửi toàn bộ playerAnswers (50 keys × n players),
    // chỉ gửi tóm tắt vote count per option
    answerSummary: summarizeAnswers(room.playerAnswers || {}),
    answeredCount: countAnswered(room.playerAnswers || {}),
    // Gửi myAnswer riêng cho từng client qua emit cá nhân, không qua broadcast
    roundCorrectAnswer: room.roundCorrectAnswer || null
  };
}

// Broadcast nhẹ: không có round data đầy đủ
function broadcastRoom(room) {
  io.to(room.id).emit('room:update', serializeRoom(room, 'broadcast'));
}

// Gửi full data cho 1 socket (khi join/rejoin)
function sendFullRoom(socket, room) {
  const data = serializeRoom(room, 'full');
  // Đính kèm myAnswer riêng cho player này
  const player = room.players.find(p => p.id === socket.id);
  if (player) {
    data.myAnswer = room.playerAnswers?.[player.teamId]?.[player.id] || null;
  }
  socket.emit('room:joined-data', data);
}

// Debounce broadcast khi nhiều người submit cùng lúc
const broadcastDebounce = new Map(); // roomId -> timeoutHandle

function debouncedBroadcast(room, delay = 200) {
  if (broadcastDebounce.has(room.id)) return; // đã có pending broadcast
  broadcastDebounce.set(room.id, setTimeout(() => {
    broadcastDebounce.delete(room.id);
    broadcastRoom(room);
  }, delay));
}

function clearRoundTimer(room) {
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
  if (room.tickHandle) {
    clearInterval(room.tickHandle);
    room.tickHandle = null;
  }
  if (room.transitionHandle) {
    clearTimeout(room.transitionHandle);
    room.transitionHandle = null;
  }
}

function finalizeRound(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'playing') return;

  clearRoundTimer(room);

  const roundData = rounds[room.currentRound - 1];
  room.teams.forEach((team) => {
    const resolved = resolveTeamAnswer(room, team.id);
    if (resolved) {
      room.roundAnswers[team.id] = resolved;
      team.answer = resolved;
    }

    // mark whether the resolved team answer matches the correct answer
    team.correct = room.roundCorrectAnswer ? team.answer === room.roundCorrectAnswer : false;

    const answer = room.roundAnswers[team.id];
    if (!answer) return;

    const option = roundData.options.find((item) => item.id === answer);
    if (!option) return;

    team.score.economy += option.effects.economy || 0;
    team.score.social += option.effects.social || 0;
    team.score.environment += option.effects.environment || 0;

    team.eliminated = [team.score.economy, team.score.social, team.score.environment].some((value) => value <= 0);
  });

  const finalAnswers = room.teams.reduce((result, team) => {
    if (room.roundAnswers[team.id]) {
      result[team.id] = room.roundAnswers[team.id];
    }
    return result;
  }, {});

  const summaryLines = room.teams.map((team) => {
    const answer = room.roundAnswers[team.id] || 'không có';
    return `${team.name}: ${answer}`;
  });

  room.roundResult = {
    roundNumber: room.currentRound,
    title: roundData.title,
    summary: `Đáp án nhóm: ${summaryLines.join(' | ')}`
  };
  // expose that server-side time is now 0 for clients
  room.serverTimeLeft = 0;
  room.status = 'round-result';
  broadcastRoom(room);
  io.to(room.id).emit('round:ended', { roundAnswers: finalAnswers });
}

function startRound(room, roundNumber) {
  room.currentRound = roundNumber;
  room.status = 'playing';
  room.roundStartedAt = Date.now();
  room.serverTimeLeft = null;
  // determine correct answer for this round
  room.roundCorrectAnswer = getCorrectOption(rounds[roundNumber - 1]);
  room.roundAnswers = {};
  room.playerAnswers = {};
  room.roundResult = null;
  room.teams.forEach((team) => {
    team.answer = null;
  });
  clearRoundTimer(room);
  room.timerHandle = setTimeout(() => {
    finalizeRound(room.id);
  }, room.roundDuration * 1000);
  // emit tick to clients every second so timers stay in sync
  room.tickHandle = setInterval(() => {
    const elapsed = Math.floor((Date.now() - room.roundStartedAt) / 1000);
    const timeLeft = Math.max(0, room.roundDuration - elapsed);
    io.to(room.id).emit('round:tick', { timeLeft });
    if (timeLeft <= 0) {
      // safety: finalize if time is up
      clearInterval(room.tickHandle);
      room.tickHandle = null;
    }
  }, 1000);
  io.to(room.id).emit('round:start', {
    round: rounds[roundNumber - 1],
    roundStartedAt: room.roundStartedAt,
    roundDuration: room.roundDuration
  });
  broadcastRoom(room);
}

function getSustainableScore(score) {
  const { economy, social, environment } = score;
  const max = Math.max(economy, social, environment);
  const min = Math.min(economy, social, environment);
  return (economy + social + environment) - (max - min);
}

function finishGame(room) {
  room.status = 'finished';
  clearRoundTimer(room);
  const ranked = [...room.teams].sort((a, b) => {
    const scoreA = getSustainableScore(a.score);
    const scoreB = getSustainableScore(b.score);
    return scoreB - scoreA;
  });
  room.roundResult = {
    roundNumber: room.currentRound,
    title: 'Kết thúc trò chơi',
    summary: 'Trò chơi đã kết thúc.',
    winner: ranked[0]
  };
  broadcastRoom(room);
  // Gửi top 3 và toàn bộ ranking
  const top3 = ranked.slice(0, 3).map((team, i) => ({
    rank: i + 1,
    name: team.name,
    score: team.score,
    total: team.score.economy + team.score.social + team.score.environment,
    sustainable: getSustainableScore(team.score)
  }));
  io.to(room.id).emit('game:finished', { winner: ranked[0], ranking: ranked, top3 });
}

const rooms = new Map();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('host:create-room', ({ roomName, roundDuration }) => {
    const roomCode = generateRoomCode();
    const room = {
      id: roomCode,
      name: roomName || 'Phòng Quyết sách đổi mới',
      hostId: socket.id,
      hostName: 'Host',
      status: 'lobby',
      teams: [], // Individual players will be dynamically added as "teams" here
      players: [],
      currentRound: 0,
      roundDuration: Number(roundDuration) || 30,
      roundStartedAt: null,
      roundAnswers: {},
      playerAnswers: {},
      roundResult: null,
      timerHandle: null,
      tickHandle: null,
      disconnectTimers: {},
      hostDisconnectTimer: null
    };
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.role = 'host';
    socket.emit('room:created', { room: serializeRoom(room, 'full') });
    broadcastRoom(room);
  });

  // Host rejoin sau khi mất kết nối
  socket.on('host:rejoin-room', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', { message: 'Không tìm thấy phòng.' });
      return;
    }
    // Hủy timer xóa phòng
    if (room.hostDisconnectTimer) {
      clearTimeout(room.hostDisconnectTimer);
      room.hostDisconnectTimer = null;
    }
    room.hostId = socket.id;
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'host';
    socket.emit('room:created', { room: serializeRoom(room, 'full') });
    broadcastRoom(room);
  });

  socket.on('player:preview-room', ({ roomCode }) => {
    const code = (roomCode || '').toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', { message: 'Không tìm thấy phòng.' });
      return;
    }

    socket.emit('room:preview', { room: serializeRoom(room) });
  });

  socket.on('player:join-room', ({ roomCode, name, rejoinToken }) => {
    const code = (roomCode || '').toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', { message: 'Không tìm thấy phòng.' });
      return;
    }

    if (room.status === 'finished') {
      socket.emit('error', { message: 'Phòng này đã kết thúc.' });
      return;
    }

    // Kiểm tra rejoin: nếu player đã có session trước (dùng rejoinToken = teamId cũ)
    let existingTeam = null;
    let existingPlayer = null;
    if (rejoinToken) {
      existingTeam = room.teams.find((t) => t.id === rejoinToken);
      existingPlayer = room.players.find((p) => p.teamId === rejoinToken);
    }

    let player;
    let playerTeamId;

    if (existingTeam && existingPlayer) {
      // Rejoin: cập nhật socket id mới vào player cũ
      playerTeamId = existingTeam.id;
      existingPlayer.id = socket.id;
      player = existingPlayer;
    } else {
      // Join mới
      const playerName = name || `Đồng chí ${room.players.length + 1}`;
      playerTeamId = socket.id;

      const playerTeam = {
        id: playerTeamId,
        name: playerName,
        score: { economy: 50, social: 50, environment: 50 },
        answer: null,
        eliminated: false
      };
      room.teams.push(playerTeam);

      player = {
        id: socket.id,
        name: playerName,
        teamId: playerTeamId
      };
      room.players.push(player);
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'player';
    socket.data.teamId = playerTeamId;
    // Gửi full data (kể cả round content) cho player này
    socket.emit('room:joined', { player });
    sendFullRoom(socket, room);
    // Broadcast compact update cho các người khác
    debouncedBroadcast(room, 400);
  });

  socket.on('host:start-game', ({ roomCode }) => {
    const room = rooms.get((roomCode || '').toUpperCase());
    if (!room || room.hostId !== socket.id) return;
    
    // Yêu cầu có ít nhất 2 người chơi tham gia
    if (room.players.length < 2) {
      socket.emit('error', { message: 'Không thể bắt đầu trò chơi. Phải có ít nhất 2 người chơi tham gia.' });
      return;
    }
    
    startRound(room, 1);
  });

  socket.on('host:next-round', ({ roomCode }) => {
    const room = rooms.get((roomCode || '').toUpperCase());
    if (!room || room.hostId !== socket.id) return;
    if (room.status !== 'round-result' && room.status !== 'lobby') return;
    if (room.currentRound >= rounds.length) {
      finishGame(room);
      return;
    }
    startRound(room, room.currentRound + 1);
  });

  socket.on('team:submit-answer', ({ roomCode, teamId, answer }) => {
    const room = rooms.get((roomCode || '').toUpperCase());
    if (!room || room.status !== 'playing') return;

    const player = room.players.find((item) => item.id === socket.id);
    if (!player || player.teamId !== teamId) return;
    if (typeof answer !== 'string' || !['A', 'B', 'C'].includes(answer)) return;
    if (room.playerAnswers?.[teamId]?.[player.id]) return;

    recordPlayerAnswer(room, teamId, player.id, answer);

    // Xác nhận riêng cho player này (không cần broadcast toàn phòng)
    socket.emit('answer:confirmed', { answer });

    if (allPlayersAnswered(room)) {
      // Hủy debounce pending nếu có, finalize ngay
      if (broadcastDebounce.has(room.id)) {
        clearTimeout(broadcastDebounce.get(room.id));
        broadcastDebounce.delete(room.id);
      }
      finalizeRound(room.id);
    } else {
      // Debounce broadcast vote summary để tránh spam khi nhiều người submit liền nhau
      debouncedBroadcast(room, 300);
    }
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    if (room.hostId === socket.id) {
      // Chờ 10s trước khi xóa phòng, cho phép host reconnect
      room.hostDisconnectTimer = setTimeout(() => {
        const r = rooms.get(roomCode);
        if (r && r.hostId === socket.id) {
          rooms.delete(roomCode);
          io.to(roomCode).emit('room:deleted');
        }
      }, 10000);
      return;
    }

    // Player disconnect: chỉ đánh dấu offline, không xóa ngay
    // Chờ 15s cho phép player reconnect
    const disconnectTimer = setTimeout(() => {
      const r = rooms.get(roomCode);
      if (!r) return;
      // Kiểm tra xem player đã reconnect chưa (id đã thay đổi)
      const stillGone = r.players.find((p) => p.id === socket.id && p.teamId === socket.data.teamId);
      if (stillGone) {
        r.players = r.players.filter((p) => p.id !== socket.id);
        r.teams = r.teams.filter((t) => t.id !== socket.data.teamId);
        broadcastRoom(r);
      }
    }, 15000);

    // Lưu timer để có thể cancel nếu reconnect
    room.disconnectTimers = room.disconnectTimers || {};
    // Hủy timer cũ nếu có cho cùng teamId
    if (room.disconnectTimers[socket.data.teamId]) {
      clearTimeout(room.disconnectTimers[socket.data.teamId]);
    }
    room.disconnectTimers[socket.data.teamId] = disconnectTimer;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
