"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const windows_1 = require("./windows");
const shortcuts_1 = require("./shortcuts");
const icpHandler_1 = require("./icpHandler");
const contextMenu_1 = require("./contextMenu");
const firebase_1 = require("../auth/firebase");
let mainWindow = null;
electron_1.app.whenReady().then(() => {
    mainWindow = (0, windows_1.createMainWindow)();
    (0, contextMenu_1.setupContextMenu)(mainWindow);
    (0, icpHandler_1.handleIpcEvents)(mainWindow);
    (0, shortcuts_1.registerShortcuts)(mainWindow);
    (0, firebase_1.initFirebase)();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
