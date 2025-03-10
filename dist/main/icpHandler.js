"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleIpcEvents = handleIpcEvents;
const electron_1 = require("electron");
function handleIpcEvents(mainWindow) {
    electron_1.ipcMain.on("close-window", () => {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.close();
    });
    electron_1.ipcMain.on("minimize-window", () => {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.minimize();
    });
    electron_1.ipcMain.on("toggle-maximize-window", () => {
        if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isMaximized()) {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.unmaximize();
        }
        else {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.maximize();
        }
    });
}
