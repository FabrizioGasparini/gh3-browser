"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electron", {
    closeActiveTab: (callback) => electron_1.ipcRenderer.on("close-active-tab", callback),
    openSearchBar: (callback) => electron_1.ipcRenderer.on("open-search-bar", callback),
    toggleFloatingSidebar: (callback) => electron_1.ipcRenderer.on("toggle-floating-sidebar", callback),
    focusUrlBar: (callback) => electron_1.ipcRenderer.on("focus-url-bar", callback),
    closeWindow: () => electron_1.ipcRenderer.send("close-window"),
    minimizeWindow: () => electron_1.ipcRenderer.send("minimize-window"),
    toggleMaximizeWindow: () => electron_1.ipcRenderer.send("toggle-maximize-window"),
    showContextMenu: (params, id) => electron_1.ipcRenderer.send("show-context-menu", params, id),
    setDevToolsContent: (id, id_2) => electron_1.ipcRenderer.send("set-dev-tools-content", id, id_2),
    setFullscreen: (callback) => electron_1.ipcRenderer.on("set-fullscreen", (event, value) => callback(value)),
});
electron_1.contextBridge.exposeInMainWorld("page", {
    reload: (callback) => electron_1.ipcRenderer.on("reload-page", callback),
    goBack: (callback) => electron_1.ipcRenderer.on("go-back-page", callback),
    goForward: (callback) => electron_1.ipcRenderer.on("go-forward-page", callback),
});
electron_1.contextBridge.exposeInMainWorld("webview", {
    openPopup: (callback) => electron_1.ipcRenderer.on("open-popup", (event, details) => callback(details)),
    toggleDevTools: (callback) => electron_1.ipcRenderer.on("toggle-devtools", callback),
});
