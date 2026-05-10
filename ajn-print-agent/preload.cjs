const { contextBridge, ipcRenderer } = require("electron");

const agentAPI = {
  getBootstrap: () => ipcRenderer.invoke("agent:get-bootstrap"),
  saveSettings: (settings) => ipcRenderer.invoke("agent:save-settings", settings),
  startPrinting: () => ipcRenderer.invoke("agent:start-printing"),
  stopPrinting: () => ipcRenderer.invoke("agent:stop-printing"),
  testPrinter: () => ipcRenderer.invoke("agent:test-printer"),
  retryFailed: () => ipcRenderer.invoke("agent:retry-failed"),
  listPrinters: () => ipcRenderer.invoke("agent:list-printers"),
  openAdmin: () => ipcRenderer.invoke("agent:open-admin"),
  onState: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("agent:state", listener);
    return () => ipcRenderer.removeListener("agent:state", listener);
  },
};

contextBridge.exposeInMainWorld("agentAPI", agentAPI);
contextBridge.exposeInMainWorld("ajnPrintAgent", agentAPI);
