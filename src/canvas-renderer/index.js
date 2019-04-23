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

const { expandFontId } = require('../../lib/fonts');
const loadPromise = require('../events/load-promise');

const BLUE = [0, 68, 214];

function createCanvas(doc, width, height) {
  const canvas = doc.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
}

function img(doc, src) {
  const img = doc.createElement('img');
  const promise = loadPromise(img);
  img.src = src;
  return promise;
}

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

function hueRotate(color, turns) {
  let [h, s, v] = RGBtoHSV(...color);
  h += turns;
  h %= 1;
  return HSVtoRGB(h, s, v);
}

module.exports = class CanvasRenderer {
  constructor(win) {
    this.win_ = win;
    this.text_ = null;
    this.font_ = null;
    this.img_ = null;
  }

  setText(text, font, hue) {
    this.text_ = text;
    this.hue_ = hue;
    this.font_ = font;
  }

  setTexture(texture) {
    this.img_ = img(this.win_.document, texture);
  }

  renderTexture_(width, height) {
    const { canvas, ctx } = createCanvas(this.win_.document, width, height);

    return this.img_.then(img => {
      const { naturalWidth, naturalHeight } = img;
      const imgsPerRow = Math.ceil(canvas.width / naturalWidth);
      const imgsPerColumn = Math.ceil(canvas.height / naturalHeight);

      for (let x = 0; x < imgsPerRow; x++) {
        for (let y = 0; y < imgsPerColumn; y++) {
          ctx.drawImage(img, x * naturalWidth, y * naturalHeight);
        }
      }

      ctx.globalCompositeOperation = 'destination-over';

      ctx.fillStyle = `rgba(${BLUE.join(',')},1)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      return canvas;
    });
  }

  render() {
    const [width, height] = [600, 400];
    const { canvas, ctx } = createCanvas(this.win_.document, width, height);
    const [fontName] = expandFontId(this.font_);

    ctx.filter = `hue-rotate(${360 * this.hue_}deg)`;

    return this.renderTexture_(width, height).then(texture => {
      ctx.save();
      ctx.beginPath();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `72px '${fontName}', sans-serif`;
      ctx.fillText(
        this.text_,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
      );
      ctx.fill();
      ctx.beginPath();
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(texture, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `72px '${fontName}', sans-serif`;
      ctx.shadowColor = `rgba(${hueRotate(BLUE, this.hue_).join(',')},0.48)`;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
      ctx.shadowBlur = 12;
      ctx.fillText(
        this.text_,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width
      );
      // ctx.fill();
      ctx.restore();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return canvas;
    });
  }
};
