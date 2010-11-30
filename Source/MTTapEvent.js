/*
--- 
authors: 
- 3n
provides: [MTTapEvent]
requires: 
  - MTCore
  - Core/Element.Event
  - Core/Element.Dimensions
license: MIT-style
description: Adds element.addEvent('tap', fn).
...
*/

Element.Events.tap = {
  tapEventActiveClass : 'tapEventActive',
  allTapsCanceled : false,
  
  cancelAllTaps : function(){
    Element.Events.tap.allTapsCanceled = true;
  },
  
  onAdd: function(fn){
    var startScrollY,
        activeClass = Element.Events.tap.tapEventActiveClass,
        tapCanceled = false;
    
    var cancelTap = function(){
      tapCanceled = true;
      this.removeClass(activeClass);
      this.removeEvent(MT.endEvent, endFn);
      this.removeEvent(MT.moveEvent, scrollFn);      
    };
    var startFn = function(event){
      Element.Events.tap.allTapsCanceled = false;
      tapCanceled = false;
      startScrollY = window.pageYOffset;
      this.addEvent(MT.endEvent, endFn)
          .addEvent(MT.moveEvent, scrollFn);
      (function(){
        if (!tapCanceled && !Element.Events.tap.allTapsCanceled && this.addClass) 
          this.addClass(activeClass);
      }).delay(100, this);
    };
    var endFn = function(event){
      tapCanceled = true;
      if (this.removeClass) this.removeClass(activeClass);
      if (Element.Events.tap.allTapsCanceled) 
        cancelTap.call(this);
      else
        fn.call(this, event);
    };
    var scrollFn = function(event){
      var event = MT.getEvent(event.event);
      var pageX = event.pageX,
          pageY = event.pageY,
          left  = this.getLeft(),
          top   = this.getTop();

      if (startScrollY !== window.pageYOffset 
          || !(pageX > left && pageX < left + this.getWidth())
          || !(pageY > top && pageY < top + this.getHeight())){
            cancelTap.call(this);
            return;
      }
      
      if (Element.Events.tap.allTapsCanceled) cancelTap.call(this);
    };
    
    this.addEvent(MT.startEvent, startFn);
    if (Element.Events.swipe) this.addEvent('swipe', cancelTap);
    
    var tapAddedEvents = {};
    tapAddedEvents[fn] = {};
    tapAddedEvents[fn][MT.startEvent] = startFn;
    tapAddedEvents[fn][MT.moveEvent] = scrollFn;
    tapAddedEvents[fn][MT.endEvent] = endFn;
    
    this.store('tapAddedEvents', tapAddedEvents);
  },
  
  onRemove: function(fn){
    if (this.removeClass) this.removeClass(Element.Events.tap.tapEventActiveClass);
    $H(this.retrieve('tapAddedEvents')[fn]).each(function(v,k){
      this.removeEvent(k,v);
    }, this);
  }
};


Element.Events.tapOut = {
  onAdd : function(fn) {
    var tapOut = function(e){
      if (![e.target].combine(e.target.getParents()).contains(this))
        fn.call(this, e);
    }.bind(this);
    
    this.getDocument().addEvent('tap', tapOut);
    this.store('tapOutCallback', tapOut);
  },
  onRemove : function(fn) {
    this.getDocument().removeEvent('tap', this.retrieve('tapOutCallback'));
  }
};

Element.Events.touchOut = {
  base : MT.startEvent,
  condition : function(event) {
    event.stopPropagation();
    return false;
  },
  onAdd : function(fn) {
    this.getDocument().addEvent(MT.startEvent, fn);
  },
  onRemove : function(fn) {
    this.getDocument().removeEvent(MT.startEvent, fn);
  }
};