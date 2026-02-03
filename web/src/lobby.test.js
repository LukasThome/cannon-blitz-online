import { describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { initLobbySteps } from './lobby.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="step-name"></div>
    <div id="step-mode" class="hidden"></div>
    <div id="step-join" class="hidden"></div>
    <div id="step-single" class="hidden"></div>
    <div id="step-confirm" class="hidden"></div>
    <input id="name-input" />
    <input id="code-input" />
    <select id="difficulty"><option value="easy">Easy</option><option value="normal" selected>Normal</option></select>
    <button id="btn-next-name"></button>
    <button id="btn-create-mode"></button>
    <button id="btn-join-mode"></button>
    <button id="btn-single"></button>
    <button id="btn-back"></button>
    <button id="btn-back-single"></button>
    <button id="btn-back-confirm"></button>
    <button id="btn-next-join"></button>
    <button id="btn-next-single"></button>
    <button id="btn-create"></button>
    <button id="btn-join"></button>
    <button id="btn-start-single"></button>
    <div id="confirm-summary"></div>
    <div id="lobby-message"></div>
  `;

  return {
    stepName: document.getElementById('step-name'),
    stepMode: document.getElementById('step-mode'),
    stepJoin: document.getElementById('step-join'),
    stepSingle: document.getElementById('step-single'),
    stepConfirm: document.getElementById('step-confirm'),
    nameInput: document.getElementById('name-input'),
    codeInput: document.getElementById('code-input'),
    difficulty: document.getElementById('difficulty'),
    btnNextName: document.getElementById('btn-next-name'),
    btnCreateMode: document.getElementById('btn-create-mode'),
    btnJoinMode: document.getElementById('btn-join-mode'),
    btnSingle: document.getElementById('btn-single'),
    btnBack: document.getElementById('btn-back'),
    btnBackSingle: document.getElementById('btn-back-single'),
    btnBackConfirm: document.getElementById('btn-back-confirm'),
    btnNextJoin: document.getElementById('btn-next-join'),
    btnNextSingle: document.getElementById('btn-next-single'),
    btnCreate: document.getElementById('btn-create'),
    btnJoin: document.getElementById('btn-join'),
    btnStartSingle: document.getElementById('btn-start-single'),
    confirmSummary: document.getElementById('confirm-summary'),
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
    expect(ui.lobbyMessage.textContent).toContain('nome');
  });

  it('moves to mode after name', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    expect(ui.stepMode.classList.contains('hidden')).toBe(false);
  });

  it('moves to join code step', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    fireEvent.click(ui.btnJoinMode);
    expect(ui.stepJoin.classList.contains('hidden')).toBe(false);
  });

  it('requires room code before confirm', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    fireEvent.click(ui.btnJoinMode);
    fireEvent.click(ui.btnNextJoin);
    expect(ui.lobbyMessage.textContent).toContain('codigo');
  });

  it('moves to single difficulty step', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    fireEvent.click(ui.btnSingle);
    expect(ui.stepSingle.classList.contains('hidden')).toBe(false);
  });

  it('moves to confirm after join', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    fireEvent.click(ui.btnJoinMode);
    ui.codeInput.value = 'ABCDE';
    fireEvent.click(ui.btnNextJoin);
    expect(ui.stepConfirm.classList.contains('hidden')).toBe(false);
  });

  it('back returns to mode step', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    fireEvent.click(ui.btnJoinMode);
    fireEvent.click(ui.btnBack);
    expect(ui.stepMode.classList.contains('hidden')).toBe(false);
  });

  it('create mode goes to confirm', () => {
    const ui = setupDom();
    initLobbySteps(ui);
    ui.nameInput.value = 'Lucas';
    fireEvent.click(ui.btnNextName);
    fireEvent.click(ui.btnCreateMode);
    expect(ui.stepConfirm.classList.contains('hidden')).toBe(false);
    expect(ui.confirmSummary.textContent).toContain('Criar sala');
  });
});
