/*
---

name: MTSwipeEvent

description: Adds a custom swipe event

authors: Ian Collins (@3n)

license: MIT-style license.

requires: [MTCore, Core/Element.Event]

provides: MTSwipeEvent

...
*/

Element.Events.swipe = {
	allSwipesCanceled : false,

	cancelAllSwipes : function(){
		Element.Events.swipe.allSwipesCanceled = true;
	},

	onAdd: function(fn){
		var startX, startY, active = false;

		var touchStart = function(event){
			active = true;
			Element.Events.swipe.allSwipesCanceled = false;
			var originalEvent = MT.getEvent(event.event);
			startX = originalEvent.pageX;
			startY = originalEvent.pageY;
		};
		var touchMove = function(event){
			var originalEvent = MT.getEvent(event.event);
			var endX	= originalEvent.pageX,
					endY	= originalEvent.pageY,
					diff	= endX - startX,
					isLeftSwipe = diff < -1 * Element.Events.swipe.swipeWidth,
					isRightSwipe = diff > Element.Events.swipe.swipeWidth;

			if (active && !Element.Events.swipe.allSwipesCanceled && (isRightSwipe || isLeftSwipe)
					&& (event.onlySwipeLeft ? isLeftSwipe : true)
					&& (event.onlySwipeRight ? isRightSwipe : true) ){
				active = false;
				fn.call(this, {
					'direction': isRightSwipe ? 'right' : 'left',
					'startX': startX,
					'endX': endX,
					'startY': startY,
					'endY': endY
				}, event);
			}

			if (Element.Events.swipe.cancelVertical
					&& Math.abs(startY - endY) < Math.abs(startX - endX)){
				return false;
			}
		};

		this.addEvent(MT.startEvent, touchStart);
		this.addEvent(MT.moveEvent, touchMove);

		var swipeAddedEvents = {};
		swipeAddedEvents[fn] = {};
		swipeAddedEvents[fn][MT.startEvent] = touchStart;
		swipeAddedEvents[fn][MT.moveEvent]	= touchMove;

		this.store('swipeAddedEvents', swipeAddedEvents);
	},

	onRemove: function(fn){
		Object.each(this.retrieve('swipeAddedEvents')[fn], function(v,k){
			this.removeEvent(k,v);
		}, this);
	}
};

Element.Events.swipe.swipeWidth = 70;
Element.Events.swipe.cancelVertical = true;
