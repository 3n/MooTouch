/*
--- 
authors: 
- 3n
provides: [MTReplaceClicks]
requires: 
  - MTCore
  - MTTapEvent
license: MIT-style
description: Replaces clicks with taps. Thanks to Christopher Pojer.
...
*/

// if (MT.supportsTouches) (function(){
//   delete Element.NativeEvents['click'];
// 
//   Element.Events.click = {
//    base: 'tap'
//   };
// })();