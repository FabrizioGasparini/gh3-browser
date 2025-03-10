import { Auth, signInAnonymously, User } from "firebase/auth";
import { FirebaseUser } from "./firebase";

export const loginAnonymously = async (auth: Auth) => {
    try {
        const userCredential = await signInAnonymously(auth);
        const user: User = userCredential.user;

        const token = await user.getIdTokenResult();
        return {
            uid: user.uid,
            isAnonymous: user.isAnonymous,
            email: user.email || null,
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
        console.error("Errore login anonimo:", error);
        throw error;
    }
};
