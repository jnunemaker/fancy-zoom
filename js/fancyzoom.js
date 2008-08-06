var FancyZoom = Class.create({
	initialize: function(element) {
		this.element = $(element);
		this.zoom    = $(this.element.readAttribute('href').gsub(/^#/, ''));
		this.zooming = false;
		this.bg      = 'url(images/shadow_round_small.png) no-repeat';
		if (this.element && this.zoom) {
			this.zoom.addClassName('zoom');
			this.zoom.setStyle({
				position	: 'absolute', 
				margin		: '0',
				padding		: '0'
			});
			this.zoomWidth  = this.zoom.getWidth();
			this.zoomHeight = this.zoom.getHeight();
			this.zoom.hide();
			this.addCloseButton();
			this.element.observe('click', this.zoomIn.bindAsEventListener(this));
		}
	},
	
	addCloseButton: function() {
		var a   = new Element('a', {href:'#'});
		var img = new Element('img', {src:'images/closebox.png', alt:'Close'});
		a.appendChild(img);
		this.zoom.appendChild(a);
		this.zoomLink = $(a);
		this.zoomLink.observe('click', this.zoomOut.bindAsEventListener(this)).addClassName('zoom_close');
		$(img).setStyle('border:none');
	},
		
	windowSize: function() {
		var width  = window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
		var height = window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);
		var x      = window.pageXOffset || (window.document.documentElement.scrollLeft || window.document.body.scrollLeft);
		var y      = window.pageYOffset || (window.document.documentElement.scrollTop || window.document.body.scrollTop);
		return {'width':width, 'height':height, 'x':x, 'y':y}
	},

	
	zoomIn: function(e) {
		e.stop();
		if (this.zooming) return;
		this.zooming   = true;
		var self       = this;
		var d          = this.windowSize();
		var yOffset    = document.viewport.getScrollOffsets()[1];
		var newTop     = (d.height/2) - (this.zoomHeight/2) + yOffset;
		var newLeft    = (d.width/2) - (this.zoomWidth/2);
		this.curOffset = this.element.cumulativeOffset();
		this.curTop    = e ? e.pointerY() : this.curOffset.top + 50;
		this.curLeft   = e ? e.pointerX() : this.curOffset.left - 40;
		this.moveX     = -(this.curLeft - newLeft);
		this.moveY     = -(this.curTop - newTop);
		$$('div.zoom').invoke('hide');
		this.zoom.setStyle({
			position		: 'absolute',
			top					: this.curTop+'px',
			left				: this.curLeft+'px',
			background	: this.bg
		});
		
		new Effect.Parallel([			
			new Effect.Appear(this.zoom, {sync:true}),
			new Effect.Move(this.zoom, {x: this.moveX, y: this.moveY, sync: true}),
			new Effect.Scale(this.zoom, 100, {
				scaleFrom			: 0,
				scaleContent	: false,
				sync					: true,
				beforeStart: function(effect) {
					$(effect.element).setStyle({
						width: self.zoomWidth+'px',
						height: self.zoomHeight+'px'
					});
					self.addBgColorIfIE();
					self.zoom.select('div').invoke('hide');
				},
				afterFinish: function(effect) {
					self.removeBgColorIfIE();
					self.zoom.select('div').invoke('show');
					self.zoom.select('a.zoom_close').invoke('hide');
					self.zoomLink.show();
					self.zoom.setStyle({
						width:self.zoomWidth,
						height:self.zoomHeight,
						background:self.bg
					})
					self.zooming = false;
				}
			})
		], { duration: 0.3 });
	},
	
	zoomOut: function(e) {
		e.stop();
		if (this.zooming) return;
		this.zooming = true;
		var self = this;
		new Effect.Parallel([
			new Effect.Move(this.zoom, {x: this.moveX*-1, y: this.moveY*-1, sync: true}),
			new Effect.Scale(this.zoom, 0, {
				scaleFrom			: 100,
				scaleContent	: false,
				sync					: true,
				beforeStart: function(effect) {
					self.addBgColorIfIE();
					self.zoomLink.hide();
					self.zoom.select('div').invoke('hide');
				},
				afterFinish: function(effect) {
					self.removeBgColorIfIE();
					self.zoom.select('div').invoke('show');
					self.zooming = false;
				}
			}),
			new Effect.Fade(this.zoom, {sync:true})
		], { duration: 0.5 });
	},
	
	// prevents the thick black border that happens when appearing or fading png in IE
	addBgColorIfIE: function() {
		if (Prototype.Browser.IE) this.zoom.setStyle({ background: '#fff ' + this.bg });
	},
	
	removeBgColorIfIE: function() {
		if (Prototype.Browser.IE) this.zoom.setStyle({ background: this.bg });
	}
});