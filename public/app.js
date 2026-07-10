const socket = io();

const state = {
  role: 'host',
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
  // tabs removed: navigation via title icon
  teamSelect: document.getElementById('team-select'),
  homeButton: document.getElementById('host-home-btn')
};
els.hostTracker = document.getElementById('host-tracker');
els.hostTrackerList = document.getElementById('host-tracker-list');

function setMessage(text) {
  els.messageBox.textContent = text;
}

function switchView(role) {
  state.role = role;
  els.hostForm.classList.toggle('hidden', role !== 'host');
  els.playerForm.classList.toggle('hidden', role !== 'player');
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
  els.roomStatus.textContent = state.room.status;
  const isHost = state.role === 'host';
  els.hostControls.classList.toggle('hidden', !isHost);
  if (isHost) {
    const showStart = state.room.status === 'lobby';
    const showNext = state.room.status === 'round-result';
    els.startGameBtn.classList.toggle('hidden', !showStart);
    els.nextRoundBtn.classList.toggle('hidden', !showNext);
  }

  els.scoreboardPanel.classList.toggle('hidden', !isHost);
  els.scoreboardNotice.classList.toggle('hidden', isHost);
  if (!isHost) {
    els.scoreboardNotice.textContent = 'Chỉ host được xem bảng điểm.';
  } else {
    const visibleTeams = (state.room.teams || []).filter((team) => {
      return (state.room.players || []).some((player) => player.teamId === team.id);
    });
    const table = [];
    visibleTeams.forEach((team) => {
      const total = team.score.economy + team.score.social + team.score.environment;
      table.push(`<div class="score-row"><span>${team.name}</span><span><strong>${total}</strong> · K:${team.score.economy} · X:${team.score.social} · M:${team.score.environment}</span></div>`);
    });
    els.scoreboard.innerHTML = table.join('') || '<p>Chưa có nhóm nào có thành viên</p>';
  }

  if ((state.room.status === 'playing' || state.room.status === 'round-result') && state.room.round) {
    els.roundCard.classList.remove('hidden');
    els.roundTitle.textContent = state.room.round.title;
    els.roundScenario.textContent = state.room.round.scenario;
    const isRoundResult = state.room.status === 'round-result';
    const myTeam = state.room.teams.find((team) => team.id === state.player?.teamId);
    const myTeamAnswers = state.room.playerAnswers?.[myTeam?.id] || {};
    const playerAnswer = myTeamAnswers?.[state.player?.id];
    const playerAnswered = typeof playerAnswer === 'string';
    const canAnswer = state.role === 'player' && state.player && state.player.teamId && !playerAnswered && !isRoundResult;
    els.optionsList.innerHTML = state.room.round.options.map((option) => {
      const isSelected = playerAnswer === option.id;
      const isCorrect = state.room.roundCorrectAnswer === option.id;
      const classes = `option-btn ${isSelected ? 'selected' : ''} ${isCorrect && isRoundResult ? 'correct' : ''}`.trim();
      return `<button class="${classes}" data-answer="${option.id}" ${canAnswer ? '' : 'disabled'}>${option.id}. ${option.text}${isSelected ? ' <span class="badge">Đã chọn</span>' : ''}${isCorrect && isRoundResult ? ' <span class="badge correct-badge">Đáp án đúng</span>' : ''}</button>`;
    }).join('');

    if (isRoundResult) {
      const finalTeams = (state.room.teams || []).map((team) => {
        const answer = state.room.roundAnswers?.[team.id] || 'chưa trả lời';
        const correct = state.room.roundCorrectAnswer ? (answer === state.room.roundCorrectAnswer) : false;
        return `${team.name}: ${answer}${answer !== 'chưa trả lời' ? (correct ? ' ✓ đúng' : ' ✗ sai') : ''}`;
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

    // prefer server-provided timeLeft (via round:tick), fallback to client calc
    const timeLeft = typeof state.room.serverTimeLeft === 'number'
      ? state.room.serverTimeLeft
      : Math.max(0, Math.ceil((state.room.roundDuration * 1000 - (Date.now() - state.room.roundStartedAt)) / 1000));
    els.roundTimer.textContent = `Thời gian còn lại: ${timeLeft}s`;
    // host tracker
    if (state.role === 'host') {
      els.hostTracker.classList.remove('hidden');
      const isRoundResult = state.room.status === 'round-result';
      const list = (state.room.teams || []).map((team) => {
        if (isRoundResult) {
          const answer = state.room.roundAnswers?.[team.id] || 'chưa trả lời';
          const correct = state.room.roundCorrectAnswer ? answer === state.room.roundCorrectAnswer : false;
          const status = answer === 'chưa trả lời' ? '❌' : (correct ? '✅' : '⚠️');
          return `<div>${status} ${team.name} ${answer !== 'chưa trả lời' ? `- ${answer}${correct ? ' (đúng)' : ' (sai)'}` : ''}</div>`;
        }
        const answers = state.room.playerAnswers?.[team.id] ? Object.values(state.room.playerAnswers[team.id]) : [];
        const votedCount = answers.length;
        const unique = Array.from(new Set(answers));
        const status = votedCount > 0 ? '✅' : '❌';
        const detail = votedCount > 0 ? `${votedCount}/${state.room.players.filter((player) => player.teamId === team.id).length} phiếu ${unique.length > 1 ? `(đa dạng: ${unique.join(', ')})` : unique[0]}` : '';
        return `<div>${status} ${team.name}${detail ? ` - ${detail}` : ''}</div>`;
      }).join('');
      els.hostTrackerList.innerHTML = list || 'Chưa có nhóm';
    } else {
      els.hostTracker.classList.add('hidden');
    }
    els.resultCard.classList.add('hidden');
  } else {
    els.roundCard.classList.add('hidden');
  }

  if (state.room.status === 'round-result' && state.room.roundResult) {
    els.resultCard.classList.remove('hidden');
    els.resultSummary.textContent = `${state.room.roundResult.title}: ${state.room.roundResult.summary}`;
  } else {
    els.resultCard.classList.add('hidden');
  }
}

function populateTeamOptions(room = state.room || state.previewRoom) {
  if (!room || !room.teams) return;
  const options = room.teams.map((team) => `<option value="${team.id}" ${state.player?.teamId === team.id ? 'selected' : ''}>${team.name}</option>`).join('');
  els.teamSelect.innerHTML = options;
}

// tabs removed: no tab click handlers

els.homeButton.addEventListener('click', () => {
  state.role = 'host';
  switchView('host');
  renderRoom();
});

els.hostForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = {
    roomName: document.getElementById('room-name').value,
    teamNames: document.getElementById('team-names').value.split(',').map((item) => item.trim()),
    roundDuration: document.getElementById('round-duration').value
  };
  socket.emit('host:create-room', payload);
  state.role = 'host';
  setMessage('Đang tạo phòng...');
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
  setMessage('Đang tham gia phòng...');
});

els.startGameBtn.addEventListener('click', () => {
  socket.emit('host:start-game', { roomCode: state.room.id });
  setMessage('Đang bắt đầu trò chơi...');
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
  setMessage('Đã gửi đáp án của nhóm');
});

socket.on('connect', () => {
  setMessage('Đã kết nối máy chủ');
});

socket.on('room:created', ({ room }) => {
  state.room = room;
  state.role = 'host';
  renderRoom();
  populateTeamOptions();
  setMessage(`Đã tạo phòng ${room.id}`);
});

socket.on('room:preview', ({ room }) => {
  state.previewRoom = room;
  populateTeamOptions(room);
  setMessage(`Đã tải phòng ${room.id}. Vui lòng chọn nhóm trước khi tham gia.`);
});

socket.on('room:joined', ({ room, player }) => {
  state.room = room;
  state.previewRoom = null;
  state.player = player;
  state.teamId = player.teamId;
  state.role = 'player';
  renderRoom();
  populateTeamOptions(room);
  setMessage(`Đã vào phòng ${room.id}`);
});

socket.on('room:update', (room) => {
  state.room = room;
  renderRoom();
  populateTeamOptions();
});

socket.on('round:start', () => {
  renderRoom();
});

socket.on('round:tick', ({ timeLeft }) => {
  if (!state.room) return;
  state.room.serverTimeLeft = timeLeft;
  // update timer display only
  els.roundTimer.textContent = `Thời gian còn lại: ${timeLeft}s`;
});

socket.on('room:deleted', () => {
  state.room = null;
  state.player = null;
  renderRoom();
  setMessage('Host đã đóng phòng');
});

socket.on('game:finished', ({ winner }) => {
  setMessage(`Trò chơi kết thúc. Nhóm thắng là ${winner?.name || 'n/a'}`);
});

socket.on('error', ({ message }) => {
  setMessage(message);
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

// Default to player view (tabs removed)
switchView('player');
renderRoom();
startTimerTick();
