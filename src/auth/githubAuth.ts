import { signInWithPopup, GithubAuthProvider, Auth } from "firebase/auth";

export const loginWithGithub = async (auth: Auth) => {
    const provider = new GithubAuthProvider();
    try {
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential.user;
    } catch (error) {
        console.error("Errore login GitHub:", error);
        throw error;
    }
};
