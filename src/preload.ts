import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
    closeActiveTab: (callback: () => void) => ipcRenderer.on("close-active-tab", callback),
    openSearchBar: (callback: () => void) => ipcRenderer.on("open-search-bar", callback),
    toggleFloatingSidebar: (callback: () => void) => ipcRenderer.on("toggle-floating-sidebar", callback),
    focusUrlBar: (callback: () => void) => ipcRenderer.on("focus-url-bar", callback),
    openPopup: (url: string) => ipcRenderer.send("open-popup", url),
});
