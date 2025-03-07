import { ipcMain, BrowserWindow } from "electron";

export function handleIpcEvents(mainWindow: BrowserWindow) {
    ipcMain.on("close-window", () => mainWindow?.close());
    ipcMain.on("minimize-window", () => mainWindow?.minimize());
    ipcMain.on("toggle-maximize-window", () => {
        if (mainWindow?.isMaximized()) {
            mainWindow?.unmaximize();
        } else {
            mainWindow?.maximize();
        }
    });

    ipcMain.on("toggle-devtools", () => mainWindow.webContents.toggleDevTools());
}
