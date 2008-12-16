var FancyZoom = new Class({
  Implements: [Options, Events],
  options: {
    /* 
    onShow: $empty,
    onHide: $empty,
    */
    scaleImg: false,
    // The directory option is global to all future instances of FancyZoom on the same page
    directory : 'images',
    width: null,
    height: null,
    // This directive will force the zoom to scale to a maximum of 1024px wide
    max: 1024
  },
  initialize: function(element, options) {
    this.setOptions(options)
    if(!$('zoom'))
      this.setup()
    this.element = $(element)
    if (this.element) {
      this.content_div = $(this.element.get('href').match(/#(.+)$/)[1]).setStyles({display:'block', position:'absolute', visibility:'hidden'});
      this.element.store('fancy', this)
      this.element.addEvent('click', FancyZoom.show);
    }
  },
  setup: function() {
    var ext = Browser.Engine.trident ? 'gif' : 'png'
    var html = '<table id="zoom_table" style="border-collapse:collapse; width:100%; height:100%;"> \
                 <tbody> \
                   <tr> \
                     <td class="tl" style="background:url(' + this.options.directory + '/tl.'+ext+') 0 0 no-repeat; width:20px height:20px; overflow:hidden;" /> \
                     <td class="tm" style="background:url(' + this.options.directory + '/tm.'+ext+') 0 0 repeat-x; height:20px; overflow:hidden;" /> \
                     <td class="tr" style="background:url(' + this.options.directory + '/tr.'+ext+') 100% 0 no-repeat; width:20px height:20px; overflow:hidden;" /> \
                   </tr> \
                   <tr> \
                     <td class="ml" style="background:url(' + this.options.directory + '/ml.'+ext+') 0 0 repeat-y; width:20px; overflow:hidden;" /> \
                     <td class="mm" style="background:#fff; vertical-align:top; padding:10px;"> \
                       <div id="zoom_content"> \
                       </div> \
                     </td> \
                     <td class="mr" style="background:url(' + this.options.directory + '/mr.'+ext+') 100% 0 repeat-y;  width:20px; overflow:hidden;" /> \
                   </tr> \
                   <tr> \
                     <td class="bl" style="background:url(' + this.options.directory + '/bl.'+ext+') 0 100% no-repeat; width:20px height:20px; overflow:hidden;" /> \
                     <td class="bm" style="background:url(' + this.options.directory + '/bm.'+ext+') 0 100% repeat-x; height:20px; overflow:hidden;" /> \
                     <td class="br" style="background:url(' + this.options.directory + '/br.'+ext+') 100% 100% no-repeat; width:20px height:20px; overflow:hidden;" /> \
                   </tr> \
                 </tbody> \
               </table> \
               <a href="#" title="Close" id="zoom_close" style="position:absolute; top:0; left:0;"> \
                 <img src="' + this.options.directory + '/closebox.'+ext+'" alt="Close" style="border:none; margin:0; padding:0;" /> \
               </a>';
    $(document.body).grab(new Element('div', {id:"zoom", style:"display:none", html: html}));
    //Setup the FX as class methods
    FancyZoom.showFx = new Fx.Morph($('zoom'), {
      link: 'cancel',
      onStart: function(element) {
        var fancy = element.retrieve('fancy')
        if(fancy.options.scaleImg) {
          fancy.content_div.getElements('img').setStyles({'width': 50, 'height':'auto'})
          $('zoom_content').set('html', fancy.content_div.get('html'));
          //This is still broken in IE
          $$('#zoom_content img').tween('width', this.to.width[0].value - 60)
        } else
          $('zoom_content').set('html','');
      },
      onComplete: function(element) {
        FancyZoom.zoomed = true;
        var fancy = element.retrieve('fancy')
        fancy.loaded = false
        if (!fancy.options.scaleImg)
          $('zoom_content').set('html', fancy.content_div.get('html'));
        // middle row height must be set for IE otherwise it tries to be "logical" with the height
        if(Browser.Engine.trident)
          $$('td.ml, td.mm, td.mr').setStyle('height', this.to.height[0].value - 60);
        $('zoom_close').setStyle('display', '');
        FancyZoom.unfixBackgroundsForIE();
      }
    })
    FancyZoom.hideFx = new Fx.Morph($('zoom'), {
      onStart: function(element) {
        if (!element.retrieve('fancy').scaleImg)
          $('zoom_content').set({'html': '', 'style':''})
        $('zoom_close').setStyle('display', 'none');
      },
      onComplete: function(element) {
        FancyZoom.zoomed = false;
        element.setStyle('display', 'none');
        FancyZoom.unfixBackgroundsForIE();
      }
    })
    //Attach the events only once
    $('zoom_close').addEvent('click', FancyZoom.hide);
    // hide zoom if click fired is not inside zoom
    $$('html')[0].addEvent('click', function(e) {
      if (!($(e.target).match('#zoom') || $(e.target).getParent('#zoom')))
        FancyZoom.hide(e);
    });
    // esc to close zoom box
    $(document).addEvent('keyup', function(e) {
      if (e.key == 'esc')
        FancyZoom.hide(e);
    });
  }
});
FancyZoom.zoomed = false;
FancyZoom.show = function(e) {
  e.stop();
  var element            = $(e.target).match('a') ? e.target : e.target.getParent('a');
  var fancy              = element.retrieve('fancy')
  var width              = (fancy.options.width || fancy.content_div.getWidth()) + 60;
  var height             = (fancy.options.height || fancy.content_div.getHeight()) + 60;
  //Make the image a maximum of 1024px wide
  var height             = (Math.min(fancy.options.max, width) / width) * height
  var width              = Math.min(fancy.options.max, width)
  var d                  = Window.getSize();
  var yOffset            = Window.getScrollTop();
  // ensure that newTop is at least 0 so it doesn't hide close button
  var newTop             = Math.max((d.y/2) - (height/2) + yOffset, 0);
  var newLeft            = (d.x/2) - (width/2);
  if(!fancy.loaded) {
    $('zoom').store('curTop', e.page.y);
    $('zoom').store('curLeft', e.page.x);
    $('zoom').store('fancy', fancy);
    $('zoom').setStyles({
      position  : 'absolute',
      display   : 'block',
      opacity   : 0,
      top       : e.page.y,
      left      : e.page.x,
      width     : 1,
      height    : 1
    });
    //So we need a delay for IE to be happy....
    fancy.fireEvent('show', {stop:$empty, target:element, page: e.page}, 100)
  }
  FancyZoom.fixBackgroundsForIE();
  FancyZoom.showFx.start({
    opacity: 1,
    top: newTop,
    left: newLeft,
    width: width,
    height: height})
}
FancyZoom.hide = function(e) {
  if(!FancyZoom.zoomed)
    return
  e.stop();
  $('zoom').retrieve('fancy').fireEvent('hide')
  FancyZoom.fixBackgroundsForIE();
  FancyZoom.hideFx.start({
    left: $('zoom').retrieve('curLeft'), 
    top: $('zoom').retrieve('curTop'),
    width: 1,
    height: 1,
    opacity: 0});
}
FancyZoom.switchBackgroundImagesTo = function(to) {
  $$('#zoom_table td').each(function(e) {
    var bg = e.getStyle('background-image').replace(/\.(png|gif|none)\)$/, '.'+to+')');
    e.setStyle('background-image', bg);
  });
  var close_img = zoom_close.getElement('img');
  var new_img = close_img.get('src').replace(/\.(png|gif|none)$/, '.' + to);
  close_img.set('src', new_img);
}
FancyZoom.fixBackgroundsForIE = function() {
  if (Browser.Engine.trident5) {
    FancyZoom.switchBackgroundImagesTo('gif'); 
  }
}
FancyZoom.unfixBackgroundsForIE = function() {
  if (Browser.Engine.trident5) {
    FancyZoom.switchBackgroundImagesTo('png'); 
  }
}