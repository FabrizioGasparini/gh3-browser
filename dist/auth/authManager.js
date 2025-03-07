"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
exports.logout = logout;
const emailAuth_1 = require("./emailAuth");
const googleAuth_1 = require("./googleAuth");
const githubAuth_1 = require("./githubAuth");
const anonymousAuth_1 = require("./anonymousAuth");
const auth_1 = require("firebase/auth");
exports.AuthManager = {
    loginWithEmail: emailAuth_1.loginWithEmail,
    registerWithEmail: emailAuth_1.registerWithEmail,
    loginWithGoogle: googleAuth_1.loginWithGoogle,
    loginWithGithub: githubAuth_1.loginWithGithub,
    loginAnonymously: anonymousAuth_1.loginAnonymously,
};
function logout(auth) {
    (0, auth_1.signOut)(auth)
        .then(() => {
        console.log("Logout effettuato.");
    })
        .catch((error) => {
        console.error("Errore di logout:", error);
    });
}
