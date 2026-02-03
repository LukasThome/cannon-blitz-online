import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { initMenu } from './menu.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="main-menu"></div>
    <div id="menu-play" class="hidden"></div>
    <button id="menu-play-btn"></button>
    <button id="menu-back"></button>
    <button id="play-quick"></button>
    <button id="play-create"></button>
    <button id="play-join"></button>
    <button id="play-ai"></button>
    <div id="menu-message"></div>
  `;

  return {
    mainMenu: document.getElementById('main-menu'),
    menuPlay: document.getElementById('menu-play'),
    menuPlayBtn: document.getElementById('menu-play-btn'),
    menuBack: document.getElementById('menu-back'),
    playQuick: document.getElementById('play-quick'),
    playCreate: document.getElementById('play-create'),
    playJoin: document.getElementById('play-join'),
    playAi: document.getElementById('play-ai'),
    menuMessage: document.getElementById('menu-message'),
  };
}

describe('Main menu', () => {
  it('opens play menu', () => {
    const ui = setupDom();
    initMenu(ui, { onPlayMode: vi.fn() });
    fireEvent.click(ui.menuPlayBtn);
    expect(ui.menuPlay.classList.contains('hidden')).toBe(false);
  });

  it('calls onPlayMode for create', () => {
    const ui = setupDom();
    const onPlayMode = vi.fn();
    initMenu(ui, { onPlayMode });
    fireEvent.click(ui.menuPlayBtn);
    fireEvent.click(ui.playCreate);
    expect(onPlayMode).toHaveBeenCalledWith('create');
  });

  it('shows coming soon on quick match', () => {
    const ui = setupDom();
    initMenu(ui, { onPlayMode: vi.fn() });
    fireEvent.click(ui.menuPlayBtn);
    fireEvent.click(ui.playQuick);
    expect(ui.menuMessage.textContent.toLowerCase()).toContain('coming');
  });
});
