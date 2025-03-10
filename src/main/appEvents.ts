import { app, BrowserWindow, net, protocol } from "electron";
import { registerShortcut, unregisterShortcuts } from "./shortcuts";
import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs";

export function setupAppEvents(mainWindow: BrowserWindow) {
    app.whenReady().then(() => {
        protocol.handle("gh3b", (request) => {
            let param = request.url.slice("gh3b://".length);

            if (param.includes(".css")) param = param.split("/")[1];
            else if (param.includes(".js")) {
                let list = param.split("/");
                list.shift();
                param = "../../" + list.join("/");
            } else param += ".html";
            const filePath = path.join(__dirname, "../public/protocol/", param);

            console.log(param);
            if (fs.existsSync(filePath)) {
                return net.fetch(pathToFileURL(filePath).toString());
            }

            return net.fetch(pathToFileURL(path.join(__dirname, "../public/protocol/not_found.html")).toString());
        });
    });

    app.on("open-url", (event, data) => {
        console.log(event, data);
    });

    app.on("browser-window-focus", () => {
        registerShortcut("CommandOrControl+Shift+I", () => mainWindow.webContents.toggleDevTools());

        registerShortcut("CommandOrControl+W", () => mainWindow.webContents.send("close-active-tab"));
        registerShortcut("CommandOrControl+T", () => mainWindow.webContents.send("open-search-bar"));
        registerShortcut("CommandOrControl+S", () => mainWindow.webContents.send("toggle-floating-sidebar"));
        registerShortcut("CommandOrControl+L", () => mainWindow.webContents.send("focus-url-bar"));
        registerShortcut("CommandOrControl+H", () => mainWindow.webContents.send("open-history-panel"));
        registerShortcut("CommandOrControl+G", () => mainWindow.webContents.send("open-glinks-panel"));

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

    app.on("browser-window-blur", () => {
        unregisterShortcuts();
    });

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
}
