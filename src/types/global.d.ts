export {};

declare global {
    interface Window {
        electron: {
            closeActiveTab: (callback: () => void) => void;
            openSearchBar: (callback: () => void) => void;
            toggleFloatingSidebar: (callback: () => void) => void;
            focusUrlBar: (callback: () => void) => void;

            closeWindow: () => void;
            minimizeWindow: () => void;
            toggleMaximizeWindow: () => void;
            showContextMenu: (params: {}, browser: {}) => void;
        };

        page: {
            reload: (callback: () => void) => void;
            goBack: (callback: () => void) => void;
            goForward: (callback: () => void) => void;
        };

        webview: {
            openPopup: (callback: (details: Electron.HandlerDetails) => void) => string;
        };
    }
}
