const socket = io();

const state = {
  role: 'player', // Default to player now
  room: null,
  previewRoom: null,
  player: null,
  teamId: null
};

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

function renderLobby() {
  if (!state.room || !els.lobbyPlayersList) return;

  const players = state.room.players || [];
  const teams = state.room.teams || [];

  if (players.length === 0) {
    els.lobbyPlayersList.innerHTML = '<p class="empty-lobby-text">Chưa có người chơi nào tham gia</p>';
    return;
  }

  // Group players by teamId
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

  // Translate status text for beautiful UI
  let statusText = 'Đang chờ';
  if (state.room.status === 'playing') statusText = 'Đang diễn ra';
  if (state.room.status === 'round-result') statusText = 'Kết quả vòng';
  if (state.room.status === 'finished') statusText = 'Hoàn thành';
  els.roomStatus.textContent = statusText;

  const isHost = state.role === 'host';
  els.hostControls.classList.toggle('hidden', !isHost);



  if (isHost) {
    const showStart = state.room.status === 'lobby';
    const showNext = state.room.status === 'round-result';
    els.startGameBtn.classList.toggle('hidden', !showStart);
    els.nextRoundBtn.classList.toggle('hidden', !showNext);

    if (showStart) {
      const activeTeams = (state.room.teams || []).filter((team) => {
        return (state.room.players || []).some((player) => player.teamId === team.id);
      });
      if (activeTeams.length < 2) {
        els.startGameBtn.disabled = true;
        els.startGameBtn.title = "Cần ít nhất 2 nhóm có người chơi để bắt đầu";
        els.startGameBtn.textContent = "Chờ thêm nhóm tham gia (cần ít nhất 2 nhóm)";
        els.startGameBtn.style.opacity = "0.6";
        els.startGameBtn.style.cursor = "not-allowed";
      } else {
        els.startGameBtn.disabled = false;
        els.startGameBtn.title = "";
        els.startGameBtn.textContent = "Bắt đầu trò chơi";
        els.startGameBtn.style.opacity = "1";
        els.startGameBtn.style.cursor = "pointer";
      }
    }
  }

  els.scoreboardPanel.classList.toggle('hidden', !isHost);
  els.scoreboardNotice.classList.toggle('hidden', isHost);

  if (!isHost) {
    els.scoreboardNotice.textContent = 'Chỉ host mới có quyền xem bảng điểm trên màn hình chung.';
  } else {
    // Only display teams that have joined players
    const visibleTeams = (state.room.teams || []).filter((team) => {
      return (state.room.players || []).some((player) => player.teamId === team.id);
    });

    // Sort teams by total score (and push eliminated ones to the bottom)
    const sortedTeams = [...visibleTeams].sort((a, b) => {
      if (a.eliminated && !b.eliminated) return 1;
      if (!a.eliminated && b.eliminated) return -1;
      const totalA = a.score.economy + a.score.social + a.score.environment;
      const totalB = b.score.economy + b.score.social + b.score.environment;
      return totalB - totalA;
    });

    const table = sortedTeams.map((team, index) => {
      const total = team.score.economy + team.score.social + team.score.environment;
      const isEliminated = team.eliminated;
      const isLeader = index === 0;

      const econPct = Math.min(100, Math.max(0, team.score.economy));
      const socPct = Math.min(100, Math.max(0, team.score.social));
      const envPct = Math.min(100, Math.max(0, team.score.environment));

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
              <div class="score-bar-outer">
                <div class="score-bar-inner" style="width: ${econPct}%;"></div>
              </div>
              <span class="score-bar-value">${team.score.economy}</span>
            </div>
            <div class="score-bar-group" data-stat="social">
              <span class="score-bar-label">XH</span>
              <div class="score-bar-outer">
                <div class="score-bar-inner" style="width: ${socPct}%;"></div>
              </div>
              <span class="score-bar-value">${team.score.social}</span>
            </div>
            <div class="score-bar-group" data-stat="environment">
              <span class="score-bar-label">MT</span>
              <div class="score-bar-outer">
                <div class="score-bar-inner" style="width: ${envPct}%;"></div>
              </div>
              <span class="score-bar-value">${team.score.environment}</span>
            </div>
          </div>
        </div>
      `;
    });

    els.scoreboard.innerHTML = table.join('') || '<p class="empty-lobby-text">Chưa có nhóm nào có thành viên tham gia</p>';
  }

  // Render lobby members
  renderLobby();

  // Round Card & Options
  if ((state.room.status === 'playing' || state.room.status === 'round-result') && state.room.round) {
    els.roundCard.classList.remove('hidden');
    els.roundTitle.textContent = state.room.round.title;
    els.roundScenario.textContent = state.room.round.scenario;

    const isRoundResult = state.room.status === 'round-result';
    const myTeam = state.room.teams.find((team) => team.id === state.player?.teamId);
    const myTeamAnswers = state.room.playerAnswers?.[myTeam?.id] || {};
    const playerAnswer = myTeamAnswers?.[state.player?.id];
    const playerAnswered = typeof playerAnswer === 'string';
    const canAnswer = state.role === 'player' && state.player && state.player.teamId && !playerAnswered && !isRoundResult && !myTeam?.eliminated;

    els.optionsList.innerHTML = state.room.round.options.map((option) => {
      const isSelected = playerAnswer === option.id;
      const isCorrect = state.room.roundCorrectAnswer === option.id;
      const classes = `option-btn ${isSelected ? 'selected' : ''} ${isCorrect && isRoundResult ? 'correct' : ''}`.trim();
      return `
        <button class="${classes}" data-answer="${option.id}" ${canAnswer ? '' : 'disabled'}>
          <span>${option.id}. ${option.text}</span>
          ${isSelected ? '<span class="badge">Đã chọn</span>' : ''}
          ${isCorrect && isRoundResult ? '<span class="badge correct-badge">Đáp án đúng</span>' : ''}
        </button>
      `;
    }).join('');

    if (isRoundResult) {
      const finalTeams = (state.room.teams || []).map((team) => {
        const answer = state.room.roundAnswers?.[team.id] || 'chưa trả lời';
        const correct = state.room.roundCorrectAnswer ? (answer === state.room.roundCorrectAnswer) : false;
        const isAnswered = answer !== 'chưa trả lời' && answer !== 'không có';
        let feedback = '';
        if (isAnswered) {
          feedback = correct
            ? ' <span class="indicator-correct">đúng</span>'
            : ' <span class="indicator-incorrect">sai</span>';
        }
        return `${team.name}: <span class="badge-answer">${answer}</span>${feedback}`;
      });
      els.roundStatus.innerHTML = finalTeams.length ? `Kết quả: ${finalTeams.join(' • ')}` : 'Chưa có nhóm nào chọn đáp án.';
    } else {
      const answeredTeams = (state.room.teams || []).map((team) => {
        const answers = state.room.playerAnswers?.[team.id] ? Object.values(state.room.playerAnswers[team.id]) : [];
        if (!answers.length) return `${team.name}: chưa trả lời`;
        const counts = answers.reduce((map, answer) => {
          map[answer] = (map[answer] || 0) + 1;
          return map;
        }, {});
        const entries = Object.entries(counts).map(([answer, count]) => `${answer}:${count}`);
        return `${team.name}: ${entries.join(', ')}`;
      });
      els.roundStatus.innerHTML = answeredTeams.length
        ? `Vote nhóm: ${answeredTeams.join(' • ')}`
        : 'Chưa có nhóm nào chọn đáp án.';
    }

    // Timer calculation & visual updates
    const duration = state.room.roundDuration || 30;
    const timeLeft = typeof state.room.serverTimeLeft === 'number'
      ? state.room.serverTimeLeft
      : Math.max(0, Math.ceil((duration * 1000 - (Date.now() - state.room.roundStartedAt)) / 1000));

    els.roundTimer.textContent = `Thời gian còn lại: ${timeLeft}s`;
    if (els.timerProgressBar) {
      const percentage = (timeLeft / duration) * 100;
      els.timerProgressBar.style.width = `${percentage}%`;
    }

    els.resultCard.classList.add('hidden');
  } else {
    els.roundCard.classList.add('hidden');
  }

  // Display Result Card
  if (state.room.status === 'round-result' && state.room.roundResult) {
    els.resultCard.classList.remove('hidden');

    // Tìm phương án đúng của vòng hiện tại để hiển thị phần giải thích / bẫy tư duy
    const correctOpt = state.room.round?.options?.find(opt => opt.id === state.room.roundCorrectAnswer);
    const explanationHtml = correctOpt && correctOpt.explanation
      ? `<div class="explanation-box"><strong>💡 Phân tích & Bẫy tư duy:</strong> ${correctOpt.explanation}</div>`
      : '';

    els.resultSummary.innerHTML = `
      <div><strong>${state.room.roundResult.title}:</strong> ${state.room.roundResult.summary}</div>
      ${explanationHtml}
    `;
  } else {
    els.resultCard.classList.add('hidden');
  }
}

function populateTeamOptions(room = state.room || state.previewRoom) {
  if (!room || !room.teams) return;
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
  if (modal) {
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
    teamNames: document.getElementById('team-names').value.split(',').map((item) => item.trim()),
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
    name: document.getElementById('player-name').value,
    teamId: els.teamSelect.value
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
  checkUrlParams();
});

socket.on('room:created', ({ room }) => {
  state.room = room;
  state.role = 'host';
  renderRoom();
  populateTeamOptions();
  setMessage(`Hệ thống: Đã tạo phòng ${room.id} thành công.`);
});

socket.on('room:preview', ({ room }) => {
  state.previewRoom = room;
  populateTeamOptions(room);
  setMessage(`Phòng tìm thấy: ${room.name}. Vui lòng chọn nhóm của bạn.`);
});

socket.on('room:joined', ({ room, player }) => {
  state.room = room;
  state.previewRoom = null;
  state.player = player;
  state.teamId = player.teamId;
  state.role = 'player';
  renderRoom();
  populateTeamOptions(room);
  setMessage(`Hệ thống: Bạn đã tham gia phòng ${room.id} với tư cách là ${player.name}.`);
});

socket.on('room:update', (room) => {
  state.room = room;
  renderRoom();
  populateTeamOptions();
});

socket.on('round:start', () => {
  renderRoom();
  setMessage('Bắt đầu vòng chơi mới! Hãy thảo luận và đưa ra quyết sách.');
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
  renderRoom();
  setMessage('Lưu ý: Host đã tắt phòng hoặc ngắt kết nối.');
});

socket.on('game:finished', ({ winner }) => {
  const conclusionText = "\n\nÝ nghĩa trò chơi: Nếu chỉ chọn tăng trưởng Kinh tế mà bỏ qua An sinh và Môi trường thì quốc gia sẽ sụp đổ. Đó là lý do vì sao bắt buộc phải chọn con đường phát triển bền vững, gắn tăng trưởng Kinh tế với tiến bộ, công bằng Xã hội và bảo vệ Môi trường (Kinh tế thị trường Định hướng XHCN)!";
  setMessage(`Trò chơi đã kết thúc! Xin chúc mừng nhóm ${winner?.name || 'N/A'} đã xuất sắc giành chiến thắng chung cuộc!${conclusionText}`);
});

socket.on('error', ({ message }) => {
  setMessage(`Lỗi: ${message}`);
});

let timerTick = null;
function startTimerTick() {
  if (timerTick) clearInterval(timerTick);
  timerTick = setInterval(() => {
    if (state.room?.status === 'playing' && state.room.roundStartedAt) {
      renderRoom();
    }
  }, 1000);
}

// Check for room code query parameter in URL on startup
let paramsChecked = false;
function checkUrlParams() {
  if (paramsChecked) return;
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

// Initial Setup
switchView('player'); // Set default tab to player
renderRoom();
startTimerTick();
