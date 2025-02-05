"use strict";
class BrowserTabs {
    constructor() {
        var _a, _b, _c, _d;
        this.tabs = [];
        this.activeTabId = null;
        this.isValidUrl = (urlString) => {
            var urlPattern = new RegExp("^(https?:\\/\\/)?" + // protocollo
                "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // nome dominio
                "((\\d{1,3}\\.){3}\\d{1,3}))" + // o indirizzo ip (v4)
                "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // porta e percorso
                "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
                "(\\#[-a-z\\d_]*)?$", "i"); // fragment locator
            return !!urlPattern.test(urlString);
        };
        this.container = document.getElementById("browser-container");
        this.sidebar = document.getElementById("sidebar");
        this.searchFloat = document.getElementById("search-float");
        this.searchSuggestions = document.getElementById("search-suggestions");
        this.tabList = document.getElementById("tab-list");
        this.searchBar = document.getElementById("search-input");
        this.urlBar = document.getElementById("url-bar");
        (_a = document.getElementById("new-tab")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => this.createTab());
        (_b = document.getElementById("back")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", (e) => {
            e.preventDefault();
            this.goBack();
        });
        (_c = document.getElementById("forward")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", (e) => {
            e.preventDefault();
            this.goForward();
        });
        (_d = document.getElementById("reload")) === null || _d === void 0 ? void 0 : _d.addEventListener("click", (e) => {
            e.preventDefault();
            this.reload();
        });
        this.urlBar.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key == "Escape")
                this.loadUrl(this.urlBar.value);
        });
        this.searchBar.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                if (this.searchBar.value != "")
                    this.createTab(this.searchBar.value);
                this.setFloatingSearchbar(false);
            }
        });
        this.searchBar.addEventListener("focusout", (e) => {
            this.setFloatingSearchbar(false);
        });
        this.tabList.addEventListener("dragstart", (event) => {
            var _a;
            const target = event.target;
            // Salva l'id della tab che viene trascinata
            (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", target.getAttribute("id"));
            target.style.opacity = "0.5"; // Modifica l'opacità della tab mentre è in movimento
        });
        // Aggiungi l'evento dragover per permettere il drop
        this.tabList.addEventListener("dragover", (event) => {
            event.preventDefault(); // Permette il drop
            const target = event.target;
        });
        this.tabList.addEventListener("drop", (event) => {
            var _a, _b;
            event.preventDefault();
            const target = event.target;
            const draggedId = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text/plain");
            if (((_b = target.parentElement) === null || _b === void 0 ? void 0 : _b.classList.contains("tab")) && draggedId) {
                const draggedElement = document.getElementById(draggedId);
                // Se il target è una tab, spostiamo la tab trascinata
                if (draggedElement) {
                    const draggedIndex = Array.from(this.tabList.children).indexOf(draggedElement);
                    const targetIndex = Array.from(this.tabList.children).indexOf(target.parentElement);
                    // Aggiungi il draggedElement prima o dopo il target
                    if (draggedIndex < targetIndex) {
                        this.tabList.insertBefore(draggedElement, target.parentElement.nextSibling);
                    }
                    else {
                        this.tabList.insertBefore(draggedElement, target.parentElement);
                    }
                }
            }
        });
        // Reset opacity della tab quando il drag finisce
        this.tabList.addEventListener("dragend", (event) => {
            const target = event.target;
            target.style.opacity = "1";
        });
    }
    toggleFloatingSidebar() {
        this.sidebar.classList.toggle("floating");
    }
    setFloatingSearchbar(active) {
        this.searchBar.value = "";
        if (active)
            this.searchFloat.classList.add("active");
        else
            this.searchFloat.classList.remove("active");
        this.searchBar.focus();
    }
    createTab(url = "https://www.google.com") {
        const id = crypto.randomUUID();
        if (!this.isValidUrl(url))
            url = "https://www.google.com/search?q=" + encodeURI(url) + "&sourceid=chrome&ie=UTF-8";
        else if (!url.startsWith("http"))
            url = "http://" + url;
        const webview = document.createElement("webview");
        webview.setAttribute("src", url);
        webview.setAttribute("autosize", "on");
        this.container.appendChild(webview);
        const tab = {
            id,
            title: "New Tab",
            url,
            icon: "https://www.google.com/favicon.ico",
            webview,
        };
        console.log(tab);
        webview.addEventListener("page-title-updated", (e) => {
            tab.title = e.title;
            this.updateTabs();
        });
        webview.addEventListener("page-favicon-updated", (e) => {
            tab.icon = e.favicons[0];
            this.updateTabs();
        });
        webview.addEventListener("did-navigate", (e) => {
            tab.url = e.url;
            if (this.activeTabId == id)
                this.urlBar.value = e.url;
        });
        webview.addEventListener("will-navigate", (event) => {
            console.log(event);
            const e = event;
            if (e.url != "about:blank")
                this.urlBar.value = e.url;
        });
        this.tabs.push(tab);
        this.setActiveTab(id);
        this.updateTabs();
        return tab;
    }
    createTabElement(tab) {
        const tabElement = document.createElement("div");
        tabElement.className = `tab ${this.activeTabId == tab.id ? "active" : ""}`;
        tabElement.innerHTML = `
            <img class="tab-image" src="${tab.icon}" />
            <span class="tab-title">${tab.title}</span>
            <span class="tab-dragger"></span>
            <button class="tab-close">✕</button>
        `;
        const bgTitle = document.getElementById("bg-title");
        if (bgTitle)
            bgTitle.style.display = "none";
        tabElement.setAttribute("draggable", "true");
        tabElement.setAttribute("id", tab.id);
        tabElement.addEventListener("click", () => this.setActiveTab(tab.id));
        tabElement.querySelector(".tab-close").addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });
        return tabElement;
    }
    saveTabs() {
        const tabs = this.tabs;
        const tabData = Array.from(tabs).map((tab) => {
            return {
                id: tab.id,
                url: tab.url,
            };
        });
        localStorage.setItem("tabs", JSON.stringify(tabData));
        localStorage.setItem("activeTab", browser.activeTabId);
    }
    loadTabs() {
        const savedTabs = JSON.parse(localStorage.getItem("tabs") || "[]");
        savedTabs.forEach((tab) => {
            const newTab = this.createTab(tab.url);
            newTab.id = tab.id;
        });
        if (this.tabs.length == 0) {
            browser.setFloatingSearchbar(true);
            // this.createTab();
        }
        browser.setActiveTab(localStorage.getItem("activeTab") || browser.tabs[0].id);
    }
    updateTabs() {
        this.tabList.innerHTML = "";
        this.tabs.forEach((tab) => {
            this.tabList.appendChild(this.createTabElement(tab));
        });
    }
    setActiveTab(id) {
        this.activeTabId = id;
        const tab = this.tabs.find((tab) => tab.id == id);
        if (!tab)
            return;
        this.tabs.forEach((tab) => {
            tab.webview.classList.toggle("active", tab.id == id);
        });
        this.urlBar.value = tab.url;
        this.updateTabs();
    }
    closeTab(id) {
        const index = this.tabs.findIndex((tab) => tab.id == id);
        if (index == -1)
            return;
        this.tabs[index].webview.remove();
        this.tabs.splice(index, 1);
        if (this.activeTabId == id) {
            const newIndex = Math.min(index, this.tabs.length - 1);
            if (newIndex >= 0)
                this.setActiveTab(this.tabs[newIndex].id);
            else
                this.urlBar.value = "";
            const bgTitle = document.getElementById("bg-title");
            if (bgTitle && newIndex < 0)
                bgTitle.style.display = "block";
        }
        this.updateTabs();
    }
    getActiveTab() {
        return this.tabs.find((tab) => tab.id == this.activeTabId);
    }
    loadUrl(url) {
        let tab = this.getActiveTab();
        if (!this.isValidUrl(url))
            url = "https://www.google.com/search?q=" + encodeURI(url) + "&sourceid=chrome&ie=UTF-8";
        else if (!url.startsWith("http"))
            url = "http://" + url;
        if (!tab)
            this.createTab(url);
        else
            tab.webview.loadURL(url);
    }
    goBack() {
        const tab = this.getActiveTab();
        if (tab === null || tab === void 0 ? void 0 : tab.webview.canGoBack)
            tab.webview.goBack();
    }
    goForward() {
        const tab = this.getActiveTab();
        if (tab === null || tab === void 0 ? void 0 : tab.webview.canGoForward)
            tab.webview.goForward();
    }
    reload() {
        const tab = this.getActiveTab();
        tab === null || tab === void 0 ? void 0 : tab.webview.reload();
    }
}
const browser = new BrowserTabs();
window.electron.closeActiveTab(() => {
    browser.closeTab(browser.activeTabId);
});
window.electron.openSearchBar(() => {
    browser.setFloatingSearchbar(true);
});
window.electron.toggleFloatingSidebar(() => {
    browser.toggleFloatingSidebar();
});
window.electron.focusUrlBar(() => {
    browser.urlBar.select();
    browser.sidebar.classList.remove("floating");
});
window.addEventListener("beforeunload", () => {
    browser.saveTabs();
});
// Caricamento della sessione
window.addEventListener("load", () => {
    browser.loadTabs();
});
