var FancyZoom = new Class({
  Implements: Options,
  options: {
    //The directory option is global to all future instances of FancyZoom on the same page
    directory : 'images',
    scaleImg: false,
    width: null,
    height: null
  },
  initialize: function(element, options) {
    this.setOptions(options)
    if(!$('zoom'))
      this.setup()
    this.element = $(element)
    if (this.element) {
      this.element.store('content_div', $(this.element.get('href').match(/#(.+)$/)[1]).setStyles({display:'block', position:'absolute', visibility:'hidden'}));
      this.element.store('scaleImg', this.options.scaleImg)
      this.element.store('zoom_width', this.options.width);
      this.element.store('zoom_height', this.options.height);
      this.element.addEvent('click', FancyZoom.show);
    }
  },
  setup: function() {
    var ext = (Browser.Engine.trident && !Browser.Engine.trident5) ? 'gif' : 'png'
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
    document.body.grab(new Element('div', {id:"zoom", style:"display:none", html: html}));
    //Setup the FX as class methods
    FancyZoom.showFx = new Fx.Morph($('zoom'), {
      duration: 500,
      onStart: function(element) {
        if (element.retrieve('scaleImg')) {
          $('zoom_content').set('html', element.retrieve('content_div').get('html'));
          $$('#zoom_content img').setStyle('width', '100%');
        } else {
          $('zoom_content').set('html','');
        }
        // middle row height must be set for IE otherwise it tries to be "logical" with the height
        if (Browser.trident) {
          $A([$$('td.ml'), $$('td.mm'), $$('td.mr')]).flatten().setStyle('height', (height-40));
        }
      },
      onComplete: function(element) {
        if (!element.retrieve('scaleImg'))
          $('zoom_content').set('html', element.retrieve('content_div').get('html'));
        $('zoom_close').setStyle('display', '');
      }
    })
    FancyZoom.hideFx = new Fx.Morph($('zoom'), {
      duration: 500,
      onStart: function(element) {
        if (!element.retrieve('scaleImg'))
          $('zoom_content').set('html', '')
        $('zoom_close').setStyle('display', 'none');
      },
      onComplete: function(element) {
        element.setStyle('display', 'none')
      }
    })
    //Attach the events only once
    $('zoom_close').addEvent('click', FancyZoom.hide);
    // hide zoom if click fired is not inside zoom
    $$('html')[0].addEvent('click', function(e) {
      var click_in_zoom = e.target.match('#zoom') ? e.target : e.target.getParent('#zoom');
      if (!click_in_zoom)
        FancyZoom.hide(e);
    });
    // esc to close zoom box
    $(document).addEvent('keyup', function(e) {
      if (e.key == 'esc')
        FancyZoom.hide(e);
    });
  }
});
FancyZoom.show = function(e) {
  e.stop();
  var element            = e.target.match('a') ? e.target : e.target.getParent('a');
  var content_div        = element.retrieve('content_div')
  var width              = (element.retrieve('zoom_width') || content_div.getWidth()) + 60;
  var height             = (element.retrieve('zoom_height') || content_div.getHeight()) + 60;
  var d                  = window.getSize();
  var yOffset            = window.getScrollTop();
  // ensure that newTop is at least 0 so it doesn't hide close button
  var newTop             = Math.max((d.y/2) - (height/2) + yOffset, 0);
  var newLeft            = (d.x/2) - (width/2);
  // store this FancyZooms info in the zoom container
  $('zoom').store('curTop', e.client.y);
  $('zoom').store('curLeft', e.client.x);
  $('zoom').store('content_div', content_div)
  $('zoom').store('scaleImg', element.retrieve('scaleImg'))
  $('zoom').setStyles({
    position  : 'absolute',
    display   : 'block',
    opacity   : 0,
    top       : e.client.y,
    left      : e.client.x,
    width     : 1,
    height    : 1
  });
  
  FancyZoom.showFx.start({
    opacity: 1,
    top: newTop,
    left: newLeft,
    width: width,
    height: height})
}
FancyZoom.hide = function(e) {
  e.stop();
  FancyZoom.hideFx.start({
    left: $('zoom').retrieve('curLeft'), 
    top: $('zoom').retrieve('curTop'),
    width: 1,
    height: 1,
    opacity: 0});
}