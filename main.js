(function (window, document, undefined){
	var CLIPBOARD = new CLIPBOARD_CLASS("my_canvas", true),
		canvas,
		ctx,
		image,
		sp,
		ep,
		moved = false,
		md = false;

	function CLIPBOARD_CLASS(canvas_id, autoresize) {
		var _self = this;
		canvas = document.getElementById(canvas_id);
		ctx = document.getElementById(canvas_id).getContext("2d");
		var ctrl_pressed = false;
		var command_pressed = false;
		var paste_event_support;
		var pasteCatcher;

		document.addEventListener('keydown', function (e) {
			_self.on_keyboard_action(e);
		}, false); //firefox fix
		document.addEventListener('keyup', function (e) {
			_self.on_keyboardup_action(e);
		}, false); //firefox fix
		document.addEventListener('paste', function (e) {
			_self.paste_auto(e);
		}, false);
      
		this.init = function () {
			pasteCatcher = document.createElement("div");
			pasteCatcher.setAttribute("id", "paste_ff");
			pasteCatcher.setAttribute("contenteditable", "");
			pasteCatcher.style.cssText = 'opacity:0;position:fixed;top:0px;left:0px;width:10px;margin-left:-20px;';
			document.body.appendChild(pasteCatcher);

			// create an observer instance
			var observer = new MutationObserver(function(mutations) {
				mutations.forEach(function(mutation) {
					if (paste_event_support === true || ctrl_pressed == false || mutation.type != 'childList'){
						return true;
					}
					if(mutation.addedNodes.length == 1) {
						if (mutation.addedNodes[0].src != undefined) {
							_self.paste_createImage(mutation.addedNodes[0].src);
						}
						setTimeout(function () {
							pasteCatcher.innerHTML = '';
						}, 20);
					}
				});
			});
			var target = document.getElementById('paste_ff');
			var config = { attributes: true, childList: true, characterData: true };
			observer.observe(target, config);
		}();
      
		this.paste_auto = function (e) {
			paste_event_support = false;
			if(pasteCatcher != undefined){
				pasteCatcher.innerHTML = '';
			}
			if (e.clipboardData) {
				var items = e.clipboardData.items;
				if (items) {
					paste_event_support = true;
					for (var i = 0; i < items.length; i++) {
						if (items[i].type.indexOf("image") !== -1) {
							//image
							var blob = items[i].getAsFile();
							var URLObj = window.URL || window.webkitURL;
							var source = URLObj.createObjectURL(blob);
							this.paste_createImage(source);
						}
					}
					e.preventDefault();
				}
			}
		};
      
		this.on_keyboard_action = function (event) {
			k = event.keyCode;
			if (k == 17 || event.metaKey || event.ctrlKey) {
				if (ctrl_pressed == false)
					ctrl_pressed = true;
			}
			if (k == 86) {
				if (document.activeElement != undefined && document.activeElement.type == 'text') {
					return false;
				}
				if (ctrl_pressed == true && pasteCatcher != undefined){
					pasteCatcher.focus();
				}
			}
		};
      
		this.on_keyboardup_action = function (event) {
			if (event.ctrlKey == false && ctrl_pressed == true) {
				ctrl_pressed = false;
			} else if(event.metaKey == false && command_pressed == true){
				command_pressed = false;
				ctrl_pressed = false;
			}
		};
      
		this.paste_createImage = function (source) {
			document.getElementById('note').style.display = 'none';
			image = new Image();
			image.onload = function () {
				canvas.width = ctx.width = image.width;
				canvas.height = ctx.height = image.height;
				canvas.removeAttribute('style');
				canvas.style.cursor = 'crosshair';
				ctx.drawImage(image, 0, 0);
			}
			image.src = source;
			
			
			canvas.addEventListener('mousedown', function (e) {
				sp = {x: e.clientX + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft), y: e.clientY + Math.max(document.documentElement.scrollTop, document.body.scrollTop)};
				md = true;
			});
			canvas.addEventListener('mousemove', function (e) {
				if (md) {
					ep = {x: e.clientX + Math.max(document.documentElement.scrollLeft, document.body.scrollLeft), y: e.clientY + Math.max(document.documentElement.scrollTop, document.body.scrollTop)};
					drawCrop(sp.x, sp.y, ep.x, ep.y);
					moved = true;
				}
			});
			document.addEventListener('mouseup', function (e) {
				if (md) {
					if (moved) {
						saveImage(sp.x, sp.y, ep.x, ep.y);
					} else {
						saveImage(0, 0, image.width, image.height);
					}
					
					document.body.removeChild(canvas);
					md = false;
				}
			});
		};
	}

	function saveImage(x, y, x2, y2) {
		var cropped = document.createElement('canvas'),
			cctx = cropped.getContext('2d');
		
		var dims = {
			x: Math.min(x, x2),
			y: Math.min(y, y2),
			w: Math.abs(x-x2),
			h: Math.abs(y-y2)
		};
		cropped.width = cctx.width = dims.w;
		cropped.height = cctx.height = dims.h;
		
		cctx.drawImage(canvas, dims.x, dims.y, dims.w, dims.h, 0, 0, dims.w, dims.h);
		
		var canvasData = cropped.toDataURL("image/jpeg", 0.8),
			form = document.createElement('form'),
			photo = document.createElement('input');
		
		form.appendChild(photo);
		photo.setAttribute('name', 'photo');
		form.setAttribute('method', 'post');
		
		photo.value = canvasData;
		
		form.style.display = 'none';
		document.body.appendChild(form);
		form.submit();
	}

	function drawCrop(x, y, x2, y2) {
		var dims = {
			x: Math.min(x, x2),
			y: Math.min(y, y2),
			w: Math.abs(x-x2),
			h: Math.abs(y-y2)
		};
		ctx.drawImage(image, 0, 0);
		ctx.fillStyle = 'rgba(0,0,0,0.5)';
		ctx.fillRect(0,0,image.width,dims.y);
		ctx.fillRect(0,dims.y + dims.h,image.width,image.height - dims.y - dims.h);
		
		ctx.fillRect(0,dims.y,dims.x,dims.h);
		ctx.fillRect(dims.x + dims.w,dims.y,image.width - dims.x - dims.w, dims.h);
	}
})(window, document);