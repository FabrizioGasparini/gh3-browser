import { loginWithEmail, registerWithEmail } from "./emailAuth";
import { loginWithGoogle } from "./googleAuth";
import { loginWithGithub } from "./githubAuth";
import { loginAnonymously } from "./anonymousAuth";
import { Auth, signOut } from "firebase/auth";

export const AuthManager = {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithGithub,
    loginAnonymously,
};

export function logout(auth: Auth) {
    signOut(auth)
        .then(() => {
            console.log("Logout effettuato.");
        })
        .catch((error) => {
            console.error("Errore di logout:", error);
        });
}
