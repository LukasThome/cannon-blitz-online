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
  connIndicator: document.getElementById('conn-indicator'),
  btnReconnect: document.getElementById('btn-reconnect'),
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
  wsLabel: document.getElementById('ws-label'),
  wsInput: document.getElementById('ws-input'),
  codeInput: document.getElementById('code-input'),
  btnCreate: document.getElementById('btn-create'),
  btnJoin: document.getElementById('btn-join'),
  btnAdvanced: document.getElementById('btn-advanced'),
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
let clientImpacts = [];
let impactTimer = null;
let lastShooterId = null;
let backendOnline = false;
let healthFailures = 0;

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
        clientImpacts = state.last_impacts;
        if (impactTimer) {
          clearTimeout(impactTimer);
        }
        impactTimer = setTimeout(() => {
          clientImpacts = [];
          renderState();
        }, 1000);
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
  const impacts = clientImpacts;
  const impactsOnEnemy = lastShooterId === playerId ? impacts : [];
  const impactsOnMe = lastShooterId && lastShooterId !== playerId ? impacts : [];

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
}

function send(type, payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ type, ...payload }));
}

ui.btnCreate.addEventListener('click', () => {
  const name = ui.nameInput.value.trim() || 'Jogador';
  const wsUrl = ui.wsInput.value.trim();
  if (wsUrl) {
    localStorage.setItem('cannon_ws', wsUrl);
    if (!wsParam) {
      setWsUrl(wsUrl);
    }
  }
  send('create_room', { name });
});

ui.btnJoin.addEventListener('click', () => {
  const name = ui.nameInput.value.trim() || 'Jogador';
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
  ui.btnCreate.classList.add('hidden');
  ui.btnJoin.classList.add('hidden');
  const codeLabel = ui.codeInput.closest('label');
  if (codeLabel) {
    codeLabel.classList.add('hidden');
  }
  ui.lobbyMessage.textContent = 'Digite seu nome para entrar.';
  ui.nameInput.addEventListener('change', () => {
    const name = ui.nameInput.value.trim();
    if (!name) return;
    if (socket && socket.readyState === WebSocket.OPEN) {
      send('join_room', { name, room_code: ui.codeInput.value.trim().toUpperCase() });
    } else {
      pendingJoin = true;
    }
  });
}
if (wsParam) {
  ui.wsInput.value = wsParam;
  ui.wsLabel.classList.remove('hidden');
  ui.btnAdvanced.textContent = 'Advanced ✓';
}
