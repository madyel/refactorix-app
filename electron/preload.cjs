const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  workspace: {
    pickDirectory: () => ipcRenderer.invoke('workspace:pick-directory'),
    listTree: (path, depth) => ipcRenderer.invoke('workspace:list-tree', { path, depth }),
    readFile: (path) => ipcRenderer.invoke('workspace:read-file', { path }),
    writeFile: (path, content) => ipcRenderer.invoke('workspace:write-file', { path, content }),
  },
  updater: {
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
    onEvent: (listener) => {
      const handler = (_event, payload) => listener(payload);
      ipcRenderer.on('updater:event', handler);
      return () => ipcRenderer.removeListener('updater:event', handler);
    },
  },
});
