import { contextBridge, ipcRenderer, WebviewTag } from "electron";

contextBridge.exposeInMainWorld("electron", {
    closeActiveTab: (callback: () => void) => ipcRenderer.on("close-active-tab", callback),
    changeActiveTab: (callback: (dir: number) => void) => ipcRenderer.on("change-active-tab", (event: Electron.Event, dir: number) => callback(dir)),
    openSearchBar: (callback: () => void) => ipcRenderer.on("open-search-bar", callback),
    toggleFloatingSidebar: (callback: () => void) => ipcRenderer.on("toggle-floating-sidebar", callback),
    focusUrlBar: (callback: () => void) => ipcRenderer.on("focus-url-bar", callback),
    openHistoryPanel: (callback: () => void) => ipcRenderer.on("open-history-panel", callback),

    closeWindow: () => ipcRenderer.send("close-window"),
    minimizeWindow: () => ipcRenderer.send("minimize-window"),
    toggleMaximizeWindow: () => ipcRenderer.send("toggle-maximize-window"),
    showContextMenu: (params: {}, id: number) => ipcRenderer.send("show-context-menu", params, id),

    setDevToolsContent: (id: number, id_2: number) => ipcRenderer.send("set-dev-tools-content", id, id_2),
    setFullscreen: (callback: (value: boolean) => void) => ipcRenderer.on("set-fullscreen", (event: Electron.Event, value: boolean) => callback(value)),
});

contextBridge.exposeInMainWorld("page", {
    reload: (callback: () => void) => ipcRenderer.on("reload-page", callback),
    goBack: (callback: () => void) => ipcRenderer.on("go-back-page", callback),
    goForward: (callback: () => void) => ipcRenderer.on("go-forward-page", callback),
});

contextBridge.exposeInMainWorld("webview", {
    openPopup: (callback: (details: Electron.HandlerDetails) => void) => ipcRenderer.on("open-popup", (event: Electron.Event, details: Electron.HandlerDetails) => callback(details)),
    toggleDevTools: (callback: () => void) => ipcRenderer.on("toggle-devtools", callback),
});
