interface Tab {
    id: string;
    title: string;
    url: string;
    icon: string;
    visible: boolean;
    webview: Electron.WebviewTag;
    loaded: boolean;
}

interface HistoryElement {
    title: string;
    url: string;
    timestamp: number;
}

class BrowserTabs {
    public tabs: Tab[] = [];
    public activeTabId: string | null = null;
    public activeTabIndex: number | null = null;
    public suggestionsHistory: { [key: string]: [string, string] } = {};
    public history: HistoryElement[] = [];

    public container: HTMLElement;
    public sidebar: HTMLElement;
    public searchFloat: HTMLElement;
    public historyPanel: HTMLElement;
    public searchSuggestions: HTMLElement;
    public tabList: HTMLElement;
    public suggestionsList: HTMLElement;
    public historyList: HTMLElement;

    public selectedSuggestionIndex: number;
    public suggestionsURLs: string[] = [];

    public searchBar: HTMLInputElement;
    public urlBar: HTMLInputElement;

    constructor() {
        this.container = document.getElementById("browser-container")!;
        this.sidebar = document.getElementById("sidebar")!;
        this.searchFloat = document.getElementById("search-float")!;
        this.historyPanel = document.getElementById("history-panel")!;
        this.searchSuggestions = document.getElementById("search-suggestions")!;
        this.tabList = document.getElementById("tab-list")!;
        this.suggestionsList = document.getElementById("suggestions")!;
        this.historyList = document.getElementById("history-list")!;
        this.searchBar = document.getElementById("search-input") as HTMLInputElement;
        this.urlBar = document.getElementById("url-bar") as HTMLInputElement;

        this.selectedSuggestionIndex = 0;
        this.suggestionsURLs = [];

        this.setupSidebar();
        this.setupTitlebar();
        this.addEventListeners();
    }

    private setupSidebar() {
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
    }

    private setupTitlebar() {
        document.getElementById("close")?.addEventListener("click", () => window.electron.closeWindow());
        document.getElementById("maximize")?.addEventListener("click", () => window.electron.toggleMaximizeWindow());
        document.getElementById("minimize")?.addEventListener("click", () => window.electron.minimizeWindow());
    }

    private addEventListeners() {
        this.urlBar.addEventListener("focus", (e) => {
            browser.showSearchbar(true);
            browser.updateSearchSuggestions();
            browser.searchBar.value = this.urlBar.value;
            browser.searchBar.select();
        });

        this.searchBar.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "Escape":
                    if (this.searchBar.value != "" && this.suggestionsURLs.length != 0) {
                        this.selectedSuggestionIndex = -1;
                        this.suggestionsList.innerHTML = "";
                        this.suggestionsURLs = [];
                    } else {
                        this.showSearchbar(false);
                    }
                    break;

                case "Enter":
                    if (this.searchBar.value == "") {
                        if (this.selectedSuggestionIndex != -1 && this.suggestionsURLs.length != 0) this.createTab(this.suggestionsURLs[this.selectedSuggestionIndex]);
                    } else {
                        if (this.selectedSuggestionIndex == -1 || this.suggestionsURLs.length == 0) this.createTab(this.searchBar.value);
                        else this.createTab(this.suggestionsURLs[this.selectedSuggestionIndex]);
                    }

                    this.showSearchbar(false);
                    this.suggestionsList.innerHTML = "";
                    break;

                case "ArrowDown":
                    e.preventDefault();
                    this.moveSearchSuggestions("down");
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    this.moveSearchSuggestions("up");
                    break;
            }
        });

        this.searchFloat.addEventListener("focusout", (e: FocusEvent) => {
            if (!(e.relatedTarget as HTMLElement)?.classList.contains("delete-search-btn")) this.showSearchbar(false);
        });

        this.tabList.addEventListener("dragstart", (event) => {
            const target = event.target as HTMLElement;

            event.dataTransfer?.setData("text/plain", target.getAttribute("id")!);
            target.style.opacity = "0.5"; // Modifica l'opacità della tab mentre è in movimento
        });

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
                    if (draggedIndex < targetIndex) 
                        this.tabList.insertBefore(draggedElement, target.parentElement.nextSibling);
                    else
                        this.tabList.insertBefore(draggedElement, target.parentElement);
                    
                    [this.tabs[draggedIndex], this.tabs[targetIndex]] = [this.tabs[targetIndex], this.tabs[draggedIndex]];
                }
            }
        });

        // Reset opacity della tab quando il drag finisce
        this.tabList.addEventListener("dragend", (event) => {
            const target = event.target as HTMLElement;
            target.style.opacity = "1";
        });

        this.searchBar.addEventListener("input", async () => {
            this.updateSearchSuggestions();
        });
    }

    public toggleFloatingSidebar() {
        this.sidebar.classList.toggle("floating");
    }

    public showSearchbar(active: boolean) {
        this.searchBar.value = "";
        if (active) this.searchFloat.classList.add("active");
        else this.searchFloat.classList.remove("active");
        this.searchBar.focus();
        this.selectedSuggestionIndex = 0;
        this.updateSearchSuggestions()
    }

    public toggleHistoryPanel() {
        this.historyPanel.classList.toggle("active");
        this.updateHistoryList()
    }

    public focusSearchbar() {
        this.urlBar.select();
        this.sidebar.classList.remove("floating");
    }

    public updateSearchSuggestions() {
        this.suggestionsList.innerHTML = "";
        this.selectedSuggestionIndex = 0;
        this.suggestionsURLs = [];
        let query = this.searchBar.value.toLowerCase();
        let openTabs = this.tabs.filter((tab) => tab.title.toLowerCase().includes(query)).slice(0, 5);

        let totalSuggestions = openTabs.length;

        openTabs.forEach((tab) => {
            const suggestion = document.createElement("li");
            suggestion.innerHTML = "";

            suggestion.className = "suggestion";
            suggestion.innerHTML = `
                <div class="left">
                    <img src="${tab.icon}" class="tab-image"></img> 
                    <p>${tab.title}</p>
                </div>
                Open Tab →`;

            suggestion.addEventListener("click", () => {
                this.setActiveTab(tab.id);
                this.showSearchbar(false);
                this.suggestionsList.innerHTML = "";
            });

            this.suggestionsList.appendChild(suggestion);
            this.suggestionsURLs.push("gh3b://" + tab.id);
        });

        for (let url in this.suggestionsHistory) {
            if (!url.includes(query)) continue;

            if (totalSuggestions == 5) break;
            totalSuggestions += 1;

            const suggestion = document.createElement("li");
            suggestion.className = "suggestion";
            suggestion.innerHTML = `
                    <div class="left">
                        <img src="${this.suggestionsHistory[url][1]}" class="tab-image"></img> 
                        <p>${this.suggestionsHistory[url][0]}</p>
                    </div>
                    <div class="center">
                        <p>${url}</p>
                    </div>
                    `;

            const btn = document.createElement("button");
            btn.className = "tab-close delete-search-btn";
            btn.innerText = "✕";
            btn.addEventListener("click", () => {
                delete this.suggestionsHistory[url];
                this.updateSearchSuggestions();
            });

            suggestion.appendChild(btn);

            suggestion.addEventListener("click", (e) => {
                if ((e.target as HTMLElement).className == "tab-close") return;

                this.createTab(url);
                this.showSearchbar(false);
                this.suggestionsList.innerHTML = "";
            });
            this.suggestionsList.appendChild(suggestion);
            this.suggestionsURLs.push(url);
        }

        this.suggestionsList.querySelectorAll(".suggestion")[this.selectedSuggestionIndex]?.classList.add("active");
    }

    public updateHistoryList() {
        this.historyList.innerHTML = "";

        this.history.forEach((page) => {
            const elem = document.createElement("li");
            elem.className = "page";
            elem.innerHTML = `
                <div class="left">
                    <p>${page.title}</p>
                </div>
                <div class="center">
                    <p>${page.url}</p>
                </div>
            `;

            this.historyList.appendChild(elem)
        })
    }

    public moveSearchSuggestions(direction: string) {
        let items = document.querySelectorAll(".suggestion");
        if (items.length === 0) return;

        if (direction === "down") {
            this.selectedSuggestionIndex = (this.selectedSuggestionIndex + 1) % items.length;
        } else if (direction === "up") {
            this.selectedSuggestionIndex = (this.selectedSuggestionIndex - 1 + items.length) % items.length;
        }

        items.forEach((item) => item.classList.remove("active"));
        items[this.selectedSuggestionIndex].classList.add("active");
    }

    public createTab(url = "https://www.google.com", id: string = "", open: boolean = true, visible: boolean = true) {
        id = id == "" ? crypto.randomUUID() : id;
        let tabUrl = url == "" ? "https://www.google.com" : url;

        if (tabUrl.startsWith("gh3b://")) {
            const tab = this.getTab(tabUrl.split("://")[1]);
            if (tab) {
                this.setActiveTab(tab.id);
                return;
            }
        }

        if (!tabUrl.includes("://")) {
            if (!tabUrl.startsWith("http")) {
                console.log(tabUrl)
                if (!this.isValidUrl(tabUrl)) tabUrl = "https://www.google.com/search?q=" + encodeURI(tabUrl) + "&sourceid=chrome&ie=UTF-8";
                else tabUrl = "https://" + tabUrl;
            }
        }

        console.log(tabUrl)

        const webview = document.createElement("webview");
        webview.setAttribute("src", tabUrl);
        webview.setAttribute("autosize", "on");
        webview.setAttribute("allowpopups", "");
        webview.setAttribute("plugins", "");
        webview.setAttribute("webpreferences", "nativeWindowOpen");
        webview.setAttribute("webpreferences", "nativeWindowOpen");
        webview.setAttribute("disableblinkfeatures", "CSSBackdropFilter");

        this.container.appendChild(webview);

        const tab: Tab = {
            id,
            title: "New Tab",
            url: tabUrl,
            visible,
            icon: "https://www.google.com/favicon.ico",
            webview,
            loaded: false
        };

        webview.addEventListener("page-title-updated", (e) => {
            tab.title = e.title;
            this.suggestionsHistory[webview.getURL().startsWith("https://www.google.com/search?q=") ? url : webview.getURL()] = [tab.title, tab.icon || ""];

            this.updateTabs();
        });

        webview.addEventListener("page-favicon-updated", (e) => {
            tab.icon = e.favicons[0];
            this.suggestionsHistory[webview.getURL().startsWith("https://www.google.com/search?q=") ? url : webview.getURL()] = [tab.title, tab.icon];

            this.updateTabs();
        });

        webview.addEventListener("did-navigate", (e) => {
            tab.url = e.url;
            
            if (this.activeTabId == id) this.urlBar.value = e.url;

            const back = document.getElementById("back");
            if (back) back.style.color = webview.canGoBack() ? "#fff" : "#808080";

            const forward = document.getElementById("forward");
            if (forward) forward.style.color = webview.canGoForward() ? "#fff" : "#808080";
            document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", "dark");

        });
        
        webview.addEventListener("dom-ready", () => {
            tab.loaded = true;
            this.history.push({ title: tab.title, url: tab.url, timestamp: Date.now() } as HistoryElement);

            webview.executeJavaScript(`
                (function() {
                    function fixBackground() {
                        function setIfTransparent(el) {
                            const computedBg = window.getComputedStyle(el).backgroundColor;
                            
                            if (!computedBg || computedBg === "rgba(0, 0, 0, 0)" || computedBg === "transparent") {
                                el.style.backgroundColor = "white";
                            }
                        }

                        // Controlla e imposta sfondo su <html> e <body>
                        setIfTransparent(document.documentElement);
                        setIfTransparent(document.body);

                        // Controlla e imposta sfondo negli iframe
                        document.querySelectorAll("iframe").forEach(iframe => {
                            try {
                                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                                if (iframeDoc) {
                                    setIfTransparent(iframeDoc.documentElement);
                                    setIfTransparent(iframeDoc.body);
                                }
                            } catch (e) {
                                // Ignora errori di CORS sugli iframe esterni
                            }
                        });
                    }

                    // Applica subito il fix
                    fixBackground();

                    // Rileva modifiche alla pagina e riapplica se necessario
                    const observer = new MutationObserver(fixBackground);
                    observer.observe(document, { attributes: true, childList: true, subtree: true });

                    // Controlla periodicamente per sicurezza
                    setInterval(fixBackground, 2000);
                })();
            `);
        });

        webview.addEventListener("context-menu", (event: Electron.ContextMenuEvent) => {
            event.preventDefault();
            const params = {
                x: event.params.x,
                y: event.params.y,
                linkURL: event.params.linkURL || null,
                srcURL: event.params.srcURL || null,
                selectionText: event.params.selectionText || null,
            };

            window.electron.showContextMenu(params, webview.getWebContentsId());
        });

        this.tabs.push(tab);

        if (!open) return tab;

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
            <span class="tab-dragger" title="${tab.id}"></span>
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

    public saveBrowser() {
        const tabs = this.tabs;
        const tabData = Array.from(tabs).map((tab) => {
            return {
                id: tab.id,
                url: tab.url,
            };
        });
        localStorage.setItem("tabs", JSON.stringify(tabData));
        localStorage.setItem("activeTab", this.activeTabId!);
        localStorage.setItem("suggestionsHistory", JSON.stringify(this.suggestionsHistory));
        localStorage.setItem("history", JSON.stringify(this.history));
    }

    public loadBrowser() {
        const savedTabs = JSON.parse(localStorage.getItem("tabs") || "[]");
        savedTabs.forEach((tab: { id: string; url: string }) => {
            const newTab = this.createTab(tab.url, "", false)!;
            newTab.id = tab.id;
        });

        if (this.tabs.length == 0) {
            this.showSearchbar(true);
            this.updateSearchSuggestions();
        }

        this.setActiveTab(localStorage.getItem("activeTab") || this.tabs[0].id);
        this.suggestionsHistory = JSON.parse(localStorage.getItem("suggestionsHistory") || "{}");
        this.history = JSON.parse(localStorage.getItem("history") || "[]");
    }

    public updateTabs() {
        this.tabList.innerHTML = "";
        this.tabs.forEach((tab) => {
            if (tab.visible) this.tabList.appendChild(this.createTabElement(tab));
        });
    }

    public setActiveTab(id: string) {
        this.activeTabId = id;
        const tab = this.tabs.find((tab) => tab.id == id);
        if (!tab) return;

        this.activeTabIndex = this.tabs.indexOf(tab);

        this.tabs.forEach((tab) => {
            tab.webview.classList.toggle("active", tab.id == id);
        });

        this.urlBar.value = tab.url;
        this.updateTabs();
    }

    public setActiveTabFromIndex(index: number) {
        if (index < 0) index = this.tabs.length - 1;
        if (index > this.tabs.length - 1) index = 0;

        const tab = this.tabs[index];
        if (!tab) return;

        this.activeTabId = tab.id;
        this.activeTabIndex = index;

        this.tabs.forEach((t) => {
            t.webview.classList.toggle("active", tab.id == t.id);
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

    public getTab(id: string) {
        return this.tabs.find((tab) => tab.id == id);
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

        if (url.startsWith("gh3b://")) {
            const newTab = this.getTab(url.split("://")[1]);
            if (newTab) {
                this.setActiveTab(newTab.id);
                return;
            }
        }

        if (!url.includes("://")) {
            if (!url.startsWith("http")) {
                if (!this.isValidUrl(url)) url = "https://www.google.com/search?q=" + encodeURI(url) + "&sourceid=chrome&ie=UTF-8";
                else url = "http://" + url;
            }
        }

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
        this.getActiveTab()?.webview.reload();
    }

    public toggleDevTools() {
        const webview = this.getActiveTab()?.webview!;
        webview.isDevToolsOpened() ? webview.closeDevTools() : webview.openDevTools();
    }
}

const browser = new BrowserTabs();

window.electron.closeActiveTab(() => browser.closeTab(browser.activeTabId!));
window.electron.changeActiveTab((dir: number) => browser.setActiveTabFromIndex(browser.activeTabIndex! + dir));

window.electron.openSearchBar(() => browser.showSearchbar(true));

window.electron.toggleFloatingSidebar(() => browser.toggleFloatingSidebar());
window.electron.toggleHistoryPanel(() => browser.toggleHistoryPanel());
window.electron.focusUrlBar(() => browser.focusSearchbar());
window.electron.setFullscreen((value: boolean) => document.getElementById("title-bar")?.classList.toggle("hide", value));

window.page.reload(() => browser.reload());
window.page.goBack(() => browser.goBack());
window.page.goForward(() => browser.goForward());

window.webview.toggleDevTools(() => browser.toggleDevTools());
window.webview.openPopup((details: Electron.HandlerDetails) => browser.createTab(details.url));

window.addEventListener("beforeunload", () => browser.saveBrowser());
window.addEventListener("load", () => browser.loadBrowser());
