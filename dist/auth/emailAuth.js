"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWithEmail = exports.loginWithEmail = void 0;
const auth_1 = require("firebase/auth");
const loginWithEmail = (auth, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userCredential = yield (0, auth_1.signInWithEmailAndPassword)(auth, email, password);
        const user = userCredential.user;
        console.log(user);
        const token = yield user.getIdTokenResult();
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
        };
    }
    catch (error) {
        console.error("Errore login email:", error);
        throw error;
    }
});
exports.loginWithEmail = loginWithEmail;
const registerWithEmail = (auth, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userCredential = yield (0, auth_1.createUserWithEmailAndPassword)(auth, email, password);
        yield (0, auth_1.sendEmailVerification)(userCredential.user);
        return userCredential.user;
    }
    catch (error) {
        console.error("Errore registrazione email:", error);
        throw error;
    }
});
exports.registerWithEmail = registerWithEmail;
