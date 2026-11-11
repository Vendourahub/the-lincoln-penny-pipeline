const fs = require('fs');
const path = require('path');

// Determine repository root directory
// Can be overridden via LINCOLN_ROOT environment variable
const ROOT_DIR = process.env.LINCOLN_ROOT 
  ? path.resolve(process.env.LINCOLN_ROOT)
  : path.resolve(__dirname, '..');

// Helper to load key=value lines from .env safely without third-party dotenv dependency
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return false;
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let val = match[2].trim();
        // Strip wrapping quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
    return true;
  } catch (err) {
    console.warn(`[config/env] Warning: failed to load ${envPath}:`, err.message);
    return false;
  }
}

// Attempt to load .env from repository root, then fallback to current working directory
loadEnvFile(path.join(ROOT_DIR, '.env'));
if (process.cwd() !== ROOT_DIR) {
  loadEnvFile(path.join(process.cwd(), '.env'));
}

const OUT_DIR = path.join(ROOT_DIR, 'out');
const EDITORIAL_DIR = path.join(ROOT_DIR, 'editorial');
const FACTS_DIR = path.join(EDITORIAL_DIR, 'facts');
const DISTRIBUTION_DIR = path.join(ROOT_DIR, 'distribution');
const AGENTS_DIR = path.join(ROOT_DIR, 'agents');
const AUDIO_DIR = path.join(ROOT_DIR, 'audio-engine');
const MOTION_DIR = path.join(ROOT_DIR, 'motion-engine');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

module.exports = {
  ROOT_DIR,
  OUT_DIR,
  EDITORIAL_DIR,
  FACTS_DIR,
  DISTRIBUTION_DIR,
  AGENTS_DIR,
  AUDIO_DIR,
  MOTION_DIR,
  DOCS_DIR,
  loadEnvFile
};
