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
    mainWindow.setMenu(null);
    mainWindow.loadFile(path_1.default.join(__dirname, "../../src/index.html"));
    return mainWindow;
}
