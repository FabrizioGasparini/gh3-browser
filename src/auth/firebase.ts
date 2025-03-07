// Importa Firebase SDK
import { ipcMain } from "electron";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { AuthManager, logout } from "./authManager";

const firebaseConfig = {
    apiKey: "AIzaSyDq7V7Wb8pVCWSJ2xyZeNAFt0dXCDxcnto",
    authDomain: "gh3browser.firebaseapp.com",
    projectId: "gh3browser",
    storageBucket: "gh3browser.firebasestorage.app",
    messagingSenderId: "1072198874421",
    appId: "1:1072198874421:web:788ff6e3d59dcdde09487c",
    measurementId: "G-JL59YDBJZ7",
};

export function initFirebase() {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    ipcMain.handle("login:email", async (_, email: string, password: string) => {
        AuthManager.loginWithEmail(auth, email, password);
    });

    ipcMain.handle("login:google", async () => {
        AuthManager.loginWithGoogle(auth);
    });

    ipcMain.handle("login:github", async () => {
        AuthManager.loginWithGithub(auth);
    });

    ipcMain.handle("login:anonymous", async () => {
        AuthManager.loginAnonymously(auth);
    });
}
