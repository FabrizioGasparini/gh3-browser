import { BrowserWindow } from "electron";
import path from "path";

export function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "../preload/preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            disableBlinkFeatures: "CSSBackdropFilter",
        },
        titleBarStyle: "hidden",
    });

    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, "../../src/index.html"));

    return mainWindow;
}
