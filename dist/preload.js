"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electron", {
    closeActiveTab: (callback) => electron_1.ipcRenderer.on("close-active-tab", callback),
    openSearchBar: (callback) => electron_1.ipcRenderer.on("open-search-bar", callback),
    toggleFloatingSidebar: (callback) => electron_1.ipcRenderer.on("toggle-floating-sidebar", callback),
    focusUrlBar: (callback) => electron_1.ipcRenderer.on("focus-url-bar", callback),
    openPopup: (url) => electron_1.ipcRenderer.send("open-popup", url),
});
