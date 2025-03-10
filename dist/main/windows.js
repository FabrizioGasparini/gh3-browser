"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMainWindow = createMainWindow;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
function createMainWindow() {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path_1.default.join(__dirname, "../preload/preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            disableBlinkFeatures: "CSSBackdropFilter",
        },
        titleBarStyle: "hidden",
    });
    mainWindow.webContents.on("before-input-event", (event, input) => {
        switch (input.key.toLowerCase()) {
            case "f4":
                if (input.alt && process.platform !== "darwin")
                    electron_1.app.quit();
                break;
            case "f12":
                event.preventDefault();
                mainWindow.webContents.send("toggle-devtools");
                break;
            default:
                break;
        }
        mainWindow.webContents.setIgnoreMenuShortcuts(true);
    });
    mainWindow.webContents.on("did-attach-webview", (_, contents) => {
        contents.setWindowOpenHandler((details) => {
            mainWindow.webContents.send("open-popup", details);
            return { action: "deny" };
        });
    });
    mainWindow.setMenu(null);
    mainWindow.loadFile(path_1.default.join(__dirname, "../public/index.html"));
    return mainWindow;
}
