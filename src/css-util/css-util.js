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

/* global scssVar */

import { getLengthNumeral } from '../../lib/css';

const shadowAxisMax = 12;
const shadowBlurMax = 18;
const shadow3dSteps = 6;
const shadow3dStepDarknessIncrease = 0.03;

const percentage255 = amount => 255 * amount;
const darkenChanel = (channel, amount) =>
  Math.max(0, parseInt(channel - percentage255(amount), 10));

const darken = ([r, g, b], amount) => [
  Math.max(0, darkenChanel(r, amount)),
  Math.max(0, darkenChanel(g, amount)),
  Math.max(0, darkenChanel(b, amount)),
];

const pxInt = n => `${parseInt(n, 10)}px`;

const textShadow = (x, y, blur, color) =>
  [`rgba(${color.join(',')})`, pxInt(x), pxInt(y), pxInt(blur)].join(' ');

const fx3dShadow = baseColor =>
  Array(shadow3dSteps)
    .fill(null)
    .map((_, y) =>
      textShadow(
        0,
        y + 1,
        0,
        darken(
          baseColor,
          shadow3dStepDarknessIncrease * (shadow3dSteps - y)
        ).concat([1])
      )
    );

export function composeTextShadow(direction, shadowIs3d, is3d) {
  const blue = scssVar('blue').slice(0, 3);
  const lightBlue = scssVar('lightBlue').slice(0, 3);
  const axis = shadowAxisMax * direction;
  const x = axis;
  const y = axis + (axis > 0 && is3d ? shadow3dSteps : 0);
  const fx3d = is3d ? fx3dShadow(blue) : [];
  const maxShadowOpacity = shadowIs3d ? 0.4 : 0.8;
  const fxShadow = textShadow(
    x,
    y,
    shadowIs3d ? shadowBlurMax * Math.abs(direction) : 0,
    lightBlue.concat([
      maxShadowOpacity - 0.5 * maxShadowOpacity * Math.abs(direction),
    ])
  );
  return fx3d.concat([fxShadow]).join(',');
}

export const decomposeTextShadow = textShadow =>
  textShadow
    .replace(
      /rgba?\(([^\)]*)\)/g,
      (_, channels) => `rgba(${channels.replace(/\s*,\s*/g, '|')}`
    )
    .split(',')
    .map(s => {
      const [rgba, x, y, spread] = s.trim().split(/\s+/g);
      const color = rgba
        .replace(/^rgba?\(.+\)$/, '$1')
        .split('|')
        .map(getLengthNumeral);
      return [
        getLengthNumeral(x),
        getLengthNumeral(y),
        getLengthNumeral(spread),
        color,
      ];
    });

export const defaultTextShadow = () => composeTextShadow(0.5, false, true);
