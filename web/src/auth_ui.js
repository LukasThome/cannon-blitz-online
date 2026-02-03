export function initAuthUI(ui, auth) {
  let mode = null;

  const showStep = (step) => {
    ui.stepEmail.classList.add('hidden');
    ui.stepPassword.classList.add('hidden');
    step.classList.remove('hidden');
  };

  const setMessage = (text, kind = 'info') => {
    ui.message.textContent = text || '';
    ui.message.classList.remove('is-error', 'is-success');
    if (kind === 'error') ui.message.classList.add('is-error');
    if (kind === 'success') ui.message.classList.add('is-success');
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
      setMessage('Digite seu email para continuar.', 'error');
      return;
    }
    setMessage('');
    showStep(ui.stepPassword);
  });

  ui.btnSubmit.addEventListener('click', async () => {
    const email = ui.email.value.trim();
    const password = ui.password.value.trim();
    if (!email || !password) {
      setMessage('Digite email e senha.', 'error');
      return;
    }
    setMessage('');
    try {
      if (mode === 'login') {
        await auth.login(email, password);
        setMessage('Login realizado com sucesso.', 'success');
      } else if (mode === 'register') {
        await auth.register(email, password);
        setMessage('Conta criada com sucesso.', 'success');
      }
    } catch (err) {
      setMessage('Erro ao autenticar. Verifique seus dados.', 'error');
    }
  });

  if (ui.btnGoogle) {
    ui.btnGoogle.addEventListener('click', async () => {
      try {
        if (auth.googleLogin) {
          await auth.googleLogin();
          setMessage('Login Google realizado.', 'success');
        }
      } catch (err) {
        setMessage('Erro ao entrar com Google.', 'error');
      }
    });
  }

  return { showStep };
}
