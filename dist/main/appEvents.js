"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAppEvents = setupAppEvents;
const electron_1 = require("electron");
const shortcuts_1 = require("./shortcuts");
function setupAppEvents(mainWindow) {
    electron_1.app.on("browser-window-blur", () => {
        (0, shortcuts_1.unregisterShortcuts)();
    });
    electron_1.app.on("open-url", (event, url) => {
        event.preventDefault();
        mainWindow.webContents.send("handle-verification-url", url);
    });
    electron_1.app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
}
