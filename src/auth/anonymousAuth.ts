import { Auth, signInAnonymously } from "firebase/auth";

export const loginAnonymously = async (auth: Auth) => {
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error) {
        console.error("Errore login anonimo:", error);
        throw error;
    }
};
