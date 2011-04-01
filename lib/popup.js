$(document).ready(function() {
	var BLUE = "#3569A0";
	var BLUE_TITLE = "#F6AE44";
	var RED = "#B02B2B";
	var RED_TITLE = "#56C656";
	var GREEN = "#6BBA70";
	var GREEN_TITLE = "#9A2F2C";
	var YELLOW = "#C79810";
	var YELLOW_TITLE = "#1E218B";
	var WHITE = "#EEEEEE";
	var WHITE_TITLE = "#9B4D4D";
	var BLACK = "#000000";
	var BLACK_TITLE = "#ffffff";
 
	chrome.tabs.onRemoved.addListener(function(tabId){
		initSetColor();
	});

	function initSetColor() {
		switch(localStorage.getItem("style")) {
			case "blue":
				setColor("blue",BLUE_TITLE, BLUE);
				break;
			case "red":
				setColor("red", RED_TITLE, RED);
				break;
			case "green":
				setColor("green", GREEN_TITLE, GREEN);
				break;
			case "yellow":
				setColor("yellow", YELLOW_TITLE, YELLOW);
				break;
			case "black":
				setColor("black", BLACK_TITLE, BLACK);
				break;
			case "white":
				setColor("white", WHITE_TITLE, WHITE);
				break;
			default:
				setColor("black", BLACK_TITLE, BLACK);
		}
	}
	
	window.localStorage.setItem("view", "recent");//always show recent tabs when open the extension.
	initSetColor();

	function init(titleColor){
		var cf = new CF(
			$('#container'), {
				lightBox : false,
				onclick : true,
				onscroll: true,
				scrollUp: true,
				scrollDown: true,
				title: true,
				titleColor: titleColor,
				speed: 1
			});
		}

	function setColor(style, titleColor, backgroundColor) {
		emptyContainer();
		var titleC = titleColor;
		var width = "100%";
		window.localStorage.setItem("style", style);
		$("#container").css({"background-color": backgroundColor, "width": width});
		$("body").css("background-color", backgroundColor);
		init(titleC);
	}
	
	function emptyContainer() {
		while($("#container").html()) {
			$("#container").empty();
		}
	}
	
	switch(localStorage.view) {
		case "recent":
			$("#recent").css("opacity", 1);
			break;
		case "closed":
			$("#closed").css("opacity", 1);
			break;
	}
	
	function clickEvent() {
		$("#blue").click(function(){setColor("blue",BLUE_TITLE, BLUE)});
		$("#red").click(function(){setColor("red", RED_TITLE, RED)});
		$("#green").click(function(){setColor("green", GREEN_TITLE, GREEN)});
		$("#yellow").click(function(){setColor("yellow", YELLOW_TITLE, YELLOW)});
		$("#black").click(function(){setColor("black", BLACK_TITLE, BLACK)});
		$("#white").click(function(){setColor("white", WHITE_TITLE, WHITE)});
	
		$("#options").click(function(){
			chrome.tabs.create({selected: true, url: "visualTabsOptions.html"});
			window.close();
		});

		$("#recent").click(function(){
			window.localStorage.setItem("view", "recent");
			$("#recent").css("opacity", 1);
			$("#closed").removeAttr("style");
			initSetColor();
		});

		$("#closed").click(function(){
			window.localStorage.setItem("view", "closed");
			$("#closed").css("opacity", 1);
			$("#recent").removeAttr("style");
			initSetColor();
		});
	
		$("#reset").click(function(){
			closedTabsPopup = [];
			chrome.extension.sendRequest({info: "reset"}, function(response){
				if(response.done === "true")
					initSetColor();
			});
		});
	}
	
	//try to improve the first time loading
	var myInterval = window.setInterval(function(){
		if($("#container").find(".tabTitle").length > 0) {
			clickEvent();
			clearInterval(myInterval);
		}
	}, 1000);
	
	//Option: if user select not to dispaly setting in the popup window, don't display it
	//Get user's option in the option page, save it in the localStorage
	//Add $("#setting").hide() if user choose not to display the setting bar
	if(localStorage.setting == "true") {
		$("#setting").hide();
	} else {
		$("#setting").show();
	}
	
	//THIS IS A QUICK HACK ONLY WORK IN WINDOW
	// if(localStorage.popupOption === "window")
	// 	chrome.windows.onFocusChanged.addListener(function(windowId){
	// 		chrome.windows.get(windowId, function(win){
	// 			var height = win.height - 63;
	// 			var width = win.width - 10;
	// 			if(height == localStorage.winHeight && width == localStorage.winWidth) {
	// 				emptyContainer();
	// 				initSetColor();
	// 			}
	// 		});
	// 	});
	// else if(localStorage.popupOption === "tab")
	// 	chrome.tabs.onSelectionChanged.addListener(function(tabId){
	// 		chrome.tabs.get(tabId, function(tab){
	// 			var extURL = chrome.extension.getURL("visualTabsNewTab.html");
	// 			if(tab.url == extURL) {
	// 				emptyContainer();
	// 				initSetColor();
	// 			}
	// 		});
	// 	});
});
