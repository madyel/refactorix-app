const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { wireUpdater, checkForUpdates, downloadUpdate, quitAndInstall } = require('./updater.cjs');

const isDev = !app.isPackaged;
const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#171717',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  wireUpdater(mainWindow);

  return mainWindow;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();

  ipcMain.handle('updater:check', async () => {
    await checkForUpdates();
    return { ok: true };
  });

  ipcMain.handle('updater:download', async () => {
    await downloadUpdate();
    return { ok: true };
  });

  ipcMain.handle('updater:quit-and-install', async () => {
    quitAndInstall();
    return { ok: true };
  });

  if (!isDev) {
    setTimeout(() => {
      mainWindow.webContents.send('updater:event', { type: 'checking-for-update' });
      checkForUpdates();
    }, 10_000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
