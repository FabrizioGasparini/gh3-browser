"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAppEvents = setupAppEvents;
const electron_1 = require("electron");
const shortcuts_1 = require("./shortcuts");
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const node_fs_1 = __importDefault(require("node:fs"));
function setupAppEvents(mainWindow) {
    electron_1.app.whenReady().then(() => {
        electron_1.protocol.handle("gh3b", (request) => {
            let param = request.url.slice("gh3b://".length);
            if (param.includes(".css"))
                param = param.split("/")[1];
            else if (param.includes(".js")) {
                let list = param.split("/");
                list.shift();
                param = "../../" + list.join("/");
            }
            else
                param += ".html";
            const filePath = node_path_1.default.join(__dirname, "../public/protocol/", param);
            console.log(param);
            if (node_fs_1.default.existsSync(filePath)) {
                return electron_1.net.fetch((0, node_url_1.pathToFileURL)(filePath).toString());
            }
            return electron_1.net.fetch((0, node_url_1.pathToFileURL)(node_path_1.default.join(__dirname, "../public/protocol/not_found.html")).toString());
        });
    });
    electron_1.app.on("open-url", (event, data) => {
        console.log(event, data);
    });
    electron_1.app.on("browser-window-focus", () => {
        (0, shortcuts_1.registerShortcut)("CommandOrControl+Shift+I", () => mainWindow.webContents.toggleDevTools());
        (0, shortcuts_1.registerShortcut)("CommandOrControl+W", () => mainWindow.webContents.send("close-active-tab"));
        (0, shortcuts_1.registerShortcut)("CommandOrControl+T", () => mainWindow.webContents.send("open-search-bar"));
        (0, shortcuts_1.registerShortcut)("CommandOrControl+S", () => mainWindow.webContents.send("toggle-floating-sidebar"));
        (0, shortcuts_1.registerShortcut)("CommandOrControl+L", () => mainWindow.webContents.send("focus-url-bar"));
        (0, shortcuts_1.registerShortcut)("CommandOrControl+H", () => mainWindow.webContents.send("open-history-panel"));
        (0, shortcuts_1.registerShortcut)("CommandOrControl+G", () => mainWindow.webContents.send("open-glinks-panel"));
        (0, shortcuts_1.registerShortcut)("Alt+Up", () => mainWindow.webContents.send("change-active-tab", -1));
        (0, shortcuts_1.registerShortcut)("Alt+Down", () => mainWindow.webContents.send("change-active-tab", 1));
        (0, shortcuts_1.registerShortcut)("CommandOrControl+Tab", () => mainWindow.webContents.send("change-active-tab", 1));
        (0, shortcuts_1.registerShortcut)("CommandOrControl+R", () => mainWindow.webContents.send("reload-page"));
        (0, shortcuts_1.registerShortcut)("Alt+Left", () => mainWindow.webContents.send("go-back-page"));
        (0, shortcuts_1.registerShortcut)("Alt+Right", () => mainWindow.webContents.send("go-forward-page"));
        (0, shortcuts_1.registerShortcut)("F12", () => console.log("f12"));
        (0, shortcuts_1.registerShortcut)("F11", () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
            mainWindow.webContents.send("set-fullscreen", mainWindow.isFullScreen());
        });
    });
    electron_1.app.on("browser-window-blur", () => {
        (0, shortcuts_1.unregisterShortcuts)();
    });
    electron_1.app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            electron_1.app.quit();
        }
    });
}
