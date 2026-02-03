export function initLobbySteps(ui) {
  let mode = null;
  let forcedMode = null;

  const showStep = (step) => {
    ui.stepName.classList.add('hidden');
    ui.stepMode.classList.add('hidden');
    ui.stepJoin.classList.add('hidden');
    ui.stepSingle.classList.add('hidden');
    ui.stepConfirm.classList.add('hidden');
    step.classList.remove('hidden');
  };

  const setMessage = (text) => {
    ui.lobbyMessage.textContent = text || '';
  };

  const updateConfirm = () => {
    const name = ui.nameInput.value.trim();
    const code = ui.codeInput.value.trim().toUpperCase();
    const difficulty = ui.difficulty.value;
    if (mode === 'create') {
      ui.confirmSummary.textContent = `Criar sala para ${name}.`;
      ui.btnCreate.classList.remove('hidden');
      ui.btnJoin.classList.add('hidden');
      ui.btnStartSingle.classList.add('hidden');
    } else if (mode === 'join') {
      ui.confirmSummary.textContent = `Entrar na sala ${code} como ${name}.`;
      ui.btnCreate.classList.add('hidden');
      ui.btnJoin.classList.remove('hidden');
      ui.btnStartSingle.classList.add('hidden');
    } else if (mode === 'single') {
      ui.confirmSummary.textContent = `Single Player (${difficulty}) para ${name}.`;
      ui.btnCreate.classList.add('hidden');
      ui.btnJoin.classList.add('hidden');
      ui.btnStartSingle.classList.remove('hidden');
    }
  };

  ui.btnNextName.addEventListener('click', () => {
    const name = ui.nameInput.value.trim();
    if (!name) {
      setMessage('Digite seu nome para continuar.');
      return;
    }
    setMessage('');
    if (forcedMode === 'create') {
      mode = 'create';
      updateConfirm();
      showStep(ui.stepConfirm);
      return;
    }
    if (forcedMode === 'join') {
      mode = 'join';
      showStep(ui.stepJoin);
      return;
    }
    if (forcedMode === 'single') {
      mode = 'single';
      showStep(ui.stepSingle);
      return;
    }
    showStep(ui.stepMode);
  });

  ui.btnCreateMode.addEventListener('click', () => {
    mode = 'create';
    updateConfirm();
    showStep(ui.stepConfirm);
  });

  ui.btnJoinMode.addEventListener('click', () => {
    mode = 'join';
    showStep(ui.stepJoin);
  });

  ui.btnSingle.addEventListener('click', () => {
    mode = 'single';
    showStep(ui.stepSingle);
  });

  ui.btnNextJoin.addEventListener('click', () => {
    const code = ui.codeInput.value.trim();
    if (!code) {
      setMessage('Informe o codigo da sala.');
      return;
    }
    setMessage('');
    updateConfirm();
    showStep(ui.stepConfirm);
  });

  ui.btnNextSingle.addEventListener('click', () => {
    updateConfirm();
    showStep(ui.stepConfirm);
  });

  ui.btnBack.addEventListener('click', () => {
    showStep(ui.stepMode);
  });

  ui.btnBackSingle.addEventListener('click', () => {
    showStep(ui.stepMode);
  });

  ui.btnBackConfirm.addEventListener('click', () => {
    if (mode === 'create') return showStep(ui.stepMode);
    if (mode === 'join') return showStep(ui.stepJoin);
    if (mode === 'single') return showStep(ui.stepSingle);
    return showStep(ui.stepMode);
  });

  showStep(ui.stepName);

  return {
    showStep,
    setForcedMode(nextMode) {
      forcedMode = nextMode;
    },
  };
}
