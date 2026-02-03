import fs from 'node:fs';
import path from 'node:path';

function readEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    env[key] = rest.join('=').trim();
  }
  return env;
}

const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
  console.error('Missing .env file. Copy .env.example to .env and fill values.');
  process.exit(1);
}

const env = readEnv(envPath);
const config = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID,
};

const outPath = path.resolve('config.json');
fs.writeFileSync(outPath, JSON.stringify(config, null, 2));
console.log('Wrote web/config.json');
