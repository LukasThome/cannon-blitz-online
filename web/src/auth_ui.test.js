import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { initAuthUI } from './auth_ui.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="auth-overlay" class="">
      <div id="auth-message"></div>
      <div id="auth-step-mode"></div>
      <div id="auth-step-email" class="hidden">
        <input id="auth-email" />
        <button id="auth-next-email">Next</button>
      </div>
      <div id="auth-step-password" class="hidden">
        <input id="auth-password" />
        <button id="auth-submit">Submit</button>
      </div>
      <button id="auth-login"></button>
      <button id="auth-register"></button>
      <button id="auth-google"></button>
    </div>
  `;

  return {
    overlay: document.getElementById('auth-overlay'),
    message: document.getElementById('auth-message'),
    stepMode: document.getElementById('auth-step-mode'),
    stepEmail: document.getElementById('auth-step-email'),
    stepPassword: document.getElementById('auth-step-password'),
    email: document.getElementById('auth-email'),
    password: document.getElementById('auth-password'),
    btnNextEmail: document.getElementById('auth-next-email'),
    btnSubmit: document.getElementById('auth-submit'),
    btnLogin: document.getElementById('auth-login'),
    btnRegister: document.getElementById('auth-register'),
    btnGoogle: document.getElementById('auth-google'),
  };
}

describe('Auth UI flow', () => {
  it('starts on mode step', () => {
    const ui = setupDom();
    initAuthUI(ui, { login: vi.fn(), register: vi.fn(), onAuthStateChanged: vi.fn(), googleLogin: vi.fn() });
    expect(ui.stepEmail.classList.contains('hidden')).toBe(true);
    expect(ui.stepPassword.classList.contains('hidden')).toBe(true);
  });

  it('requires email before continuing', () => {
    const ui = setupDom();
    initAuthUI(ui, { login: vi.fn(), register: vi.fn(), onAuthStateChanged: vi.fn(), googleLogin: vi.fn() });
    fireEvent.click(ui.btnLogin);
    fireEvent.click(ui.btnNextEmail);
    expect(ui.message.textContent).toContain('email');
  });

  it('moves to password step after email', () => {
    const ui = setupDom();
    initAuthUI(ui, { login: vi.fn(), register: vi.fn(), onAuthStateChanged: vi.fn(), googleLogin: vi.fn() });
    fireEvent.click(ui.btnRegister);
    ui.email.value = 'user@example.com';
    fireEvent.click(ui.btnNextEmail);
    expect(ui.stepPassword.classList.contains('hidden')).toBe(false);
  });

  it('calls login with email/password', () => {
    const login = vi.fn();
    const ui = setupDom();
    initAuthUI(ui, { login, register: vi.fn(), onAuthStateChanged: vi.fn(), googleLogin: vi.fn() });
    fireEvent.click(ui.btnLogin);
    ui.email.value = 'user@example.com';
    fireEvent.click(ui.btnNextEmail);
    ui.password.value = 'secret123';
    fireEvent.click(ui.btnSubmit);
    expect(login).toHaveBeenCalledWith('user@example.com', 'secret123');
  });

  it('hides overlay when user is authenticated', () => {
    const ui = setupDom();
    let cb;
    const onAuthStateChanged = (handler) => { cb = handler; };
    initAuthUI(ui, { login: vi.fn(), register: vi.fn(), onAuthStateChanged, googleLogin: vi.fn() });
    expect(ui.overlay.classList.contains('hidden')).toBe(false);
    cb({ uid: 'abc' });
    expect(ui.overlay.classList.contains('hidden')).toBe(true);
  });

  it('calls google login when button clicked', () => {
    const googleLogin = vi.fn();
    const ui = setupDom();
    initAuthUI(ui, { login: vi.fn(), register: vi.fn(), onAuthStateChanged: vi.fn(), googleLogin });
    fireEvent.click(ui.btnGoogle);
    expect(googleLogin).toHaveBeenCalled();
  });
});
