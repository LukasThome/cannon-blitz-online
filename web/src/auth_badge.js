export function wireAuthBadge(ui, auth) {
  if (!auth || !auth.onAuthStateChanged) return;

  auth.onAuthStateChanged((user) => {
    if (user) {
      ui.authUser.textContent = `User: ${user.email || user.uid}`;
      ui.btnLogout.disabled = false;
    } else {
      ui.authUser.textContent = 'User: --';
      ui.btnLogout.disabled = true;
    }
  });

  ui.btnLogout.addEventListener('click', async () => {
    if (auth.logout) {
      await auth.logout();
    }
  });
}
