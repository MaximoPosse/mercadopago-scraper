const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'scraper.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function error(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ERROR: ${message}`;
  console.error(line);
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, line + '\n');
}

module.exports = { log, error };
