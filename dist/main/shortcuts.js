"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShortcuts = registerShortcuts;
exports.unregisterShortcuts = unregisterShortcuts;
const electron_1 = require("electron");
function registerShortcuts(mainWindow) {
    const shortcuts = {
        "CommandOrControl+Shift+I": () => mainWindow.webContents.toggleDevTools(),
        "CommandOrControl+W": () => mainWindow.webContents.send("close-active-tab"),
        "CommandOrControl+T": () => mainWindow.webContents.send("open-search-bar"),
        "CommandOrControl+S": () => mainWindow.webContents.send("toggle-floating-sidebar"),
        "CommandOrControl+L": () => mainWindow.webContents.send("focus-url-bar"),
        "CommandOrControl+H": () => mainWindow.webContents.send("open-history-panel"),
        "CommandOrControl+G": () => mainWindow.webContents.send("open-glinks-panel"),
        "Alt+Up": () => mainWindow.webContents.send("change-active-tab", -1),
        "Alt+Down": () => mainWindow.webContents.send("change-active-tab", 1),
        "CommandOrControl+Tab": () => mainWindow.webContents.send("change-active-tab", 1),
        "CommandOrControl+R": () => mainWindow.webContents.send("reload-page"),
        "Alt+Left": () => mainWindow.webContents.send("go-back-page"),
        "Alt+Right": () => mainWindow.webContents.send("go-forward-page"),
        F11: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
            mainWindow.webContents.send("set-fullscreen", mainWindow.isFullScreen());
        },
    };
    for (const [key, func] of Object.entries(shortcuts)) {
        electron_1.globalShortcut.register(key, func);
    }
}
function unregisterShortcuts() {
    electron_1.globalShortcut.unregisterAll();
}
