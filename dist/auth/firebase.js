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
exports.initFirebase = initFirebase;
// Importa Firebase SDK
const electron_1 = require("electron");
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const authManager_1 = require("./authManager");
const firebaseConfig = {
    apiKey: "AIzaSyDq7V7Wb8pVCWSJ2xyZeNAFt0dXCDxcnto",
    authDomain: "gh3browser.firebaseapp.com",
    projectId: "gh3browser",
    storageBucket: "gh3browser.firebasestorage.app",
    messagingSenderId: "1072198874421",
    appId: "1:1072198874421:web:788ff6e3d59dcdde09487c",
    measurementId: "G-JL59YDBJZ7",
};
function initFirebase() {
    const app = (0, app_1.initializeApp)(firebaseConfig);
    const auth = (0, auth_1.getAuth)(app);
    electron_1.ipcMain.handle("login:email", (_, email, password) => __awaiter(this, void 0, void 0, function* () {
        authManager_1.AuthManager.loginWithEmail(auth, email, password);
    }));
    electron_1.ipcMain.handle("login:google", () => __awaiter(this, void 0, void 0, function* () {
        authManager_1.AuthManager.loginWithGoogle(auth);
    }));
    electron_1.ipcMain.handle("login:github", () => __awaiter(this, void 0, void 0, function* () {
        authManager_1.AuthManager.loginWithGithub(auth);
    }));
    electron_1.ipcMain.handle("login:anonymous", () => __awaiter(this, void 0, void 0, function* () {
        authManager_1.AuthManager.loginAnonymously(auth);
    }));
}
