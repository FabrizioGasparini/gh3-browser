import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, Menu, MenuItem } from "electron";
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
        titleBarStyle: "hidden",
    });

    mainWindow.setMenu(null);

    mainWindow.webContents.on("before-input-event", (event, input) => {
        switch (input.key.toLowerCase()) {
            case "f4":
                if (input.alt && process.platform !== "darwin") app.quit();
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

    ipcMain.on("show-context-menu", (event, params: Electron.Params, browser) => {
        const contextMenu = new Menu();

        if (params.linkURL) {
            contextMenu.append(new MenuItem({ label: "Apri in una nuova scheda", click: () => browser.createTab(params.linkURL) }));
            contextMenu.append(new MenuItem({ label: "Copia indirizzo link", click: () => clipboard.writeText(params.linkURL) }));
        } else if (params.mediaType == "image") {
            contextMenu.append(new MenuItem({ label: "Salva immagine", click: () => console.error(params.srcURL) }));
            contextMenu.append(new MenuItem({ label: "Copia indirizzo immagine", click: () => clipboard.writeText(params.srcURL) }));
        }

        contextMenu.append(
            new MenuItem({
                label: "Indietro",
                enabled: browser.getActiveTab()?.webview.canGoBack(),
                click: () => browser.getActiveTab()?.webview.goBack(),
            })
        );

        contextMenu.append(
            new MenuItem({
                label: "Avanti",
                enabled: browser.getActiveTab()?.webview.canGoForward(),
                click: () => browser.getActiveTab()?.webview.goForward(),
            })
        );

        contextMenu.append(new MenuItem({ type: "separator" }));

        contextMenu.append(
            new MenuItem({
                label: "Ricarica",
                click: () => browser.getActiveTab()?.webview.reload(),
            })
        );

        contextMenu.append(new MenuItem({ type: "separator" }));

        contextMenu.append(
            new MenuItem({
                label: "Traduci con Google",
                click: () => {
                    const selectedText = document.getSelection()?.toString();
                    if (selectedText) {
                        const url = `https://translate.google.com/?text=${encodeURIComponent(selectedText)}`;
                        browser.createTab(url);
                    }
                },
            })
        );

        contextMenu.append(
            new MenuItem({
                label: "Ispeziona Elemento",
                click: () => browser.getActiveTab()?.webview.inspectElement(params.x, params.y),
            })
        );

        // Mostra il menu nella posizione corretta
        contextMenu.popup({ window: mainWindow });
    });
});

app.on("browser-window-focus", () => {
    registerShortcut("CommandOrControl+Shift+I", () => mainWindow.webContents.toggleDevTools());

    registerShortcut("CommandOrControl+W", () => mainWindow.webContents.send("close-active-tab"));
    registerShortcut("CommandOrControl+T", () => mainWindow.webContents.send("open-search-bar"));
    registerShortcut("CommandOrControl+S", () => mainWindow.webContents.send("toggle-floating-sidebar"));
    registerShortcut("CommandOrControl+L", () => mainWindow.webContents.send("focus-url-bar"));

    registerShortcut("CommandOrControl+R", () => mainWindow.webContents.send("reload-page"));
    registerShortcut("Alt+Left", () => mainWindow.webContents.send("go-back-page"));
    registerShortcut("Alt+Right", () => mainWindow.webContents.send("go-forward-page"));
});

function registerShortcut(command: string, func: () => void) {
    globalShortcut.register(command, func);
}

ipcMain.on("close-window", () => {
    mainWindow?.close();
});

ipcMain.on("minimize-window", () => {
    mainWindow?.minimize();
});

ipcMain.on("toggle-maximize-window", () => {
    if (mainWindow?.isMaximized()) {
        mainWindow?.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

app.on("browser-window-blur", () => {
    globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
