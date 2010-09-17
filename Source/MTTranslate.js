/*
---

name: MTTranslate

description: Element extensions for getting and setting the translate3d css property.

authors: Ian Collins (@3n)

license: MIT-style license.

requires: [MTPoint]

provides: MTTranslate

...
*/

Element.implement({

	getTranslate3d: function(){
		var match = this.getStyle('-webkit-transform').match(/translate3d\(([\.\-0-9]+)[^\.\-0-9]+([\.\-0-9]+)[^\.\-0-9]+([\.\-0-9]+)[^\.\-0-9]+/);
		if (!match || match.length !== 4) return null;
		return new MTPoint(match[1].toInt(), match[2].toInt(), match[3].toInt());
	},

	setTranslate3d: function(x, y, z){
		var point = this.getTranslate3d() || new MTPoint(0, 0, 0);
		x = (x != null) ? x : point.x;
		y = (y != null) ? y : point.y;
		z = (z != null) ? z : point.z;

		if (new MTPoint(x, y, z).equals(point)) return this;

		var transform = this.getStyle('-webkit-transform'),
			previousTransform = '' + (transform != 'none' ? transform : '').replace(/translate3d\([^)]+\)/, '');

		this.setStyle('-webkit-transform', previousTransform + ' translate3d(' + x + 'px,' + y + 'px,' + z + 'px)');
		return this;
	}

});
