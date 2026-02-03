import { describe, expect, it } from 'vitest';
import { createRouter } from './router.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="screen-login"></div>
    <div id="screen-menu" class="hidden"></div>
    <div id="screen-setup" class="hidden"></div>
    <div id="screen-game" class="hidden"></div>
    <div id="diagnostics" class="hidden"></div>
  `;

  return {
    login: document.getElementById('screen-login'),
    menu: document.getElementById('screen-menu'),
    setup: document.getElementById('screen-setup'),
    game: document.getElementById('screen-game'),
    diagnostics: document.getElementById('diagnostics'),
  };
}

function visible(el) {
  return !el.classList.contains('hidden');
}

describe('router', () => {
  it('redirects unauthenticated users to /login', () => {
    const ui = setupDom();
    let authed = false;
    const router = createRouter({
      screens: { login: ui.login, menu: ui.menu, setup: ui.setup, game: ui.game },
      diagnostics: ui.diagnostics,
      isAuthenticated: () => authed,
      isDev: false,
    });
    history.pushState({}, '', '/menu');
    router.render('/menu');
    expect(visible(ui.login)).toBe(true);
    expect(visible(ui.menu)).toBe(false);
  });

  it('allows authenticated users to access /menu', () => {
    const ui = setupDom();
    let authed = true;
    const router = createRouter({
      screens: { login: ui.login, menu: ui.menu, setup: ui.setup, game: ui.game },
      diagnostics: ui.diagnostics,
      isAuthenticated: () => authed,
      isDev: false,
    });
    history.pushState({}, '', '/menu');
    router.render('/menu');
    expect(visible(ui.menu)).toBe(true);
    expect(visible(ui.login)).toBe(false);
  });

  it('logout returns to /login', () => {
    const ui = setupDom();
    let authed = true;
    const router = createRouter({
      screens: { login: ui.login, menu: ui.menu, setup: ui.setup, game: ui.game },
      diagnostics: ui.diagnostics,
      isAuthenticated: () => authed,
      isDev: false,
    });
    history.pushState({}, '', '/menu');
    router.render('/menu');
    authed = false;
    router.render('/menu');
    expect(visible(ui.login)).toBe(true);
  });

  it('keeps screens exclusive per route', () => {
    const ui = setupDom();
    const router = createRouter({
      screens: { login: ui.login, menu: ui.menu, setup: ui.setup, game: ui.game },
      diagnostics: ui.diagnostics,
      isAuthenticated: () => true,
      isDev: false,
    });

    router.navigate('/menu');
    expect(visible(ui.menu)).toBe(true);
    expect(visible(ui.setup)).toBe(false);
    expect(visible(ui.game)).toBe(false);

    router.navigate('/menu/play');
    expect(visible(ui.menu)).toBe(false);
    expect(visible(ui.setup)).toBe(true);
    expect(visible(ui.game)).toBe(false);

    router.navigate('/game');
    expect(visible(ui.menu)).toBe(false);
    expect(visible(ui.setup)).toBe(false);
    expect(visible(ui.game)).toBe(true);
  });

  it('ESC returns from setup to menu', () => {
    const ui = setupDom();
    const router = createRouter({
      screens: { login: ui.login, menu: ui.menu, setup: ui.setup, game: ui.game },
      diagnostics: ui.diagnostics,
      isAuthenticated: () => true,
      isDev: false,
    });
    router.navigate('/menu/play');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(visible(ui.menu)).toBe(true);
    expect(visible(ui.setup)).toBe(false);
  });
});
