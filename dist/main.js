"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow;
const stateFile = path_1.default.join(electron_1.app.getPath("userData"), "tabsState.json");
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
        titleBarStyle: "hidden",
    });
    mainWindow.setMenu(null);
    mainWindow.webContents.on("before-input-event", (event, input) => {
        switch (input.key.toLowerCase()) {
            case "f4":
                if (input.alt && process.platform !== "darwin")
                    electron_1.app.quit();
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
    /*if (fs.existsSync(stateFile)) {
        const savedState = fs.readFileSync(stateFile, "utf-8");

        if (savedState) {
            mainWindow.webContents.executeJavaScript(`localStorage.setItem('tabsState', '${savedState}')`);
        }
    }*/
    mainWindow.loadFile("../index.html");
    const brows = new BrowserTabs();
    console.log(brows.activeTabId);
    electron_1.ipcMain.on("show-context-menu", (event, params, browser) => {
        var _a, _b;
        const contextMenu = new electron_1.Menu();
        if (params.linkURL) {
            contextMenu.append(new electron_1.MenuItem({ label: "Apri in una nuova scheda", click: () => browser.createTab(params.linkURL) }));
            contextMenu.append(new electron_1.MenuItem({ label: "Copia indirizzo link", click: () => electron_1.clipboard.writeText(params.linkURL) }));
        }
        else if (params.mediaType == "image") {
            contextMenu.append(new electron_1.MenuItem({ label: "Salva immagine", click: () => console.error(params.srcURL) }));
            contextMenu.append(new electron_1.MenuItem({ label: "Copia indirizzo immagine", click: () => electron_1.clipboard.writeText(params.srcURL) }));
        }
        contextMenu.append(new electron_1.MenuItem({
            label: "Indietro",
            enabled: (_a = browser.getActiveTab()) === null || _a === void 0 ? void 0 : _a.webview.canGoBack(),
            click: () => { var _a; return (_a = browser.getActiveTab()) === null || _a === void 0 ? void 0 : _a.webview.goBack(); },
        }));
        contextMenu.append(new electron_1.MenuItem({
            label: "Avanti",
            enabled: (_b = browser.getActiveTab()) === null || _b === void 0 ? void 0 : _b.webview.canGoForward(),
            click: () => { var _a; return (_a = browser.getActiveTab()) === null || _a === void 0 ? void 0 : _a.webview.goForward(); },
        }));
        contextMenu.append(new electron_1.MenuItem({ type: "separator" }));
        contextMenu.append(new electron_1.MenuItem({
            label: "Ricarica",
            click: () => { var _a; return (_a = browser.getActiveTab()) === null || _a === void 0 ? void 0 : _a.webview.reload(); },
        }));
        contextMenu.append(new electron_1.MenuItem({ type: "separator" }));
        contextMenu.append(new electron_1.MenuItem({
            label: "Traduci con Google",
            click: () => {
                var _a;
                const selectedText = (_a = document.getSelection()) === null || _a === void 0 ? void 0 : _a.toString();
                if (selectedText) {
                    const url = `https://translate.google.com/?text=${encodeURIComponent(selectedText)}`;
                    browser.createTab(url);
                }
            },
        }));
        contextMenu.append(new electron_1.MenuItem({
            label: "Ispeziona Elemento",
            click: () => { var _a; return (_a = browser.getActiveTab()) === null || _a === void 0 ? void 0 : _a.webview.inspectElement(params.x, params.y); },
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
    registerShortcut("CommandOrControl+R", () => mainWindow.webContents.send("reload-page"));
    registerShortcut("Alt+Left", () => mainWindow.webContents.send("go-back-page"));
    registerShortcut("Alt+Right", () => mainWindow.webContents.send("go-forward-page"));
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
