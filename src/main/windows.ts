import { app, BrowserWindow } from "electron";
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

    mainWindow.webContents.on("before-input-event", (event, input) => {
        switch (input.key.toLowerCase()) {
            case "f4":
                if (input.alt && process.platform !== "darwin") app.quit();
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
    mainWindow.loadFile(path.join(__dirname, "../public/index.html"));

    return mainWindow;
}
