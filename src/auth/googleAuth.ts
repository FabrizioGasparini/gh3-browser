import { BrowserWindow } from "electron";
import { signInWithRedirect, GoogleAuthProvider, Auth } from "firebase/auth";

export const loginWithGoogle = async (mainWindow: BrowserWindow, auth: Auth) => {
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithRedirect(auth, provider);
        console.log(userCredential);
        return userCredential;
    } catch (error) {
        console.error("Errore login Google:", error);
        throw error;
    }
};
