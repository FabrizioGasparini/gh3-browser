import { app, BrowserWindow } from "electron";
import { unregisterShortcuts } from "./shortcuts";

export function setupAppEvents(mainWindow: BrowserWindow) {
    app.on("browser-window-blur", () => {
        unregisterShortcuts();
    });

    app.on("open-url", (event, url) => {
        event.preventDefault();
        mainWindow.webContents.send("handle-verification-url", url);
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
}
