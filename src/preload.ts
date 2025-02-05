import { contextBridge, ipcRenderer, WebviewTag } from "electron";

contextBridge.exposeInMainWorld("electron", {
    closeActiveTab: (callback: () => void) => ipcRenderer.on("close-active-tab", callback),
    openSearchBar: (callback: () => void) => ipcRenderer.on("open-search-bar", callback),
    toggleFloatingSidebar: (callback: () => void) => ipcRenderer.on("toggle-floating-sidebar", callback),
    focusUrlBar: (callback: () => void) => ipcRenderer.on("focus-url-bar", callback),

    closeWindow: () => ipcRenderer.send("close-window"),
    minimizeWindow: () => ipcRenderer.send("minimize-window"),
    toggleMaximizeWindow: () => ipcRenderer.send("toggle-maximize-window"),
    showContextMenu: (params: {}, browser: {}) => ipcRenderer.send("show-context-menu", params, browser),
});

contextBridge.exposeInMainWorld("page", {
    reload: (callback: () => void) => ipcRenderer.on("reload-page", callback),
    goBack: (callback: () => void) => ipcRenderer.on("go-back-page", callback),
    goForward: (callback: () => void) => ipcRenderer.on("go-forward-page", callback),
});

contextBridge.exposeInMainWorld("webview", {
    openPopup: (callback: (details: Electron.HandlerDetails) => void) => ipcRenderer.on("open-popup", (event: Electron.Event, details: Electron.HandlerDetails) => callback(details)),
});
