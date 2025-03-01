interface Tab {
    id: string;
    title: string;
    url: string;
    icon: string;
    visible: boolean;
    webview: Electron.WebviewTag | undefined;
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
    public historyOpen: boolean = false;

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
    public historySearch: HTMLInputElement;

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
        this.historySearch = document.getElementById("history-search") as HTMLInputElement;

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
                    if (draggedIndex < targetIndex) this.tabList.insertBefore(draggedElement, target.parentElement.nextSibling);
                    else this.tabList.insertBefore(draggedElement, target.parentElement);

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

        this.historySearch.addEventListener("input", async () => {
            this.updateHistoryList();
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
        this.updateSearchSuggestions();
    }

    public showHistoryPanel(active: boolean) {
        this.historyPanel.classList.toggle("active", active);
        this.updateHistoryList();
    }

    public openHistory() {
        this.historyOpen = true;
        this.showHistoryPanel(true);

        if (this.getTab("history")) this.setActiveTab("history");
        else this.createTab("gh3b://history");
    }

    public focusSearchbar() {
        this.urlBar.select();
        this.sidebar.classList.remove("floating");
    }

    private escapeHTML(html: string): string {
        return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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

            const img = tab.icon;

            suggestion.innerHTML = `
                <div class="left">
                    <img src="${img}" class="tab-image"></img> 
                    <p>${this.escapeHTML(tab.title)}</p>
                </div>
                Open Tab →`;

            suggestion.onclick = () => {
                this.setActiveTab(tab.id);
                this.showSearchbar(false);
                this.suggestionsList.innerHTML = "";
            };

            this.suggestionsList.appendChild(suggestion);
            this.suggestionsURLs.push("gh3b://" + tab.id);
        });

        for (let url in this.suggestionsHistory) {
            if (!url.includes(query)) continue;

            if (totalSuggestions == 5) break;
            totalSuggestions += 1;

            const suggestion = document.createElement("li");
            suggestion.className = "suggestion";

            const img = this.suggestionsHistory[url][1];

            suggestion.innerHTML = `
                    <div class="left">
                        <img src="${img}" class="tab-image"></img> 
                        <p>${this.escapeHTML(this.suggestionsHistory[url][0])}</p>
                    </div>
                    <div class="center">
                        <p>${this.escapeHTML(url)}</p>
                    </div>
                    `;

            const btn = document.createElement("button");
            btn.className = "tab-close delete-search-btn";
            btn.innerText = "✕";
            btn.onclick = () => {
                delete this.suggestionsHistory[url];
                this.updateSearchSuggestions();
            };

            suggestion.appendChild(btn);

            suggestion.onclick = (e) => {
                if ((e.target as HTMLElement).classList.contains("tab-close")) {
                    this.showSearchbar(true);
                    return;
                }

                this.createTab(url);
                this.showSearchbar(false);
                this.suggestionsList.innerHTML = "";
            };

            this.suggestionsList.appendChild(suggestion);
            this.suggestionsURLs.push(url);
        }

        this.suggestionsList.querySelectorAll(".suggestion")[this.selectedSuggestionIndex]?.classList.add("active");
    }

    private formatDate(dateString: number) {
        return new Date(dateString).toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    }

    private formatTime(dateString: number) {
        return new Date(dateString).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    }

    public updateHistoryList() {
        this.historyList.innerHTML = "";

        const groupedHistory: { [key: string]: HistoryElement[] } = {};
        this.history.forEach((item) => {
            if (!item) return;

            if (!item.title.toLowerCase().includes(this.historySearch.value.toLowerCase()) && !item.url.toLowerCase().includes(this.historySearch.value.toLowerCase())) return;

            const date = this.formatDate(item.timestamp);
            if (!groupedHistory[date]) groupedHistory[date] = [];
            groupedHistory[date].push(item);
        });

        Object.keys(groupedHistory)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .forEach((date) => {
                const dayContainer = document.createElement("div");
                dayContainer.classList.add("history-day");

                groupedHistory[date]
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .forEach((item) => {
                        const historyItem = document.createElement("div");
                        historyItem.classList.add("history-item");
                        historyItem.innerHTML = `
                            <span class="history-text">${item.title}<p>${item.url}</p></span>
                            <span class="history-time">${this.formatTime(item.timestamp)}</span>
                        `;

                        historyItem.onclick = (e) => {
                            if ((e.target as HTMLElement).classList.contains("tab-close")) return;

                            this.createTab(item.url);
                        };

                        const btn = document.createElement("button");
                        btn.className = "tab-close delete-search-btn";
                        btn.innerText = "✕";
                        btn.onclick = () => {
                            delete this.history[this.history.indexOf(item)];
                            this.updateHistoryList();
                        };

                        historyItem.appendChild(btn);

                        dayContainer.prepend(historyItem);
                    });

                const dateContainer = document.createElement("span");
                if (date == this.formatDate(Date.now())) date = "Oggi - " + date;
                else if (date == this.formatDate(Date.now() - 86400000)) date = "Ieri - " + date;

                dateContainer.innerText = date;
                dateContainer.classList.add("history-date");

                dayContainer.prepend(dateContainer);

                this.historyList.appendChild(dayContainer);
            });
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

    public createTab(url = "https://www.google.com", id: string = "", title: string = "", open: boolean = true, visible: boolean = true) {
        id = id == "" ? crypto.randomUUID() : id;
        title = title == "" ? "New Tab" : title;
        let tabUrl = url == "" ? "https://www.google.com" : url;

        if (tabUrl.startsWith("gh3b://")) {
            const param = tabUrl.split("://")[1];
            switch (param) {
                case "history":
                    const historyTab: Tab = {
                        id: "history",
                        title: "History",
                        url: tabUrl,
                        visible,
                        icon: "https://www.google.com/favicon.ico",
                        webview: undefined,
                        loaded: false,
                    };

                    this.showHistoryPanel(true);
                    this.tabs.push(historyTab);

                    if (!open) return historyTab;

                    this.setActiveTab("history");
                    this.updateTabs();

                    return historyTab;

                default:
                    const tab = this.getTab(param);
                    if (tab) {
                        this.setActiveTab(tab.id);
                        return;
                    }

                    break;
            }
        }

        if (!tabUrl.includes("://")) {
            if (!tabUrl.startsWith("http")) {
                console.log(tabUrl);
                if (!this.isValidUrl(tabUrl)) tabUrl = "https://www.google.com/search?q=" + encodeURI(tabUrl) + "&sourceid=chrome&ie=UTF-8";
                else tabUrl = "https://" + tabUrl;
            }
        }

        console.log(tabUrl);

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
            title,
            url: tabUrl,
            visible,
            icon: "https://www.google.com/favicon.ico",
            webview,
            loaded: false,
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

        webview.addEventListener("dom-ready", (e) => {
            tab.loaded = true;
            if (open)
                if (tab.url != this.history[this.history.length - 1]?.url) {
                    this.history.unshift({ title: tab.title, url: tab.url, timestamp: Date.now() } as HistoryElement);
                    this.updateHistoryList();
                }

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
            const newTab = this.createTab(tab.url, "", "", false)!;
            newTab.id = tab.id;
        });

        if (this.tabs.length == 0) {
            this.showSearchbar(true);
            this.updateSearchSuggestions();
        }

        this.setActiveTab(localStorage.getItem("activeTab") || this.tabs[0].id);
        this.suggestionsHistory = JSON.parse(localStorage.getItem("suggestionsHistory") || "{}");
        this.history = JSON.parse(localStorage.getItem("history") || "[]");
        this.updateHistoryList();
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

        this.historyOpen = id == "history";
        this.showHistoryPanel(id == "history");

        this.activeTabIndex = this.tabs.indexOf(tab);

        this.tabs.forEach((tab) => {
            tab.webview?.classList.toggle("active", tab.id == id);
        });

        this.urlBar.value = tab.url;
        this.updateTabs();
    }

    public setActiveTabFromIndex(index: number) {
        if (index < 0) index = this.tabs.length - 1;
        if (index > this.tabs.length - 1) index = 0;

        const tab = this.tabs[index];
        if (!tab) return;

        this.historyOpen = tab.id == "history";
        this.showHistoryPanel(tab.id == "history");

        this.activeTabId = tab.id;
        this.activeTabIndex = index;

        this.tabs.forEach((t) => {
            t.webview?.classList.toggle("active", tab.id == t.id);
        });

        this.urlBar.value = tab.url;
        this.updateHistoryList();
        this.updateTabs();
    }

    public closeTab(id: string) {
        const index = this.tabs.findIndex((tab) => tab.id == id);
        if (index == -1) return;

        if (id == "history") {
            this.historyOpen = false;
            this.showHistoryPanel(false);
        }

        this.tabs[index].webview?.remove();
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

    public goBack() {
        const tab = this.getActiveTab();
        if (tab?.webview?.canGoBack) tab.webview.goBack();
    }

    public goForward() {
        const tab = this.getActiveTab();
        if (tab?.webview?.canGoForward) tab.webview.goForward();
    }

    public reload() {
        this.getActiveTab()?.webview?.reload();
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
window.electron.openHistoryPanel(() => browser.openHistory());
window.electron.focusUrlBar(() => browser.focusSearchbar());
window.electron.setFullscreen((value: boolean) => document.getElementById("title-bar")?.classList.toggle("hide", value));

window.page.reload(() => browser.reload());
window.page.goBack(() => browser.goBack());
window.page.goForward(() => browser.goForward());

window.webview.toggleDevTools(() => browser.toggleDevTools());
window.webview.openPopup((details: Electron.HandlerDetails) => browser.createTab(details.url));

window.addEventListener("beforeunload", () => browser.saveBrowser());
window.addEventListener("load", () => browser.loadBrowser());
