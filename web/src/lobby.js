export function initLobbySteps(ui) {
  const showStep = (step) => {
    ui.stepName.classList.add('hidden');
    ui.stepMode.classList.add('hidden');
    ui.stepJoin.classList.add('hidden');
    ui.stepSingle.classList.add('hidden');
    step.classList.remove('hidden');
  };

  ui.btnNextName.addEventListener('click', () => {
    const name = ui.nameInput.value.trim();
    if (!name) {
      ui.lobbyMessage.textContent = 'Digite seu nome para continuar.';
      return;
    }
    ui.lobbyMessage.textContent = '';
    showStep(ui.stepMode);
  });

  ui.btnJoinMode.addEventListener('click', () => {
    showStep(ui.stepJoin);
  });

  ui.btnSingle.addEventListener('click', () => {
    showStep(ui.stepSingle);
  });

  showStep(ui.stepName);

  return { showStep };
}
