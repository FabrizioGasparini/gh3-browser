interface Tab {
    id: string;
    title: string;
    url: string;
    icon: string;
    webview: Electron.WebviewTag;
}

class BrowserTabs {
    public tabs: Tab[] = [];
    public activeTabId: string | null = null;
    public container: HTMLElement;
    public sidebar: HTMLElement;
    public searchFloat: HTMLElement;
    public searchSuggestions: HTMLElement;
    public tabList: HTMLElement;
    public searchBar: HTMLInputElement;
    public urlBar: HTMLInputElement;

    constructor() {
        this.container = document.getElementById("browser-container")!;
        this.sidebar = document.getElementById("sidebar")!;
        this.searchFloat = document.getElementById("search-float")!;
        this.searchSuggestions = document.getElementById("search-suggestions")!;
        this.tabList = document.getElementById("tab-list")!;
        this.searchBar = document.getElementById("search-input") as HTMLInputElement;
        this.urlBar = document.getElementById("url-bar") as HTMLInputElement;

        document.getElementById("new-tab")?.addEventListener("click", () => this.createTab());

        document.getElementById("back")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.goBack();
        });

        document.getElementById("forward")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.goForward();
        });

        document.getElementById("reload")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.reload();
        });

        this.urlBar.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key == "Escape") this.loadUrl(this.urlBar.value);
        });

        this.searchBar.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                if (this.searchBar.value != "") this.createTab(this.searchBar.value);
                this.setFloatingSearchbar(false);
            }
        });

        this.searchBar.addEventListener("focusout", (e) => {
            this.setFloatingSearchbar(false);
        });

        this.tabList.addEventListener("dragstart", (event) => {
            const target = event.target as HTMLElement;

            // Salva l'id della tab che viene trascinata
            event.dataTransfer?.setData("text/plain", target.getAttribute("id")!);
            target.style.opacity = "0.5"; // Modifica l'opacità della tab mentre è in movimento
        });

        // Aggiungi l'evento dragover per permettere il drop
        this.tabList.addEventListener("dragover", (event) => {
            event.preventDefault(); // Permette il drop
            const target = event.target as HTMLElement;
        });

        this.tabList.addEventListener("drop", (event) => {
            event.preventDefault();
            const target = event.target as HTMLElement;
            const draggedId = event.dataTransfer?.getData("text/plain");

            if (target.parentElement?.classList.contains("tab") && draggedId) {
                const draggedElement = document.getElementById(draggedId);

                // Se il target è una tab, spostiamo la tab trascinata
                if (draggedElement) {
                    const draggedIndex = Array.from(this.tabList.children).indexOf(draggedElement);
                    const targetIndex = Array.from(this.tabList.children).indexOf(target.parentElement);

                    // Aggiungi il draggedElement prima o dopo il target
                    if (draggedIndex < targetIndex) {
                        this.tabList.insertBefore(draggedElement, target.parentElement.nextSibling);
                    } else {
                        this.tabList.insertBefore(draggedElement, target.parentElement);
                    }
                }
            }
        });

        // Reset opacity della tab quando il drag finisce
        this.tabList.addEventListener("dragend", (event) => {
            const target = event.target as HTMLElement;
            target.style.opacity = "1";
        });
    }

    public toggleFloatingSidebar() {
        this.sidebar.classList.toggle("floating");
    }

    public setFloatingSearchbar(active: boolean) {
        this.searchBar.value = "";
        if (active) this.searchFloat.classList.add("active");
        else this.searchFloat.classList.remove("active");
        this.searchBar.focus();
    }

    public createTab(url = "https://www.google.com") {
        const id = crypto.randomUUID();

        if (!this.isValidUrl(url)) url = "https://www.google.com/search?q=" + encodeURI(url) + "&sourceid=chrome&ie=UTF-8";
        else if (!url.startsWith("http")) url = "http://" + url;

        const webview = document.createElement("webview");
        webview.setAttribute("src", url);
        webview.setAttribute("autosize", "on");

        this.container.appendChild(webview);

        const tab: Tab = {
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
            if (this.activeTabId == id) this.urlBar.value = e.url;
        });

        webview.addEventListener("will-navigate", (event) => {
            console.log(event);
            const e = event as Electron.WillFrameNavigateEvent;
            if (e.url != "about:blank") this.urlBar.value = e.url;
        });

        this.tabs.push(tab);
        this.setActiveTab(id);
        this.updateTabs();

        return tab;
    }

    public createTabElement(tab: Tab) {
        const tabElement = document.createElement("div");
        tabElement.className = `tab ${this.activeTabId == tab.id ? "active" : ""}`;
        tabElement.innerHTML = `
            <img class="tab-image" src="${tab.icon}" />
            <span class="tab-title">${tab.title}</span>
            <span class="tab-dragger"></span>
            <button class="tab-close">✕</button>
        `;

        const bgTitle = document.getElementById("bg-title");
        if (bgTitle) bgTitle.style.display = "none";

        tabElement.setAttribute("draggable", "true");
        tabElement.setAttribute("id", tab.id);

        tabElement.addEventListener("click", () => this.setActiveTab(tab.id));
        tabElement.querySelector(".tab-close")!.addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });

        return tabElement;
    }

    public saveTabs() {
        const tabs = this.tabs;
        const tabData = Array.from(tabs).map((tab) => {
            return {
                id: tab.id,
                url: tab.url,
            };
        });
        localStorage.setItem("tabs", JSON.stringify(tabData));
        localStorage.setItem("activeTab", browser.activeTabId!);
    }

    public loadTabs() {
        const savedTabs = JSON.parse(localStorage.getItem("tabs") || "[]");
        savedTabs.forEach((tab: { id: string; url: string }) => {
            const newTab = this.createTab(tab.url);
            newTab.id = tab.id;
        });

        if (this.tabs.length == 0) {
            browser.setFloatingSearchbar(true);
            // this.createTab();
        }

        browser.setActiveTab(localStorage.getItem("activeTab") || browser.tabs[0].id);
    }

    public updateTabs() {
        this.tabList.innerHTML = "";
        this.tabs.forEach((tab) => {
            this.tabList.appendChild(this.createTabElement(tab));
        });
    }

    public setActiveTab(id: string) {
        this.activeTabId = id;
        const tab = this.tabs.find((tab) => tab.id == id);
        if (!tab) return;

        this.tabs.forEach((tab) => {
            tab.webview.classList.toggle("active", tab.id == id);
        });

        this.urlBar.value = tab.url;
        this.updateTabs();
    }

    public closeTab(id: string) {
        const index = this.tabs.findIndex((tab) => tab.id == id);
        if (index == -1) return;

        this.tabs[index].webview.remove();
        this.tabs.splice(index, 1);

        if (this.activeTabId == id) {
            const newIndex = Math.min(index, this.tabs.length - 1);
            if (newIndex >= 0) this.setActiveTab(this.tabs[newIndex].id);
            else this.urlBar.value = "";

            const bgTitle = document.getElementById("bg-title");
            if (bgTitle && newIndex < 0) bgTitle.style.display = "block";
        }

        this.updateTabs();
    }

    public getActiveTab() {
        return this.tabs.find((tab) => tab.id == this.activeTabId);
    }

    public isValidUrl = (urlString: string) => {
        var urlPattern = new RegExp(
            "^(https?:\\/\\/)?" + // protocollo
            "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // nome dominio
            "((\\d{1,3}\\.){3}\\d{1,3}))" + // o indirizzo ip (v4)
            "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // porta e percorso
            "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
                "(\\#[-a-z\\d_]*)?$",
            "i"
        ); // fragment locator
        return !!urlPattern.test(urlString);
    };

    public loadUrl(url: string) {
        let tab = this.getActiveTab();

        if (!this.isValidUrl(url)) url = "https://www.google.com/search?q=" + encodeURI(url) + "&sourceid=chrome&ie=UTF-8";
        else if (!url.startsWith("http")) url = "http://" + url;

        if (!tab) this.createTab(url);
        else tab.webview.loadURL(url);
    }

    public goBack() {
        const tab = this.getActiveTab();
        if (tab?.webview.canGoBack) tab.webview.goBack();
    }

    public goForward() {
        const tab = this.getActiveTab();
        if (tab?.webview.canGoForward) tab.webview.goForward();
    }

    public reload() {
        const tab = this.getActiveTab();
        tab?.webview.reload();
    }
}

const browser = new BrowserTabs();

window.electron.closeActiveTab(() => {
    browser.closeTab(browser.activeTabId!);
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
