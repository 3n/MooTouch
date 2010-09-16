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

// MTPoint helper class
// Represents a point with x,y,z axis. Default value is 0.
function MTPoint (x, y, z) {
  if (typeOf(x) == 'object'){
    z = x.z;
    y = x.y;
    x = x.x;
  }
  this.x = (x != null && !isNaN(x)) ? x : 0;
  this.y = (y != null && !isNaN(y)) ? y : 0;
  this.z = (z != null && !isNaN(z)) ? z : 0;
};

MTPoint.prototype.equals = function (pointB) {
  return (this.x === pointB.x && this.y === pointB.y);
};
MTPoint.prototype.minus = function (pointB) {
  return new MTPoint(
    this.x - pointB.x,
    this.y - pointB.y
  );
};
MTPoint.prototype.plus = function (pointB) {
  return new MTPoint(
    this.x + pointB.x,
    this.y + pointB.y
  );
};

MTPoint.prototype.copy = function(fn){
  if (fn)
    return new MTPoint(fn(this.x, 'x'), fn(this.y, 'y'));
  else
    return new MTPoint(this.x, this.y);
};

MTPoint.fromEventInElement = function (event, element) {
  event = MT.getEvent(event);
  var wkPoint = window.webkitConvertPointFromPageToNode(element, new WebKitPoint(event.pageX, event.pageY));
  return new MTPoint(wkPoint.x, wkPoint.y);
};