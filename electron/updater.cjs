const log = require('electron-log');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function wireUpdater(mainWindow) {
  autoUpdater.on('checking-for-update', () => log.info('[updater] checking-for-update'));
  autoUpdater.on('update-available', (info) => {
    log.info('[updater] update-available', info?.version);
    mainWindow.webContents.send('updater:event', { type: 'update-available', info });
  });
  autoUpdater.on('update-not-available', (info) => {
    log.info('[updater] update-not-available', info?.version);
    mainWindow.webContents.send('updater:event', { type: 'update-not-available', info });
  });
  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('updater:event', { type: 'download-progress', progress });
  });
  autoUpdater.on('update-downloaded', (info) => {
    log.info('[updater] update-downloaded', info?.version);
    mainWindow.webContents.send('updater:event', { type: 'update-downloaded', info });
  });
  autoUpdater.on('error', (error) => {
    log.error('[updater] error', error);
    mainWindow.webContents.send('updater:event', { type: 'error', message: error?.message ?? 'Unknown updater error' });
  });
}

async function checkForUpdates() {
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    log.error('[updater] checkForUpdates failed', error);
  }
}

async function downloadUpdate() {
  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    log.error('[updater] downloadUpdate failed', error);
  }
}

function quitAndInstall() {
  autoUpdater.quitAndInstall();
}

module.exports = {
  wireUpdater,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
};
