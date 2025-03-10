import { app } from "electron";
import { createMainWindow } from "./windows";
import { handleIpcEvents } from "./icpHandler";
import { setupContextMenu } from "./contextMenu";
import { initFirebase } from "../auth/firebase";
import { setupAppEvents } from "./appEvents";

let mainWindow = null;

app.whenReady().then(() => {
    mainWindow = createMainWindow();
    setupContextMenu(mainWindow);
    setupAppEvents(mainWindow);
    handleIpcEvents(mainWindow);
    initFirebase(mainWindow);
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
