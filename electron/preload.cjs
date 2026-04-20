const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("ajnDesktop", {
  platform: process.platform,
  desktop: true,
});

