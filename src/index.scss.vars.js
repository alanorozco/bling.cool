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
import once from 'lodash.once';

const lighten = ([r, g, b, a], amount) => [
  ...[r, g, b].map(c =>
    Math.min(255, Math.max(0, Math.round(c + amount * 255)))
  ),
  a,
];

const alpha = ([r, g, b], a) => [r, g, b, a];

const darken = (color, amount) => lighten(color, -amount);

const marginUnit = '18px';
const lightboxAnimationDuration = '300ms';

const blue = [0, 68, 214, 1];
const lightBlue = lighten(blue, 0.2);
const verylightBlue = lighten(blue, 0.4);
const transparentBlue = alpha(lighten(blue, 0.5), 0.5);
const caretBlue = alpha(blue, 0.8);

const grayish = [180, 186, 194, 1];
const lightGrayish = lighten(grayish, 0.15);
const darkGrayish = darken(grayish, 0.2);

export const vars = {
  marginUnit,
  lightboxAnimationDuration,
  blue,
  lightBlue,
  verylightBlue,
  transparentBlue,
  caretBlue,
  grayish,
  lightGrayish,
  darkGrayish,
};

function forCss(val) {
  if (Array.isArray(val)) {
    const [r, g, b, a] = val;
    if (a === 1) {
      return `#${[r, g, b]
        .map(c => {
          const hex = c.toString(16);
          if (hex.length < 2) return `0${hex}`;
          return hex;
        })
        .join('')}`;
    }
    return `rgba(${[r, g, b, a].join(',')})`;
  }
  return val;
}

export const css = once(() => {
  const out = {};
  for (const name of Object.keys(vars)) {
    out[name] = forCss(vars[name]);
  }
  return out;
});
