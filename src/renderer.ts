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
            if (e.key === "Enter") this.loadUrl(this.urlBar.value);
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

        this.createTab();
    }

    public toggleFloatingSidebar() {
        this.sidebar.classList.toggle("floating");
    }

    public setFloatingSearchbar(active: boolean) {
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
            <button class="tab-close">✕</button>
        `;

        tabElement.addEventListener("click", () => this.setActiveTab(tab.id));
        tabElement.querySelector(".tab-close")!.addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });

        return tabElement;
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
