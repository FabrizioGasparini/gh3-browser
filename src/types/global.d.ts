import { FirebaseUser } from "../auth/firebase";
import { User } from "firebase/auth";

export {};

declare global {
    interface Window {
        electron: {
            closeActiveTab: (callback: () => void) => void;
            changeActiveTab: (callback: (dir: number) => void) => void;
            openNewTab: (callback: (url: string) => void) => void;

            openSearchBar: (callback: () => void) => void;
            toggleFloatingSidebar: (callback: () => void) => void;
            focusUrlBar: (callback: () => void) => void;
            openHistoryPanel: (callback: () => void) => void;
            openGLinksPanel: (callback: () => void) => void;

            closeWindow: () => void;
            minimizeWindow: () => void;
            toggleMaximizeWindow: () => void;
            showContextMenu: (params: {}, id: number) => void;

            setDevToolsContent: (id: number, id_2: number) => void;
            setFullscreen: (callback: (value: boolean) => void) => void;
        };

        page: {
            reload: (callback: () => void) => void;
            goBack: (callback: () => void) => void;
            goForward: (callback: () => void) => void;
        };

        webview: {
            openPopup: (callback: (details: Electron.HandlerDetails) => void) => string;
            toggleDevTools: (callback: () => void) => string;
        };

        auth: {
            loginWithEmail: (email: string, password: string) => Promise<FirebaseUser>;
            loginWithGoogle: () => Promise<FirebaseUser>;
            loginWithGithub: () => Promise<FirebaseUser>;
            loginAnonymously: () => Promise<FirebaseUser>;
        };
    }
}
