#!/usr/bin/env node
/**
 * NullAI HexStrike Terminal — Unified CLI & Desktop App Launcher
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

// Check if user asked for desktop app or web server
const isWeb = args[0] === 'web' || args.includes('--web');
const isAppRequest = !isWeb && (args.length === 0 || args.includes('--gui') || args.includes('--app') || args.includes('--desktop') || args[0] === 'app' || args[0] === 'desktop' || args[0] === 'gui');

if (isWeb) {
  console.log('⚡ Launching NullAI HexStrike Web UI on http://127.0.0.1:8000 ...');
  const pyChild = spawn('python3', [path.join(rootDir, 'backend', 'main.py')], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ZOTH_ZERO_EGRESS: 'true',
    },
  });
  pyChild.on('error', (pyErr) => {
    console.error('[HexStrike] Failed to start backend:', pyErr);
  });
} else if (isAppRequest) {
  console.log('⚡ Launching NullAI HexStrike Terminal Desktop Workstation...');
  
  // Ensure UI is built if missing
  const uiDist = path.join(rootDir, 'ui', 'dist', 'index.html');
  if (!fs.existsSync(uiDist)) {
    console.log('[HexStrike] Pre-built UI not found. Building React dashboard...');
    try {
      require('child_process').execSync('npm run build', {
        cwd: path.join(rootDir, 'ui'),
        stdio: 'inherit',
      });
    } catch (e) {
      console.warn('[HexStrike] Note: UI build failed or skipped. Falling back to API mode.');
    }
  }

  // Try running Electron from local node_modules or system
  const localElectron = path.join(rootDir, 'node_modules', '.bin', 'electron');
  const electronCmd = fs.existsSync(localElectron) ? localElectron : 'electron';

  const child = spawn(electronCmd, ['.'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
      ZOTH_ZERO_EGRESS: 'true',
    },
  });

  child.on('error', (err) => {
    console.warn(`[HexStrike] Electron launcher error: ${err.message}. Starting Python web server on port 8000 instead...`);
    const pyChild = spawn('python3', [path.join(rootDir, 'backend', 'main.py')], {
      cwd: rootDir,
      stdio: 'inherit',
    });
    pyChild.on('error', (pyErr) => {
      console.error('[HexStrike] Failed to start backend:', pyErr);
    });
  });
} else {
  // Delegate to Python CLI / MCP engine
  const cliScript = path.join(rootDir, 'cli.py');
  const child = spawn('python3', [cliScript, ...args], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
