/**
 * Copyright 2020 Alan Orozco <alan@orozco.xyz>
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

// The following count is dynamically generated at build-time.
// If this name changes, so must the `bling-count-texture-files` babel plugin.
const textureAssetsCountReplaceMe = 1;

// Indirection for naïve scope safety.
const textureAssetsCount = textureAssetsCountReplaceMe;

export const randomTill = n => Math.floor(n * Math.random());
export const pickRandom = arr => arr[randomTill(arr.length)];

export const coinToss = () => Math.random() > 0.5;

function randomShadowDirection() {
  const direction = (Math.random() * 2 - 1) * 0.8;
  // Around 0 is not very visible, special case it
  return direction < 0.3 && direction > -0.3
    ? randomShadowDirection()
    : direction;
}

export const randomFont = () =>
  pickRandom(
    Array.from(document.querySelectorAll('.font-option'))
  ).getAttribute('data-value');

export const shuffleStyle = ({
  hue,
  texture,
  shadowDirection,
  shadowIs3d,
  is3d,
  font,
} = {}) => ({
  hue: hue || Math.random(),
  texture: texture || randomTill(textureAssetsCount),
  shadowDirection: shadowDirection || randomShadowDirection(),
  shadowIs3d: shadowIs3d || coinToss(),
  is3d: is3d || coinToss(),
  font: font || randomFont(),
});
