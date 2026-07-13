const socket = io({
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10
});

const state = {
  role: 'player',
  room: null,
  previewRoom: null,
  player: null,
  teamId: null,
  rejoinInfo: null,
  // Cache round data để không cần server gửi lại mỗi broadcast
  roundCache: {},  // { [roundIndex]: roundData }
  myAnswer: null,  // đáp án của player này, lưu local
};

// Rounds data từ server — được populate khi nhận room:joined-data
// Client cache lại để không cần gửi lại trong mỗi broadcast
const roundsCache = {};

const els = {
  hostForm: document.getElementById('host-form'),
  playerForm: document.getElementById('player-form'),
  setupView: document.getElementById('setup-view'),
  roomView: document.getElementById('room-view'),
  roomTitle: document.getElementById('room-title'),
  roomCodeDisplay: document.getElementById('room-code-display'),
  roomStatus: document.getElementById('room-status'),
  hostControls: document.getElementById('host-controls'),
  startGameBtn: document.getElementById('start-game-btn'),
  nextRoundBtn: document.getElementById('next-round-btn'),
  roundCard: document.getElementById('round-card'),
  roundTitle: document.getElementById('round-title'),
  roundScenario: document.getElementById('round-scenario'),
  optionsList: document.getElementById('options-list'),
  roundTimer: document.getElementById('round-timer'),
  roundStatus: document.getElementById('round-status'),
  resultCard: document.getElementById('result-card'),
  resultSummary: document.getElementById('result-summary'),
  scoreboardPanel: document.getElementById('scoreboard-panel'),
  scoreboard: document.getElementById('scoreboard'),
  scoreboardNotice: document.getElementById('scoreboard-notice'),
  messageBox: document.getElementById('message-box'),
  teamSelect: document.getElementById('team-select'),
  homeButton: document.getElementById('host-home-btn'),

  // New elements
  tabPlayerBtn: document.getElementById('tab-player-btn'),
  tabHostBtn: document.getElementById('tab-host-btn'),
  lobbyCard: document.getElementById('lobby-card'),
  lobbyPlayersList: document.getElementById('lobby-players-list'),
  timerProgressBar: document.getElementById('timer-progress-bar'),
  // QR and Guide elements
  roomCodeInput: document.getElementById('room-code'),
  guideBtn: document.getElementById('guide-btn'),
  guideModal: document.getElementById('guide-modal'),
  closeGuideBtn: document.getElementById('close-guide-btn')

};

function setMessage(text) {
  els.messageBox.textContent = text;
}

function switchView(role) {
  state.role = role;
  els.hostForm.classList.toggle('hidden', role !== 'host');
  els.playerForm.classList.toggle('hidden', role !== 'player');

  if (els.tabPlayerBtn && els.tabHostBtn) {
    els.tabPlayerBtn.classList.toggle('active', role === 'player');
    els.tabHostBtn.classList.toggle('active', role === 'host');
  }
}

// Lưu hash lobby để tránh re-render khi không thay đổi
let _lastLobbyHash = '';

function renderLobby() {
  if (!state.room || !els.lobbyPlayersList) return;

  const players = state.room.players || [];
  const teams = state.room.teams || [];

  // Hash đơn giản: số lượng + tên
  const hash = teams.map(t => t.id + t.name).join('|') + '|' + players.length;
  if (hash === _lastLobbyHash) return; // không thay đổi, bỏ qua
  _lastLobbyHash = hash;

  if (players.length === 0) {
    els.lobbyPlayersList.innerHTML = '<p class="empty-lobby-text">Chưa có người chơi nào tham gia</p>';
    return;
  }

  const playersByTeam = {};
  players.forEach((p) => {
    playersByTeam[p.teamId] = playersByTeam[p.teamId] || [];
    playersByTeam[p.teamId].push(p);
  });

  const html = teams.map((team) => {
    const teamPlayers = playersByTeam[team.id] || [];
    const count = teamPlayers.length;
    const membersHtml = teamPlayers.map((p) => {
      const isMe = p.id === socket.id;
      return `<div class="lobby-team-member">${p.name}${isMe ? ' <span class="badge" style="font-size:0.65rem;background:var(--success);">Bạn</span>' : ''}</div>`;
    }).join('');
    return `
      <div class="lobby-team-group">
        <div class="lobby-team-title">
          <span>${team.name}</span>
          <span class="badge">${count} người</span>
        </div>
        <div class="lobby-team-members">
          ${membersHtml || '<p class="empty-lobby-text" style="font-size: 0.78rem;">Chưa có thành viên</p>'}
        </div>
      </div>
    `;
  }).join('');

  els.lobbyPlayersList.innerHTML = html;
}

// ── Dirty-check helpers ──────────────────────────────────────────────────────
let _lastStatus = null;
let _lastScoreboardHash = '';
let _lastRoundCardHash = '';
let _lastOptionsHash = '';
let _lastResultHash = '';

function getRound() {
  if (!state.room) return null;
  const idx = state.room.currentRound;
  if (!idx) return null;
  // roundsCache key = round.id (1-10), khớp với currentRound
  return roundsCache[idx] || state.room.round || null;
}

function renderScoreboard() {
  if (!els.scoreboard) return;
  const room = state.room;
  if (!room) return;

  const visibleTeams = (room.teams || []).filter(t =>
    (room.players || []).some(p => p.teamId === t.id)
  );
  const sorted = [...visibleTeams].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    const tA = a.score.economy + a.score.social + a.score.environment;
    const tB = b.score.economy + b.score.social + b.score.environment;
    return tB - tA;
  });

  // Hash để skip nếu không thay đổi
  const hash = sorted.map(t =>
    `${t.id}:${t.score.economy},${t.score.social},${t.score.environment},${t.eliminated}`
  ).join('|');
  if (hash === _lastScoreboardHash) return;
  _lastScoreboardHash = hash;

  if (sorted.length === 0) {
    els.scoreboard.innerHTML = '<p class="empty-lobby-text">Chưa có người chơi nào tham gia</p>';
    return;
  }

  els.scoreboard.innerHTML = sorted.map((team, index) => {
    const total = team.score.economy + team.score.social + team.score.environment;
    const isEliminated = team.eliminated;
    const isLeader = index === 0;
    const econPct = Math.min(100, Math.max(0, team.score.economy));
    const socPct  = Math.min(100, Math.max(0, team.score.social));
    const envPct  = Math.min(100, Math.max(0, team.score.environment));
    return `
      <div class="score-row ${isEliminated ? 'eliminated' : ''} ${isLeader ? 'leader' : ''}">
        <div class="score-team-meta">
          <div class="score-team-main">
            <div class="score-rank-badge">${index + 1}</div>
            <div class="score-team-text">
              <span class="team-name-header">${team.name}${isEliminated ? ' <span class="eliminated-tag">Bị loại</span>' : ''}</span>
              <span class="team-subtext">${isEliminated ? 'Bị loại' : 'Đang tranh tài'}</span>
            </div>
          </div>
          <span class="team-total-score">${total}đ</span>
        </div>
        <div class="score-bars">
          <div class="score-bar-group" data-stat="economy">
            <span class="score-bar-label">KINH</span>
            <div class="score-bar-outer"><div class="score-bar-inner" style="width:${econPct}%"></div></div>
            <span class="score-bar-value">${team.score.economy}</span>
          </div>
          <div class="score-bar-group" data-stat="social">
            <span class="score-bar-label">XH</span>
            <div class="score-bar-outer"><div class="score-bar-inner" style="width:${socPct}%"></div></div>
            <span class="score-bar-value">${team.score.social}</span>
          </div>
          <div class="score-bar-group" data-stat="environment">
            <span class="score-bar-label">MT</span>
            <div class="score-bar-outer"><div class="score-bar-inner" style="width:${envPct}%"></div></div>
            <span class="score-bar-value">${team.score.environment}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderOptions() {
  const room = state.room;
  if (!room) return;
  const round = getRound();
  if (!round) return;
  const isRoundResult = room.status === 'round-result';
  const myAnswer = state.myAnswer;
  const myTeam = room.teams.find(t => t.id === state.player?.teamId);
  const canAnswer = state.role === 'player' && state.player && !myAnswer && !isRoundResult && !myTeam?.eliminated;

  const hash = `${myAnswer}|${isRoundResult}|${room.roundCorrectAnswer}|${canAnswer}`;
  if (hash === _lastOptionsHash) return;
  _lastOptionsHash = hash;

  els.optionsList.innerHTML = round.options.map((option) => {
    const isSelected = myAnswer === option.id;
    const isCorrect = room.roundCorrectAnswer === option.id;
    const classes = `option-btn ${isSelected ? 'selected' : ''} ${isCorrect && isRoundResult ? 'correct' : ''}`.trim();
    return `
      <button class="${classes}" data-answer="${option.id}" ${canAnswer ? '' : 'disabled'}>
        <span>${option.id}. ${option.text}</span>
        ${isSelected ? '<span class="badge">Đã chọn</span>' : ''}
        ${isCorrect && isRoundResult ? '<span class="badge correct-badge">Đáp án đúng</span>' : ''}
      </button>`;
  }).join('');
}

function renderRoundStatus() {
  const room = state.room;
  if (!room) return;
  const isRoundResult = room.status === 'round-result';

  if (isRoundResult) {
    const finalTeams = (room.teams || []).map((team) => {
      const answer = room.roundAnswers?.[team.id] || 'chưa trả lời';
      const correct = room.roundCorrectAnswer ? (answer === room.roundCorrectAnswer) : false;
      const isAnswered = answer !== 'chưa trả lời';
      let feedback = '';
      if (isAnswered) {
        feedback = correct
          ? ' <span class="indicator-correct">đúng</span>'
          : ' <span class="indicator-incorrect">sai</span>';
      }
      return `${team.name}: <span class="badge-answer">${answer}</span>${feedback}`;
    });
    els.roundStatus.innerHTML = finalTeams.length
      ? `Kết quả: ${finalTeams.join(' • ')}`
      : 'Chưa có người chơi nào chọn đáp án.';
  } else {
    // Dùng answerSummary (compact) thay vì playerAnswers đầy đủ
    const summary = room.answerSummary || {};
    const answeredCount = room.answeredCount || {};
    const totalPlayers = (room.players || []).length;
    const totalAnswered = Object.values(answeredCount).reduce((s, c) => s + c, 0);

    const teamLines = (room.teams || []).map((team) => {
      const counts = summary[team.id];
      if (!counts || Object.values(counts).every(c => c === 0)) return `${team.name}: chưa trả lời`;
      const entries = Object.entries(counts)
        .filter(([, c]) => c > 0)
        .map(([a, c]) => `${a}:${c}`);
      return `${team.name}: ${entries.join(', ')}`;
    });
    els.roundStatus.innerHTML = `Đã trả lời: ${totalAnswered}/${totalPlayers} • ${teamLines.join(' • ')}`;
  }
}

function renderRoundCard() {
  const room = state.room;
  if (!room) return;
  const round = getRound();
  const showCard = (room.status === 'playing' || room.status === 'round-result') && round;

  if (!showCard) {
    els.roundCard.classList.add('hidden');
    els.resultCard.classList.add('hidden');
    return;
  }

  const hash = `${room.currentRound}|${round.title}`;
  if (hash !== _lastRoundCardHash) {
    _lastRoundCardHash = hash;
    els.roundTitle.textContent = round.title;
    els.roundScenario.textContent = round.scenario;
    els.roundCard.classList.remove('hidden');
  } else {
    els.roundCard.classList.remove('hidden');
  }

  renderOptions();
  renderRoundStatus();
  updateTimer();

  // Result card
  if (room.status === 'round-result' && room.roundResult) {
    const correctOpt = round?.options?.find(o => o.id === room.roundCorrectAnswer);
    const explanationHtml = correctOpt?.explanation
      ? `<div class="explanation-box"><strong>💡 Phân tích & Bẫy tư duy:</strong> ${correctOpt.explanation}</div>`
      : '';
    const resultHash = `${room.roundResult.title}|${room.roundResult.summary}`;
    if (resultHash !== _lastResultHash) {
      _lastResultHash = resultHash;
      els.resultSummary.innerHTML = `
        <div><strong>${room.roundResult.title}:</strong> ${room.roundResult.summary}</div>
        ${explanationHtml}`;
    }
    els.resultCard.classList.remove('hidden');
  } else {
    els.resultCard.classList.add('hidden');
  }
}

function updateTimer() {
  if (!state.room) return;
  const duration = state.room.roundDuration || 30;
  const timeLeft = typeof state.room.serverTimeLeft === 'number'
    ? state.room.serverTimeLeft
    : Math.max(0, Math.ceil((duration * 1000 - (Date.now() - state.room.roundStartedAt)) / 1000));
  els.roundTimer.textContent = `Thời gian còn lại: ${timeLeft}s`;
  if (els.timerProgressBar) {
    els.timerProgressBar.style.width = `${(timeLeft / duration) * 100}%`;
  }
}

function renderRoom() {
  if (!state.room) {
    els.setupView.classList.remove('hidden');
    els.roomView.classList.add('hidden');
    return;
  }

  els.setupView.classList.add('hidden');
  els.roomView.classList.remove('hidden');
  els.roomTitle.textContent = state.room.name;
  els.roomCodeDisplay.textContent = state.room.id;

  const statusMap = { lobby: 'Đang chờ', playing: 'Đang diễn ra', 'round-result': 'Kết quả vòng', finished: 'Hoàn thành' };
  const newStatus = statusMap[state.room.status] || 'Đang chờ';
  if (newStatus !== _lastStatus) {
    _lastStatus = newStatus;
    els.roomStatus.textContent = newStatus;
  }

  const isHost = state.role === 'host';
  els.hostControls.classList.toggle('hidden', !isHost);

  if (isHost) {
    const showStart = state.room.status === 'lobby';
    const showNext  = state.room.status === 'round-result';
    els.startGameBtn.classList.toggle('hidden', !showStart);
    els.nextRoundBtn.classList.toggle('hidden', !showNext);

    if (showStart) {
      const activeCount = (state.room.teams || []).filter(t =>
        (state.room.players || []).some(p => p.teamId === t.id)
      ).length;
      const notEnough = activeCount < 2;
      els.startGameBtn.disabled = notEnough;
      els.startGameBtn.textContent = notEnough
        ? 'Chờ thêm thành viên tham gia (cần ít nhất 2 thành viên)'
        : 'Bắt đầu trò chơi';
      els.startGameBtn.style.opacity = notEnough ? '0.6' : '1';
      els.startGameBtn.style.cursor = notEnough ? 'not-allowed' : 'pointer';
    }
  }

  els.scoreboardPanel.classList.toggle('hidden', !isHost);
  els.scoreboardNotice.classList.toggle('hidden', isHost);
  if (!isHost) {
    els.scoreboardNotice.textContent = 'Chỉ host mới có quyền xem bảng điểm trên màn hình chung.';
  } else {
    renderScoreboard();
  }

  renderLobby();
  renderRoundCard();
}

function populateTeamOptions(room = state.room || state.previewRoom) {
  if (!els.teamSelect || !room || !room.teams) return;
  const hasSelected = room.teams.some(team => state.player?.teamId === team.id);
  const options = room.teams.map((team, index) => {
    const isSelected = hasSelected ? (state.player?.teamId === team.id) : (index === 0);
    return `<option value="${team.id}" ${isSelected ? 'selected' : ''}>${team.name}</option>`;
  }).join('');
  els.teamSelect.innerHTML = options;
}

// Bind tabs click event listeners
if (els.tabPlayerBtn) {
  els.tabPlayerBtn.addEventListener('click', () => {
    switchView('player');
  });
}

if (els.tabHostBtn) {
  els.tabHostBtn.addEventListener('click', () => {
    switchView('host');
  });
}

els.homeButton.addEventListener('click', (e) => {
  e.preventDefault();
  const modal = document.getElementById('website-qr-modal');
  const qrImg = modal ? modal.querySelector('.qr-code-wrapper img') : null;
  if (modal && qrImg) {
    let joinUrl = `https://minigame-nu-black.vercel.app/`;
    if (state.room && state.room.id) {
      joinUrl = `https://minigame-nu-black.vercel.app/?room=${state.room.id}`;
    }
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;
    if (qrImg.getAttribute('src') !== qrApiUrl) {
      qrImg.setAttribute('src', qrApiUrl);
    }
    
    const modalInfo = modal.querySelector('.modal-info');
    if (modalInfo) {
      if (state.room && state.room.id) {
        modalInfo.innerHTML = `Quét mã QR để vào thẳng phòng chơi <strong>${state.room.id}</strong>`;
      } else {
        modalInfo.innerHTML = `Quét mã QR để truy cập nhanh vào trò chơi <strong>Quyết Sách Đổi Mới</strong>`;
      }
    }
    modal.classList.remove('hidden');
  }
});

const closeWebsiteQrBtn = document.getElementById('close-website-qr-btn');
const websiteQrModal = document.getElementById('website-qr-modal');

if (closeWebsiteQrBtn && websiteQrModal) {
  closeWebsiteQrBtn.addEventListener('click', () => {
    websiteQrModal.classList.add('hidden');
  });
  websiteQrModal.addEventListener('click', (e) => {
    if (e.target === websiteQrModal) {
      websiteQrModal.classList.add('hidden');
    }
  });
}

// Guide Modal Event Listeners
if (els.guideBtn && els.guideModal) {
  els.guideBtn.addEventListener('click', () => {
    els.guideModal.classList.remove('hidden');
  });
}

if (els.closeGuideBtn && els.guideModal) {
  els.closeGuideBtn.addEventListener('click', () => {
    els.guideModal.classList.add('hidden');
  });
  els.guideModal.addEventListener('click', (e) => {
    if (e.target === els.guideModal) {
      els.guideModal.classList.add('hidden');
    }
  });
}

els.hostForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const password = document.getElementById('host-password').value;
  if (password !== '1231231231') {
    setMessage('Lỗi: Mật khẩu Host không chính xác.');
    return;
  }
  const payload = {
    roomName: document.getElementById('room-name').value,
    roundDuration: document.getElementById('round-duration').value
  };
  socket.emit('host:create-room', payload);
  state.role = 'host';
  setMessage('Đang kết nối để tạo phòng...');
});

document.getElementById('room-code').addEventListener('input', (event) => {
  const roomCode = event.target.value.trim().toUpperCase();
  if (roomCode.length >= 3) {
    socket.emit('player:preview-room', { roomCode });
  }
});


els.playerForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = {
    roomCode: document.getElementById('room-code').value,
    name: document.getElementById('player-name').value
  };
  socket.emit('player:join-room', payload);
  setMessage('Đang xin gia nhập phòng...');
});

els.startGameBtn.addEventListener('click', () => {
  if (els.startGameBtn.disabled) return;
  socket.emit('host:start-game', { roomCode: state.room.id });
  setMessage('Đang khởi chạy trò chơi...');
});

els.nextRoundBtn.addEventListener('click', () => {
  socket.emit('host:next-round', { roomCode: state.room.id });
});

els.optionsList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-answer]');
  if (!button || !state.room || !state.player) return;
  socket.emit('team:submit-answer', {
    roomCode: state.room.id,
    teamId: state.player.teamId,
    answer: button.dataset.answer
  });
  setMessage('Đã nộp đáp án của bạn thành công.');
});

// Socket Events
socket.on('connect', () => {
  setMessage('Hệ thống: Đã kết nối với máy chủ.');

  // Nếu đang có session cũ → tự động rejoin
  if (state.rejoinInfo) {
    const { role, roomCode, playerName, teamId } = state.rejoinInfo;
    if (role === 'host') {
      socket.emit('host:rejoin-room', { roomCode });
      setMessage('Đang kết nối lại phòng host...');
    } else if (role === 'player') {
      socket.emit('player:join-room', { roomCode, name: playerName, rejoinToken: teamId });
      setMessage('Đang kết nối lại phòng...');
    }
  } else {
    checkUrlParams();
  }
});

socket.on('room:created', ({ room }) => {
  if (room.round) roundsCache[room.round.id] = room.round;
  state.room = room;
  state.role = 'host';
  state.rejoinInfo = { role: 'host', roomCode: room.id };
  _lastLobbyHash = '';
  _lastScoreboardHash = '';
  _lastRoundCardHash = '';
  _lastOptionsHash = '';
  _lastResultHash = '';
  renderRoom();
  populateTeamOptions();
  setMessage(`Hệ thống: Đã tạo phòng ${room.id} thành công.`);
});

socket.on('room:preview', ({ room }) => {
  state.previewRoom = room;
  populateTeamOptions(room);
  setMessage(`Phòng tìm thấy: ${room.name}. Vui lòng chọn nhóm của bạn.`);
});

socket.on('room:joined', ({ player }) => {
  // Nhận thông tin player trước, full room data sẽ đến qua room:joined-data
  state.player = player;
  state.teamId = player.teamId;
  state.role = 'player';
  state.myAnswer = null;
});

socket.on('room:joined-data', (roomData) => {
  // Cache round data nếu server gửi kèm (full join/rejoin)
  if (roomData.round) {
    roundsCache[roomData.round.id] = roomData.round;
  }
  if (roomData.myAnswer) {
    state.myAnswer = roomData.myAnswer;
  }
  state.room = roomData;
  if (!state.player && roomData.players) {
    const me = roomData.players.find(p => p.teamId === state.teamId);
    if (me) state.player = me;
  }
  state.rejoinInfo = {
    role: 'player',
    roomCode: roomData.id,
    playerName: state.player?.name,
    teamId: state.teamId
  };
  // Reset dirty-check để force full render
  _lastLobbyHash = '';
  _lastScoreboardHash = '';
  _lastRoundCardHash = '';
  _lastOptionsHash = '';
  _lastResultHash = '';
  renderRoom();
  populateTeamOptions(roomData);
  setMessage(`Hệ thống: Bạn đã tham gia phòng ${roomData.id} với tư cách là ${state.player?.name}.`);
});

let _renderPending = false;
socket.on('room:update', (roomData) => {
  if (roomData.round) {
    roundsCache[roomData.round.id] = roomData.round;
  }
  state.room = roomData;
  if (state.player && state.teamId) {
    const updated = roomData.players?.find(p => p.teamId === state.teamId);
    if (updated) state.player = updated;
  }
  if (!_renderPending) {
    _renderPending = true;
    requestAnimationFrame(() => {
      _renderPending = false;
      renderRoom();
      populateTeamOptions();
    });
  }
});

socket.on('round:start', ({ round, roundStartedAt, roundDuration }) => {
  // Server gửi round data đầy đủ trong event này — cache lại
  if (round) {
    roundsCache[round.id] = round;
  }
  state.myAnswer = null;
  _lastOptionsHash = '';
  _lastRoundCardHash = '';
  _lastResultHash = '';
  if (state.room) {
    state.room.serverTimeLeft = null;
    state.room.roundStartedAt = roundStartedAt;
    state.room.roundDuration = roundDuration;
    // Cập nhật currentRound nếu biết
    if (round) state.room.currentRound = round.id;
    state.room.status = 'playing';
    state.room.roundAnswers = {};
    state.room.answerSummary = {};
    state.room.answeredCount = {};
  }
  renderRoom();
  setMessage('Bắt đầu vòng chơi mới! Hãy thảo luận và đưa ra quyết sách.');
});

// Server xác nhận đáp án của chính mình — không cần broadcast toàn phòng
socket.on('answer:confirmed', ({ answer }) => {
  state.myAnswer = answer;
  _lastOptionsHash = ''; // force re-render options
  renderOptions();
  setMessage('Đã nộp đáp án của bạn thành công.');
});

socket.on('round:tick', ({ timeLeft }) => {
  if (!state.room) return;
  state.room.serverTimeLeft = timeLeft;
  els.roundTimer.textContent = `Thời gian còn lại: ${timeLeft}s`;

  if (els.timerProgressBar) {
    const duration = state.room.roundDuration || 30;
    const percentage = (timeLeft / duration) * 100;
    els.timerProgressBar.style.width = `${percentage}%`;
  }
});

socket.on('room:deleted', () => {
  state.room = null;
  state.player = null;
  state.rejoinInfo = null; // Xóa thông tin rejoin vì phòng đã bị xóa hẳn
  renderRoom();
  setMessage('Lưu ý: Host đã tắt phòng hoặc ngắt kết nối.');
});

socket.on('game:finished', ({ winner, ranking, top3 }) => {
  setMessage(`Trò chơi đã kết thúc! Xin chúc mừng ${winner?.name || 'N/A'} đã giành chiến thắng chung cuộc!`);
  showPodium(top3 || [], ranking || []);
});

socket.on('error', ({ message }) => {
  setMessage(`Lỗi: ${message}`);
});

socket.on('disconnect', (reason) => {
  setMessage(`Hệ thống: Mất kết nối (${reason}). Đang thử kết nối lại...`);
});

socket.on('reconnect', (attemptNumber) => {
  setMessage(`Hệ thống: Đã kết nối lại sau ${attemptNumber} lần thử.`);
});

socket.on('reconnect_error', () => {
  setMessage('Hệ thống: Không thể kết nối lại. Vui lòng kiểm tra mạng.');
});

socket.on('reconnect_failed', () => {
  setMessage('Hệ thống: Kết nối thất bại. Vui lòng tải lại trang.');
});

let timerTick = null;
function startTimerTick() {
  if (timerTick) clearInterval(timerTick);
  timerTick = setInterval(() => {
    // Chỉ update timer text — không rebuild toàn bộ DOM
    if (state.room?.status === 'playing' && state.room.roundStartedAt) {
      updateTimer();
    }
  }, 1000);
}

// Check for room code query parameter in URL on startup
let paramsChecked = false;
function checkUrlParams() {
  if (paramsChecked) return;
  if (state.rejoinInfo) return; // Không check URL params nếu đang rejoin
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get('room');
  if (roomCode) {
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length >= 3) {
      if (els.roomCodeInput) {
        els.roomCodeInput.value = cleanCode;
      }
      switchView('player');
      socket.emit('player:preview-room', { roomCode: cleanCode });
      setMessage(`Đang tải thông tin phòng ${cleanCode} từ liên kết...`);
      paramsChecked = true;
    }
  }
}

// ── Podium (kết thúc game) ──────────────────────────────────────────────────
function showPodium(top3, ranking) {
  const modal = document.getElementById('podium-modal');
  const stage = document.getElementById('podium-stage');
  if (!modal || !stage) return;

  // Podium order: 2nd (left) | 1st (center) | 3rd (right)
  const slots = [
    { rank: 2, data: top3[1] || null },
    { rank: 1, data: top3[0] || null },
    { rank: 3, data: top3[2] || null }
  ];

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const rankLabels = { 1: 'Quán Quân', 2: 'Á Quân', 3: 'Hạng Ba' };

  stage.innerHTML = slots.map(({ rank, data }) => {
    if (!data) return `<div class="podium-slot podium-rank-${rank} podium-empty"><div class="podium-block"><span class="podium-rank-num">${rank}</span></div></div>`;

    const econPct = Math.min(100, Math.max(0, data.score.economy));
    const socPct  = Math.min(100, Math.max(0, data.score.social));
    const envPct  = Math.min(100, Math.max(0, data.score.environment));

    return `
      <div class="podium-slot podium-rank-${rank}">
        <div class="podium-avatar">${medals[rank]}</div>
        <div class="podium-name">${data.name}</div>
        <div class="podium-score-label">${data.sustainable}đ <span class="podium-score-sub">cân bằng</span></div>
        <div class="podium-mini-bars">
          <div class="podium-bar-row" title="Kinh tế">
            <span class="podium-bar-lbl">KINH</span>
            <div class="podium-bar-outer"><div class="podium-bar-inner econ" style="width:${econPct}%"></div></div>
            <span class="podium-bar-val" style="color:var(--stat-economy)">${data.score.economy}</span>
          </div>
          <div class="podium-bar-row" title="Xã hội">
            <span class="podium-bar-lbl">XH</span>
            <div class="podium-bar-outer"><div class="podium-bar-inner soc" style="width:${socPct}%"></div></div>
            <span class="podium-bar-val" style="color:var(--stat-social)">${data.score.social}</span>
          </div>
          <div class="podium-bar-row" title="Môi trường">
            <span class="podium-bar-lbl">MT</span>
            <div class="podium-bar-outer"><div class="podium-bar-inner env" style="width:${envPct}%"></div></div>
            <span class="podium-bar-val" style="color:var(--stat-environment)">${data.score.environment}</span>
          </div>
        </div>
        <div class="podium-block">
          <span class="podium-rank-num">${rank}</span>
          <span class="podium-rank-label">${rankLabels[rank]}</span>
        </div>
      </div>
    `;
  }).join('');

  modal.classList.remove('hidden');
  spawnFireworks();
}

function spawnFireworks() {
  const container = document.getElementById('podium-fireworks');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#c9a227', '#a61b1b', '#ffffff', '#e0b62d', '#f87171'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'firework-particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-delay: ${Math.random() * 1.4}s;
      animation-duration: ${1.2 + Math.random() * 0.8}s;
      width: ${4 + Math.random() * 5}px;
      height: ${4 + Math.random() * 5}px;
    `;
    container.appendChild(p);
  }
}

// Close podium modal
document.getElementById('close-podium-btn')?.addEventListener('click', () => {
  document.getElementById('podium-modal')?.classList.add('hidden');
});
document.getElementById('close-podium-btn-2')?.addEventListener('click', () => {
  document.getElementById('podium-modal')?.classList.add('hidden');
});
document.getElementById('podium-modal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('podium-modal')) {
    document.getElementById('podium-modal').classList.add('hidden');
  }
});

// ── Initial Setup ────────────────────────────────────────────────────────────
switchView('player'); // Set default tab to player
renderRoom();
startTimerTick();
