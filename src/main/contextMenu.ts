import { Menu, MenuItem, clipboard, webContents, BrowserWindow, ipcMain } from "electron";

export function setupContextMenu(mainWindow: BrowserWindow) {
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
            contextMenu.append(new MenuItem({ label: "Indietro", enabled: webview?.canGoBack(), click: () => webview?.goBack() }));
            contextMenu.append(new MenuItem({ label: "Avanti", enabled: webview?.canGoForward(), click: () => webview?.goForward() }));
            contextMenu.append(new MenuItem({ label: "Ricarica", click: () => webview?.reload() }));
            contextMenu.append(new MenuItem({ label: "Ispeziona Elemento", click: () => mainWindow.webContents.send("toggle-devtools") }));
        }

        contextMenu.popup({ window: mainWindow });
    });
}
