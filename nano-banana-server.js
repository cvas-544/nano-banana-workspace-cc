#!/usr/bin/env node
/**
 * Nano Banana Local Bridge Server
 * Bridges the HTML playground to the Gemini CLI / nanobanana extension.
 * Usage: node ~/nano-banana-server.js
 */

const http = require('http');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3333;
const HOME = os.homedir();
const OUTPUT_DIR = path.join(HOME, 'nanobanana-output');
const SETTINGS_PATH = path.join(HOME, '.gemini', 'settings.json');
const MEMORY_PATH = path.join(HOME, '.claude', 'projects', '-Users-vasuchukka', 'memory', 'nano-banana-skill-memory.json');

// ── API Key ──────────────────────────────────────────────
function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.NANOBANANA_GEMINI_API_KEY) return process.env.NANOBANANA_GEMINI_API_KEY;
  try {
    const s = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    return s.apiKey || null;
  } catch { return null; }
}

// ── Gemini CLI path ───────────────────────────────────────
let GEMINI_BIN = 'gemini';
try { GEMINI_BIN = execSync('which gemini', { encoding: 'utf8' }).trim(); } catch {}

// ── File snapshot (detect new images after generation) ────
function snapshotDir(dir) {
  if (!fs.existsSync(dir)) return {};
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
  const snap = {};
  for (const f of files) snap[f] = fs.statSync(path.join(dir, f)).mtimeMs;
  return snap;
}

// ── Helpers ───────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function send(res, code, data) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

// ── Server ────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    const apiKey = getApiKey();
    return send(res, 200, { status: 'ok', apiKeyFound: !!apiKey });
  }

  // Generate image
  if (req.method === 'POST' && req.url === '/generate') {
    const { prompt } = await readBody(req);
    if (!prompt) return send(res, 400, { error: 'prompt is required' });

    const apiKey = getApiKey();
    if (!apiKey) return send(res, 500, {
      error: 'No API key found. Set GEMINI_API_KEY or configure ~/.gemini/settings.json'
    });

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const before = snapshotDir(OUTPUT_DIR);

    // Escape single quotes in prompt
    const safe = prompt.replace(/'/g, "'\\''");
    const cmd = `${GEMINI_BIN} --yolo "/generate '${safe}'"`;

    console.log(`[generate] Running: ${cmd.slice(0, 80)}...`);

    exec(cmd, {
      timeout: 180000,
      cwd: HOME,
      env: {
        ...process.env,
        GEMINI_API_KEY: apiKey,
        NANOBANANA_GEMINI_API_KEY: apiKey,
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin'
      }
    }, (err, stdout, stderr) => {
      const after = snapshotDir(OUTPUT_DIR);
      const newFiles = Object.keys(after)
        .filter(f => !before[f] || after[f] > (before[f] + 500))
        .sort((a, b) => after[b] - after[a]);

      if (newFiles.length > 0) {
        const imgPath = path.join(OUTPUT_DIR, newFiles[0]);
        const imgData = fs.readFileSync(imgPath);
        const ext = path.extname(newFiles[0]).slice(1).replace('jpg', 'jpeg');
        console.log(`[generate] Success → ${newFiles[0]}`);
        return send(res, 200, {
          success: true,
          image: `data:image/${ext};base64,${imgData.toString('base64')}`,
          filename: newFiles[0]
        });
      }

      const errMsg = (stderr || stdout || '').slice(0, 400) || 'No image generated';
      console.error(`[generate] Failed: ${errMsg}`);
      return send(res, 500, { success: false, error: errMsg });
    });
    return;
  }

  // Save skill memory
  if (req.method === 'POST' && req.url === '/memory') {
    const body = await readBody(req);
    try {
      fs.mkdirSync(path.dirname(MEMORY_PATH), { recursive: true });
      fs.writeFileSync(MEMORY_PATH, JSON.stringify(body, null, 2));
      return send(res, 200, { saved: true });
    } catch (e) {
      return send(res, 500, { error: e.message });
    }
  }

  // Load skill memory
  if (req.method === 'GET' && req.url === '/memory') {
    try {
      const data = JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
      return send(res, 200, data);
    } catch {
      return send(res, 200, { patterns: [], sessions: 0, lastUpdated: null });
    }
  }

  // Stop server
  if (req.method === 'POST' && req.url === '/stop') {
    send(res, 200, { stopped: true });
    console.log('\n🍌 Server stopped via UI.');
    setTimeout(() => process.exit(0), 200);
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  const apiKey = getApiKey();
  console.log(`\n🍌 Nano Banana server → http://localhost:${PORT}`);
  console.log(`   API key : ${apiKey ? '✓ configured' : '✗ NOT FOUND (set GEMINI_API_KEY)'}`);
  console.log(`   Output  : ${OUTPUT_DIR}`);
  console.log(`   Gemini  : ${GEMINI_BIN}\n`);
});

process.on('SIGINT', () => { console.log('\n🍌 Server stopped.'); process.exit(0); });
