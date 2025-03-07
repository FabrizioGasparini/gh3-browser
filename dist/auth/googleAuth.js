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
exports.loginWithGoogle = void 0;
const auth_1 = require("firebase/auth");
const loginWithGoogle = (auth) => __awaiter(void 0, void 0, void 0, function* () {
    const provider = new auth_1.GoogleAuthProvider();
    try {
        const userCredential = yield (0, auth_1.signInWithPopup)(auth, provider);
        return userCredential.user;
    }
    catch (error) {
        console.error("Errore login Google:", error);
        throw error;
    }
});
exports.loginWithGoogle = loginWithGoogle;
