export function initMenu(ui, actions) {
  const showPlay = () => {
    ui.menuPlay.classList.remove('hidden');
    ui.menuMessage.textContent = '';
  };

  const hidePlay = () => {
    ui.menuPlay.classList.add('hidden');
  };

  ui.menuPlayBtn.addEventListener('click', showPlay);
  ui.menuBack.addEventListener('click', hidePlay);

  ui.playQuick.addEventListener('click', () => actions.onPlayMode('create'));
  ui.playCreate.addEventListener('click', () => actions.onPlayMode('create'));
  ui.playJoin.addEventListener('click', () => actions.onPlayMode('join'));
  ui.playAi.addEventListener('click', () => actions.onPlayMode('single'));

  return { showPlay, hidePlay };
}
