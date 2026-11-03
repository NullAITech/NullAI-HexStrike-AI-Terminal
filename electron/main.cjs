const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

// Linux & VM GPU Safeguards
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform');
app.commandLine.appendSwitch('ozone-platform', 'x11');

const IS_SMOKE = process.argv.includes('--smoke-test');
const TOOL_ID = "hexstrike-arsenal";
const TOOL_NAME = "HexStrike Security Arsenal";
const BACKEND_PORT = Number(process.env.PORT || 8138);
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

let mainWindow = null;
let backendProcess = null;
const consoleErrors = [];

function isBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get(BACKEND_URL, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startBackend() {
  const rootDir = path.resolve(__dirname, '..');
  const env = { ...process.env, PORT: String(BACKEND_PORT), PYTHONUNBUFFERED: '1' };
  let cmd = 'python3';
  let args = ['server.py', '--port', String(BACKEND_PORT)];

  if (fs.existsSync(path.join(rootDir, 'server.js'))) {
    cmd = 'node';
    args = ['server.js', '--port', String(BACKEND_PORT)];
  } else if (fs.existsSync(path.join(rootDir, 'server.py'))) {
    cmd = 'python3';
    args = ['server.py', '--port', String(BACKEND_PORT)];
  } else if (fs.existsSync(path.join(rootDir, 'zoth_relay', 'server.py'))) {
    cmd = 'python3';
    args = ['-m', 'zoth_relay.server', '--port', String(BACKEND_PORT)];
  } else if (fs.existsSync(path.join(rootDir, 'src'))) {
    const srcDir = path.join(rootDir, 'src');
    const pkgs = fs.readdirSync(srcDir).filter((d) => fs.existsSync(path.join(srcDir, d, 'cli.py')));
    if (pkgs.length > 0) {
      env.PYTHONPATH = env.PYTHONPATH ? `${srcDir}:${env.PYTHONPATH}` : srcDir;
      args = ['-m', `${pkgs[0]}.cli`, 'serve', '--port', String(BACKEND_PORT)];
    }
  }

  backendProcess = spawn(cmd, args, {
    cwd: rootDir,
    stdio: 'ignore',
    detached: true,
    env,
  });
  backendProcess.unref();
}

async function waitForBackend(maxAttempts = 35, interval = 200) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await isBackendRunning()) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    show: !IS_SMOKE,
    backgroundColor: '#08080B',
    title: `${TOOL_NAME} // ZothOS Sovereign Workstation (:${BACKEND_PORT})`,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    if (level >= 3 && !message.includes('favicon')) {
      consoleErrors.push(message);
    }
  });

  if (IS_SMOKE) {
    const timer = setTimeout(() => {
      console.log(JSON.stringify({ tool: TOOL_ID, port: BACKEND_PORT, ok: false, error: 'timeout' }));
      app.exit(1); process.exit(1); process.exit(1);
    }, 10000);

    mainWindow.webContents.once('dom-ready', async () => {
      clearTimeout(timer);
      try {
        const metrics = await mainWindow.webContents.executeJavaScript(`({
          title: document.title || '',
          textLen: (document.body && document.body.innerText ? document.body.innerText.trim().length : 0),
          htmlLen: (document.documentElement ? document.documentElement.innerHTML.length : 0),
          buttons: document.querySelectorAll('button, a, input, select, canvas').length
        })`);
        const ok = metrics.htmlLen > 100;
        console.log(JSON.stringify({
          tool: TOOL_ID,
          name: TOOL_NAME,
          port: BACKEND_PORT,
          url: BACKEND_URL,
          ok,
          ...metrics,
          consoleErrors: consoleErrors.slice(0, 5)
        }));
        app.exit(ok ? 0 : 1); process.exit(ok ? 0 : 1); process.exit(ok ? 0 : 1);
      } catch (err) {
        console.log(JSON.stringify({ tool: TOOL_ID, port: BACKEND_PORT, ok: false, error: String(err) }));
        app.exit(1); process.exit(1); process.exit(1);
      }
    });
  }

  mainWindow.loadURL(BACKEND_URL);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  if (!(await isBackendRunning())) {
    startBackend();
    await waitForBackend();
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
