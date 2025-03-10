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
}
