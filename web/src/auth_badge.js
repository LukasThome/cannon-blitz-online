export function wireAuthBadge(ui, auth) {
  if (!auth || !auth.onAuthStateChanged) return;

  auth.onAuthStateChanged((user) => {
    if (user) {
      const label = user.email || user.uid;
      ui.authUser.textContent = `User: ${label}`;
      if (ui.lobbyUser) {
        ui.lobbyUser.textContent = `Jogador: ${label}`;
      }
      if (ui.userAvatar) {
        ui.userAvatar.textContent = label[0].toUpperCase();
      }
      ui.btnLogout.disabled = false;
    } else {
      ui.authUser.textContent = 'User: --';
      if (ui.lobbyUser) {
        ui.lobbyUser.textContent = 'Jogador: --';
      }
      if (ui.userAvatar) {
        ui.userAvatar.textContent = '?';
      }
      ui.btnLogout.disabled = true;
    }
  });

  ui.btnLogout.addEventListener('click', async () => {
    if (auth.logout) {
      await auth.logout();
    }
  });
}
