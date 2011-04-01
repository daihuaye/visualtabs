var tabData = {};
var closedTabs = new Array();
var ids = {};
var windowFocusTabId = {};

chrome.tabs.onSelectionChanged.addListener(
	function(tabId) {
		if(tabData[tabId]) {
			screenShot(tabId, tabData[tabId].windowId);
			windowFocusTabId[tabData[tabId].windowId] = tabId;
		}
	}
);

chrome.tabs.onUpdated.addListener(function(tabId,object,tab)
{
	var windowId = tabData[tabId].windowId;
	screenShot(tabId, windowId);
	tabData[tabId].title = tab.title;
	tabData[tabId].tabPosition = tab.index;
	tabData[tab.id].url = tab.url;
});

chrome.tabs.onRemoved.addListener(
								function(tabId) {
									if(tabData[tabId]) {
										var windowId = tabData[tabId].windowId;
										var title = tabData[tabId].title;
										var thumbNail = tabData[tabId].thumbNail;
										var url = tabData[tabId].url;
										closedTabs.push(new createClosedTabs(tabId, windowId, title, thumbNail, url));
									}
									removeTabDataImg(tabId);
							});

chrome.tabs.onCreated.addListener(function(tab){
	if(!tabData[tab.id]) {
		tabData[tab.id] = new createTabData(tab.id,tab.windowId);
		tabData[tab.id].title = tab.title;
		tabData[tab.id].tabPosition = tab.index;
		tabData[tab.id].url = tab.url;
	}
});

chrome.tabs.onAttached.addListener(
	function(tabId, object) {
		tabData[tabId].windowId = object.newWindowId;
		tabData[tabId].tabPosition = object.newPosition;
	});
	
function init() {
	chrome.windows.getAll({populate:true},function(windows)
											{
												windows.forEach(function(win)
												{
													var winId = win.id;
													window.focus();
													win.tabs.forEach(function(tab)
																				{
																					tabData[tab.id] = new createTabData(tab.id, winId);
																					tabData[tab.id].title = tab.title;
																					tabData[tab.id].tabPosition = tab.index;
																					tabData[tab.id].url = tab.url;
																				})
												});
											});
	initLocalStorage();
}

function createTabData(tabId, windowId) {
	this.id = tabId;
	this.windowId = windowId;
	this.title = "";
	this.tabPosition = "";
	this.thumbNail = "../images/blankPage.jpg";
	this.url = "";
}

function removeTabDataImg(tabId) {
	delete tabData[tabId].thumbNail;
}

function createClosedTabs(tabId, windowId, title, thumbNail, url) {
	this.id = tabId;
	this.windowId = windowId;
	this.title = title;
	this.thumbNail = thumbNail;
	this.url = url;
	
	return this;
}

function createIds(winId) {
	this.lastFocusedWinId = winId;
}
	
function screenShot(tabId, windowId) {
	chrome.tabs.getSelected(windowId, function(tab){
		chrome.tabs.captureVisibleTab(windowId, function(img) {
			tabData[tabId].thumbNail = (img != undefined) ? img : "../images/blankPage.jpg";
		});
	});
}

function initLocalStorage() {
	if(!window.localStorage.getItem("reflection"))
		window.localStorage.setItem("reflection", true);
	if(!window.localStorage.getItem("fadeInDistance"))
		window.localStorage.setItem("fadeInDistance", false);
	if(!window.localStorage.getItem("closeButton"))
		window.localStorage.setItem("closeButton", true);
	if(!window.localStorage.getItem("thumbSize"))
		window.localStorage.setItem("thumbSize", true);
	if(!window.localStorage.getItem("setting"))
		window.localStorage.setItem("setting", true);
	if(!window.localStorage.getItem("popupOption"))
		window.localStorage.setItem("popupOption", "window");
	if(!window.localStorage.getItem("winWidth"))
		window.localStorage.setItem("winWidth", "850");
	if(!window.localStorage.getItem("winHeight"))
		window.localStorage.setItem("winHeight", "440");
	if(!window.localStorage.getItem("view"))
		window.localStorage.setItem("view", "recent");
	if(!window.localStorage.getItem("style"))
		window.localStorage.setItem("style", "black");
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if(request.hotkey !== "keyDown")
		return;
	var option = (window.localStorage.popupOption) ? window.localStorage.popupOption : "tab";
	if(option === "tab")
		chrome.tabs.getAllInWindow(null, function(tabs) {
			for (var i = 0, tab; tab = tabs[i]; i++) {
				if (tab.url && /^chrome.*visualTabsNewTab.html/.test(tab.url)) {
					chrome.tabs.update(tab.id, { selected: true });
					return;
				}
			}
			chrome.tabs.create({ url: "visualTabsNewTab.html" });
		});
	else
		if(option === "window") {
			chrome.windows.getCurrent(function(win){
				ids = new createIds(win.id.toString());
				window.localStorage.setItem("lastFocusedWinId", ids.lastFocusedWinId);
			});

			chrome.windows.getAll({populate: false}, function(windows){
				var newTabUrl = chrome.extension.getURL("visualTabsNewTab.html");
				windows.forEach(function(window){
					chrome.tabs.getAllInWindow(window.id, function(tabs) {
						tabs.forEach(function(tab){
							if(tab.url && /^chrome.*visualTabsNewTab.html/.test(tab.url)) {
								chrome.windows.update(windows.id);
								return;
							}
						})
					})
				});
				window.open(newTabUrl,"Visual Tabs" , "width="+localStorage.winWidth+", height="+localStorage.winHeight+"");
			});
		}
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if(request.info === "closeTab") {
		var id = request.tabId;
		for(var i = 0; i < closedTabs.length; i++) {
			if(closedTabs[i].id == id) {
				closedTabs.splice(i, 1);
				break;
			}
		}
	} else if(request.info === "reset") {
		closedTabs = [];
		sendResponse({done: "true"});
	}
});