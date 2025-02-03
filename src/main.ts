import { app, BrowserWindow, globalShortcut } from "electron";
import path from "path";

let mainWindow: BrowserWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
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

app.on("browser-window-focus", () => {
    globalShortcut.register("CommandOrControl+Shift+I", () => {
        mainWindow.webContents.toggleDevTools();
    });

    globalShortcut.register("CommandOrControl+W", () => {
        mainWindow.webContents.send("close-active-tab");
    });

    globalShortcut.register("CommandOrControl+T", () => {
        mainWindow.webContents.send("open-search-bar");
    });

    globalShortcut.register("CommandOrControl+S", () => {
        mainWindow.webContents.send("toggle-floating-sidebar");
    });

    globalShortcut.register("CommandOrControl+L", () => {
        mainWindow.webContents.send("focus-url-bar");
    });
});

app.on("browser-window-blur", () => {
    globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
