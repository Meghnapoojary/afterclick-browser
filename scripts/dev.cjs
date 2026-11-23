'use strict';

const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
let viteServer;
let electronProcess;
let shuttingDown = false;

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (electronProcess && !electronProcess.killed) {
    try { electronProcess.kill(); } catch {}
  }
  if (viteServer) {
    try { await viteServer.close(); } catch {}
  }
  process.exitCode = exitCode;
}

async function main() {
  const { createServer } = await import('vite');
  viteServer = await createServer({
    configFile: path.join(projectRoot, 'vite.config.mts'),
    server: { host: '127.0.0.1', port: 0, strictPort: true },
    clearScreen: false
  });
  await viteServer.listen();

  const address = viteServer.httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Could not determine the local Vite development URL.');
  }
  const devUrl = `http://127.0.0.1:${address.port}`;
  console.log(`[AFTERCLICK] Vite ready at ${devUrl}`);

  const electronBinary = require('electron');
  electronProcess = spawn(electronBinary, ['.'], {
    cwd: projectRoot,
    env: { ...process.env, VITE_DEV_SERVER_URL: devUrl },
    stdio: 'inherit',
    windowsHide: false
  });

  electronProcess.once('error', async (error) => {
    console.error('[AFTERCLICK] Could not launch Electron:', error.message);
    await shutdown(1);
  });
  electronProcess.once('exit', async (code, signal) => {
    if (!shuttingDown) {
      if (signal) console.log(`[AFTERCLICK] Electron stopped (${signal}).`);
      await shutdown(code ?? (signal ? 1 : 0));
    }
  });

  process.once('SIGINT', () => shutdown(0));
  process.once('SIGTERM', () => shutdown(0));
}

main().catch(async (error) => {
  console.error('[AFTERCLICK] Development startup failed:', error.stack || error.message);
  await shutdown(1);
});
