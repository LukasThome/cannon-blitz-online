import { initLobbySteps } from './lobby.js';
import { initAuthUI } from './auth_ui.js';
import { initFirebaseAuth } from './auth.js';
import { wireAuthBadge } from './auth_badge.js';

const defaultWsUrl = 'wss://honest-kanya-thobe-digital-fa68f3e8.koyeb.app/ws';
const params = new URLSearchParams(location.search);
const wsParam = params.get('ws');
const storedWs = localStorage.getItem('cannon_ws');
let currentWsUrl = wsParam || storedWs || defaultWsUrl;
let healthUrl = currentWsUrl
  .replace(/^wss:\/\//, 'https://')
  .replace(/^ws:\/\//, 'http://')
  .replace(/\/ws$/, '/health');

const app = new PIXI.Application({
  width: 640,
  height: 520,
  backgroundColor: 0x1b1512,
  antialias: false,
  resolution: window.devicePixelRatio || 1,
});

document.getElementById('pixi-root').appendChild(app.view);

const palette = {
  board: 0x2a1f1a,
  grid: 0x5b4532,
  me: 0x5dbb63,
  enemy: 0xd55b5b,
  impact: 0xd3b65f,
  empty: 0xf7e8c1,
};

const ui = {
  status: document.getElementById('status'),
  statusText: document.getElementById('status-text'),
  backendStatus: document.getElementById('backend-status'),
  authUser: document.getElementById('auth-user'),
  btnLogout: document.getElementById('btn-logout'),
  lobbyUser: document.getElementById('lobby-user'),
  connIndicator: document.getElementById('conn-indicator'),
  btnReconnect: document.getElementById('btn-reconnect'),
  btnSound: document.getElementById('btn-sound'),
  btnSettings: document.getElementById('btn-settings'),
  roomCode: document.getElementById('room-code'),
  inviteLink: document.getElementById('invite-link'),
  btnCopyLink: document.getElementById('btn-copy-link'),
  playerList: document.getElementById('player-list'),
  turn: document.getElementById('turn'),
  saldo: document.getElementById('saldo'),
  message: document.getElementById('message'),
  btnNormal: document.getElementById('btn-normal'),
  btnPrecise: document.getElementById('btn-precise'),
  btnStrong: document.getElementById('btn-strong'),
  btnBuy: document.getElementById('btn-buy'),
  btnReady: document.getElementById('btn-ready'),
  lobby: document.getElementById('lobby-overlay'),
  lobbyMessage: document.getElementById('lobby-message'),
  nameInput: document.getElementById('name-input'),
  btnNextName: document.getElementById('btn-next-name'),
  wsLabel: document.getElementById('ws-label'),
  wsInput: document.getElementById('ws-input'),
  difficulty: document.getElementById('difficulty'),
  codeInput: document.getElementById('code-input'),
  btnCreate: document.getElementById('btn-create'),
  btnJoinMode: document.getElementById('btn-join-mode'),
  btnSingle: document.getElementById('btn-single'),
  btnStartSingle: document.getElementById('btn-start-single'),
  btnJoin: document.getElementById('btn-join'),
  btnAdvanced: document.getElementById('btn-advanced'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modal-title'),
  modalBody: document.getElementById('modal-body'),
  modalClose: document.getElementById('modal-close'),
  settings: document.getElementById('settings'),
  settingsClose: document.getElementById('settings-close'),
  toggleSounds: document.getElementById('toggle-sounds'),
  togglePopups: document.getElementById('toggle-popups'),
  stepName: document.getElementById('step-name'),
  stepMode: document.getElementById('step-mode'),
  stepJoin: document.getElementById('step-join'),
  stepSingle: document.getElementById('step-single'),
  authOverlay: document.getElementById('auth-overlay'),
  authMessage: document.getElementById('auth-message'),
  authStepMode: document.getElementById('auth-step-mode'),
  authStepEmail: document.getElementById('auth-step-email'),
  authStepPassword: document.getElementById('auth-step-password'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authNextEmail: document.getElementById('auth-next-email'),
  authSubmit: document.getElementById('auth-submit'),
  authLogin: document.getElementById('auth-login'),
  authRegister: document.getElementById('auth-register'),
};

class BoardView {
  constructor({ x, y, rows, cols, label }) {
    this.rows = rows;
    this.cols = cols;
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    const title = new PIXI.Text(label, {
      fontFamily: 'Press Start 2P',
      fontSize: 10,
      fill: 0xf2d085,
    });
    title.y = -18;
    this.container.addChild(title);

    this.cells = [];
    const cellSize = 48;
    for (let r = 0; r < rows; r += 1) {
      const row = [];
      for (let c = 0; c < cols; c += 1) {
        const g = new PIXI.Graphics();
        g.beginFill(palette.board);
        g.lineStyle(2, palette.grid, 1);
        g.drawRect(0, 0, cellSize, cellSize);
        g.endFill();
        g.x = c * (cellSize + 4);
        g.y = r * (cellSize + 4);
        g.eventMode = 'static';
        g.cursor = 'pointer';
        g.__pos = { r, c };
        this.container.addChild(g);
        row.push(g);
      }
      this.cells.push(row);
    }
  }

  onCellClick(handler) {
    this.cells.flat().forEach((cell) => {
      cell.on('pointerdown', () => handler(cell.__pos));
    });
  }

  render({ bases, impacts, showBases }) {
    for (let r = 0; r < this.rows; r += 1) {
      for (let c = 0; c < this.cols; c += 1) {
        const cell = this.cells[r][c];
        cell.clear();
        let fill = palette.board;
        if (showBases && bases.some((p) => p[0] === r && p[1] === c)) {
          fill = showBases === 'me' ? palette.me : palette.enemy;
        }
        if (impacts.some((p) => p[0] === r && p[1] === c)) {
          fill = palette.impact;
        }
        cell.beginFill(fill);
        cell.lineStyle(2, palette.grid, 1);
        cell.drawRect(0, 0, 48, 48);
        cell.endFill();
      }
    }
  }
}

const enemyBoard = new BoardView({ x: 20, y: 40, rows: 3, cols: 5, label: 'Campo Inimigo' });
const myBoard = new BoardView({ x: 20, y: 260, rows: 3, cols: 5, label: 'Seu Campo' });
app.stage.addChild(enemyBoard.container);
app.stage.addChild(myBoard.container);

let socket = null;
let playerId = null;
let state = null;
let buyingMode = false;
let readyState = false;
let roomCode = null;
let lastShooterId = null;
let backendOnline = false;
let healthFailures = 0;
let audioEnabled = false;
let audioCtx = null;
let lastPhase = null;
let lastWinnerId = null;
let popupsEnabled = true;
let autoJoinTriggered = false;
let myImpacts = [];
let enemyImpacts = [];
let myImpactTimer = null;
let enemyImpactTimer = null;
let bgInterval = null;
let idToken = null;

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone({ freq = 440, duration = 0.12, type = 'square', gain = 0.04 } = {}) {
  if (!audioEnabled) return;
  ensureAudio();
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playStart() {
  playTone({ freq: 660, duration: 0.08 });
  setTimeout(() => playTone({ freq: 880, duration: 0.08 }), 120);
}

function playWin() {
  playTone({ freq: 784, duration: 0.1 });
  setTimeout(() => playTone({ freq: 988, duration: 0.1 }), 120);
  setTimeout(() => playTone({ freq: 1174, duration: 0.12 }), 240);
}

function playLose() {
  playTone({ freq: 330, duration: 0.12 });
  setTimeout(() => playTone({ freq: 262, duration: 0.14 }), 140);
}

function playShot() {
  playCannon();
}

function playHit() {
  playTone({ freq: 920, duration: 0.07, type: 'triangle', gain: 0.06 });
}

function playCannon() {
  if (!audioEnabled) return;
  ensureAudio();
  const duration = 0.2;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  gain.gain.value = 0.08;
  source.buffer = buffer;
  source.connect(gain).connect(audioCtx.destination);
  source.start();
}

function playPirateLoop() {
  if (!audioEnabled) return;
  ensureAudio();
  if (bgInterval) return;
  const melody = [262, 294, 330, 392, 440, 392, 330, 294];
  let index = 0;
  bgInterval = setInterval(() => {
    if (!audioEnabled) return;
    playTone({ freq: melody[index % melody.length], duration: 0.12, type: 'square', gain: 0.015 });
    index += 1;
  }, 220);
}

function stopPirateLoop() {
  if (bgInterval) {
    clearInterval(bgInterval);
    bgInterval = null;
  }
}

const { showStep } = initLobbySteps(ui);

async function setupAuth() {
  const authUi = {
    overlay: ui.authOverlay,
    message: ui.authMessage,
    stepEmail: ui.authStepEmail,
    stepPassword: ui.authStepPassword,
    email: ui.authEmail,
    password: ui.authPassword,
    btnNextEmail: ui.authNextEmail,
    btnSubmit: ui.authSubmit,
    btnLogin: ui.authLogin,
    btnRegister: ui.authRegister,
  };

  try {
    if (!window.__FIREBASE_CONFIG__ || !window.__FIREBASE_CONFIG__.apiKey) {
      try {
        const res = await fetch('/config.json');
        if (res.ok) {
          window.__FIREBASE_CONFIG__ = await res.json();
        }
      } catch (err) {
        // ignore fetch error; handled below
      }
    }
    const config = window.__FIREBASE_CONFIG__ || {};
    const auth = await initFirebaseAuth(config);
    initAuthUI(authUi, auth);
    wireAuthBadge({ authUser: ui.authUser, btnLogout: ui.btnLogout, lobbyUser: ui.lobbyUser }, auth);
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        idToken = await user.getIdToken();
      } else {
        idToken = null;
      }
    });
  } catch (err) {
    authUi.message.textContent = 'Configure o Firebase para continuar.';
  }
}

function showModal(title, body) {
  if (!popupsEnabled) return;
  ui.modalTitle.textContent = title;
  ui.modalBody.textContent = body;
  ui.modal.classList.remove('hidden');
}

function hideModal() {
  ui.modal.classList.add('hidden');
}

function setWsUrl(nextUrl) {
  currentWsUrl = nextUrl;
  healthUrl = currentWsUrl
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://')
    .replace(/\/ws$/, '/health');
}
let pendingJoin = false;

function setConnectionState(state) {
  ui.statusText.textContent = state;
  if (state.toLowerCase().includes('connect')) {
    ui.connIndicator.classList.remove('hidden');
  } else {
    ui.connIndicator.classList.add('hidden');
  }
}

function connect() {
  setConnectionState('Connecting...');
  socket = new WebSocket(currentWsUrl);
  socket.addEventListener('open', () => {
    setConnectionState('Connected');
    const storedRoom = localStorage.getItem('cannon_room');
    const storedPlayer = localStorage.getItem('cannon_player');
    if (storedRoom && storedPlayer) {
      send('reconnect', { room_code: storedRoom, player_id: storedPlayer });
      return;
    }
    if (pendingJoin) {
      const name = ui.nameInput.value.trim() || 'Jogador';
      send('join_room', { name, room_code: ui.codeInput.value.trim().toUpperCase() });
      pendingJoin = false;
    }
  });

  socket.addEventListener('message', (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.type === 'joined') {
      playerId = msg.player_id;
      roomCode = msg.room_code;
      ui.roomCode.textContent = `Sala: ${roomCode}`;
      const invite = `${location.origin}${location.pathname}?room=${roomCode}&ws=${encodeURIComponent(currentWsUrl)}`;
      ui.inviteLink.textContent = `Invite: ${invite}`;
      ui.lobbyMessage.textContent = `Link: ${invite}`;
      ui.lobby.classList.add('hidden');
      ui.lobbyMessage.textContent = '';
      readyState = false;
      ui.btnReady.textContent = 'Pronto';
      buyingMode = false;
      localStorage.setItem('cannon_room', roomCode);
      localStorage.setItem('cannon_player', playerId);
      return;
    }
    if (msg.type === 'room_state') {
      state = msg.data;
      lastShooterId = state.last_shooter_id;
      if (state.last_impacts && state.last_impacts.length) {
        if (lastShooterId === playerId) {
          myImpacts = state.last_impacts;
          if (myImpactTimer) clearTimeout(myImpactTimer);
          myImpactTimer = setTimeout(() => {
            myImpacts = [];
            renderState();
          }, 1000);
        } else {
          enemyImpacts = state.last_impacts;
          if (enemyImpactTimer) clearTimeout(enemyImpactTimer);
          enemyImpactTimer = setTimeout(() => {
            enemyImpacts = [];
            renderState();
          }, 1000);
        }
      }
      renderState();
    }
    if (msg.type === 'error') {
      ui.lobbyMessage.textContent = msg.message;
      ui.message.textContent = msg.message;
      if (msg.message === 'Reconexao invalida') {
        localStorage.removeItem('cannon_room');
        localStorage.removeItem('cannon_player');
        ui.lobby.classList.remove('hidden');
      }
    }
  });

  socket.addEventListener('close', () => {
    setConnectionState('Disconnected');
  });
}

async function checkBackend() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(healthUrl, { signal: controller.signal });
    if (res.ok) {
      const data = await res.json();
      ui.backendStatus.textContent = `Backend: ${data.status || 'ok'}`;
      backendOnline = true;
      healthFailures = 0;
    } else {
      ui.backendStatus.textContent = `Backend: error ${res.status}`;
      backendOnline = false;
      healthFailures += 1;
    }
  } catch (err) {
    ui.backendStatus.textContent = 'Backend: offline';
    backendOnline = false;
    healthFailures += 1;
  } finally {
    clearTimeout(timeout);
  }
  ui.btnReconnect.disabled = !backendOnline;
  if (!backendOnline && healthFailures >= 2 && storedWs && !wsParam && currentWsUrl !== defaultWsUrl) {
    localStorage.removeItem('cannon_ws');
    setWsUrl(defaultWsUrl);
    ui.message.textContent = 'Backend offline. Fallback to default.';
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    connect();
  }
}

function renderState() {
  if (!state) return;

  const me = state.players.find((p) => p.id === playerId);
  const enemy = state.players.find((p) => p.id !== playerId);
  const myBases = state.bases[playerId] || [];
  const enemyBases = enemy ? state.bases[enemy.id] || [] : [];
  const impactsOnEnemy = myImpacts;
  const impactsOnMe = enemyImpacts;

  ui.turn.textContent = `Turn: ${state.turn_player_id === playerId ? 'Você' : 'Oponente'}`;
  ui.saldo.textContent = `Saldo: ${me ? me.saldo : 0}`;
  ui.message.textContent = state.message || '';
  ui.playerList.textContent = `Players: ${state.players.map((p) => {
    const status = state.phase === 'lobby'
      ? (p.ready ? 'ready' : 'not ready')
      : (p.connected ? 'online' : 'offline');
    return `${p.name} (${status})`;
  }).join(' | ')}`;

  const myTurn = state.turn_player_id === playerId;
  const saldo = me ? me.saldo : 0;
  ui.btnNormal.disabled = !myTurn || state.phase !== 'battle';
  ui.btnPrecise.disabled = !myTurn || state.phase !== 'battle' || saldo < 1;
  ui.btnStrong.disabled = !myTurn || state.phase !== 'battle' || saldo < 3;
  ui.btnBuy.disabled = !myTurn || state.phase !== 'battle' || saldo < 2;
  ui.btnReady.disabled = state.phase !== 'lobby';

  enemyBoard.render({ bases: enemyBases, impacts: impactsOnEnemy, showBases: enemy ? 'enemy' : null });
  myBoard.render({ bases: myBases, impacts: impactsOnMe, showBases: 'me' });

  if (lastPhase !== state.phase) {
    if (state.phase === 'placement') {
      showModal('Coloque suas bases', 'Escolha 5 posicoes no seu campo.');
      playStart();
    }
    if (state.phase === 'battle') {
      showModal('Partida iniciada', 'Boa sorte! Um tiro ou compra por turno.');
      playStart();
    }
  }

  if (state.phase === 'ended' && lastWinnerId !== state.winner_id) {
    if (state.winner_id === playerId) {
      showModal('Vitoria!', 'Voce destruiu todas as bases do inimigo.');
      playWin();
    } else {
      showModal('Derrota', 'Suas bases foram destruídas.');
      playLose();
    }
  }

  if ((myImpacts.length || enemyImpacts.length) && lastShooterId !== null) {
    const enemyHit = enemy && impactsOnEnemy.some((pos) => enemyBases.some((b) => b[0] === pos[0] && b[1] === pos[1]));
    const meHit = impactsOnMe.some((pos) => myBases.some((b) => b[0] === pos[0] && b[1] === pos[1]));
    playShot();
    if (enemyHit || meHit) {
      playHit();
    }
  }

  lastPhase = state.phase;
  lastWinnerId = state.winner_id;
}

function send(type, payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const message = { type, ...payload };
  if (idToken) {
    message.idToken = idToken;
  }
  socket.send(JSON.stringify(message));
}

ui.btnCreate.addEventListener('click', () => {
  const name = ui.nameInput.value.trim();
  if (!name) {
    ui.lobbyMessage.textContent = 'Digite seu nome.';
    return;
  }
  const wsUrl = ui.wsInput.value.trim();
  if (wsUrl) {
    localStorage.setItem('cannon_ws', wsUrl);
    if (!wsParam) {
      setWsUrl(wsUrl);
    }
  }
  send('create_room', { name });
});

ui.btnStartSingle.addEventListener('click', () => {
  const name = ui.nameInput.value.trim();
  if (!name) {
    ui.lobbyMessage.textContent = 'Digite seu nome.';
    return;
  }
  const difficulty = ui.difficulty.value;
  send('create_ai_room', { name, difficulty });
});

ui.btnJoin.addEventListener('click', () => {
  const name = ui.nameInput.value.trim();
  if (!name) {
    ui.lobbyMessage.textContent = 'Digite seu nome.';
    return;
  }
  const code = ui.codeInput.value.trim().toUpperCase();
  if (!code) {
    ui.lobbyMessage.textContent = 'Informe o codigo da sala.';
    return;
  }
  const wsUrl = ui.wsInput.value.trim();
  if (wsUrl) {
    localStorage.setItem('cannon_ws', wsUrl);
    if (!wsParam) {
      setWsUrl(wsUrl);
    }
  }
  send('join_room', { name, room_code: code });
});

ui.btnAdvanced.addEventListener('click', () => {
  const isHidden = ui.wsLabel.classList.contains('hidden');
  ui.wsLabel.classList.toggle('hidden', !isHidden);
  ui.btnAdvanced.textContent = isHidden ? 'Advanced ✓' : 'Advanced';
});

ui.btnSound.addEventListener('click', async () => {
  audioEnabled = !audioEnabled;
  if (audioEnabled) {
    ensureAudio();
    await audioCtx.resume();
    playPirateLoop();
  } else {
    stopPirateLoop();
  }
  ui.btnSound.textContent = audioEnabled ? 'Som: On' : 'Som: Off';
  ui.toggleSounds.checked = audioEnabled;
});

ui.modalClose.addEventListener('click', hideModal);

ui.btnSettings.addEventListener('click', () => {
  ui.settings.classList.remove('hidden');
});

ui.settingsClose.addEventListener('click', () => {
  ui.settings.classList.add('hidden');
});

ui.toggleSounds.addEventListener('change', async (evt) => {
  audioEnabled = evt.target.checked;
  if (audioEnabled) {
    ensureAudio();
    await audioCtx.resume();
    playPirateLoop();
  } else {
    stopPirateLoop();
  }
  ui.btnSound.textContent = audioEnabled ? 'Som: On' : 'Som: Off';
});

ui.togglePopups.addEventListener('change', (evt) => {
  popupsEnabled = evt.target.checked;
});

ui.btnNormal.addEventListener('click', () => send('shot', { shot_type: 'normal' }));
ui.btnPrecise.addEventListener('click', () => send('shot', { shot_type: 'precise' }));
ui.btnStrong.addEventListener('click', () => send('shot', { shot_type: 'strong' }));
ui.btnBuy.addEventListener('click', () => {
  buyingMode = true;
  ui.message.textContent = 'Clique em uma posicao livre para comprar base.';
});
ui.btnReady.addEventListener('click', () => {
  readyState = !readyState;
  ui.btnReady.textContent = readyState ? 'Pronto ✓' : 'Pronto';
  send('ready', { ready: readyState });
});

ui.btnCopyLink.addEventListener('click', async () => {
  if (!roomCode) return;
  const invite = `${location.origin}${location.pathname}?room=${roomCode}&ws=${encodeURIComponent(currentWsUrl)}`;
  try {
    await navigator.clipboard.writeText(invite);
    ui.message.textContent = 'Link copiado.';
  } catch (err) {
    ui.message.textContent = 'Falha ao copiar link.';
  }
});

myBoard.onCellClick(({ r, c }) => {
  if (!state) return;
  if (state.phase === 'placement') {
    send('place_base', { pos: [r, c] });
    return;
  }
  if (state.phase === 'battle' && buyingMode) {
    send('buy_base', { pos: [r, c] });
    buyingMode = false;
  }
});

connect();
setupAuth();
checkBackend();
setInterval(checkBackend, 10000);

ui.btnReconnect.addEventListener('click', () => {
  if (!backendOnline) return;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
  }
  connect();
});

const urlRoom = params.get('room');
if (urlRoom) {
  ui.codeInput.value = urlRoom.toUpperCase();
  ui.btnNextName.classList.add('hidden');
  const codeLabel = ui.codeInput.closest('label');
  if (codeLabel) {
    codeLabel.classList.add('hidden');
  }
  const diffLabel = ui.difficulty.closest('label');
  if (diffLabel) {
    diffLabel.classList.add('hidden');
  }
  ui.lobbyMessage.textContent = 'Digite seu nome para entrar.';
  ui.nameInput.addEventListener('input', () => {
    const name = ui.nameInput.value.trim();
    if (!name || autoJoinTriggered) return;
    autoJoinTriggered = true;
    if (socket && socket.readyState === WebSocket.OPEN) {
      send('join_room', { name, room_code: ui.codeInput.value.trim().toUpperCase() });
    } else {
      pendingJoin = true;
    }
  });
  showStep(ui.stepName);
} else {
  showStep(ui.stepName);
}
if (wsParam) {
  ui.wsInput.value = wsParam;
  ui.wsLabel.classList.remove('hidden');
  ui.btnAdvanced.textContent = 'Advanced ✓';
}
