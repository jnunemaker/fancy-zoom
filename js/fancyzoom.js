function benchmark(func) {
  var st = new Date().getTime();
  func.call();
  var et = new Date().getTime();
  console.log(func + ': ' + (et-st).toString() + 'ms');
}

Object.extend(String.prototype, {
  // if a string doesn't end with str it appends it
  ensureEndsWith: function(str) {
    return this.endsWith(str) ? this : this + str;
  },
  
  // makes sure that string ends with px (for setting widths and heights)
  px: function() {
    return this.ensureEndsWith('px');
  }
});

Object.extend(Number.prototype, {
  // makes sure that number ends with px (for setting widths and heights)
  px: function() {
    return this.toString().px();
  }
});

var Window = {
  // returns correct dimensions for window, had issues with prototype's sometimes. this was ganked from apple.
  size: function() {
		var width  = window.innerWidth || (window.document.documentElement.clientWidth || window.document.body.clientWidth);
		var height = window.innerHeight || (window.document.documentElement.clientHeight || window.document.body.clientHeight);
		var x      = window.pageXOffset || (window.document.documentElement.scrollLeft || window.document.body.scrollLeft);
		var y      = window.pageYOffset || (window.document.documentElement.scrollTop || window.document.body.scrollTop);
		return {'width':width, 'height':height, 'x':x, 'y':y}
	}
}

Element.addMethods({
  insertElements: function(element) {
    var elements = (arguments.length == 2) ? arguments[1] : $A(arguments).slice(1, arguments.length);
    element = $(element);
    $A(elements).flatten().each(function(el) { element.insert(el); });
    return element;
  }
});

var FancyZoomBox = {
  directory : 'images',
  zooming   : false,
  
  init: function(directory) {
    if ($('zoom')) { return; }
    // setup all our elements
    var img   = new Element('img', {src:FancyZoomBox.directory + '/closebox.png', alt:'Close'});
    var a     = new Element('a', {href:'#', title:'Close', id:'zoom_close'});
    var tl    = new Element('td', {'class':'tl'});
    var tm    = new Element('td', {'class':'tm'});
    var tr    = new Element('td', {'class':'tr'});
    var ml    = new Element('td', {'class':'ml'});
    var mm    = new Element('td', {'class':'mm', 'id':'zoom_content_area'});
    var mr    = new Element('td', {'class':'mr'});
    var bl    = new Element('td', {'class':'bl'});
    var bm    = new Element('td', {'class':'bm'});
    var br    = new Element('td', {'class':'br'});
    var trow  = new Element('tr');
    var mrow  = new Element('tr');
    var brow  = new Element('tr');
    var table = new Element('table', {'id':'zoom_table'});
    var zoom  = new Element('div', {'id':'zoom'});
    var body  = $$('body').first();

    trow.insertElements(tl, tm, tr);
    mrow.insertElements(ml, mm, mr);
    brow.insertElements(bl, bm, br);
    table.insertElements(trow, mrow, brow);
  	a.insert(img);
  	zoom.insertElements(table, a);
    body.insert(zoom);
    
    $(table).setStyle('border-collapse:collapse; width:100%; height:100%;');
    $(tl).setStyle('background:url(' + FancyZoomBox.directory + '/tl.png) no-repeat; width:20px height:20px; overflow:hidden;');
    $(tm).setStyle('background:url(' + FancyZoomBox.directory + '/tm.png) repeat-x; height:20px; overflow:hidden;');
    $(tr).setStyle('background:url(' + FancyZoomBox.directory + '/tr.png) no-repeat; width:20px height:20px; overflow:hidden;');
    $(ml).setStyle('background:url(' + FancyZoomBox.directory + '/ml.png) repeat-y; width:20px; overflow:hidden;');
    $(mm).setStyle('background:#fff; vertical-align:top; padding:10px;');
    $(mr).setStyle('background:url(' + FancyZoomBox.directory + '/mr.png) repeat-y;  width:20px; overflow:hidden;');
    $(bl).setStyle('background:url(' + FancyZoomBox.directory + '/bl.png) 0 100% no-repeat; width:20px height:20px; overflow:hidden;');
    $(bm).setStyle('background:url(' + FancyZoomBox.directory + '/bm.png) repeat-x; height:20px; overflow:hidden;');
    $(br).setStyle('background:url(' + FancyZoomBox.directory + '/br.png) no-repeat; width:20px height:20px; overflow:hidden;');
    $(img).setStyle('border:none; margin:0; padding:0;');
    $(a).setStyle('position:absolute; top:0; left:0;').observe('click', FancyZoomBox.out);
    
    FancyZoomBox.zoom = zoom;
    FancyZoomBox.zoom_close = a;
    FancyZoomBox.zoom_content_area = mm;
  },
  
  in: function(e) {
    e.stop();
		if (FancyZoomBox.zooming) return;
		FancyZoomBox.zooming   = true;
		var element            = e.element();
		var related_div        = element.content_div;
		var width              = related_div.getWidth();
		var height             = related_div.getHeight();		
		var d                  = Window.size();
		var yOffset            = document.viewport.getScrollOffsets()[1];
		var newTop             = (d.height/2) - (height/2) + yOffset;
		var newLeft            = (d.width/2) - (width/2);
		FancyZoomBox.curOffset = element.cumulativeOffset();
		FancyZoomBox.curTop    = e ? e.pointerY() : FancyZoomBox.curOffset.top;
		FancyZoomBox.curLeft   = e ? e.pointerX() : FancyZoomBox.curOffset.left;
		FancyZoomBox.moveX     = -(FancyZoomBox.curLeft - newLeft);
		FancyZoomBox.moveY     = -(FancyZoomBox.curTop - newTop);
    FancyZoomBox.zoom.hide().setStyle({
			position		: 'absolute',
			top					: FancyZoomBox.curTop.px(),
			left				: FancyZoomBox.curLeft.px()
		});
    FancyZoomBox.zoom_content_area.innerHTML = related_div.innerHTML;
		
		new Effect.Parallel([			
			new Effect.Appear(FancyZoomBox.zoom, {sync:true}),
			new Effect.Move(FancyZoomBox.zoom, {x: FancyZoomBox.moveX, y: FancyZoomBox.moveY, sync: true}),
			new Effect.Scale(FancyZoomBox.zoom, 100, {
				scaleFrom			: 0,
				scaleContent	: false,
				sync					: true,
				beforeStart: function(effect) {
					$(effect.element).setStyle({
						width   : width.px(),
						height  : height.px()
					});
					FancyZoomBox.addBgColorIfIE();
				},
				afterFinish: function(effect) {
					FancyZoomBox.removeBgColorIfIE();
					FancyZoomBox.zoom.show().setStyle({
						width   : width.px(),
						height  : height.px()
					});
					FancyZoomBox.zoom_close.show();
					FancyZoomBox.zooming = false;
				}
			})
		], { duration: 0.3 });
  },
  
  out: function(e) {
    e.stop();
		if (FancyZoomBox.zooming) return;
		FancyZoomBox.zooming = true;		
		new Effect.Parallel([
			new Effect.Move(FancyZoomBox.zoom, {x: FancyZoomBox.moveX*-1, y: FancyZoomBox.moveY*-1, sync: true}),
			new Effect.Scale(FancyZoomBox.zoom, 0, {
				scaleFrom			: 100,
				scaleContent	: false,
				sync					: true,
				beforeStart: function(effect) {
					FancyZoomBox.addBgColorIfIE();
					FancyZoomBox.zoom_close.hide();
				},
				afterFinish: function(effect) {
					FancyZoomBox.removeBgColorIfIE();
					FancyZoomBox.zooming = false;
				}
			}),
			new Effect.Fade(FancyZoomBox.zoom, {sync:true})
		], { duration: 0.5 });
  },
  
  // prevents the thick black border that happens when appearing or fading png in IE
	addBgColorIfIE: function() {
    // if (Prototype.Browser.IE) this.zoom.setStyle({ background: '#fff ' + this.bg });
	},
	
	removeBgColorIfIE: function() {
    // if (Prototype.Browser.IE) this.zoom.setStyle({ background: this.bg });
	}
}

var FancyZoom = Class.create({
	initialize: function(element) {
	  this.options = arguments.length > 1 ? arguments[1] : {};
	  FancyZoomBox.init();
	  
	  this.zoom          = $('zoom');
    this.zoom_table    = $('zoom_table');
	  
    this.zoom.hide();
	  this.element = $(element);
		this.zooming  = false;
		if (this.element && this.zoom) {
		  this.element.content_div = $(this.element.readAttribute('href').gsub(/^#/, ''));
  		this.element.content_div.hide();
      this.element.observe('click', FancyZoomBox.in);
		}
	}
});