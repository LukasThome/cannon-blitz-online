# Firebase Setup

This project uses **Firebase Auth (client)** and **Firebase Admin SDK (backend)**.

## 1) Create Firebase Project
1. Go to Firebase Console: https://console.firebase.google.com/
2. Create a project (or use existing).
3. Enable **Authentication → Sign-in method → Email/Password**.
4. Enable **Authentication → Sign-in method → Google**.

## 2) Get Web App Config
1. In **Project Settings → General → Your apps**, add a **Web app**.
2. Copy the config keys:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId`

## 3) Configure Frontend (Vercel)
Add these env vars in **Vercel → Project Settings → Environment Variables**:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_MEASUREMENT_ID`

Vercel will run:
```
cd web
npm run generate:config
```
which creates `web/config.json` at build time.

## 4) Local Frontend Setup
```
cd web
cp .env.example .env
# fill values
npm run generate:config
```

## 5) Backend Admin SDK
1. In Firebase Console → **Project Settings → Service accounts**
2. Click **Generate new private key** (JSON)
3. Upload to your backend host (Koyeb)
4. Set env var:
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

Optional (dev/tests):
```
AUTH_DISABLED=1
```

## 6) Verify
- Frontend: login/register should work
- Backend: WebSocket should accept messages with `idToken`

## Notes
- Do **not** commit `web/config.json` or service account JSON.
- Firebase web config is not a secret, but keep it out of the repo per policy.
