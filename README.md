MooTouch
========

A small "framework" to help in building applications with MooTools for touch-
capable devices. 

Currently provides a few helper events for common gestures, some Element
extensions for getting and setting the translate3d property and a 
native iOS scrolling emulation class.

All code works on old-school "desktop" browsers as well, as "mouse" events
are handled the same as touch events.

A demo can be found here: http://iancollins.me/MooTouch-Demo/

Authors
-------

Ian Collins & Toby Sterrett,
Grade 3

To Do
-----

* Add compatibility for non iOS devices (e.g. Android)
* Add compatibility for non webkit browsers (e.g. Firefox?)
* Add UI/Control classes such as button and toggle.

MooTouch Core
=============

This file contains an extremely light global object "MT" that contains useful
information for use in the MooTouch framework. It is mostly used to set up a
cross-platform (mouse / touch) base for the framework.

What it does
------------

* The necessary event codes are setup for Element.AddEvent to work.
* Some event names are chosen based on the platform and put into
	MT.startEvent, MT.moveEvent and MT.endEvent. Feel free to use
	these in your code as well.
* A MT.getEvent method is created for hiding the difference between
  touches and clicks from the rest of MooTouch.

MTSwipeEvent
============

Adds the 'swipe' event to Element.Events. This means you can do this:
	
	my_element.addEvent('swipe', fn);

How to use
----------
	
Add and remove the event as you would normally. The event will only fire under 
these conditions: 
	
1. The user starts his touch inside of the element and moves horizontally in 
	 either direction for 70 pixels (configurable).

Arguments
---------

The function you specify as a callback will be bound to the element and passed the 
following things:

1. An object containing the direction ('left' or 'right'), startX, endX, startY and endY
2. The event. 

Configuration
-------------

You can configure the following properties by assigning a value to them in your script:

	Element.Events.swipe.swipeWidth // default is 70
	Element.Events.swipe.cancelVertical // default is true


MTTapEvent
==========

Adds the 'tap' event to Element.Events. This means you can do this:
	
	my_element.addEvent('tap', fn);

How to use
----------
	
Add and remove the event as you would normally. The event will only fire under these conditions: 
	
1. The user starts his touch inside of the element and releases it inside of the element.
2. During the touch start/end sequence, the page does not scroll.


MooTouch Translate
==================

Some element extensions for setting and getting the css translate3d property.

getTranslate3d
--------------

Returns the element's current translate3d value, or null if there isn't one.
An object is returned containing x, y, z as keys, and numbers as values.

setTranslate3d
--------------

Set's the element's translate3d property. Uses the current value for any
axis that isn't specified in the arguments. Does not clobber any other
transforms that may be applied to the element - only replaces or appends
the translate3d part.

Arguments: x,y,z (ints or floats)

Convenience methods
-------------------

setTranslate(x,y), setTranslateX(x), setTranslateY(y), setTranslateZ(z).
All of these take a final argument of (boolean)useZero that will use 0
for the other axis, instead of leaving null (which will maintain current
value).


MooTouch ScrollView
===================

A class to add iOS native-like scrolling to a given element. It strives in
every way possible to exactly duplicate the native behavior of iOS devices
including animation velocity, scroll indicator behavior, bounds handling and
pagination. Being a MooTools class, all of these traits (and more) are
provided as options creation time. Also, a full range of events are given
in order to inform and further customize the scrolling behavior.

_MTScrollView is part of the MooTouch family, and has some (light) dependencies
on it._

Currently Supports
------------------

1. CSS style-able scroll indicators that automatically hide and show themselves
2. Pagination - lock the scrolling on any axis to a specified grid. This is
   useful in creating a swipe-to-navigate interface such as the Photos app.
3. Fully customizable animation friction, velocity and duration.
4. Customizable out-of-bounds scrolling behavior.
5. Events. Events everywhere.
6. One, two or even three axis of scrolling at once.

How to use
----------

	#JS
	var scrollView = new MTScrollView(element);
	
That element will now be the wrapper/container for all of the scrolling 
content. It is advised that you give it a static size. If it is ever
resized, call scrollView.refreshSizes().

You should also have some CSS to go along with the scroll view. Here is the
most basic:
	
	#CSS
	#id_of_element {
		position:relative;
	  overflow: hidden;
	}

If you need indicators, this will get you close to the native style:
	
	#CSS
	.indicator {
	  background:rgba(0,0,0,0.4); 
	  -webkit-border-radius:5px;
	  position:absolute;
	  opacity:0;
	}
	  .indicator.showing {
	    opacity:1;
	  }
	.y-axis-indicator {
	  width:5px;
	  min-height:10px;
	  top:0px;
	  right:5px;
	  margin:5px 0;
	}
	.x-axis-indicator {
	  bottom:5px;
	  margin:0 5px;
	  height:5px;
	}
	
Sytax
-----

	new MTScrollView(element, [options]);

Arguments
---------

	1. element - (mixed) An Element or string id.
	2. options - (object, optional) the options described below:

Options
-------

* axis - Array of axis to scroll on. Defaults to ['y'].
* showScrollIndicatorX - Obvious. Defaults to true.
* showScrollIndicatorY - Obvious. Defaults to true.
* pagingEnabled - Pagination. Defaults to false.
* bounces - Bouncing effect on out-of-bounds scrolling. Defaults to true.
* eventElement - Element to add touch events to. Defaults to window.  
* indicatorClass - Class name for indicators. Defaults to 'indicator'.
* indicatorShowingClass - Class name for indicators while showing Defaults to 'showing'.
* frameRate - Obvious. Defaults to (1000 / 60).    
* minimumTrackingForDrag - How many pixels in drag before it counts as a scroll. Defaults to 15.
* scrollAcceleration - Obvious. Defaults to 15.
* snapDeceleration - The acceleration of the snap-to-bounds animation. Defaults to 0.05.
* snapAcceleration - The deceleration of the snap-to-bounds animation. Defaults to 0.13.
* minVelocity - Don't worry about it. Defaults to 0.05.    
* minVelocityForDeceleration - Don't worry about it. Defaults to 1.
* minVelocityForDecelerationWhenPaging - Don't worry about it. Defaults to 4.
* maxVelocityForBouncingWithPaging - Don't worry about it. Defaults to 20.
* pagingTransitionDuration - Don't worry about it. Defaults to '0.25s'. 
* decelerationFrictionFactor - Don't worry about it. Defaults to 0.950.   
* boundsFrictionFactor - Don't worry about it. Defaults to 0.6.
* maxAgeForPointHistory - Don't worry about it. Defaults to 100.

Events
------

* willBeginDragging - user has touched and moved the minimum number of pixels.
* scroll - each step of the scrolling (lots).
* dragEnd - user finished dragging.
* willBeginDecelerating - user has let go, an animation will start.
* didEndDecelerating - deceleration animation done.
* scrollEnd - scroll is over.
