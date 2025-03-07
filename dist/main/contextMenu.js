"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupContextMenu = setupContextMenu;
const electron_1 = require("electron");
function setupContextMenu(mainWindow) {
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
            contextMenu.append(new electron_1.MenuItem({ label: "Indietro", enabled: webview === null || webview === void 0 ? void 0 : webview.canGoBack(), click: () => webview === null || webview === void 0 ? void 0 : webview.goBack() }));
            contextMenu.append(new electron_1.MenuItem({ label: "Avanti", enabled: webview === null || webview === void 0 ? void 0 : webview.canGoForward(), click: () => webview === null || webview === void 0 ? void 0 : webview.goForward() }));
            contextMenu.append(new electron_1.MenuItem({ label: "Ricarica", click: () => webview === null || webview === void 0 ? void 0 : webview.reload() }));
            contextMenu.append(new electron_1.MenuItem({ label: "Ispeziona Elemento", click: () => mainWindow.webContents.send("toggle-devtools") }));
        }
        contextMenu.popup({ window: mainWindow });
    });
}
