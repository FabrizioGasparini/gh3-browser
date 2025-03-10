import { globalShortcut } from "electron";

export function registerShortcut(command: string, func: () => void) {
    globalShortcut.register(command, func);
}

export function unregisterShortcuts() {
    globalShortcut.unregisterAll();
}
