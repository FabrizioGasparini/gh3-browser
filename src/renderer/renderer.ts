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

function formatDate(dateString: number) {
    return new Date(dateString).toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(dateString: number) {
    return new Date(dateString).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function escapeHTML(html: string): string {
    return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function isValidUrl(urlString: string) {
    var urlPattern = new RegExp(
        "^(https?:\\/\\/)?" + // protocollo
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // nome dominio
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // o indirizzo ip (v4)
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // porta e percorso
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
            "(\\#[-a-z\\d_]*)?$",
        "i"
    );
    return !!urlPattern.test(urlString);
}

const defaultGLinks: { [key: string]: { url: string; title: string } } = {
    w: { url: "https://en.wikipedia.org/wiki/%s", title: "Wikipedia" },
    yt: { url: "https://www.youtube.com/results?search_query=%s", title: "YouTube" },
    gi: { url: "http://www.google.com/search?q=%s&tbm=isch", title: "Google Images" },
    gh: { url: "https://github.com/search?q=%s", title: "GitHub" },
    gpt: { url: "https://chat.openai.com/?q=%s", title: "ChatGPT" },

    az: { url: "https://www.amazon.com/s?k=%s", title: "Amazon" },
    eb: { url: "https://www.ebay.com/sch/i.html?_nkw=%s", title: "eBay" },

    so: { url: "https://stackoverflow.com/search?q=%s", title: "StackOverflow" },

    tw: { url: "https://twitter.com/search?q=%s", title: "Twitter" },
    fb: { url: "https://www.facebook.com/search/top/?q=%s", title: "Facebook" },
    ig: { url: "https://www.instagram.com/%s", title: "Instagram" },
    twitch: { url: "https://www.twitch.tv/%s", title: "Twitch" },
    sp: { url: "https://open.spotify.com/search/%s", title: "Spotify" },

    gmail: { url: "https://mail.google.com/mail/u/0/", title: "Gmail" },
    maps: { url: "https://google.com/maps", title: "Google Maps" },
    cal: { url: "https://calendar.google.com/calendar/u/0/r", title: "Google Calendar" },
    drive: { url: "https://drive.google.com/drive/u/0/home", title: "Google Drive" },
    docs: { url: "https://docs.google.com/document/u/0/", title: "Google Docs" },
    sheets: { url: "https://docs.google.com/spreadsheets/u/0/", title: "Google Sheets" },
    slides: { url: "https://docs.google.com/presentation/u/0/", title: "Google Slides" },
    photos: { url: "https://photos.google.com/", title: "Google Photos" },
    meet: { url: "https://meet.google.com/", title: "Google Meet" },

    trans: { url: "https://translate.google.com/", title: "Google Translate" },
};

class GLinksManager {
    public static instance: GLinksManager;

    private gLinks: { [key: string]: { url: string; title: string } } = { ...defaultGLinks };
    private customGLinks: { [key: string]: { [url: string]: string } } = {};

    private gLinksPanel: HTMLElement;

    private defaultGLinksList: HTMLElement;
    private customGLinksList: HTMLElement;

    constructor(customGLinks: { [key: string]: { url: string; title: string } }, gLinksPanel: HTMLElement, defaultGLinksList: HTMLElement, customGLinksList: HTMLElement) {
        if (GLinksManager.instance) throw new Error("Singleton Error: Class already instantiated!");
        GLinksManager.instance = this;

        this.gLinksPanel = gLinksPanel;
        this.defaultGLinksList = defaultGLinksList;
        this.customGLinksList = customGLinksList;

        this.addCustomGLinks(customGLinks);
    }

    public addCustomGLinks(links: { [key: string]: { url: string; title: string } }) {
        this.gLinks = { ...this.gLinks, ...links };
        this.customGLinks = { ...this.customGLinks, ...links };
        this.updateGLinksList();
    }

    public updateGLink(shortcut: string, title: string, url: string) {
        if (defaultGLinks[shortcut]) return;

        this.gLinks[shortcut] = { url, title };
        this.customGLinks[shortcut] = { url, title };
    }

    public getGLink(shortcut: string) {
        if (!this.gLinks[shortcut]) return null;
        return this.gLinks[shortcut];
    }

    public getCustomGLinks() {
        return this.customGLinks;
    }

    public getGLinkType(shortcut: string) {
        if (defaultGLinks[shortcut]) return "default";
        if (this.customGLinks[shortcut]) return "custom";
        return null;
    }

    public removeCustomGLink(shortcut: string) {
        if (!this.customGLinks[shortcut]) return;
        delete this.customGLinks[shortcut];
        delete this.gLinks[shortcut];
    }

    public showGLinksPanel(active: boolean) {
        this.gLinksPanel.classList.toggle("active", active);
        this.updateGLinksList();
    }

    public createGLink(title: string, shortcut: string, url: string, edit: boolean = false) {
        if (shortcut == "" || title == "" || url == "") {
            PopupManager.instance.setPopupError("Tutti i campi sono obbligatori");
            return;
        }
        if (this.getGLinkType(shortcut) && !edit) {
            PopupManager.instance.setPopupError("Shortcut già esistente");
            return;
        }
        if (this.getGLinkType(shortcut) == "default") {
            PopupManager.instance.setPopupError("Shortcut già esistente");
            return;
        }
        if (!isValidUrl(url)) {
            PopupManager.instance.setPopupError("URL non valido");
            return;
        }

        PopupManager.instance.showPopup(false);

        this.updateGLink(shortcut, title, url);
        this.updateGLinksList();
    }

    public updateGLinksList() {
        this.defaultGLinksList.innerHTML = "<span class='glinks-title'>Default GLinks</span>";
        this.customGLinksList.innerHTML = "<span class='glinks-title'>Custom GLinks</span>";

        for (let key in this.gLinks) {
            const gLink = document.createElement("li");
            gLink.className = key in this.customGLinks ? "glink custom" : "glink";
            gLink.innerHTML = `
                    <div class="left">
                        <img class="glink-icon" src="http://www.google.com/s2/favicons?sz=32&domain=${this.gLinks[key]["url"]}" onerror="this.onerror=null;this.src='https://www.google.com/favicon.ico';"></img>
                        <span class="glink-title">${this.gLinks[key]["title"]}</span>
                        <span class="glink-shortcut">${key}</span>
                    </div>
                    <span class="glink-url">${this.gLinks[key]["url"]}</span>
                `;

            if (key in this.customGLinks) {
                const btn = document.createElement("button");
                btn.className = "tab-close delete-search-btn";
                btn.innerText = "✕";
                btn.onclick = () => {
                    this.removeCustomGLink(key);
                    this.updateGLinksList();
                };

                gLink.appendChild(btn);

                gLink.onclick = (e) => {
                    if ((e.target as HTMLElement).classList.contains("tab-close")) return;

                    const link = this.getGLink(key);
                    this.openGLinksPopup(true, link?.title, key, link?.url);
                    PopupManager.instance.showPopup(true);
                };
            }

            if (this.getGLinkType(key) == "custom") this.customGLinksList.appendChild(gLink);
            else this.defaultGLinksList.appendChild(gLink);
        }

        const addGLink = document.createElement("button");
        addGLink.id = "add-glink";
        addGLink.innerHTML = '<i class="fa fa-plus"></i>';
        addGLink.onclick = () => {
            PopupManager.instance.showPopup(true);
            this.openGLinksPopup();
        };

        this.customGLinksList.appendChild(addGLink);
    }

    private openGLinksPopup(edit: boolean = false, title: string = "", shortcut: string = "", url: string = "") {
        PopupManager.instance.showPopup(true);

        PopupManager.instance.setupPopup(
            "Aggiungi GLink",
            "Annulla",
            () => {
                PopupManager.instance.showPopup(false);
            },
            "Aggiungi",
            () => {
                this.createGLink(PopupManager.instance.getInput("glink-name")!, PopupManager.instance.getInput("glink-shortcut")!, PopupManager.instance.getInput("glink-url")!, edit);
            }
        );

        PopupManager.instance.appendInput("glink-name", "Nome", "Nome...", title);
        PopupManager.instance.appendInput("glink-shortcut", "Shortcut", "Shortcut...", shortcut);
        PopupManager.instance.appendInput("glink-url", "URL (%s al posto della query)", "https://www.example.com?query=%s", title);
    }

    public openGLinksPage() {
        this.showGLinksPanel(true);

        TabsManager.instance.createTab("gh3b://glinks", "glinks");
    }
}

class HistoryManager {
    public static instance: HistoryManager;

    private history: HistoryElement[] = [];

    private historyPanel: HTMLElement;
    private historyList: HTMLElement;
    private historySearch: HTMLInputElement;

    constructor(history: HistoryElement[], historyPanel: HTMLElement, historyList: HTMLElement, historySearch: HTMLInputElement) {
        if (HistoryManager.instance) throw new Error("Singleton Error: Class already instantiated!");
        HistoryManager.instance = this;

        this.history = history;

        this.historyPanel = historyPanel;
        this.historyList = historyList;
        this.historySearch = historySearch;

        this.setupEventListeners();
        this.updateHistoryList();
    }

    private setupEventListeners() {
        this.historySearch.addEventListener("input", async () => {
            this.updateHistoryList();
        });
    }

    public showHistoryPanel(active: boolean) {
        this.historyPanel.classList.toggle("active", active);
        this.updateHistoryList();
    }

    public openHistory() {
        this.showHistoryPanel(true);

        TabsManager.instance.createTab("gh3b://history", "history");
    }

    public getHistory(): HistoryElement[] {
        return this.history;
    }

    public removeHistoryElement(element: HistoryElement) {
        delete this.history[this.history.indexOf(element)];
    }

    public updateHistoryList() {
        this.historyList.innerHTML = "";

        const groupedHistory: { [key: string]: HistoryElement[] } = {};
        this.history.forEach((item) => {
            if (!item) return;

            if (!item.title.toLowerCase().includes(this.historySearch.value.toLowerCase()) && !item.url.toLowerCase().includes(this.historySearch.value.toLowerCase())) return;

            const date = formatDate(item.timestamp);
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
                        const historyItem = document.createElement("li");
                        historyItem.classList.add("history-item");
                        historyItem.innerHTML = `
                        <span class="history-text">${item.title}<p>${item.url}</p></span>
                        <span class="history-time">${formatTime(item.timestamp)}</span>
                    `;

                        historyItem.onclick = (e) => {
                            if ((e.target as HTMLElement).classList.contains("tab-close")) return;

                            TabsManager.instance.createTab(item.url);
                        };

                        const btn = document.createElement("button");
                        btn.className = "tab-close delete-search-btn";
                        btn.innerText = "✕";
                        btn.onclick = () => {
                            this.removeHistoryElement(item);
                            this.updateHistoryList();
                        };

                        historyItem.appendChild(btn);

                        dayContainer.prepend(historyItem);
                    });

                const dateContainer = document.createElement("span");
                if (date == formatDate(Date.now())) date = "Oggi - " + date;
                else if (date == formatDate(Date.now() - 86400000)) date = "Ieri - " + date;

                dateContainer.innerText = date;
                dateContainer.classList.add("history-date");

                dayContainer.prepend(dateContainer);

                this.historyList.appendChild(dayContainer);
            });
    }
}

class SearchManager {
    public static instance: SearchManager;

    private searchPanel: HTMLElement;
    private searchSuggestionsList: HTMLElement;

    private selectedSuggestionIndex: number = 0;
    private suggestionsURLs: string[] = [];

    private searchBar: HTMLInputElement;

    constructor(searchPanel: HTMLElement, searchSuggestionsList: HTMLElement, searchBar: HTMLInputElement) {
        if (SearchManager.instance) throw new Error("Singleton Error: Class already instantiated!");
        SearchManager.instance = this;

        this.searchPanel = searchPanel;
        this.searchSuggestionsList = searchSuggestionsList;
        this.searchBar = searchBar;

        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.searchBar.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "Escape":
                    if (this.searchBar.value != "" && this.suggestionsURLs.length > 0) {
                        this.selectedSuggestionIndex = -1;
                        this.searchSuggestionsList.innerHTML = "";
                        this.suggestionsURLs = [];
                    } else this.showSearchPanel(false);
                    break;

                case "Enter":
                    const query = this.searchBar.value.trim();
                    this.handleSearch(query);

                    this.showSearchPanel(false);
                    this.suggestionsURLs = [];
                    this.selectedSuggestionIndex = 0;
                    this.searchSuggestionsList.innerHTML = "";
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    this.moveSearchSuggestion(-1);
                    break;

                case "ArrowDown":
                    e.preventDefault();
                    this.moveSearchSuggestion(1);
                    break;
            }
        });

        this.searchBar.addEventListener("input", async () => {
            this.updateSuggestionsList();
        });

        this.searchPanel.addEventListener("focusout", (e: FocusEvent) => {
            if (!(e.relatedTarget as HTMLElement)?.classList.contains("delete-search-btn")) this.showSearchPanel(false);
        });
    }

    private moveSearchSuggestion(dir: number) {
        this.selectedSuggestionIndex += dir;
        if (this.selectedSuggestionIndex < 0) this.selectedSuggestionIndex = this.suggestionsURLs.length - 1;
        if (this.selectedSuggestionIndex >= this.suggestionsURLs.length) this.selectedSuggestionIndex = 0;

        this.searchSuggestionsList.querySelectorAll(".suggestion").forEach((suggestion) => suggestion.classList.remove("active"));
        this.searchSuggestionsList.querySelectorAll(".suggestion")[this.selectedSuggestionIndex]?.classList.add("active");
    }

    private handleSearch(query: string) {
        const gLinkRegex = /^-(\w+)\s*(.*)$/;
        const match = query.match(gLinkRegex);

        if (match) {
            const shortcut = match[1].toLowerCase();
            const searchQuery = match[2];

            TabsManager.instance.createTab(GLinksManager.instance.getGLink(shortcut) ? GLinksManager.instance.getGLink(shortcut)!["url"].replace("%s", searchQuery) : query);
        } else {
            if (query != "") TabsManager.instance.createTab(this.selectedSuggestionIndex == -1 || this.suggestionsURLs.length == 0 ? this.searchBar.value : this.suggestionsURLs[this.selectedSuggestionIndex]);
            else if (this.selectedSuggestionIndex != -1 && this.suggestionsURLs.length != 0) TabsManager.instance.createTab(this.suggestionsURLs[this.selectedSuggestionIndex]);
        }
    }

    public showSearchPanel(active: boolean) {
        this.searchBar.value = "";
        this.searchPanel.classList.toggle("active", active);

        this.searchBar.focus();
        this.selectedSuggestionIndex = 0;
        this.updateSuggestionsList();
    }

    public focusSearchBar() {
        this.searchBar.focus();
        this.searchBar.value = TabsManager.instance.getActiveTab()?.url || "";
    }

    public updateSuggestionsList() {
        this.searchSuggestionsList.innerHTML = "";
        this.suggestionsURLs = [];
        let query = this.searchBar.value.toLowerCase();
        let openTabs = TabsManager.instance
            .getTabs()
            .filter((tab) => tab.title.toLowerCase().includes(query))
            .slice(0, 5);

        let totalSuggestions = openTabs.length;

        openTabs.forEach((tab) => {
            const suggestion = document.createElement("li");
            suggestion.innerHTML = "";
            suggestion.className = "suggestion";

            const img = tab.icon;

            suggestion.innerHTML = `
                <div class="left">
                    <img src="${img}" class="tab-image"></img> 
                    <p>${escapeHTML(tab.title)}</p>
                </div>
                Open Tab →`;

            suggestion.onclick = () => {
                TabsManager.instance.switchTab(tab.id);
                this.showSearchPanel(false);
                this.searchSuggestionsList.innerHTML = "";
            };

            this.searchSuggestionsList.appendChild(suggestion);
            this.suggestionsURLs.push("gh3b://" + tab.id);
        });

        const history: HistoryElement[] = HistoryManager.instance.getHistory();
        history.forEach((elem) => {
            if (!elem) return;

            const url = elem.url;
            if (!url.includes(query) || totalSuggestions == 5) return;

            totalSuggestions += 1;

            const suggestion = document.createElement("li");
            suggestion.className = "suggestion";

            suggestion.innerHTML = `
                    <div class="left">
                        <img src="http://www.google.com/s2/favicons?sz=32&domain=${elem.url}" class="tab-image" onerror="this.onerror=null;this.src='https://www.google.com/favicon.ico';"></img> 
                        <p>${escapeHTML(elem.title)}</p>
                    </div>
                    <div class="center">
                        <p>${escapeHTML(url)}</p>
                    </div>
                    `;

            const btn = document.createElement("button");
            btn.className = "tab-close delete-search-btn";
            btn.innerText = "✕";
            btn.onclick = () => {
                HistoryManager.instance.removeHistoryElement(elem);
                this.updateSuggestionsList();
            };

            suggestion.appendChild(btn);

            suggestion.onclick = (e) => {
                if ((e.target as HTMLElement).classList.contains("tab-close")) {
                    this.showSearchPanel(true);
                    return;
                }

                TabsManager.instance.createTab(url);
                this.showSearchPanel(false);
                this.searchSuggestionsList.innerHTML = "";
            };

            this.searchSuggestionsList.appendChild(suggestion);
            this.suggestionsURLs.push(url);
        });

        this.searchSuggestionsList.querySelectorAll(".suggestion")[this.selectedSuggestionIndex]?.classList.add("active");
    }
}

class PopupManager {
    public static instance: PopupManager;

    private popupPanel: HTMLElement;
    private popupContent: HTMLElement;
    private popupError: HTMLElement;

    private popupTitle: HTMLElement;
    private popupCancel: HTMLElement;
    private popupConfirm: HTMLElement;

    constructor(popupPanel: HTMLElement, popupContent: HTMLElement, popupError: HTMLElement, popupTitle: HTMLElement, popupCancel: HTMLElement, popupConfirm: HTMLElement) {
        if (PopupManager.instance) throw new Error("Singleton Error: Class already instantiated!");
        PopupManager.instance = this;

        this.popupPanel = popupPanel;
        this.popupContent = popupContent;
        this.popupError = popupError;

        this.popupTitle = popupTitle;
        this.popupCancel = popupCancel;
        this.popupConfirm = popupConfirm;
    }

    public setPopupError(error: string) {
        this.popupError.innerHTML = error;
    }

    public showPopup(active: boolean) {
        this.setPopupError("");
        this.popupPanel.classList.toggle("active", active);
    }

    public getInput(id: string) {
        return (this.popupContent.querySelector(`#${id}`) as HTMLInputElement).value || null;
    }

    public setupPopup(title: string, cancelText: string, cancelFunction: Function, confirmText: string, confirmFunction: Function) {
        this.popupContent.innerHTML = "";

        this.popupTitle.innerHTML = title;
        this.popupCancel.innerHTML = cancelText;
        this.popupConfirm.innerHTML = confirmText;

        this.popupCancel.addEventListener("click", () => cancelFunction);
        this.popupConfirm.addEventListener("click", () => confirmFunction);
    }

    public appendInput(id: string, text: string, placeholder: string, value: string | null) {
        const titleInput = document.createElement("div");
        titleInput.className = "popup-field";
        titleInput.innerHTML = `<label class="popup-text" for="${id}">${text}</><input type="text" id="${id}" placeholder="${placeholder}" class="popup-input" />`;
        this.popupContent.appendChild(titleInput);
        if (value) this.popupContent.querySelector(`#${id}`)!.setAttribute("value", value);
    }
}

class TabsManager {
    public static instance: TabsManager;

    private tabs: Tab[] = [];
    private activeTabId: string | null = null;
    private activeTabIndex: number | null = null;

    private container: HTMLElement;
    private sidebar: HTMLElement;
    private tabList: HTMLElement;
    private bgTitle: HTMLElement;

    private urlBar: HTMLInputElement;

    private backButton: HTMLElement;
    private forwardButton: HTMLElement;
    private reloadButton: HTMLElement;
    private newTabButton: HTMLElement;

    constructor(activeTabId: string, container: HTMLElement, sidebar: HTMLElement, tabList: HTMLElement, bgTitle: HTMLElement, urlBar: HTMLInputElement, backButton: HTMLElement, forwardButton: HTMLElement, reloadButton: HTMLElement, newTabButton: HTMLElement) {
        if (TabsManager.instance) throw new Error("Singleton Error: Class already instantiated!");
        TabsManager.instance = this;

        this.activeTabId = activeTabId;

        this.container = container;
        this.sidebar = sidebar;
        this.tabList = tabList;
        this.bgTitle = bgTitle;
        this.urlBar = urlBar;

        this.backButton = backButton;
        this.forwardButton = forwardButton;
        this.reloadButton = reloadButton;
        this.newTabButton = newTabButton;

        this.setupEventListeners();
        this.switchTab(activeTabId);
    }

    private setupEventListeners() {
        this.newTabButton.addEventListener("click", () => this.createTab());

        this.backButton.addEventListener("click", () => this.goBack());
        this.forwardButton.addEventListener("click", () => this.goForward());
        this.reloadButton.addEventListener("click", () => this.reload());

        this.urlBar.addEventListener("focus", (e) => {
            SearchManager.instance.showSearchPanel(true);
            SearchManager.instance.focusSearchBar();
        });

        this.tabList.addEventListener("dragstart", (event) => {
            const target = event.target as HTMLElement;

            event.dataTransfer?.setData("text/plain", target.getAttribute("id")!);
            target.style.opacity = "0.5";
        });

        this.tabList.addEventListener("dragover", (event) => {
            event.preventDefault();
            const target = event.target as HTMLElement;
        });

        this.tabList.addEventListener("drop", (event) => {
            event.preventDefault();
            const target = event.target as HTMLElement;
            const draggedId = event.dataTransfer?.getData("text/plain");

            if (target.parentElement?.classList.contains("tab") && draggedId) {
                const draggedElement = document.getElementById(draggedId);

                if (draggedElement) {
                    const draggedIndex = Array.from(this.tabList.children).indexOf(draggedElement);
                    const targetIndex = Array.from(this.tabList.children).indexOf(target.parentElement);

                    if (draggedIndex < targetIndex) this.tabList.insertBefore(draggedElement, target.parentElement.nextSibling);
                    else this.tabList.insertBefore(draggedElement, target.parentElement);

                    [this.tabs[draggedIndex], this.tabs[targetIndex]] = [this.tabs[targetIndex], this.tabs[draggedIndex]];
                }
            }
        });

        this.tabList.addEventListener("dragend", (event) => {
            const target = event.target as HTMLElement;
            target.style.opacity = "1";
        });
    }

    public toggleSidebar() {
        this.sidebar.classList.toggle("floating");
    }

    public createTab(url = "https://www.google.com", id: string = crypto.randomUUID(), title: string = "New Tab", open: boolean = true, visible: boolean = true) {
        if (this.getTab(id)) {
            this.switchTab(id);
            return;
        }

        let tabUrl = url;

        if (!tabUrl.includes("://")) tabUrl = isValidUrl(tabUrl) ? "https://" + tabUrl : "https://www.google.com/search?q=" + encodeURI(tabUrl) + "&sourceid=chrome&ie=UTF-8";

        console.log("Create Tab: ", id, title, url);
        const tab: Tab = {
            id,
            title,
            url: tabUrl,
            visible,
            icon: "https://www.google.com/favicon.ico",
            webview: undefined,
            loaded: false,
        };

        if (tabUrl.startsWith("gh3b://")) {
            const param = tabUrl.split("://")[1];

            if (this.getTab(param)) {
                this.switchTab(param);
                return;
            }

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

                    HistoryManager.instance.showHistoryPanel(true);
                    this.tabs.push(historyTab);

                    if (!open) return historyTab;

                    this.switchTab("history");
                    this.updateTabsList();

                    return historyTab;

                case "glinks":
                    const gLinksTab: Tab = {
                        id: "glinks",
                        title: "Gh3 Links",
                        url: tabUrl,
                        visible,
                        icon: "https://www.google.com/favicon.ico",
                        webview: undefined,
                        loaded: false,
                    };

                    GLinksManager.instance.showGLinksPanel(true);
                    this.tabs.push(gLinksTab);

                    if (!open) return gLinksTab;

                    this.switchTab("glinks");
                    this.updateTabsList();

                    return gLinksTab;

                case "auth":
                    const authTab: Tab = {
                        id: "auth",
                        title: "Gh3 Auth",
                        url: tabUrl,
                        visible,
                        icon: "https://www.google.com/favicon.ico",
                        webview: undefined,
                        loaded: false,
                    };

                    AuthManager.instance.showAuthPanel(true);
                    this.tabs.push(authTab);

                    if (!open) return authTab;

                    this.switchTab("auth");
                    this.updateTabsList();

                    return authTab;

                default:
                    const tab = this.getTab(param);
                    if (tab) {
                        this.switchTab(tab.id);
                        return;
                    }

                    break;
            }
        }

        const webview = document.createElement("webview");
        const webviewAttributes: { [key: string]: string } = { src: tabUrl, autosize: "on", allowpopups: "", plugins: "", webpreferences: "nativeWindowOpen", disableblinkfeatures: "CSSBackdropFilter" };
        for (let key in webviewAttributes) webview.setAttribute(key, webviewAttributes[key]);

        tab.webview = webview;
        this.container.appendChild(webview);

        webview.addEventListener("page-title-updated", (e) => {
            tab.title = e.title;
            HistoryManager.instance.getHistory().forEach((item) => {
                if (!item) return;

                if (item.url == tab.url) {
                    item.title = tab.title;
                    return;
                }
            });

            console.log("page-title-updated");
            this.updateTabsList();
        });

        webview.addEventListener("page-favicon-updated", (e) => {
            tab.icon = e.favicons[0];

            this.updateTabsList();
        });

        webview.addEventListener("did-navigate", (e) => {
            tab.url = e.url;

            if (this.activeTabId == id) this.urlBar.value = e.url;

            this.backButton.style.color = webview.canGoBack() ? "#fff" : "#808080";
            this.forwardButton.style.color = webview.canGoForward() ? "#fff" : "#808080";

            document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", "dark");
        });

        webview.addEventListener("dom-ready", (e) => {
            tab.loaded = true;
            const history = HistoryManager.instance.getHistory();
            if (open) {
                if (tab.url != history[0]?.url) history.unshift({ title: tab.title, url: tab.url, timestamp: Date.now() } as HistoryElement);
                else history[0].timestamp = Date.now();

                HistoryManager.instance.updateHistoryList();
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

        this.switchTab(id);
        this.updateTabsList();

        return tab;
    }

    public createTabElement(tab: Tab): HTMLElement {
        const tabElement = document.createElement("div");
        tabElement.className = `tab ${this.activeTabId == tab.id ? "active" : ""}`;
        tabElement.innerHTML = `
            <img class="tab-image" src="${tab.icon}" />
            <span class="tab-title">${tab.title}</span>
            <span class="tab-dragger" title="${tab.id}"></span>
            <button class="tab-close">✕</button>
        `;

        this.bgTitle.style.display = "none";

        tabElement.setAttribute("draggable", "true");
        tabElement.setAttribute("id", tab.id);

        tabElement.addEventListener("click", () => this.switchTab(tab.id));
        tabElement.querySelector(".tab-close")!.addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });

        return tabElement;
    }

    public closeTab(id: string) {
        const tab = this.getTab(id);
        if (!tab) return;

        switch (tab.id) {
            case "history":
                HistoryManager.instance.showHistoryPanel(false);
                break;

            case "glinks":
                GLinksManager.instance.showGLinksPanel(false);
                break;

            case "auth":
                AuthManager.instance.showAuthPanel(false);
                break;

            default:
                break;
        }

        const index = this.tabs.indexOf(tab);
        this.tabs.splice(index, 1);

        if (tab.webview) tab.webview.remove();
        if (tab.id === this.activeTabId) {
            const newIndex = Math.min(index, this.tabs.length - 1);
            if (newIndex >= 0) this.switchTab(newIndex);
            else this.switchTab(null);

            this.bgTitle.style.display = "block";
        }

        this.updateTabsList();
    }

    public getTab(id: string): Tab | undefined {
        return this.tabs.find((tab) => tab.id === id);
    }

    public getTabs() {
        return this.tabs;
    }

    public getActiveTab(): Tab | undefined {
        return this.getTab(this.activeTabId!);
    }

    public getActiveTabIndex(): number {
        return this.activeTabIndex!;
    }

    public switchTab(id: number): void;
    public switchTab(id: string): void;
    public switchTab(id: null): void;
    public switchTab(id: string | number | null): void {
        if (id === null) {
            this.activeTabId = null;
            this.activeTabIndex = null;
            this.tabs.forEach((tab) => tab.webview?.classList.remove("active"));
            this.urlBar.value = "";
            this.updateTabsList();

            AuthManager.instance.showAuthPanel(false);
            GLinksManager.instance.showGLinksPanel(false);
            HistoryManager.instance.showHistoryPanel(false);

            return;
        }

        let tab: Tab;
        if (typeof id === "number") {
            if (id < 0) id = this.tabs.length - 1;
            else if (id >= this.tabs.length) id = 0;
            console.log(id);

            tab = this.tabs[id];
            if (!tab) return;

            this.activeTabIndex = id;
            id = tab.id;
        } else {
            tab = this.getTab(id)!;
            if (!tab) return;

            this.activeTabIndex = this.tabs.indexOf(tab);
        }

        this.activeTabId = id;

        AuthManager.instance.showAuthPanel(false);
        GLinksManager.instance.showGLinksPanel(false);
        HistoryManager.instance.showHistoryPanel(false);
        switch (tab.id) {
            case "history":
                HistoryManager.instance.showHistoryPanel(true);
                break;

            case "glinks":
                GLinksManager.instance.showGLinksPanel(true);
                break;

            case "auth":
                AuthManager.instance.showAuthPanel(true);
                break;
        }

        this.tabs.forEach((tab) => tab.webview?.classList.toggle("active", tab.id === id));
        this.urlBar.value = tab.url;
        this.updateTabsList();
    }

    public goBack() {
        const tab = this.getActiveTab();
        if (!tab) return;

        tab.webview?.goBack();
    }

    public goForward() {
        const tab = this.getActiveTab();
        if (!tab) return;

        tab.webview?.goForward();
    }

    public reload() {
        const tab = this.getActiveTab();
        if (!tab) return;

        tab.webview?.reload();
    }

    public toggleDevTools() {
        const tab = this.getActiveTab();
        if (!tab) return;

        tab.webview?.isDevToolsOpened() ? tab.webview?.closeDevTools() : tab.webview?.openDevTools();
    }

    public updateTabsList() {
        this.tabList.innerHTML = "";
        this.tabs.forEach((tab) => {
            if (tab.visible) this.tabList.appendChild(this.createTabElement(tab));
        });
    }
}

class AuthManager {
    public static instance: AuthManager;

    private authPanel: HTMLElement;

    private emailLogin: HTMLElement;
    private googleLogin: HTMLElement;
    private githubLogin: HTMLElement;
    private anonymousLogin: HTMLElement;

    private emailInput: HTMLInputElement;
    private passwordInput: HTMLInputElement;

    constructor(authPanel: HTMLElement, emailLogin: HTMLElement, emailInput: HTMLInputElement, passwordInput: HTMLInputElement, googleLogin: HTMLElement, githubLogin: HTMLElement, anonymousLogin: HTMLElement) {
        if (AuthManager.instance) throw new Error("Singleton Error: Class already instantiated!");
        AuthManager.instance = this;

        this.authPanel = authPanel;

        this.emailLogin = emailLogin;
        this.googleLogin = googleLogin;
        this.githubLogin = githubLogin;
        this.anonymousLogin = anonymousLogin;

        this.emailInput = emailInput;
        this.passwordInput = passwordInput;

        this.setupEventListeners();
    }

    private setupEventListeners() {
        this.emailLogin.addEventListener("click", async () => {
            try {
                const result = await window.auth.loginWithEmail(this.emailInput.value, this.passwordInput.value);
                console.log(result);
            } catch (e) {
                console.error((e as Error).message);
            }
        });

        this.googleLogin.addEventListener("click", async () => {
            try {
                const result = await window.auth.loginWithGoogle();
                console.log(result);
            } catch (e) {
                console.error((e as Error).message);
            }
        });

        this.githubLogin.addEventListener("click", async () => {
            try {
                const result = await window.auth.loginWithGithub();
                console.log(result);
            } catch (e) {
                console.error((e as Error).message);
            }
        });

        this.anonymousLogin.addEventListener("click", async () => {
            try {
                const result = await window.auth.loginAnonymously();

                if (result) {
                    localStorage.setItem("accessToken", result.session!.accessToken);
                }
            } catch (e) {
                console.error((e as Error).message);
            }
        });
    }

    public showAuthPanel(active: boolean) {
        this.authPanel.classList.toggle("active", active);
    }
}

class Browser {
    constructor() {
        new GLinksManager(JSON.parse(localStorage.getItem("userGLinks") || "{}"), document.getElementById("glinks-panel")!, document.getElementById("default-glinks")!, document.getElementById("custom-glinks")!);
        new PopupManager(document.getElementById("popup-panel")!, document.getElementById("popup-content")!, document.getElementById("popup-error")!, document.getElementById("popup-title")!, document.getElementById("popup-cancel")!, document.getElementById("popup-confirm")!);
        new HistoryManager(JSON.parse(localStorage.getItem("history") || "[]"), document.getElementById("history-panel")!, document.getElementById("history-list")!, document.getElementById("history-search") as HTMLInputElement);
        new AuthManager(document.getElementById("auth-panel")!, document.getElementById("email-login")!, document.getElementById("email-input") as HTMLInputElement, document.getElementById("password-input") as HTMLInputElement, document.getElementById("google-login")!, document.getElementById("github-login")!, document.getElementById("anonymous-login")!);
        new TabsManager(localStorage.getItem("activeTab") || TabsManager.instance.getTabs()[0].id, document.getElementById("browser-container")!, document.getElementById("sidebar")!, document.getElementById("tab-list")!, document.getElementById("bg-title")!, document.getElementById("url-bar") as HTMLInputElement, document.getElementById("back")!, document.getElementById("forward")!, document.getElementById("reload")!, document.getElementById("new-tab")!);
        new SearchManager(document.getElementById("search-float")!, document.getElementById("search-suggestions")!, document.getElementById("search-input") as HTMLInputElement);

        this.loadBrowser();
        this.setupTitlebar();
    }

    private setupTitlebar() {
        document.getElementById("close")?.addEventListener("click", () => window.electron.closeWindow());
        document.getElementById("maximize")?.addEventListener("click", () => window.electron.toggleMaximizeWindow());
        document.getElementById("minimize")?.addEventListener("click", () => window.electron.minimizeWindow());
    }

    public saveBrowser() {
        const tabs = TabsManager.instance.getTabs();
        const tabData = Array.from(tabs).map((tab) => {
            return {
                id: tab.id,
                url: tab.url,
                title: tab.title,
            };
        });

        localStorage.setItem("tabs", JSON.stringify(tabData));
        localStorage.setItem("activeTab", TabsManager.instance.getActiveTab()!.id);
        localStorage.setItem("history", JSON.stringify(HistoryManager.instance.getHistory()));
        localStorage.setItem("userGLinks", JSON.stringify(GLinksManager.instance.getCustomGLinks()));
    }

    public loadBrowser() {
        const savedTabs = JSON.parse(localStorage.getItem("tabs") || "[]");
        savedTabs.forEach((tab: { id: string; url: string; title: string }) => {
            TabsManager.instance.createTab(tab.url, tab.id, tab.title, false)!;
        });

        if (TabsManager.instance.getTabs().length == 0) {
            SearchManager.instance.showSearchPanel(true);
            SearchManager.instance.updateSuggestionsList();
        }

        TabsManager.instance.switchTab(localStorage.getItem("activeTab") || savedTabs[0].id);
    }
}

let browser: Browser;

window.electron.closeActiveTab(() => TabsManager.instance.closeTab(TabsManager.instance.getActiveTab()!.id));
window.electron.changeActiveTab((dir: number) => TabsManager.instance.switchTab(TabsManager.instance.getActiveTabIndex() + dir));
window.electron.openNewTab((url: string) => TabsManager.instance.createTab(url));

window.electron.openSearchBar(() => SearchManager.instance.showSearchPanel(true));

window.electron.toggleFloatingSidebar(() => TabsManager.instance.toggleSidebar());
window.electron.openHistoryPanel(() => HistoryManager.instance.openHistory());
window.electron.openGLinksPanel(() => GLinksManager.instance.openGLinksPage());
window.electron.focusUrlBar(() => SearchManager.instance.focusSearchBar());
window.electron.setFullscreen((value: boolean) => document.getElementById("title-bar")?.classList.toggle("hide", value));

window.page.reload(() => TabsManager.instance.reload());
window.page.goBack(() => TabsManager.instance.goBack());
window.page.goForward(() => TabsManager.instance.goForward());

window.webview.toggleDevTools(() => TabsManager.instance.toggleDevTools());
window.webview.openPopup((details: Electron.HandlerDetails) => TabsManager.instance.createTab(details.url));

window.addEventListener("beforeunload", () => browser.saveBrowser());
window.addEventListener("load", () => (browser = new Browser()));
