import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, Auth, User } from "firebase/auth";
import { FirebaseUser } from "./firebase";

export const loginWithEmail = async (auth: Auth, email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user: User = userCredential.user;

        console.log(user);

        const token = await user.getIdTokenResult();
        return {
            uid: user.uid,
            isAnonymous: user.isAnonymous,
            email: user.email || null,
            emailVerified: user.emailVerified,
            displayName: user.displayName || null,
            phoneNumber: user.phoneNumber || null,
            photoURL: user.photoURL || null,
            metadata: {
                creationTime: user.metadata.creationTime,
                lastSignInTime: user.metadata.lastSignInTime,
            },
            providerData: user.providerData.map((provider) => ({
                providerId: provider.providerId,
                email: provider.email || null,
                displayName: provider.displayName || null,
                photoURL: provider.photoURL || null,
                phoneNumber: provider.phoneNumber || null,
            })),
            session: {
                accessToken: token.token,
                refreshToken: user.refreshToken,
                expiresAt: token.expirationTime,
            },
        } as FirebaseUser;
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
