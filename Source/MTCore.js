/*
---

name: MTCore

description: The core of MooTouch.

authors: Ian Collins (@3n)

license: MIT-style license.

requires: [Core/Element.Event]

provides: MTCore

...
*/

Element.NativeEvents.webkitTransitionEnd = 2;

var MT = {
	supportsTouches : 'createTouch' in document
};

MT.startEvent = MT.supportsTouches ? 'touchstart' : 'mousedown';
MT.moveEvent = MT.supportsTouches ? 'touchmove' : 'mousemove';
MT.endEvent = MT.supportsTouches ? 'touchend' : 'mouseup';

MT.getEvent = function(event){
	return (event.touches && event.touches.length > 0) ? event.touches[0] : event;
};
