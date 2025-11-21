export function getBezierPoint(t, p0, p1, p2, p3) {
   var t2 = t * t;
   var t3 = t2 * t;
   var omt = 1 - t;
   var omt2 = omt * omt;
   var omt3 = omt2 * omt;


   var x = omt3 * p0[0] + 3 * omt2 * t * p1[0] + 3 * omt * t2 * p2[0] + t3 * p3[0];
   var y = omt3 * p0[1] + 3 * omt2 * t * p1[1] + 3 * omt * t2 * p2[1] + t3 * p3[1];
   return [x, y];
}