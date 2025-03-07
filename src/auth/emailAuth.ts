import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, Auth } from "firebase/auth";

export const loginWithEmail = async (auth: Auth, email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Errore login email:", error);
        throw error;
    }
};

export const registerWithEmail = async (auth: Auth, email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        return userCredential.user;
    } catch (error) {
        console.error("Errore registrazione email:", error);
        throw error;
    }
};
