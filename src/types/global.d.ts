export {};

declare global {
    interface Window {
        electron: {
            closeActiveTab: (callback: () => void) => void;
            openSearchBar: (callback: () => void) => void;
            toggleFloatingSidebar: (callback: () => void) => void;
            focusUrlBar: (callback: () => void) => void;
        };
    }
}
