"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShortcut = registerShortcut;
exports.unregisterShortcuts = unregisterShortcuts;
const electron_1 = require("electron");
function registerShortcut(command, func) {
    electron_1.globalShortcut.register(command, func);
}
function unregisterShortcuts() {
    electron_1.globalShortcut.unregisterAll();
}
