import { app, BrowserWindow, clipboard, globalShortcut, ipcMain, Menu, MenuItem, webContents } from "electron";
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
            disableBlinkFeatures: "CSSBackdropFilter",
        },
        titleBarStyle: "hidden",
    });

    mainWindow.setMenu(null);

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

    mainWindow.loadFile("../index.html");

    ipcMain.on("show-context-menu", (event, params: Electron.Params, id: number) => {
        const contextMenu = new Menu();
        const webview = webContents.fromId(id);

        if (params.linkURL) {
            contextMenu.append(new MenuItem({ label: "Apri in una nuova scheda", click: () => mainWindow.webContents.send("open-popup", { url: params.linkURL }) }));
            contextMenu.append(new MenuItem({ label: "Copia indirizzo link", click: () => clipboard.writeText(params.linkURL) }));
        } else if (params.mediaType == "image") {
            contextMenu.append(new MenuItem({ label: "Salva immagine", click: () => console.error(params.srcURL) }));
            contextMenu.append(new MenuItem({ label: "Copia indirizzo immagine", click: () => clipboard.writeText(params.srcURL) }));
        } else {
            contextMenu.append(
                new MenuItem({
                    label: "Indietro",
                    enabled: webview?.navigationHistory.canGoBack(),
                    click: () => webview?.navigationHistory.goBack(),
                })
            );

            contextMenu.append(
                new MenuItem({
                    label: "Avanti",
                    enabled: webview?.navigationHistory.canGoForward(),
                    click: () => webview?.navigationHistory.goForward(),
                })
            );

            contextMenu.append(new MenuItem({ type: "separator" }));

            contextMenu.append(
                new MenuItem({
                    label: "Ricarica",
                    click: () => webview?.reload(),
                })
            );

            contextMenu.append(new MenuItem({ type: "separator" }));

            contextMenu.append(
                new MenuItem({
                    label: "Traduci con Google",
                    enabled: params.selectionText != null,
                    click: () => {
                        const selectedText = params.selectionText;
                        if (selectedText) {
                            const url = `https://translate.google.com/?text=${encodeURIComponent(selectedText)}`;
                            mainWindow.webContents.send("open-popup", { url });
                        }
                    },
                })
            );
        }

        contextMenu.append(new MenuItem({ type: "separator" }));

        contextMenu.append(
            new MenuItem({
                label: "Ispeziona Elemento",
                click: () => {
                    console.log();
                    mainWindow.webContents.send("toggle-devtools");
                },
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
    registerShortcut("CommandOrControl+H", () => mainWindow.webContents.send("open-history-panel"));

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
