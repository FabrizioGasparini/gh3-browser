// Importa Firebase SDK
import { ipcMain, BrowserWindow } from "electron";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { AuthManager, logout } from "./authManager";

export interface FirebaseUser {
    uid: string;
    isAnonymous: boolean;
    email: string | null;
    displayName: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    metadata: {
        creationTime: string | undefined;
        lastSignInTime: string | undefined;
    };
    providerData: {
        providerId: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
        phoneNumber: string | null;
    }[];
    session?: FirebaseSession;
}

export interface FirebaseSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}

const firebaseConfig = {
    apiKey: "AIzaSyDq7V7Wb8pVCWSJ2xyZeNAFt0dXCDxcnto",
    authDomain: "gh3browser.firebaseapp.com",
    projectId: "gh3browser",
    storageBucket: "gh3browser.firebasestorage.app",
    messagingSenderId: "1072198874421",
    appId: "1:1072198874421:web:788ff6e3d59dcdde09487c",
    measurementId: "G-JL59YDBJZ7",
};

function createAuthWindow(mainWindow: BrowserWindow) {
    let authWindow = new BrowserWindow({
        width: 400,
        height: 600,
        frame: false,
        parent: mainWindow,
        modal: true,
        show: false,
    });

    authWindow.once("ready-to-show", () => {
        authWindow.show();
    });
}

export function initFirebase(mainWindow: BrowserWindow) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    ipcMain.handle("login:email", async (_, email: string, password: string) => {
        return AuthManager.loginWithEmail(auth, email, password);
    });

    ipcMain.handle("login:google", async () => {
        createAuthWindow(mainWindow);
        return AuthManager.loginWithGoogle(mainWindow, auth);
    });

    ipcMain.handle("login:github", async () => {
        return AuthManager.loginWithGithub(auth);
    });

    ipcMain.handle("login:anonymous", async () => {
        return AuthManager.loginAnonymously(auth);
    });
}
