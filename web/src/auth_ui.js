export function initAuthUI(ui, auth) {
  let mode = null;

  const showStep = (step) => {
    ui.stepEmail.classList.add('hidden');
    ui.stepPassword.classList.add('hidden');
    step.classList.remove('hidden');
  };

  const setMessage = (text) => {
    ui.message.textContent = text || '';
  };

  ui.btnLogin.addEventListener('click', () => {
    mode = 'login';
    showStep(ui.stepEmail);
  });

  ui.btnRegister.addEventListener('click', () => {
    mode = 'register';
    showStep(ui.stepEmail);
  });

  ui.btnNextEmail.addEventListener('click', () => {
    const email = ui.email.value.trim();
    if (!email) {
      setMessage('Digite seu email para continuar.');
      return;
    }
    setMessage('');
    showStep(ui.stepPassword);
  });

  ui.btnSubmit.addEventListener('click', async () => {
    const email = ui.email.value.trim();
    const password = ui.password.value.trim();
    if (!email || !password) {
      setMessage('Digite email e senha.');
      return;
    }
    setMessage('');
    if (mode === 'login') {
      await auth.login(email, password);
    } else if (mode === 'register') {
      await auth.register(email, password);
    }
  });

  if (auth.onAuthStateChanged) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        ui.overlay.classList.add('hidden');
      } else {
        ui.overlay.classList.remove('hidden');
      }
    });
  }

  return { showStep };
}
