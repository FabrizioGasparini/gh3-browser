"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow;
electron_1.app.whenReady().then(() => {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
        },
    });
    mainWindow.setMenu(null);
    mainWindow.webContents.on("before-input-event", (event, input) => {
        mainWindow.webContents.setIgnoreMenuShortcuts(true);
    });
    mainWindow.loadFile("../index.html");
});
electron_1.app.on("browser-window-focus", () => {
    electron_1.globalShortcut.register("CommandOrControl+Shift+I", () => {
        mainWindow.webContents.toggleDevTools();
    });
    electron_1.globalShortcut.register("CommandOrControl+W", () => {
        mainWindow.webContents.send("close-active-tab");
    });
    electron_1.globalShortcut.register("CommandOrControl+T", () => {
        mainWindow.webContents.send("open-search-bar");
    });
    electron_1.globalShortcut.register("CommandOrControl+S", () => {
        mainWindow.webContents.send("toggle-floating-sidebar");
    });
    electron_1.globalShortcut.register("CommandOrControl+L", () => {
        mainWindow.webContents.send("focus-url-bar");
    });
});
electron_1.app.on("browser-window-blur", () => {
    electron_1.globalShortcut.unregisterAll();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
