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

		//handlers
		document.addEventListener('keydown', function (e) {
			_self.on_keyboard_action(e);
		}, false); //firefox fix
		document.addEventListener('keyup', function (e) {
			_self.on_keyboardup_action(e);
		}, false); //firefox fix
		document.addEventListener('paste', function (e) {
			_self.paste_auto(e);
		}, false); //official paste handler

		//constructor - we ignore security checks here
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
						//we already got data in paste_auto()
						return true;
					}

					//if paste handle failed - capture pasted object manually
					if(mutation.addedNodes.length == 1) {
						if (mutation.addedNodes[0].src != undefined) {
							//image
							_self.paste_createImage(mutation.addedNodes[0].src);
						}
						//register cleanup after some time.
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
		//default paste action
		this.paste_auto = function (e) {
			paste_event_support = false;
			if(pasteCatcher != undefined){
				pasteCatcher.innerHTML = '';
			}
			if (e.clipboardData) {
				var items = e.clipboardData.items;
				if (items) {
					paste_event_support = true;
					//access data directly
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
				else {
					//wait for DOMSubtreeModified event
					//https://bugzilla.mozilla.org/show_bug.cgi?id=891247
				}
			}
		};
		//on keyboard press
		this.on_keyboard_action = function (event) {
			k = event.keyCode;
			//ctrl
			if (k == 17 || event.metaKey || event.ctrlKey) {
				if (ctrl_pressed == false)
					ctrl_pressed = true;
			}
			//v
			if (k == 86) {
				if (document.activeElement != undefined && document.activeElement.type == 'text') {
					//let user paste into some input
					return false;
				}

				if (ctrl_pressed == true && pasteCatcher != undefined){
					pasteCatcher.focus();
				}
			}
		};
		//on kaybord release
		this.on_keyboardup_action = function (event) {
			//ctrl
			if (event.ctrlKey == false && ctrl_pressed == true) {
				ctrl_pressed = false;
			}
			//command
			else if(event.metaKey == false && command_pressed == true){
				command_pressed = false;
				ctrl_pressed = false;
			}
		};
		//draw pasted image to canvas
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
				sp = {x: e.clientX, y: e.clientY};
				//drawCrop(sp.x, sp.y, sp.x, sp.y);
				md = true;
			});
			canvas.addEventListener('mousemove', function (e) {
				if (md) {
					ep = {x: e.clientX, y: e.clientY};
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
		
		var canvasData = cropped.toDataURL(),
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
