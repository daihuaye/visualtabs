var tabDataPopup;
var closedTabsPopup;
const KEY = {
	LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,
	ENTER: 13, SPACEBAR: 32
};
var lastFocusedWinId = (window.localStorage.lastFocusedWinId && window.localStorage.popupOption === "window") ? parseInt(window.localStorage.lastFocusedWinId): null;
var obj = chrome.extension.getBackgroundPage();
tabDataPopup = obj.tabData;
closedTabsPopup = obj.closedTabs;

var VToptions = {
	reflection: window.localStorage.getItem("reflection"),
	fadeInDistance: window.localStorage.getItem("fadeInDistance"),
	closeBt: window.localStorage.getItem("closeButton"),
	thumbSize: window.localStorage.getItem("thumbSize")
};

CF = function(container, options){
	var myCF        = this;
	var grid        = 5;
	var items       = [];
	var maxAngle    = 30;
	var loadedImgs  = 0;
	var selPosition = 0;
	var imgHeight   = {};
	var position    = 0; //only in newTabmomoflow

	function scaleTo(tabId, obj, maxSize) {
		var w    = obj.width;
		var h    = obj.height;
		var hFac = 0;
		var wFac = 0;
		var rate = w / h;
		if(VToptions.thumbSize == "true") {
			if(rate > 1)
				h = w / 1.12;
			if((1/rate) > 1)
				w = h / 1.12;
		}
		var fac = (w > h) ? maxSize / w : maxSize / h;
		hFac = h * fac;
		wFac = w * fac;
		imgHeight[tabId] = hFac;
		return {width: wFac, height: hFac}
	}

	myCF.center   = container.width()/2;
	
	//only in newTabmomoflow
	$(window).bind('resize', function(){
		myCF.center = container.width()/2;
		myCF.setPosition(position);
	});
	//---------------------
	
	this.setPosition = function(offset){
		position = offset; //only in newTabmomoflow
		if($(".close"))
		$(".close").remove();
		for(var i = items.length - 1, j = 0, k = items.length - 1; i >= 0; i--, j++) {
			items[i].moveToPosition(k - offset + j);
		}
	}

	this.loaded = function(imgLength, selectedId, flagSelected){
		if (flagSelected)
			selPosition = selectedId;
		if (++loadedImgs == imgLength)
			myCF.setPosition(imgLength - selPosition - 1);
	}

  var CFItem = function(flagSelected, tabWinId, tabPos, tabId, imgLength, src, selectedId, options){
    var myself    = this;
    myself.canvi  = {};
    myself.angle  = 0;
    myself.left   = 0;
    myself.top    = 0;
    myself.index  = items.length;

    var reflectionRatio = 0.6;
    var reflectivity    = 0.4;
    var maxSize         = Math.floor(container.height()/(1+reflectionRatio));

    var reflectionCanvas;
    var img          = document.createElement('img');
    var finalCanvas  = createCanvas();
    var finalContext = finalCanvas.getContext('2d');

		$(img).load(function() {
			reflectionCanvas   = drawReflection(img, maxSize, reflectionRatio, reflectivity, container.css('background-color'));
			finalCanvas.width  = reflectionCanvas.width;
			finalCanvas.height = reflectionCanvas.height;

			$(finalCanvas).css({
				position: 'absolute',
				zIndex:   items.length + 1,
				left:     -1000,
				width:    reflectionCanvas.width,
				height:   reflectionCanvas.height
			}).appendTo(container);

			$(finalCanvas).addClass("image_"+tabId);
			
			if(flagSelected)
				redraw(0, true);
			
			myCF.loaded(imgLength, selectedId, flagSelected);
		});

		img.src = src;
		
    if (options.onclick)        $(finalCanvas).bind('click', function() {
			moveToTab();
			closeSelf(); //only in newTabmomoflow
		});
		
		//only in newTabmomoflow
		function closeSelf(){
			window.close();
		}
		//-------end-----------
		
		if(options.onscroll) {
			$(finalCanvas).bind("wheel", function(event, delta){
				navThumbNails(delta, tabPos);
			});
		}
		
		navkeyboardCtr();
		enterMoveToTab();
		HoverManager();
		
		//When user hover the middle tab will show the close image on the top right
		function addCloseImg(tabId) {
			var curTabId = parseInt($(finalCanvas).attr("class").substring(6));
			var leftPos = container.width() / 2 + finalCanvas.width / 4 + 20; //only in newTabmomoflow
			var topPos = 270 - imgHeight[tabId]; //calculate top heigh
			var closeImg = document.createElement("img");
			closeImg.src = "../images/close22.png";
			$(closeImg).addClass("close");
			$(closeImg).css({
				zIndex:   3000,
				position: 'absolute',
				top:      topPos,
				left:     leftPos,
				display:  'none'
			}).appendTo(container);
			hoverCloseImg();
			closeTab(curTabId);
		}
		
		function hoverCloseImg() {
			$(finalCanvas).hover(function(){
				$(".close").fadeIn().hover(function() {
					this.src = "../images/closeHovered.png";
				}, function(){
					this.src = "../images/close22.png";
				});
			});
		}
		
		function closeTab(tabId) {
			$(".close").bind("click", function() {
				myself.canvi = {};
				if(localStorage.view == "recent")
					chrome.tabs.remove(tabId, function() {});
				else {
					deleteClosedTab(tabId);
					window.location.reload();
				}
			});
		}
		
		function releaseMemory() {
			for(var i = 0, length = items.length; i < length; i++)
				items[i].canvi = {};
		}
		
		chrome.tabs.onRemoved.addListener(function(tabId){
			for(var i = 0, length = items.length; i < length; i++)
				items[i].canvi = {};
		});
		
		function navkeyboardCtr() {
			document.addEventListener('keydown', function(e) {
				var stTabPos;
				if (myself.angle == 0)
					stTabPos = tabPos;
				if (e.keyCode == KEY.LEFT || e.keyCode == KEY.UP) {
					var left = 1;
					navThumbNails(left, stTabPos);
				} else if(e.keyCode == KEY.RIGHT || e.keyCode == KEY.DOWN) {
					var right = -1;
					navThumbNails(right, stTabPos);
				}
			})
		}
		
		function enterMoveToTab() {
			document.addEventListener('keydown', function(e) {
				if ( myself.angle == 0 && (e.keyCode == KEY.ENTER || e.keyCode == KEY.SPACEBAR)) {
					moveToTab();
					closeSelf();
				}
			});
		}

		function moveToTab() {
			for(var i = 0, length = items.length; i < length; i++)
				items[i].canvi = {};//Remove Memory
			var tabId = parseInt($(finalCanvas).attr("class").substring(6));
			if(localStorage.view === "recent") {
				chrome.tabs.move(tabId, {windowId: parseInt(tabWinId), index: tabPos});
				chrome.tabs.update(tabId, {selected: true});
			} else {
					deleteClosedTab(tabId);
					chrome.tabs.create({windowId : lastFocusedWinId, url : tabDataPopup[tabId].url, selected : true});
			}
		}
		
		function deleteClosedTab(tabId) {
			for(var i = 0; i < items.length; i++) {
				if(closedTabsPopup[i].id == tabId) {
					closedTabsPopup.splice(i, 1);
					break;
				}
			}
			chrome.extension.sendRequest({info: "closeTab", tabId: tabId}, function(){});
		}
	
	function navThumbNails(delta, pos) {
		var up = imgLength - pos;
		var down = imgLength - 2- pos;
		
		if(delta > 0 && up < imgLength && up >= 0)
			myCF.setPosition(up);
		else if(delta < 0 && down >= 0 && down < imgLength)
			myCF.setPosition(down);
	} 
		
    function redraw(angle, show) {
			if (!myself.canvi[angle]) {
				var canvas    = createCanvas();
				canvas.width  = Math.floor(reflectionCanvas.width * Math.cos(angle * Math.PI / 180));
				canvas.height = reflectionCanvas.height;
				if(angle > 0)
					skew(canvas.getContext('2d'), reflectionCanvas, angle + 10);
				else if(angle < 0)
					skew(canvas.getContext('2d'), reflectionCanvas, angle - 11);
				else
					skew(canvas.getContext('2d'), reflectionCanvas, angle);
				myself.canvi[angle]  = canvas;
			} 
			
			if (show) {
				finalCanvas.style.width = myself.canvi[angle].width+"px";
				finalCanvas.width       = myself.canvi[angle].width;
				finalContext.clearRect(0, 0, reflectionCanvas.width, reflectionCanvas.height);
				finalContext.drawImage(myself.canvi[angle], 0, 0);
			}
    }

    function createCanvas(){
      var canvas = document.createElement('canvas');
      return canvas;
    }

    function spacer (x, dist){
      if (x==0) return 0;
      return 0.15 * dist * ((x<0) ? -1 : 1) * Math.sqrt(Math.abs(x));
    }

	function showTitle(tabId) {
		if($("#container").find(".tabTitle").length > 0)
			$(".tabTitle").hide();
		
		var title = tabDataPopup[tabId].title ? tabDataPopup[tabId].title : "";
		if($("#container").find("#" + tabId + "_title").length == 0) {
			$("#container").append("<div id='"+tabId+"_title' class='tabTitle' style='color:" + options.titleColor + "; z-index:2100; top:330px; width:100%; position:absolute;'>"+title+"<div>");
		} else if($("#" + tabId + "_title").text() != title) {
			$("#" + tabId + "_title").text(title);
			$("#" + tabId + "_title").show();
		} else if($("#container").find("#" + tabId + "_title").length > 0)
			$("#" + tabId + "_title").show();
	}

	function HoverManager() {
			$(finalCanvas).hover(function(){
				var curTabId = parseInt($(finalCanvas).attr("class").substring(6));
				showTitle(curTabId);
			}, function(){});
		}

    myself.moveToPosition = function(val){
      if (myself.animation) return;
      val = 30 * (val - imgLength + 1);
      var from  = {angle: myself.angle, left: myself.left, top: myself.top};
      var to    = {angle: Math.min(Math.max(val, -maxAngle), maxAngle) ,  left: val, top: (val == 0) ? 50 : 0 };
      var fps = 0;
      var lastAngle = myself.angle;
      myself.animation = jQuery(from).animate(to, {
        duration: options.speed,
        step: function() {
          fps++;
          var newAngle = (options.noTurn) ? 0 : Math.floor(this.angle);
          if (newAngle != lastAngle) {
            redraw(newAngle, true);
            lastAngle = newAngle;
          }
          $(finalCanvas).css({
            left:   Math.floor(myCF.center - spacer(this.left, maxSize) - finalCanvas.width/2 ),
            zIndex: 2000 - Math.floor(Math.abs(this.left))
          });
          if (options.comeToFront)      finalCanvas.style.top     = this.top+"px";
          if (VToptions.fadeInDistance == "true")   finalCanvas.style.opacity = Math.pow(0.99, Math.abs(newAngle));
        },
        complete: function(){
					myself.animation = null;
					myself.angle = Math.min(Math.max(val, -maxAngle), maxAngle); 
					myself.left  = val;
					myself.top   = (val == 0) ? 50 : 0;
					if (fps < 25) grid++;
					if (fps > 40 && grid > 3) grid --; 
					grid = 5; //reset grid, a bug in orignal code
					if(myself.angle == 0) {
						showTitle(tabId);
						if(VToptions.closeBt == "true")
							addCloseImg(tabId);
					}
        }
      });
    }
		
    function drawReflection(img,  maxSize,  ratio,  reflectivity, backgroundColor){
      // examples:                300       0.5     0.5           #ffffff
      var s = scaleTo(tabId, img, maxSize);
      var w = s.width;
      var h = s.height;
      var offset = (w > h) ? (w - h) : 0;

      var canvas    = createCanvas();
      canvas.width  = w;
      canvas.height = Math.max(w, h) * (1 + ratio);
      ctx           = canvas.getContext('2d');

      // draw the reflection image
	if(VToptions.reflection == "true") {
		ctx.save();
		ctx.translate(0, offset + (2 * h));
		ctx.scale(1, -1);
		ctx.drawImage(img, 0, 0, w, h);
		ctx.restore();

		// create the gradient effect
		ctx.save();
		ctx.translate(0, offset + h);
		ctx.globalCompositeOperation = 'destination-out';
		var grad = ctx.createLinearGradient( 0, offset + 0, 0, h * ratio );
		grad.addColorStop(1, 'rgba(0, 0, 0, 1)');
		grad.addColorStop(0, 'rgba(0, 0, 0, '+(1-reflectivity)+')');
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, w, offset + h);

		// apply background color to the gradient
		ctx.globalCompositeOperation = 'destination-over';
		ctx.fillStyle   = backgroundColor;
		ctx.globalAlpha = 0.8;
		ctx.fillRect(0, 0 , w, h);
		ctx.restore();

	}

      // draw the image
      ctx.save();
      ctx.translate(0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, offset + 0, w, h);
      ctx.restore();

      canvas.geometry = { left: 0, top: offset, width: w, height: h };

      return canvas;
    }

    function skew(context, img, angle) {
      var cos = Math.cos(angle * Math.PI / 180);
      if (cos <= 0) return;

      var w = img.width;
      var h = img.height;

      var w2 = w * cos;
      if (w2 < 1) return;

      var scalingFactor     = cos;

      var sliceNum          = w2 / grid;
      var sliceWidthOrigin  = w / sliceNum;

      var sliceWidthDest    = sliceWidthOrigin * w2 / w;
      var heightDelta       = h * ((1 - scalingFactor) / sliceNum);

      for(var n = 0; n < sliceNum; n++) {
        sx = Math.floor(sliceWidthOrigin * n);
        sy = 0;
        sw = Math.floor(sliceWidthOrigin);
        sh = h;
  
        dx = n * sliceWidthDest;
        dy = (angle > 0) ? ((heightDelta * n) / 3) : heightDelta * sliceNum / 3 - heightDelta * n /3; 
        dw = sliceWidthDest;
        dh = (angle > 0) ? h - (heightDelta * n) : h * scalingFactor + heightDelta * n;

        try {
          context.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);	
        } catch (e) {
        }
      }
    }
  }

	function calcuateImgLength(ary) {
		var sum = 0;
		jQuery.each(ary, function(index, a){
			if(a.windowId == lastFocusedWinId)
				sum++;
		});
		return sum;
	}
	
	if(window.localStorage.view === "closed") {
		var imgLength = calcuateImgLength(closedTabsPopup);
		var inx = 0;
		jQuery.each(closedTabsPopup, function(index, tab){
			if(tab.windowId == lastFocusedWinId) {
				var tabPosition = inx;
				var selectedId = imgLength - 1;
				var flagSelected = 1;
				var thumbNail = tab.thumbNail;
				items.push(new CFItem(flagSelected,
									tab.windowId,
									tabPosition,
									tab.id,
									imgLength,
									thumbNail,
									selectedId,
									{
									onclick:        options.onclick,
									onscroll:       true,
									lightBox:       options.lightBox,
									title:          options.title,
									titleColor:     options.titleColor
									}
									));
				inx++;
			}
		});
	} else {
			chrome.tabs.getAllInWindow(lastFocusedWinId, function(tabs){
				var imgLength = tabs.length;
				jQuery.each(tabs, function(index, tab){
					var tabPosition = tab.index;
					var flagSelected = 0;
					if(tab.selected) {
						var selectedId = tab.index;
						flagSelected = 1;
					}
					var thumbNail = tabDataPopup[tab.id].thumbNail;
					items.push(new CFItem(flagSelected,
										tab.windowId,
										tabPosition,
										tab.id,
										imgLength,
										thumbNail,
										selectedId,
										{
										onclick:        options.onclick,
										onscroll:       true,
										lightBox:       options.lightBox,
										title:          options.title,
										titleColor:     options.titleColor
										}
										));
				});
			});
		}

};
