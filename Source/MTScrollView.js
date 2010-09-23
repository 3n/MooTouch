/*
---

name: MTScrollView

description: A recreation of the native iOS scrolling.

authors: Ian Collins (@3n)

license: MIT-style license.

requires: [Core/Class.Extras, Core/Element.Event, Core/Element.Dimensions, Core/Number, Class-Extras/Class.Binds, Custom-Event/Element.defineCustomEvent, Mobile/Browser.Features.Touch, MTPoint, MTTranslate]

provides: MTScrollView

...
*/

(function(){

var events = Browser.Features.Touch ? {
	start: 'touchstart',
	move: 'touchmove',
	end: 'touchend'
} : {
	start: 'mousedown',
	move: 'mousemove',
	end: 'mouseup'
};

var getPosition = function(event){
	var position = (event.touches && event.touches.length > 0) ? event.touches[0] : event;
	return {x: position.pageX, y: position.pageY};
};

this.MTScrollView = new Class({

	Implements: [Options, Events, Class.Binds],

	options: {
		axis: ['y'],
		showScrollIndicatorX: true,
		showScrollIndicatorY: true,
		pagingEnabled: false,
		bounces: true,

		eventElement: document,

		indicatorClass: 'indicator',
		indicatorShowingClass: 'showing',

		frameRate: (1000 / 60),
		minimumTrackingForDrag: 15,
		scrollAcceleration: 15,
		snapDeceleration: 0.05,
		snapAcceleration: 0.13,
		minVelocity: 0.05,
		minVelocityForDeceleration: 1,
		minVelocityForDecelerationWhenPaging: 4,
		maxVelocityForBouncingWithPaging: 20,
		pagingTransitionDuration: '0.25s',
		decelerationFrictionFactor: 0.950,
		boundsFrictionFactor: 0.6,
		maxAgeForPointHistory: 100,
		bottomCancelHeight: 20
	},

	isDragging: false,
	isDecelerating: false,
	scrollEnabled: true,
	touchesBeganFired: false,

	initialize: function(element, options){
		this.setOptions(options);
		if (this.options.pageSize != null)
			this.customPageSize = true;

		this.element = element = document.id(element);
		this.currentScroll = new MTPoint();

		this.content = new Element('div').adopt(element.getChildren()).inject(element);
		
		this.indicators = {};
		this.options.axis.each(function(axis){
			this.indicators[axis] = new Element('div', {
				'class': this.options.indicatorClass + ' ' + axis + '-axis-' + this.options.indicatorClass
			}).inject(this.content, 'after');
		}, this);

		this.attach().update();

		// gets the view ready to be translate, fixes initial stickyness.
		this.scrollToPoint(new MTPoint(0, 1));
		this.scrollToPoint(new MTPoint());
		
		this.addEvent('onWillBeginDragging', Element.disableCustomEvents);

		return this;
	},

	// Event attaching and handling
	attach: function(){
		[this.element, this.content].invoke('addEvent', 'webkitTransitionEnd', this.bound('transitionEnded'))
		this.element.addEventListener(events.start, this.bound('touchesBegan'), true);

		return this;
	},

	detach: function(){
		[this.element, this.content].invoke('removeEvent', 'webkitTransitionEnd', this.bound('transitionEnded'))
		this.element.removeEventListener(events.start, this.bound('touchesBegan'), true);

		return this;
	},

	attachTrackingEvents: function(){
		var element = this.options.eventElement;

		element.addEventListener(events.move, this.bound('touchesMoved'), true);
		element.addEventListener(events.end,	this.bound('touchesEnded'), true);
		element.addEventListener('touchcancel', this.bound('touchesCancelled'), true);
	},

	detachTrackingEvents: function(){
		var element = this.options.eventElement;

		element.removeEventListener(events.move, this.bound('touchesMoved'), true);
		element.removeEventListener(events.end, this.bound('touchesEnded'), true);
		element.removeEventListener('touchcancel', this.bound('touchesCancelled'), true);
	},

	// Sizing
	update: function(){
		this.contentSize = this.content.getSize();
		this.elementSize = this.element.getSize();
		this.windowHeight = window.getHeight();

		if (this.options.pagingEnabled && !this.customPageSize)
			this.options.pageSize = this.element.getSize();

		return this.contentSize = {
			x: (this.contentSize.x - this.elementSize.x).limit(0, this.contentSize.x),
			y: (this.contentSize.y - this.elementSize.y).limit(0, this.contentSize.y)
		};
	},

	// Event Callbacks
	transitionEnded: function(e){
		this.content.setStyle('-webkit-transition-duration', 0);
		this.fireEvent('scrollEnd', this);
	},

	touchesBegan: function(event){
		this.touchesBeganFired = true;
		if (!this.scrollEnabled) return;

		event.preventDefault();
		this.stopDecelerationAnimation();
		this.content.setStyle('-webkit-transition-duration', 0);
		this.snapToBounds(false);

		this.addPointToHistory(event.timeStamp, this.currentScroll, true);

		this.startScrollPosition = this.currentScroll.copy();
		this.startTouchPosition = MTPoint.fromElement(this.element, getPosition(event));

		this.isDragging = false;

		this.attachTrackingEvents();
	},

	touchesMoved: function(event){
		if (!this.touchesBeganFired){
			this.touchesBegan(event);
			return;
		}

		event.preventDefault();

		var position = getPosition(event);
		var touch_position = MTPoint.fromElement(this.element, position);
		var deltaPoint = touch_position.subtract(this.startTouchPosition);

		if (!this.isDragging){
			if (this.options.axis.some(function(axis){
				return Math.abs(deltaPoint[axis]) >= this.options.minimumTrackingForDrag;
			}.bind(this))){
				this.fireEvent('willBeginDragging', this);
				this.isDragging = true;
				this.firstDrag = true;
				this.showIndicators();
			}
		} else {
			if (this.firstDrag){
				this.firstDrag = false;
				this.startTouchPosition = touch_position;
				return;
			}

			if (this.windowHeight - this.options.bottomCancelHeight < position.y){
				this.touchesEnded(event, true);
				return;
			}

			var newPoint = this.startScrollPosition.copy(function(val, axis){
				return (this.options.axis.contains(axis)) ? val - deltaPoint[axis] : this.currentScroll[axis];
			}.bind(this));

			this.options.axis.each(function(axis){
				var contrained = newPoint[axis].limit(0, this.contentSize[axis]);

				if (this.options.bounces && contrained !== newPoint[axis])
					newPoint[axis] -= (newPoint[axis] - contrained) * this.options.boundsFrictionFactor;
				else
					newPoint[axis] = contrained;
			}, this);

			this.scrollToPoint(newPoint, false);
		}

		this.addPointToHistory(event.timeStamp, this.currentScroll.copy());
	},

	touchesEnded: function(event, dontDetach){
		if (dontDetach == null)
			this.detachTrackingEvents();

		if (this.isDragging){
			this.isDragging = false;
			event.stopPropagation();

			if (this.oldestPoint){
				this.currentScrollBeforeDeceleration = this.currentScroll.copy();
				this.startDecelerationAnimation();
			} else
				this.fireEvent('scrollEnd', this);

			this.fireEvent('dragEnd', this);
		}

		if (!this.isDecelerating){
			this.snapToBounds(true);
			this.hideIndicators();
		}
		this.touchesBeganFired = false;

		(function(){
			Element.enableCustomEvents();
		}).delay(1);
	},

	touchesCancelled: function(event){
		this.touchesEnded(event);
	},

	// Scrolling & Animation
	scrollToPoint: function(newPoint, animate){
		if (this.currentScroll.equals(newPoint))
			return;

		this.currentScroll = newPoint;

		if (!this.isDragging && !this.isDecelerating){
			this.currentScroll = this.currentScroll.copy(function(val, axis){
				return val.limit(0, this.contentSize[axis]);
			}.bind(this));
		}

		this.content.setTranslate3d(-this.currentScroll.x, -this.currentScroll.y);

		if (animate) this.content.setStyle('-webkit-transition-duration', this.options.pagingTransitionDuration);
		
		this.updateIndicators(animate);
	},

	snapToBounds: function(animate){
		var newPoint = new MTPoint();

		if (this.options.pagingEnabled){
			newPoint.x = (this.currentScroll.x / this.options.pageSize.x).round() * this.options.pageSize.x;
			newPoint.y = (this.currentScroll.y / this.options.pageSize.y).round() * this.options.pageSize.y;
		} else
		if (this.options.bounces){
			newPoint.x = Math.max(Math.min(this.contentSize.x, this.currentScroll.x), 0);
			newPoint.y = Math.max(Math.min(this.contentSize.y, this.currentScroll.y), 0);
		}

		if (!newPoint.equals(this.currentScroll))
			this.scrollToPoint(newPoint, animate);
	},

	startDecelerationAnimation: function(){
		if (this.options.bounces && (this.currentScroll.x > this.contentSize.x || this.currentScroll.y > this.contentSize.y ||
				this.currentScroll.x < 0 || this.currentScroll.y < 0)){
			return;
		}

		this.setDecelerationVelocity();

		this.minDecelerationPoint = new MTPoint();
		this.maxDecelerationPoint = new MTPoint(this.contentSize.x, this.contentSize.y);

		if (this.options.pagingEnabled){
			this.minDecelerationPoint.x = Math.max(0, Math.floor(this.currentScrollBeforeDeceleration.x / this.options.pageSize.x) * this.options.pageSize.x);
			this.minDecelerationPoint.y = Math.max(0, Math.floor(this.currentScrollBeforeDeceleration.y / this.options.pageSize.y) * this.options.pageSize.y);
			this.maxDecelerationPoint.x = Math.min(this.contentSize.x, Math.ceil(this.currentScrollBeforeDeceleration.x / this.options.pageSize.x) * this.options.pageSize.x);
			this.maxDecelerationPoint.y = Math.min(this.contentSize.y, Math.ceil(this.currentScrollBeforeDeceleration.y / this.options.pageSize.y) * this.options.pageSize.y);
		}

		this.penetrationDeceleration = this.options.snapDeceleration;
		this.penetrationAcceleration = this.options.snapAcceleration;

		if (this.options.pagingEnabled){
			this.penetrationDeceleration *= 5;
		}

		var min_velocity = this.options.pagingEnabled ? this.options.minVelocityForDecelerationWhenPaging : this.options.minVelocityForDeceleration;
		if (Math.abs(this.decelerationVelocity.x) > min_velocity || Math.abs(this.decelerationVelocity.y) > min_velocity){
			this.isDecelerating = true;
			this.decelerationTimer = this.decelerationFrame.delay(this.options.frameRate, this);
			this.lastFrame = new Date();
			this.fireEvent('willBeginDecelerating');
		}
	},

	stopDecelerationAnimation: function(){
		if (this.isDecelerating){
			this.fireEvent('didEndDecelerating', this).fireEvent('scrollEnd', this);
		}

		this.isDecelerating = false;
		clearTimeout(this.decelerationTimer);
	},

	decelerationFrame: function(fast){
		if (!this.isDecelerating)
			return;

		var now = new Date();
		var elapsed_time = now - this.lastFrame;
		var missed_frames = fast ? 0 : ((elapsed_time / this.options.frameRate).round() - 1);

		for (var i = 0; i < missed_frames; i++){
			this.decelerationFrame(true);
		}

		var newPoint = this.currentScroll.copy(function(val, axis){
			return val + this.decelerationVelocity[axis];
		}.bind(this));

		if (!this.options.bounces){
			var clipped = new MTPoint();
			this.options.axis.each(function(axis){
				clipped[axis] = Math.max(Math.min(this.contentSize[axis], newPoint[axis]), 0);
				if (clipped[axis] !== newPoint[axis]){
					newPoint[axis] = clipped[axis];
					this.decelerationVelocity[axis] = 0;
				}
			}, this);
		}

		if (fast)
			this.currentScroll = newPoint.copy();
		else
			this.scrollToPoint(newPoint);

		if (!this.options.pagingEnabled){
			this.decelerationVelocity.x *= this.options.decelerationFrictionFactor;
			this.decelerationVelocity.y *= this.options.decelerationFrictionFactor;
		}

		// todo make MTPoint a hash and use .some()
		if (!fast && Math.abs(this.decelerationVelocity.x) <= this.options.minVelocity
				&& Math.abs(this.decelerationVelocity.y) <= this.options.minVelocity){
			this.hideIndicators();
			this.decelerationAnimationCompleted();
			return;
		}

		if (!fast)
			this.decelerationTimer = this.decelerationFrame.delay(this.options.frameRate, this);

		if (this.options.bounces){
			var penetration_factor = new MTPoint();
			this.options.axis.each(function(axis){
				if (newPoint[axis] < this.minDecelerationPoint[axis])
					penetration_factor[axis] = this.minDecelerationPoint[axis] - newPoint[axis];
				else if (newPoint[axis] > this.maxDecelerationPoint[axis])
					penetration_factor[axis] = this.maxDecelerationPoint[axis] - newPoint[axis];

				if (penetration_factor[axis] !== 0){
					if (this.options.pagingEnabled && Math.abs(this.decelerationVelocity.x) >= this.options.maxVelocityForBouncingWithPaging){
						this.decelerationAnimationCompleted();
						return;
					}
					if (penetration_factor[axis] * this.decelerationVelocity[axis] <= 0)
						this.decelerationVelocity[axis] += penetration_factor[axis] * this.penetrationDeceleration;
					else
						this.decelerationVelocity[axis] = penetration_factor[axis] * this.penetrationAcceleration;
				}
			}, this);
		}

		if (!fast){
			this.lastFrame = now;
		}
	},

	decelerationAnimationCompleted: function(){
		this.stopDecelerationAnimation();

		if (this.options.pagingEnabled){
			this.scrollToPoint(new MTPoint(
				(this.currentScroll.x / this.options.pageSize.x).round() * this.options.pageSize.x,
				(this.currentScroll.y / this.options.pageSize.y).round() * this.options.pageSize.y
			));
		}
	},

	// Indicators
	updateIndicators: function(animate){
		var mapping = {
			x: ['width', 'left'],
			y: ['height','top']
		};

		this.options.axis.each(function(axis){
			var element = this.indicators[axis];
			if (element && this.options['showScrollIndicator' + axis.toUpperCase()]){
				var dim = this.elementSize[axis] * (this.elementSize[axis] / this.contentSize[axis]).limit(0,1);
				var pos = (this.elementSize[axis] - dim) * (this.currentScroll[axis] / this.contentSize[axis]);
				var scale = 1,
						scaleDiff = 0;

				if (this.startingIndicatorSizes == null){
					this.startingIndicatorSizes = {};
					this.startingIndicatorSizes[axis] = dim;
					element.setStyle(mapping[axis][0], dim);
				}

				if (this.currentScroll[axis] < 0){
					dim += this.currentScroll[axis];
					pos = 0; // todo inset margin option? or just css?
					scale = (dim / this.startingIndicatorSizes[axis]).limit(0,1);
					scaleDiff =	-(this.startingIndicatorSizes[axis] - dim)/2;
				} else if (this.currentScroll[axis] > this.contentSize[axis]){
					dim += this.contentSize[axis] - this.currentScroll[axis];
					pos = this.elementSize[axis] - dim - 10; // todo option or use a style get
					scale = (dim / this.startingIndicatorSizes[axis]).limit(0,1);
					scaleDiff = (this.startingIndicatorSizes[axis] - dim)/2;
				}

				if (animate)
					element.setStyle('-webkit-transition-duration', this.options.pagingTransitionDuration);
				else
					element.setStyle('-webkit-transition-duration', 0);

				if (this.options.indicatorHeightEffect)
					element.setStyle('webkitTransform', 'scale' + axis.toUpperCase() + '(' + scale + ')');

				var args = [pos + (this.options.indicatorHeightEffect ? scaleDiff : 0)];
				if (axis == 'y') args.unshift(0);
				if (axis == 'z') args.unshift(0, 0); // Yikes !

				element.setTranslate3d.apply(element, args);
			}
		}, this);
	},

	showIndicators: function(){
		this.updateIndicators();
		this.options.axis.each(function(axis){
			this.indicators[axis].addClass(this.options.indicatorShowingClass);
		}, this);
	},

	hideIndicators: function(){
		this.options.axis.each(function(axis){
			this.indicators[axis].removeClass(this.options.indicatorShowingClass);
		}, this);
	},

	// Scroll Helper Methods
	scrollToTop: function(){
		return this.scrollToPoint(new MTPoint(), true);
	},

	scrollTo: function(x, y, animate){
		return this.scrollToPoint(new MTPoint(x, y), (animate != null) ? animate : true);
	},


	// Speed Tracking
	addPointToHistory: function(time, point, fast){
		this.latestPoint = point;
		this.latestTime = time;

		this.pointTimer = (function(){
			this.oldestPoint = point;
			this.oldestTime = time;
		}).delay(fast ? 0 : this.options.maxAgeForPointHistory, this);
	},

	finalDuration: function(){
		return (this.oldestTime - this.latestTime) / this.options.scrollAcceleration;
	},

	finalDistance: function(){
		return this.oldestPoint.subtract(this.latestPoint);
	},

	setDecelerationVelocity: function(){
		this.decelerationVelocity = this.finalDistance().copy(function(val){
			return val / this.finalDuration();
		}.bind(this));
	},

	// Enabling & Disabling
	cancelScroll: function(){
		if (this.isDragging){
			this.isDragging = false;
			this.snapToBounds();
			this.fireEvent('scrollEnd', this);
		}

		this.hideIndicators();
		this.detachTrackingEvents();
	},

	disableScroll: function(){
		this.cancelScroll();
		this.scrollEnabled = false;
	},

	enableScroll: function(){
		this.scrollEnabled = true;
	}

});

})();
