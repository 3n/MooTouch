/*
---

name: MTPoint

description: A simple 3d point class with some helper methods.

authors: Ian Collins (@3n)

license: MIT-style license.

requires: [MTCore]

provides: MTPoint

...
*/

var MTPoint = function MTPoint(x, y, z){
	if (x != null && !isNaN(x)) this.x = x;
	if (y != null && !isNaN(y)) this.y = y;
	if (z != null && !isNaN(z)) this.z = z;
};

MTPoint.prototype = {

	x: 0, y: 0, z: 0,

	equals: function(point){
		return (this.x == point.x && this.y == point.y && this.z == point.z);
	},

	subtract: function(point){
		return new MTPoint(
			this.x - point.x,
			this.y - point.y,
			this.z - point.z
		);
	},

	add: function(point){
		return new MTPoint(
			this.x + point.x,
			this.y + point.y,
			this.z + point.z
		);
	},

	clone: function(fn){
		if (fn) return new MTPoint(fn.call(this, this.x, 'x'), fn.call(this, this.y, 'y'), fn.call(this, this.z, 'z'));
		return new MTPoint(this.x, this.y, this.z);
	}

};

MTPoint.fromElement = function(element, position){
	var point = window.webkitConvertPointFromPageToNode(element, new WebKitPoint(position.x, position.y));
	return new MTPoint(point.x, point.y);
};
