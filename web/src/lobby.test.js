import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { initLobbySteps, MODES } from './lobby.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="setup-name"></div>
    <div id="setup-roomcode" class="hidden"></div>
    <div id="setup-difficulty" class="hidden"></div>
    <div id="setup-advanced" class="hidden"></div>
    <label id="ws-label" class="hidden"></label>
    <input id="name-input" />
    <input id="code-input" />
    <select id="difficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option></select>
    <button id="btn-advanced"></button>
    <button id="setup-primary">Start</button>
    <button id="setup-secondary">Back</button>
    <div id="lobby-message"></div>
  `;

  return {
    setupName: document.getElementById('setup-name'),
    setupRoomcode: document.getElementById('setup-roomcode'),
    setupDifficulty: document.getElementById('setup-difficulty'),
    setupAdvanced: document.getElementById('setup-advanced'),
    wsLabel: document.getElementById('ws-label'),
    nameInput: document.getElementById('name-input'),
    codeInput: document.getElementById('code-input'),
    difficulty: document.getElementById('difficulty'),
    btnAdvanced: document.getElementById('btn-advanced'),
    setupPrimary: document.getElementById('setup-primary'),
    setupSecondary: document.getElementById('setup-secondary'),
    lobbyMessage: document.getElementById('lobby-message'),
  };
}

describe('Play setup', () => {
  it('VS AI shows only difficulty and start', () => {
    const ui = setupDom();
    const api = initLobbySteps(ui, { onStartSingle: vi.fn() });
    api.setMode(MODES.AI);
    expect(ui.setupDifficulty.classList.contains('hidden')).toBe(false);
    expect(ui.setupRoomcode.classList.contains('hidden')).toBe(true);
    expect(ui.wsLabel.classList.contains('hidden')).toBe(true);
    expect(ui.setupPrimary.textContent.toLowerCase()).toContain('start');
  });

  it('only one primary CTA is visible per mode', () => {
    const ui = setupDom();
    const api = initLobbySteps(ui, { onStartSingle: vi.fn() });
    api.setMode(MODES.AI);
    const primaryButtons = Array.from(document.querySelectorAll('#setup-primary'));
    expect(primaryButtons.length).toBe(1);
    expect(primaryButtons[0].classList.contains('hidden')).toBe(false);
  });

  it('join mode shows room code and advanced', () => {
    const ui = setupDom();
    const api = initLobbySteps(ui, { onJoin: vi.fn() });
    api.setMode(MODES.JOIN);
    expect(ui.setupRoomcode.classList.contains('hidden')).toBe(false);
    expect(ui.setupAdvanced.classList.contains('hidden')).toBe(false);
  });

  it('advanced toggle only affects ws label', () => {
    const ui = setupDom();
    const api = initLobbySteps(ui, { onJoin: vi.fn() });
    api.setMode(MODES.JOIN);
    expect(ui.wsLabel.classList.contains('hidden')).toBe(true);
    fireEvent.click(ui.btnAdvanced);
    expect(ui.wsLabel.classList.contains('hidden')).toBe(false);
  });
});
