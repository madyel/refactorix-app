const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const { wireUpdater, checkForUpdates, downloadUpdate, quitAndInstall } = require('./updater.cjs');
const { handleWindowOpen, shouldOpenExternally, isSameAppOrigin } = require('./navigation.cjs');
const { electronConfig } = require('./config.cjs');

const isDev = !app.isPackaged;
const DEV_SERVER_URL = electronConfig.devServerUrl;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: electronConfig.window.width,
    height: electronConfig.window.height,
    minWidth: electronConfig.window.minWidth,
    minHeight: electronConfig.window.minHeight,
    backgroundColor: electronConfig.window.backgroundColor,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const appEntry = isDev ? DEV_SERVER_URL : 'file://';

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => handleWindowOpen(url, appEntry, shell.openExternal));

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isSameAppOrigin(url, appEntry)) {
      return;
    }

    if (shouldOpenExternally(url, appEntry)) {
      event.preventDefault();
      shell.openExternal(url);
      return;
    }

    event.preventDefault();
  });

  wireUpdater(mainWindow);

  return mainWindow;
}

app.whenReady().then(() => {
  const mainWindow = createWindow();


  ipcMain.handle('workspace:pick-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Seleziona workspace',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    return { canceled: false, path: result.filePaths[0] };
  });


  ipcMain.handle('workspace:list-tree', async (_event, payload) => {
    const rootPath = payload?.path;
    const maxDepth = Math.max(1, Math.min(Number(payload?.depth ?? 5), 8));

    if (!rootPath || typeof rootPath !== 'string') {
      return { tree: [] };
    }

    const walk = async (currentPath, depth) => {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));

      return Promise.all(sorted.map(async (entry) => {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          const children = depth < maxDepth ? await walk(fullPath, depth + 1) : [];
          return {
            name: entry.name,
            type: 'folder',
            fullPath,
            children,
          };
        }

        return {
          name: entry.name,
          type: 'file',
          fullPath,
        };
      }));
    };

    const tree = await walk(rootPath, 1);
    return { tree };
  });

  ipcMain.handle('workspace:read-file', async (_event, payload) => {
    const targetPath = payload?.path;
    if (!targetPath || typeof targetPath !== 'string') {
      return { content: '' };
    }

    const content = await fs.readFile(targetPath, 'utf8');
    return { content };
  });

  ipcMain.handle('workspace:write-file', async (_event, payload) => {
    const targetPath = payload?.path;
    const content = payload?.content;

    if (!targetPath || typeof targetPath !== 'string') {
      return { ok: false };
    }

    await fs.writeFile(targetPath, typeof content === 'string' ? content : '', 'utf8');
    return { ok: true };
  });

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
    }, electronConfig.updater.checkDelayMs);
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
