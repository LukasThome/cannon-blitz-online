import { describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { initLobbySteps } from './lobby.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="step-name"></div>
    <div id="step-mode" class="hidden"></div>
    <div id="step-join" class="hidden"></div>
    <div id="step-single" class="hidden"></div>
    <input id="name-input" />
    <button id="btn-next-name"></button>
    <button id="btn-join-mode"></button>
    <button id="btn-single"></button>
    <div id="lobby-message"></div>
  `;

  return {
    stepName: document.getElementById('step-name'),
    stepMode: document.getElementById('step-mode'),
    stepJoin: document.getElementById('step-join'),
    stepSingle: document.getElementById('step-single'),
    nameInput: document.getElementById('name-input'),
    btnNextName: document.getElementById('btn-next-name'),
    btnJoinMode: document.getElementById('btn-join-mode'),
    btnSingle: document.getElementById('btn-single'),
    lobbyMessage: document.getElementById('lobby-message'),
  };
}

describe('Lobby step flow', () => {
  it('starts at name step', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    expect(ui.stepName.classList.contains('hidden')).toBe(false);
    expect(ui.stepMode.classList.contains('hidden')).toBe(true);
  });

  it('requires name before continuing', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    fireEvent.click(ui.btnNextName);
    expect(ui.lobbyMessage.textContent).toContain('Digite seu nome');
  });

  it('moves to mode after name', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    expect(ui.stepMode.classList.contains('hidden')).toBe(false);
  });

  it('moves to join step', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    fireEvent.click(ui.btnJoinMode);
    expect(ui.stepJoin.classList.contains('hidden')).toBe(false);
  });

  it('moves to single step', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    fireEvent.click(ui.btnSingle);
    expect(ui.stepSingle.classList.contains('hidden')).toBe(false);
  });
});
