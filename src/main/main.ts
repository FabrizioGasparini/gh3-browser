import { app } from "electron";
import { createMainWindow } from "./windows";
import { registerShortcuts } from "./shortcuts";
import { handleIpcEvents } from "./icpHandler";
import { setupContextMenu } from "./contextMenu";
import { initFirebase } from "../auth/firebase";

let mainWindow = null;

app.whenReady().then(() => {
    mainWindow = createMainWindow();
    setupContextMenu(mainWindow);
    handleIpcEvents(mainWindow);
    registerShortcuts(mainWindow);
    initFirebase();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
