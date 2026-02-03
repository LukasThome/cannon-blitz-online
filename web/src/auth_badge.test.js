import { describe, expect, it, vi } from 'vitest';
import { wireAuthBadge } from './auth_badge.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="auth-user"></div>
    <div id="lobby-user"></div>
    <button id="btn-logout"></button>
  `;

  return {
    authUser: document.getElementById('auth-user'),
    lobbyUser: document.getElementById('lobby-user'),
    btnLogout: document.getElementById('btn-logout'),
  };
}

describe('Auth badge', () => {
  it('updates label on login and logout', async () => {
    const ui = setupDom();
    const onAuthStateChanged = (cb) => cb({ uid: 'u1', email: 'a@b.com' });
    const logout = vi.fn();

    wireAuthBadge(ui, { onAuthStateChanged, logout });
    expect(ui.authUser.textContent).toContain('a@b.com');
    expect(ui.lobbyUser.textContent).toContain('a@b.com');
    await ui.btnLogout.click();
    expect(logout).toHaveBeenCalled();
  });
});
