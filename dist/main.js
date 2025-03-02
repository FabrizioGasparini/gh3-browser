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
            disableBlinkFeatures: "CSSBackdropFilter",
        },
        titleBarStyle: "hidden",
    });
    mainWindow.setMenu(null);
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
    mainWindow.loadFile("../index.html");
    electron_1.ipcMain.on("show-context-menu", (event, params, id) => {
        const contextMenu = new electron_1.Menu();
        const webview = electron_1.webContents.fromId(id);
        if (params.linkURL) {
            contextMenu.append(new electron_1.MenuItem({ label: "Apri in una nuova scheda", click: () => mainWindow.webContents.send("open-popup", { url: params.linkURL }) }));
            contextMenu.append(new electron_1.MenuItem({ label: "Copia indirizzo link", click: () => electron_1.clipboard.writeText(params.linkURL) }));
        }
        else if (params.mediaType == "image") {
            contextMenu.append(new electron_1.MenuItem({ label: "Salva immagine", click: () => console.error(params.srcURL) }));
            contextMenu.append(new electron_1.MenuItem({ label: "Copia indirizzo immagine", click: () => electron_1.clipboard.writeText(params.srcURL) }));
        }
        else {
            contextMenu.append(new electron_1.MenuItem({
                label: "Indietro",
                enabled: webview === null || webview === void 0 ? void 0 : webview.navigationHistory.canGoBack(),
                click: () => webview === null || webview === void 0 ? void 0 : webview.navigationHistory.goBack(),
            }));
            contextMenu.append(new electron_1.MenuItem({
                label: "Avanti",
                enabled: webview === null || webview === void 0 ? void 0 : webview.navigationHistory.canGoForward(),
                click: () => webview === null || webview === void 0 ? void 0 : webview.navigationHistory.goForward(),
            }));
            contextMenu.append(new electron_1.MenuItem({ type: "separator" }));
            contextMenu.append(new electron_1.MenuItem({
                label: "Ricarica",
                click: () => webview === null || webview === void 0 ? void 0 : webview.reload(),
            }));
            contextMenu.append(new electron_1.MenuItem({ type: "separator" }));
            contextMenu.append(new electron_1.MenuItem({
                label: "Traduci con Google",
                enabled: params.selectionText != null,
                click: () => {
                    const selectedText = params.selectionText;
                    if (selectedText) {
                        const url = `https://translate.google.com/?text=${encodeURIComponent(selectedText)}`;
                        mainWindow.webContents.send("open-popup", { url });
                    }
                },
            }));
        }
        contextMenu.append(new electron_1.MenuItem({ type: "separator" }));
        contextMenu.append(new electron_1.MenuItem({
            label: "Ispeziona Elemento",
            click: () => {
                console.log();
                mainWindow.webContents.send("toggle-devtools");
            },
        }));
        // Mostra il menu nella posizione corretta
        contextMenu.popup({ window: mainWindow });
    });
});
electron_1.app.on("browser-window-focus", () => {
    registerShortcut("CommandOrControl+Shift+I", () => mainWindow.webContents.toggleDevTools());
    registerShortcut("CommandOrControl+W", () => mainWindow.webContents.send("close-active-tab"));
    registerShortcut("CommandOrControl+T", () => mainWindow.webContents.send("open-search-bar"));
    registerShortcut("CommandOrControl+S", () => mainWindow.webContents.send("toggle-floating-sidebar"));
    registerShortcut("CommandOrControl+L", () => mainWindow.webContents.send("focus-url-bar"));
    registerShortcut("CommandOrControl+H", () => mainWindow.webContents.send("open-history-panel"));
    registerShortcut("CommandOrControl+G", () => mainWindow.webContents.send("open-glinks-panel"));
    registerShortcut("Alt+Up", () => mainWindow.webContents.send("change-active-tab", -1));
    registerShortcut("Alt+Down", () => mainWindow.webContents.send("change-active-tab", 1));
    registerShortcut("CommandOrControl+Tab", () => mainWindow.webContents.send("change-active-tab", 1));
    registerShortcut("CommandOrControl+R", () => mainWindow.webContents.send("reload-page"));
    registerShortcut("Alt+Left", () => mainWindow.webContents.send("go-back-page"));
    registerShortcut("Alt+Right", () => mainWindow.webContents.send("go-forward-page"));
    registerShortcut("F12", () => console.log("f12"));
    registerShortcut("F11", () => {
        mainWindow.setFullScreen(!mainWindow.isFullScreen());
        mainWindow.webContents.send("set-fullscreen", mainWindow.isFullScreen());
    });
});
function registerShortcut(command, func) {
    electron_1.globalShortcut.register(command, func);
}
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
electron_1.app.on("browser-window-blur", () => {
    electron_1.globalShortcut.unregisterAll();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
