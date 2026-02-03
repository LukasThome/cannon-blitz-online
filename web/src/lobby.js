const MODES = {
  AI: 'ai',
  QUICK: 'quick',
  CREATE: 'create',
  JOIN: 'join',
};

function hide(el) {
  if (!el) return;
  el.classList.add('hidden');
}

function show(el) {
  if (!el) return;
  el.classList.remove('hidden');
}

export function initLobbySteps(ui, actions = {}) {
  let mode = null;
  let wsAdvancedVisible = false;

  const setMessage = (text) => {
    ui.lobbyMessage.textContent = text || '';
  };

  const render = () => {
    show(ui.setupName);
    hide(ui.setupRoomcode);
    hide(ui.setupDifficulty);
    hide(ui.setupAdvanced);
    hide(ui.wsLabel);

    if (mode === MODES.AI) {
      show(ui.setupDifficulty);
      ui.setupPrimary.textContent = 'Start';
      ui.setupSecondary.textContent = 'Back';
      wsAdvancedVisible = false;
      return;
    }

    if (mode === MODES.JOIN) {
      show(ui.setupRoomcode);
      show(ui.setupAdvanced);
      ui.setupPrimary.textContent = 'Join';
      ui.setupSecondary.textContent = 'Back';
      ui.wsLabel.classList.toggle('hidden', !wsAdvancedVisible);
      return;
    }

    if (mode === MODES.CREATE) {
      show(ui.setupAdvanced);
      ui.setupPrimary.textContent = 'Create';
      ui.setupSecondary.textContent = 'Back';
      ui.wsLabel.classList.toggle('hidden', !wsAdvancedVisible);
      return;
    }

    if (mode === MODES.QUICK) {
      show(ui.setupAdvanced);
      ui.setupPrimary.textContent = 'Match';
      ui.setupSecondary.textContent = 'Back';
      ui.wsLabel.classList.toggle('hidden', !wsAdvancedVisible);
      return;
    }
  };

  ui.setupPrimary.addEventListener('click', () => {
    const name = ui.nameInput.value.trim();
    if (!name) {
      setMessage('Digite seu nome.');
      return;
    }
    if (mode === MODES.AI) {
      actions.onStartSingle?.({ name, difficulty: ui.difficulty.value });
      return;
    }
    if (mode === MODES.JOIN) {
      const code = ui.codeInput.value.trim().toUpperCase();
      if (!code) {
        setMessage('Informe o codigo da sala.');
        return;
      }
      actions.onJoin?.({ name, code });
      return;
    }
    if (mode === MODES.CREATE) {
      actions.onCreate?.({ name });
      return;
    }
    if (mode === MODES.QUICK) {
      actions.onQuick?.({ name });
    }
  });

  ui.setupSecondary.addEventListener('click', () => {
    actions.onBack?.();
  });

  ui.btnAdvanced.addEventListener('click', () => {
    if (mode === MODES.AI) return;
    wsAdvancedVisible = !wsAdvancedVisible;
    ui.btnAdvanced.textContent = wsAdvancedVisible ? 'Advanced ✓' : 'Advanced';
    ui.wsLabel.classList.toggle('hidden', !wsAdvancedVisible);
  });

  render();

  return {
    setMode(nextMode) {
      mode = nextMode;
      wsAdvancedVisible = false;
      ui.btnAdvanced.textContent = 'Advanced';
      setMessage('');
      render();
    },
    setMessage,
  };
}

export { MODES };
