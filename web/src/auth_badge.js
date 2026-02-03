export function wireAuthBadge(ui, auth) {
  if (!auth || !auth.onAuthStateChanged) return;

  auth.onAuthStateChanged((user) => {
    if (user) {
      const label = user.email || user.uid;
      ui.authUser.textContent = `User: ${label}`;
      if (ui.lobbyUser) {
        ui.lobbyUser.textContent = `Jogador: ${label}`;
      }
      ui.btnLogout.disabled = false;
    } else {
      ui.authUser.textContent = 'User: --';
      if (ui.lobbyUser) {
        ui.lobbyUser.textContent = 'Jogador: --';
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
