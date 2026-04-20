const path = require("node:path");

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "AJNAdmin",
    extraResource: [path.resolve(__dirname, "electron/runtime-config.json")],
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "ajn_admin",
        setupExe: "AJN-Admin-Setup.exe",
        noMsi: true,
      },
    },
  ],
};

