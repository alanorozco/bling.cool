/**
 * Copyright 2019 Alan Orozco <alan@orozco.xyz>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// https://stackoverflow.com/a/17243070
function RGBtoHSV(r, g, b) {
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    h,
    s = max === 0 ? 0 : d / max,
    v = max / 255;

  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
  }

  return [h, s, v];
}

// https://stackoverflow.com/a/17243070
function HSVtoRGB(h, s, v) {
  let r, g, b, i, f, p, q, t;
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

exports.hueRotate = function hueRotate(color, turns) {
  let [h, s, v] = RGBtoHSV(...color);
  h += turns;
  h %= 1;
  return HSVtoRGB(h, s, v);
};
