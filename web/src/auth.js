export async function initFirebaseAuth(config) {
  if (!config || !config.apiKey) {
    throw new Error('Firebase config missing');
  }

  const appModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const authModule = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');

  const app = appModule.initializeApp(config);
  const auth = authModule.getAuth(app);
  const provider = new authModule.GoogleAuthProvider();

  return {
    login: (email, password) => authModule.signInWithEmailAndPassword(auth, email, password),
    register: (email, password) => authModule.createUserWithEmailAndPassword(auth, email, password),
    googleLogin: () => authModule.signInWithPopup(auth, provider),
    logout: () => authModule.signOut(auth),
    onAuthStateChanged: (cb) => authModule.onAuthStateChanged(auth, cb),
  };
}
