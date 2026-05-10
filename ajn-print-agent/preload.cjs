const { contextBridge, ipcRenderer } = require("electron");

const agentAPI = {
  getBootstrap: () => ipcRenderer.invoke("agent:get-bootstrap"),
  getSettings: () => ipcRenderer.invoke("agent:get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("agent:save-settings", settings),
  startPrinting: () => ipcRenderer.invoke("agent:start-printing"),
  startWatcher: () => ipcRenderer.invoke("agent:start-watcher"),
  stopPrinting: () => ipcRenderer.invoke("agent:stop-printing"),
  stopWatcher: () => ipcRenderer.invoke("agent:stop-watcher"),
  testPrinter: () => ipcRenderer.invoke("agent:test-printer"),
  testPrint: (settings) => ipcRenderer.invoke("agent:test-print", settings),
  retryFailed: () => ipcRenderer.invoke("agent:retry-failed"),
  listPrinters: () => ipcRenderer.invoke("agent:list-printers"),
  debugPrinters: () => ipcRenderer.invoke("agent:debug-printers"),
  openAdmin: () => ipcRenderer.invoke("agent:open-admin"),
  onState: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("agent:state", listener);
    return () => ipcRenderer.removeListener("agent:state", listener);
  },
};

contextBridge.exposeInMainWorld("agentAPI", agentAPI);
contextBridge.exposeInMainWorld("ajnPrintAgent", agentAPI);
