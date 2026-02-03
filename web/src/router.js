export function createRouter({ screens, diagnostics, isAuthenticated, isDev, onScreenChange }) {
  const orderedScreens = Object.values(screens).filter(Boolean);
  let currentPath = null;
  let lastNonDiagPath = '/menu';

  const showScreen = (screenKey) => {
    orderedScreens.forEach((el) => el.classList.add('hidden'));
    const target = screens[screenKey];
    if (target) target.classList.remove('hidden');
    if (onScreenChange) onScreenChange(screenKey);
  };

  const normalize = (path) => {
    if (!path) return '/';
    const url = new URL(path, window.location.origin);
    return url.pathname.replace(/\/+$/, '') || '/';
  };

  const resolveScreen = (path) => {
    if (path === '/login') return 'login';
    if (path === '/menu') return 'menu';
    if (path === '/menu/play') return 'setup';
    if (path === '/game') return 'game';
    return 'menu';
  };

  const render = (path = window.location.pathname) => {
    const targetPath = normalize(path);
    const authed = isAuthenticated();

    if (!authed && targetPath !== '/login') {
      currentPath = '/login';
      showScreen('login');
      history.replaceState({}, '', '/login');
      return;
    }

    if (authed && targetPath === '/login') {
      currentPath = '/menu';
      showScreen('menu');
      history.replaceState({}, '', '/menu');
      return;
    }

    if (targetPath === '/diagnostics') {
      if (!isDev) {
        currentPath = '/menu';
        showScreen('menu');
        history.replaceState({}, '', '/menu');
        if (diagnostics) diagnostics.classList.add('hidden');
        return;
      }
      currentPath = '/diagnostics';
      if (diagnostics) diagnostics.classList.remove('hidden');
      const baseScreen = resolveScreen(lastNonDiagPath || '/menu');
      showScreen(baseScreen);
      return;
    }

    const screen = resolveScreen(targetPath);
    currentPath = targetPath;
    lastNonDiagPath = currentPath;
    if (diagnostics) diagnostics.classList.add('hidden');
    showScreen(screen);
  };

  const navigate = (path, { replace = false } = {}) => {
    const target = normalize(path);
    if (replace) {
      history.replaceState({}, '', target);
    } else {
      history.pushState({}, '', target);
    }
    render(target);
  };

  const handleEscape = () => {
    if (currentPath === '/menu/play') {
      navigate('/menu');
    }
  };

  const handleDiagnosticsToggle = () => {
    if (!isDev) return;
    if (currentPath === '/diagnostics') {
      navigate(lastNonDiagPath || '/menu');
    } else {
      navigate('/diagnostics');
    }
  };

  window.addEventListener('popstate', () => render(window.location.pathname));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') handleEscape();
    if (event.key === 'F1') {
      event.preventDefault();
      handleDiagnosticsToggle();
    }
  });

  return {
    navigate,
    render,
    showScreen,
    get currentPath() {
      return currentPath;
    },
  };
}
