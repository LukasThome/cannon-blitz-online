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
let env = {};
if (fs.existsSync(envPath)) {
  env = readEnv(envPath);
} else {
  env = {
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
  };
}
const config = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID,
  measurementId: env.FIREBASE_MEASUREMENT_ID,
};

const missing = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length) {
  console.error(`Missing Firebase env values: ${missing.join(', ')}`);
  process.exit(1);
}

const outPath = path.resolve('config.json');
fs.writeFileSync(outPath, JSON.stringify(config, null, 2));
console.log('Wrote web/config.json');
