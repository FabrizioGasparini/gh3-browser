import { signInWithPopup, GoogleAuthProvider, Auth } from "firebase/auth";

export const loginWithGoogle = async (auth: Auth) => {
    const provider = new GoogleAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential.user;
    } catch (error) {
        console.error("Errore login Google:", error);
        throw error;
    }
};
