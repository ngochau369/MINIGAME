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
    title: 'Vòng 1: Đêm trước đổi mới',
    scenario: 'Nền kinh tế đang ở cuối thập niên 1980, lạm phát phi mã, hàng hóa khan hiếm, nhân dân thiếu gạo ăn.',
    options: [
      { id: 'A', text: 'Tiếp tục bao cấp và kiểm soát giá', effects: { economy: -20, social: -10, environment: 0 } },
      { id: 'B', text: 'Chuyển sang kinh tế thị trường có kiểm soát', effects: { economy: 20, social: 20, environment: 0 } },
      { id: 'C', text: 'Để tự do hoàn toàn, không kiểm soát', effects: { economy: -40, social: -20, environment: 0 } }
    ]
  },
  {
    id: 2,
    title: 'Vòng 2: Bản nhạc của thị trường',
    scenario: 'Nền kinh tế bắt đầu đổi mới, giá bán các mặt hàng thiết yếu cần được quyết định.',
    options: [
      { id: 'A', text: 'Giữ giá thấp bằng mệnh lệnh', effects: { economy: -20, social: 0, environment: 0 } },
      { id: 'B', text: 'Cho giá tự do và chịu rủi ro', effects: { economy: 20, social: -30, environment: 0 } },
      { id: 'C', text: 'Cho giá tự do nhưng có hỗ trợ người nghèo', effects: { economy: 20, social: 10, environment: 0 } }
    ]
  },
  {
    id: 3,
    title: 'Vòng 3: Động lực từ cạnh tranh',
    scenario: 'Doanh nghiệp cũ sản xuất hàng kém chất lượng, tư nhân muốn tham gia để tạo cạnh tranh.',
    options: [
      { id: 'A', text: 'Giữ nguyên mô hình cũ', effects: { economy: -20, social: 0, environment: 0 } },
      { id: 'B', text: 'Cho tư nhân tham gia mạnh mẽ', effects: { economy: 30, social: 0, environment: -10 } },
      { id: 'C', text: 'Cho tư nhân nhập cuộc rất giới hạn', effects: { economy: -10, social: 0, environment: 0 } }
    ]
  },
  {
    id: 4,
    title: 'Vòng 4: Ai giữ vai trò chủ đạo?',
    scenario: 'Hệ thống điện và nước sạch cần được đầu tư lớn, nhưng chi phí có thể tăng cao.',
    options: [
      { id: 'A', text: 'Đầu tư lớn, để giá tăng mạnh', effects: { economy: 30, social: -30, environment: 0 } },
      { id: 'B', text: 'Đầu tư vừa phải, có kế hoạch', effects: { economy: 10, social: 20, environment: 0 } },
      { id: 'C', text: 'Không đầu tư, giữ nguyên hiện trạng', effects: { economy: -20, social: 0, environment: 0 } }
    ]
  },
  {
    id: 5,
    title: 'Vòng 5: Sức mạnh doanh nghiệp tư nhân',
    scenario: 'Kinh tế tư nhân đang bùng nổ, tạo việc làm mới nhưng vẫn bị rào cản hành chính.',
    options: [
      { id: 'A', text: 'Để tư nhân phát triển như chaebol', effects: { economy: 30, social: -20, environment: 0 } },
      { id: 'B', text: 'Để tư nhân phát triển nhưng Nhà nước giữ vai trò chủ đạo', effects: { economy: 20, social: 10, environment: 0 } },
      { id: 'C', text: 'Giữ chế độ kiểm soát chặt', effects: { economy: -30, social: 0, environment: 0 } }
    ]
  },
  {
    id: 6,
    title: 'Vòng 6: Ra khơi biển lớn',
    scenario: 'Đất nước có cơ hội hội nhập với CPTPP/EVFTA, nhưng phải mở cửa thị trường và tuân thủ tiêu chuẩn mới.',
    options: [
      { id: 'A', text: 'Mở cửa hoàn toàn và để doanh nghiệp nội địa tự chịu áp lực', effects: { economy: 20, social: -30, environment: 0 } },
      { id: 'B', text: 'Hội nhập có kiểm soát, chọn lọc đúng lúc', effects: { economy: 30, social: 0, environment: 0 } },
      { id: 'C', text: 'Cố giữ kín, không hội nhập', effects: { economy: -20, social: 0, environment: 0 } }
    ]
  },
  {
    id: 7,
    title: 'Vòng 7: Bài toán phân phối',
    scenario: 'GDP tăng nhanh nhưng khoảng cách giàu nghèo ngày càng lớn, chỉ số bất bình đẳng đã báo động.',
    options: [
      { id: 'A', text: 'Để bất bình đẳng tự điều chỉnh', effects: { economy: 0, social: -30, environment: 0 } },
      { id: 'B', text: 'Đầu tư công bằng và phân phối lại', effects: { economy: 10, social: 20, environment: 0 } },
      { id: 'C', text: 'Tập trung vào tăng trưởng dù bỏ qua công bằng', effects: { economy: -40, social: 10, environment: 0 } }
    ]
  },
  {
    id: 8,
    title: 'Vòng 8: Bóng ma độc quyền',
    scenario: 'Một tập đoàn công nghệ lớn chiếm 75% thị phần, bắt đầu tăng giá và ép các startup.',
    options: [
      { id: 'A', text: 'Để họ độc quyền, không can thiệp', effects: { economy: 0, social: -30, environment: 0 } },
      { id: 'B', text: 'Can thiệp để bảo vệ cạnh tranh', effects: { economy: 10, social: 20, environment: 0 } },
      { id: 'C', text: 'Để mặc cho họ, không khuyến khích đổi mới', effects: { economy: -20, social: 0, environment: 0 } }
    ]
  },
  {
    id: 9,
    title: 'Vòng 9: Thảm họa sông xanh',
    scenario: 'Các dòng sông gần khu công nghiệp bị ô nhiễm nặng do doanh nghiệp lén xả thải.',
    options: [
      { id: 'A', text: 'Đóng cửa doanh nghiệp và xử lý nghiêm', effects: { economy: -10, social: 10, environment: 30 } },
      { id: 'B', text: 'Dùng tiền thuế để bù hậu quả', effects: { economy: -30, social: 0, environment: -10 } },
      { id: 'C', text: 'Im lặng để giữ tăng trưởng', effects: { economy: -40, social: 0, environment: 10 } }
    ]
  },
  {
    id: 10,
    title: 'Vòng 10: Khủng hoảng toàn cầu',
    scenario: 'Một cuộc khủng hoảng tài chính toàn cầu làm xuất khẩu đóng băng, hàng loạt doanh nghiệp thiếu dòng tiền.',
    options: [
      { id: 'A', text: 'Để thị trường tự xử lý', effects: { economy: -30, social: -30, environment: 0 } },
      { id: 'B', text: 'Can thiệp có kiểm soát để ổn định', effects: { economy: 20, social: 20, environment: 0 } },
      { id: 'C', text: 'Cắt giảm mạnh và để sụp đổ', effects: { economy: -40, social: -20, environment: 0 } }
    ]
  }
];

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function createDefaultTeams(teamNames) {
  return teamNames
    .filter(Boolean)
    .slice(0, 6)
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

function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    hostId: room.hostId,
    status: room.status,
    teams: room.teams,
    players: room.players,
    currentRound: room.currentRound,
    totalRounds: rounds.length,
    round: room.currentRound > 0 ? rounds[room.currentRound - 1] : null,
    roundStartedAt: room.roundStartedAt,
    roundDuration: room.roundDuration,
    roundResult: room.roundResult,
    roundAnswers: room.roundAnswers,
    playerAnswers: room.playerAnswers || {},
    roundCorrectAnswer: room.roundCorrectAnswer || null
  };
}

function broadcastRoom(room) {
  io.to(room.id).emit('room:update', serializeRoom(room));
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

function finishGame(room) {
  room.status = 'finished';
  clearRoundTimer(room);
  const ranked = [...room.teams].sort((a, b) => {
    const totalA = a.score.economy + a.score.social + a.score.environment;
    const totalB = b.score.economy + b.score.social + b.score.environment;
    return totalB - totalA;
  });
  room.roundResult = {
    roundNumber: room.currentRound,
    title: 'Kết thúc trò chơi',
    summary: 'Trò chơi đã kết thúc.',
    winner: ranked[0]
  };
  broadcastRoom(room);
  io.to(room.id).emit('game:finished', { winner: ranked[0], ranking: ranked });
}

const rooms = new Map();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('host:create-room', ({ roomName, teamNames, roundDuration }) => {
    const roomCode = generateRoomCode();
    const room = {
      id: roomCode,
      name: roomName || 'Phòng Quýêt sách đổi mới',
      hostId: socket.id,
      hostName: 'Host',
      status: 'lobby',
      teams: createDefaultTeams(teamNames || ['Nhóm 1', 'Nhóm 2', 'Nhóm 3', 'Nhóm 4']),
      players: [],
      currentRound: 0,
      roundDuration: Number(roundDuration) || 30,
      roundStartedAt: null,
      roundAnswers: {},
      playerAnswers: {},
      roundResult: null,
      timerHandle: null,
      tickHandle: null
    };
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.role = 'host';
    socket.emit('room:created', { room: serializeRoom(room) });
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

  socket.on('player:join-room', ({ roomCode, name, teamId }) => {
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

    const selectedTeam = room.teams.find((team) => team.id === teamId);
    const player = {
      id: socket.id,
      name: name || `Người chơi ${room.players.length + 1}`,
      teamId: selectedTeam ? selectedTeam.id : room.teams[0]?.id || null
    };
    room.players.push(player);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'player';
    socket.data.teamId = player.teamId;
    socket.emit('room:joined', { room: serializeRoom(room), player });
    broadcastRoom(room);
  });

  socket.on('host:start-game', ({ roomCode }) => {
    const room = rooms.get((roomCode || '').toUpperCase());
    if (!room || room.hostId !== socket.id) return;
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
    broadcastRoom(room);

    if (allPlayersAnswered(room)) {
      finalizeRound(room.id);
    }
  });

  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    if (room.hostId === socket.id) {
      rooms.delete(roomCode);
      io.to(roomCode).emit('room:deleted');
      return;
    }

    room.players = room.players.filter((player) => player.id !== socket.id);
    broadcastRoom(room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
