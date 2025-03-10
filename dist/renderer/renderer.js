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
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}
function escapeHTML(html) {
    return html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function isValidUrl(urlString) {
    var urlPattern = new RegExp("^(https?:\\/\\/)?" + // protocollo
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // nome dominio
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // o indirizzo ip (v4)
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // porta e percorso
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$", "i");
    return !!urlPattern.test(urlString);
}
const defaultGLinks = {
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
    constructor(customGLinks, gLinksPanel, defaultGLinksList, customGLinksList) {
        this.gLinks = Object.assign({}, defaultGLinks);
        this.customGLinks = {};
        if (GLinksManager.instance)
            throw new Error("Singleton Error: Class already instantiated!");
        GLinksManager.instance = this;
        this.gLinksPanel = gLinksPanel;
        this.defaultGLinksList = defaultGLinksList;
        this.customGLinksList = customGLinksList;
        this.addCustomGLinks(customGLinks);
    }
    addCustomGLinks(links) {
        this.gLinks = Object.assign(Object.assign({}, this.gLinks), links);
        this.customGLinks = Object.assign(Object.assign({}, this.customGLinks), links);
        this.updateGLinksList();
    }
    updateGLink(shortcut, title, url) {
        if (defaultGLinks[shortcut])
            return;
        this.gLinks[shortcut] = { url, title };
        this.customGLinks[shortcut] = { url, title };
    }
    getGLink(shortcut) {
        if (!this.gLinks[shortcut])
            return null;
        return this.gLinks[shortcut];
    }
    getCustomGLinks() {
        return this.customGLinks;
    }
    getGLinkType(shortcut) {
        if (defaultGLinks[shortcut])
            return "default";
        if (this.customGLinks[shortcut])
            return "custom";
        return null;
    }
    removeCustomGLink(shortcut) {
        if (!this.customGLinks[shortcut])
            return;
        delete this.customGLinks[shortcut];
        delete this.gLinks[shortcut];
    }
    showGLinksPanel(active) {
        this.gLinksPanel.classList.toggle("active", active);
        this.updateGLinksList();
    }
    createGLink(title, shortcut, url, edit = false) {
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
    updateGLinksList() {
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
                    if (e.target.classList.contains("tab-close"))
                        return;
                    const link = this.getGLink(key);
                    this.openGLinksPopup(true, link === null || link === void 0 ? void 0 : link.title, key, link === null || link === void 0 ? void 0 : link.url);
                    PopupManager.instance.showPopup(true);
                };
            }
            if (this.getGLinkType(key) == "custom")
                this.customGLinksList.appendChild(gLink);
            else
                this.defaultGLinksList.appendChild(gLink);
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
    openGLinksPopup(edit = false, title = "", shortcut = "", url = "") {
        PopupManager.instance.showPopup(true);
        PopupManager.instance.setupPopup("Aggiungi GLink", "Annulla", () => {
            PopupManager.instance.showPopup(false);
        }, "Aggiungi", () => {
            this.createGLink(PopupManager.instance.getInput("glink-name"), PopupManager.instance.getInput("glink-shortcut"), PopupManager.instance.getInput("glink-url"), edit);
        });
        PopupManager.instance.appendInput("glink-name", "Nome", "Nome...", title);
        PopupManager.instance.appendInput("glink-shortcut", "Shortcut", "Shortcut...", shortcut);
        PopupManager.instance.appendInput("glink-url", "URL (%s al posto della query)", "https://www.example.com?query=%s", title);
    }
    openGLinksPage() {
        this.showGLinksPanel(true);
        TabsManager.instance.createTab("gh3b://glinks", "glinks");
    }
}
class HistoryManager {
    constructor(history, historyPanel, historyList, historySearch) {
        this.history = [];
        if (HistoryManager.instance)
            throw new Error("Singleton Error: Class already instantiated!");
        HistoryManager.instance = this;
        this.history = history;
        this.historyPanel = historyPanel;
        this.historyList = historyList;
        this.historySearch = historySearch;
        this.setupEventListeners();
        this.updateHistoryList();
    }
    setupEventListeners() {
        this.historySearch.addEventListener("input", () => __awaiter(this, void 0, void 0, function* () {
            this.updateHistoryList();
        }));
    }
    showHistoryPanel(active) {
        this.historyPanel.classList.toggle("active", active);
        this.updateHistoryList();
    }
    openHistory() {
        this.showHistoryPanel(true);
        TabsManager.instance.createTab("gh3b://history", "history");
    }
    getHistory() {
        return this.history;
    }
    removeHistoryElement(element) {
        delete this.history[this.history.indexOf(element)];
    }
    updateHistoryList() {
        this.historyList.innerHTML = "";
        const groupedHistory = {};
        this.history.forEach((item) => {
            if (!item)
                return;
            if (!item.title.toLowerCase().includes(this.historySearch.value.toLowerCase()) && !item.url.toLowerCase().includes(this.historySearch.value.toLowerCase()))
                return;
            const date = formatDate(item.timestamp);
            if (!groupedHistory[date])
                groupedHistory[date] = [];
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
                    if (e.target.classList.contains("tab-close"))
                        return;
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
            if (date == formatDate(Date.now()))
                date = "Oggi - " + date;
            else if (date == formatDate(Date.now() - 86400000))
                date = "Ieri - " + date;
            dateContainer.innerText = date;
            dateContainer.classList.add("history-date");
            dayContainer.prepend(dateContainer);
            this.historyList.appendChild(dayContainer);
        });
    }
}
class SearchManager {
    constructor(searchPanel, searchSuggestionsList, searchBar) {
        this.selectedSuggestionIndex = 0;
        this.suggestionsURLs = [];
        if (SearchManager.instance)
            throw new Error("Singleton Error: Class already instantiated!");
        SearchManager.instance = this;
        this.searchPanel = searchPanel;
        this.searchSuggestionsList = searchSuggestionsList;
        this.searchBar = searchBar;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.searchBar.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "Escape":
                    if (this.searchBar.value != "" && this.suggestionsURLs.length > 0) {
                        this.selectedSuggestionIndex = -1;
                        this.searchSuggestionsList.innerHTML = "";
                        this.suggestionsURLs = [];
                    }
                    else
                        this.showSearchPanel(false);
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
        this.searchBar.addEventListener("input", () => __awaiter(this, void 0, void 0, function* () {
            this.updateSuggestionsList();
        }));
        this.searchPanel.addEventListener("focusout", (e) => {
            var _a;
            if (!((_a = e.relatedTarget) === null || _a === void 0 ? void 0 : _a.classList.contains("delete-search-btn")))
                this.showSearchPanel(false);
        });
    }
    moveSearchSuggestion(dir) {
        var _a;
        this.selectedSuggestionIndex += dir;
        if (this.selectedSuggestionIndex < 0)
            this.selectedSuggestionIndex = this.suggestionsURLs.length - 1;
        if (this.selectedSuggestionIndex >= this.suggestionsURLs.length)
            this.selectedSuggestionIndex = 0;
        this.searchSuggestionsList.querySelectorAll(".suggestion").forEach((suggestion) => suggestion.classList.remove("active"));
        (_a = this.searchSuggestionsList.querySelectorAll(".suggestion")[this.selectedSuggestionIndex]) === null || _a === void 0 ? void 0 : _a.classList.add("active");
    }
    handleSearch(query) {
        const gLinkRegex = /^-(\w+)\s*(.*)$/;
        const match = query.match(gLinkRegex);
        if (match) {
            const shortcut = match[1].toLowerCase();
            const searchQuery = match[2];
            TabsManager.instance.createTab(GLinksManager.instance.getGLink(shortcut) ? GLinksManager.instance.getGLink(shortcut)["url"].replace("%s", searchQuery) : query);
        }
        else {
            if (query != "")
                TabsManager.instance.createTab(this.selectedSuggestionIndex == -1 || this.suggestionsURLs.length == 0 ? this.searchBar.value : this.suggestionsURLs[this.selectedSuggestionIndex]);
            else if (this.selectedSuggestionIndex != -1 && this.suggestionsURLs.length != 0)
                TabsManager.instance.createTab(this.suggestionsURLs[this.selectedSuggestionIndex]);
        }
    }
    showSearchPanel(active) {
        this.searchBar.value = "";
        this.searchPanel.classList.toggle("active", active);
        this.searchBar.focus();
        this.selectedSuggestionIndex = 0;
        this.updateSuggestionsList();
    }
    focusSearchBar() {
        var _a;
        this.searchBar.focus();
        this.searchBar.value = ((_a = TabsManager.instance.getActiveTab()) === null || _a === void 0 ? void 0 : _a.url) || "";
    }
    updateSuggestionsList() {
        var _a;
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
        const history = HistoryManager.instance.getHistory();
        history.forEach((elem) => {
            if (!elem)
                return;
            const url = elem.url;
            if (!url.includes(query) || totalSuggestions == 5)
                return;
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
                if (e.target.classList.contains("tab-close")) {
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
        (_a = this.searchSuggestionsList.querySelectorAll(".suggestion")[this.selectedSuggestionIndex]) === null || _a === void 0 ? void 0 : _a.classList.add("active");
    }
}
class PopupManager {
    constructor(popupPanel, popupContent, popupError, popupTitle, popupCancel, popupConfirm) {
        if (PopupManager.instance)
            throw new Error("Singleton Error: Class already instantiated!");
        PopupManager.instance = this;
        this.popupPanel = popupPanel;
        this.popupContent = popupContent;
        this.popupError = popupError;
        this.popupTitle = popupTitle;
        this.popupCancel = popupCancel;
        this.popupConfirm = popupConfirm;
    }
    setPopupError(error) {
        this.popupError.innerHTML = error;
    }
    showPopup(active) {
        this.setPopupError("");
        this.popupPanel.classList.toggle("active", active);
    }
    getInput(id) {
        return this.popupContent.querySelector(`#${id}`).value || null;
    }
    setupPopup(title, cancelText, cancelFunction, confirmText, confirmFunction) {
        this.popupContent.innerHTML = "";
        this.popupTitle.innerHTML = title;
        this.popupCancel.innerHTML = cancelText;
        this.popupConfirm.innerHTML = confirmText;
        this.popupCancel.addEventListener("click", () => cancelFunction);
        this.popupConfirm.addEventListener("click", () => confirmFunction);
    }
    appendInput(id, text, placeholder, value) {
        const titleInput = document.createElement("div");
        titleInput.className = "popup-field";
        titleInput.innerHTML = `<label class="popup-text" for="${id}">${text}</><input type="text" id="${id}" placeholder="${placeholder}" class="popup-input" />`;
        this.popupContent.appendChild(titleInput);
        if (value)
            this.popupContent.querySelector(`#${id}`).setAttribute("value", value);
    }
}
class TabsManager {
    constructor(activeTabId, container, sidebar, tabList, bgTitle, urlBar, backButton, forwardButton, reloadButton, newTabButton) {
        this.tabs = [];
        this.activeTabId = null;
        this.activeTabIndex = null;
        if (TabsManager.instance)
            throw new Error("Singleton Error: Class already instantiated!");
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
    setupEventListeners() {
        this.newTabButton.addEventListener("click", () => this.createTab());
        this.backButton.addEventListener("click", () => this.goBack());
        this.forwardButton.addEventListener("click", () => this.goForward());
        this.reloadButton.addEventListener("click", () => this.reload());
        this.urlBar.addEventListener("focus", (e) => {
            SearchManager.instance.showSearchPanel(true);
            SearchManager.instance.focusSearchBar();
        });
        this.tabList.addEventListener("dragstart", (event) => {
            var _a;
            const target = event.target;
            (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("text/plain", target.getAttribute("id"));
            target.style.opacity = "0.5";
        });
        this.tabList.addEventListener("dragover", (event) => {
            event.preventDefault();
            const target = event.target;
        });
        this.tabList.addEventListener("drop", (event) => {
            var _a, _b;
            event.preventDefault();
            const target = event.target;
            const draggedId = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.getData("text/plain");
            if (((_b = target.parentElement) === null || _b === void 0 ? void 0 : _b.classList.contains("tab")) && draggedId) {
                const draggedElement = document.getElementById(draggedId);
                if (draggedElement) {
                    const draggedIndex = Array.from(this.tabList.children).indexOf(draggedElement);
                    const targetIndex = Array.from(this.tabList.children).indexOf(target.parentElement);
                    if (draggedIndex < targetIndex)
                        this.tabList.insertBefore(draggedElement, target.parentElement.nextSibling);
                    else
                        this.tabList.insertBefore(draggedElement, target.parentElement);
                    [this.tabs[draggedIndex], this.tabs[targetIndex]] = [this.tabs[targetIndex], this.tabs[draggedIndex]];
                }
            }
        });
        this.tabList.addEventListener("dragend", (event) => {
            const target = event.target;
            target.style.opacity = "1";
        });
    }
    toggleSidebar() {
        this.sidebar.classList.toggle("floating");
    }
    createTab(url = "https://www.google.com", id = crypto.randomUUID(), title = "New Tab", open = true, visible = true) {
        if (this.getTab(id)) {
            this.switchTab(id);
            return;
        }
        let tabUrl = url;
        if (!tabUrl.includes("://"))
            tabUrl = isValidUrl(tabUrl) ? "https://" + tabUrl : "https://www.google.com/search?q=" + encodeURI(tabUrl) + "&sourceid=chrome&ie=UTF-8";
        console.log("Create Tab: ", id, title, url);
        const tab = {
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
                    const historyTab = {
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
                    if (!open)
                        return historyTab;
                    this.switchTab("history");
                    this.updateTabsList();
                    return historyTab;
                case "glinks":
                    const gLinksTab = {
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
                    if (!open)
                        return gLinksTab;
                    this.switchTab("glinks");
                    this.updateTabsList();
                    return gLinksTab;
                case "auth":
                    const authTab = {
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
                    if (!open)
                        return authTab;
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
        const webviewAttributes = { src: tabUrl, autosize: "on", allowpopups: "", plugins: "", webpreferences: "nativeWindowOpen", disableblinkfeatures: "CSSBackdropFilter" };
        for (let key in webviewAttributes)
            webview.setAttribute(key, webviewAttributes[key]);
        tab.webview = webview;
        this.container.appendChild(webview);
        webview.addEventListener("page-title-updated", (e) => {
            tab.title = e.title;
            HistoryManager.instance.getHistory().forEach((item) => {
                if (!item)
                    return;
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
            var _a;
            tab.url = e.url;
            if (this.activeTabId == id)
                this.urlBar.value = e.url;
            this.backButton.style.color = webview.canGoBack() ? "#fff" : "#808080";
            this.forwardButton.style.color = webview.canGoForward() ? "#fff" : "#808080";
            (_a = document.querySelector('meta[name="color-scheme"]')) === null || _a === void 0 ? void 0 : _a.setAttribute("content", "dark");
        });
        webview.addEventListener("dom-ready", (e) => {
            var _a;
            tab.loaded = true;
            const history = HistoryManager.instance.getHistory();
            if (open) {
                if (tab.url != ((_a = history[0]) === null || _a === void 0 ? void 0 : _a.url))
                    history.unshift({ title: tab.title, url: tab.url, timestamp: Date.now() });
                else
                    history[0].timestamp = Date.now();
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
        webview.addEventListener("context-menu", (event) => {
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
        if (!open)
            return tab;
        this.switchTab(id);
        this.updateTabsList();
        return tab;
    }
    createTabElement(tab) {
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
        tabElement.querySelector(".tab-close").addEventListener("click", (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });
        return tabElement;
    }
    closeTab(id) {
        const tab = this.getTab(id);
        if (!tab)
            return;
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
        if (tab.webview)
            tab.webview.remove();
        if (tab.id === this.activeTabId) {
            const newIndex = Math.min(index, this.tabs.length - 1);
            if (newIndex >= 0)
                this.switchTab(newIndex);
            else
                this.switchTab(null);
            this.bgTitle.style.display = "block";
        }
        this.updateTabsList();
    }
    getTab(id) {
        return this.tabs.find((tab) => tab.id === id);
    }
    getTabs() {
        return this.tabs;
    }
    getActiveTab() {
        return this.getTab(this.activeTabId);
    }
    getActiveTabIndex() {
        return this.activeTabIndex;
    }
    switchTab(id) {
        if (id === null) {
            this.activeTabId = null;
            this.activeTabIndex = null;
            this.tabs.forEach((tab) => { var _a; return (_a = tab.webview) === null || _a === void 0 ? void 0 : _a.classList.remove("active"); });
            this.urlBar.value = "";
            this.updateTabsList();
            AuthManager.instance.showAuthPanel(false);
            GLinksManager.instance.showGLinksPanel(false);
            HistoryManager.instance.showHistoryPanel(false);
            return;
        }
        let tab;
        if (typeof id === "number") {
            if (id < 0)
                id = this.tabs.length - 1;
            else if (id >= this.tabs.length)
                id = 0;
            console.log(id);
            tab = this.tabs[id];
            if (!tab)
                return;
            this.activeTabIndex = id;
            id = tab.id;
        }
        else {
            tab = this.getTab(id);
            if (!tab)
                return;
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
        this.tabs.forEach((tab) => { var _a; return (_a = tab.webview) === null || _a === void 0 ? void 0 : _a.classList.toggle("active", tab.id === id); });
        this.urlBar.value = tab.url;
        this.updateTabsList();
    }
    goBack() {
        var _a;
        const tab = this.getActiveTab();
        if (!tab)
            return;
        (_a = tab.webview) === null || _a === void 0 ? void 0 : _a.goBack();
    }
    goForward() {
        var _a;
        const tab = this.getActiveTab();
        if (!tab)
            return;
        (_a = tab.webview) === null || _a === void 0 ? void 0 : _a.goForward();
    }
    reload() {
        var _a;
        const tab = this.getActiveTab();
        if (!tab)
            return;
        (_a = tab.webview) === null || _a === void 0 ? void 0 : _a.reload();
    }
    toggleDevTools() {
        var _a, _b, _c;
        const tab = this.getActiveTab();
        if (!tab)
            return;
        ((_a = tab.webview) === null || _a === void 0 ? void 0 : _a.isDevToolsOpened()) ? (_b = tab.webview) === null || _b === void 0 ? void 0 : _b.closeDevTools() : (_c = tab.webview) === null || _c === void 0 ? void 0 : _c.openDevTools();
    }
    updateTabsList() {
        this.tabList.innerHTML = "";
        this.tabs.forEach((tab) => {
            if (tab.visible)
                this.tabList.appendChild(this.createTabElement(tab));
        });
    }
}
class AuthManager {
    constructor(authPanel, emailLogin, emailInput, passwordInput, googleLogin, githubLogin, anonymousLogin) {
        if (AuthManager.instance)
            throw new Error("Singleton Error: Class already instantiated!");
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
    setupEventListeners() {
        this.emailLogin.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield window.auth.loginWithEmail(this.emailInput.value, this.passwordInput.value);
                console.log(result);
            }
            catch (e) {
                console.error(e.message);
            }
        }));
        this.googleLogin.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield window.auth.loginWithGoogle();
                console.log(result);
            }
            catch (e) {
                console.error(e.message);
            }
        }));
        this.githubLogin.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield window.auth.loginWithGithub();
                console.log(result);
            }
            catch (e) {
                console.error(e.message);
            }
        }));
        this.anonymousLogin.addEventListener("click", () => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield window.auth.loginAnonymously();
                if (result) {
                    localStorage.setItem("accessToken", result.session.accessToken);
                }
            }
            catch (e) {
                console.error(e.message);
            }
        }));
    }
    showAuthPanel(active) {
        this.authPanel.classList.toggle("active", active);
    }
}
class Browser {
    constructor() {
        new GLinksManager(JSON.parse(localStorage.getItem("userGLinks") || "{}"), document.getElementById("glinks-panel"), document.getElementById("default-glinks"), document.getElementById("custom-glinks"));
        new PopupManager(document.getElementById("popup-panel"), document.getElementById("popup-content"), document.getElementById("popup-error"), document.getElementById("popup-title"), document.getElementById("popup-cancel"), document.getElementById("popup-confirm"));
        new HistoryManager(JSON.parse(localStorage.getItem("history") || "[]"), document.getElementById("history-panel"), document.getElementById("history-list"), document.getElementById("history-search"));
        new AuthManager(document.getElementById("auth-panel"), document.getElementById("email-login"), document.getElementById("email-input"), document.getElementById("password-input"), document.getElementById("google-login"), document.getElementById("github-login"), document.getElementById("anonymous-login"));
        new TabsManager(localStorage.getItem("activeTab") || TabsManager.instance.getTabs()[0].id, document.getElementById("browser-container"), document.getElementById("sidebar"), document.getElementById("tab-list"), document.getElementById("bg-title"), document.getElementById("url-bar"), document.getElementById("back"), document.getElementById("forward"), document.getElementById("reload"), document.getElementById("new-tab"));
        new SearchManager(document.getElementById("search-float"), document.getElementById("search-suggestions"), document.getElementById("search-input"));
        this.loadBrowser();
        this.setupTitlebar();
    }
    setupTitlebar() {
        var _a, _b, _c;
        (_a = document.getElementById("close")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => window.electron.closeWindow());
        (_b = document.getElementById("maximize")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => window.electron.toggleMaximizeWindow());
        (_c = document.getElementById("minimize")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => window.electron.minimizeWindow());
    }
    saveBrowser() {
        const tabs = TabsManager.instance.getTabs();
        const tabData = Array.from(tabs).map((tab) => {
            return {
                id: tab.id,
                url: tab.url,
                title: tab.title,
            };
        });
        localStorage.setItem("tabs", JSON.stringify(tabData));
        localStorage.setItem("activeTab", TabsManager.instance.getActiveTab().id);
        localStorage.setItem("history", JSON.stringify(HistoryManager.instance.getHistory()));
        localStorage.setItem("userGLinks", JSON.stringify(GLinksManager.instance.getCustomGLinks()));
    }
    loadBrowser() {
        const savedTabs = JSON.parse(localStorage.getItem("tabs") || "[]");
        savedTabs.forEach((tab) => {
            TabsManager.instance.createTab(tab.url, tab.id, tab.title, false);
        });
        if (TabsManager.instance.getTabs().length == 0) {
            SearchManager.instance.showSearchPanel(true);
            SearchManager.instance.updateSuggestionsList();
        }
        TabsManager.instance.switchTab(localStorage.getItem("activeTab") || savedTabs[0].id);
    }
}
let browser;
window.electron.closeActiveTab(() => TabsManager.instance.closeTab(TabsManager.instance.getActiveTab().id));
window.electron.changeActiveTab((dir) => TabsManager.instance.switchTab(TabsManager.instance.getActiveTabIndex() + dir));
window.electron.openNewTab((url) => TabsManager.instance.createTab(url));
window.electron.openSearchBar(() => SearchManager.instance.showSearchPanel(true));
window.electron.toggleFloatingSidebar(() => TabsManager.instance.toggleSidebar());
window.electron.openHistoryPanel(() => HistoryManager.instance.openHistory());
window.electron.openGLinksPanel(() => GLinksManager.instance.openGLinksPage());
window.electron.focusUrlBar(() => SearchManager.instance.focusSearchBar());
window.electron.setFullscreen((value) => { var _a; return (_a = document.getElementById("title-bar")) === null || _a === void 0 ? void 0 : _a.classList.toggle("hide", value); });
window.page.reload(() => TabsManager.instance.reload());
window.page.goBack(() => TabsManager.instance.goBack());
window.page.goForward(() => TabsManager.instance.goForward());
window.webview.toggleDevTools(() => TabsManager.instance.toggleDevTools());
window.webview.openPopup((details) => TabsManager.instance.createTab(details.url));
window.addEventListener("beforeunload", () => browser.saveBrowser());
window.addEventListener("load", () => (browser = new Browser()));
