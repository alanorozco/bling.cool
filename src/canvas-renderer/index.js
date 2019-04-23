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
const { hueRotate } = require('./colors');
const { splitLines } = require('./text');
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

function fillText(canvas, ctx, fontSize, fontName, lines) {
  const lineHeight = Math.floor(canvas.height / lines.length);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontSize}px '${fontName}', sans-serif`;
  lines.forEach((text, i) => {
    ctx.fillText(
      text,
      canvas.width / 2,
      lineHeight / 2 + i * lineHeight,
      canvas.width
    );
  });
}

module.exports = class CanvasRenderer {
  constructor(win) {
    this.win_ = win;

    this.options_ = null;
    this.img_ = null;
  }

  setOptions(options) {
    this.options_ = options;
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

  render(width, height) {
    const { font, fontSize, text, hue } = this.options_;
    const [fontName] = expandFontId(font);
    const { canvas, ctx } = createCanvas(
      this.win_.document,
      Math.ceil(width),
      Math.ceil(height)
    );

    // TODO: This won't work on Safari. Redraw texture.
    ctx.filter = `hue-rotate(${360 * hue}deg)`;

    ctx.font = `${fontSize}px '${fontName}', sans-serif`;
    const lines = splitLines(ctx, text, canvas.width);

    return this.renderTexture_(width, height).then(texture => {
      // clipped text.
      ctx.save();
      ctx.beginPath();
      fillText(canvas, ctx, fontSize, fontName, lines);
      ctx.fill();
      ctx.beginPath();
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(texture, 0, 0);
      ctx.restore();

      // text shadow.
      ctx.save();
      ctx.beginPath();
      ctx.globalCompositeOperation = 'destination-over';
      ctx.shadowColor = `rgba(${hueRotate(BLUE, hue).join(',')},0.48)`;
      ctx.shadowOffsetX = 6;
      ctx.shadowOffsetY = 6;
      ctx.shadowBlur = 12;
      fillText(canvas, ctx, fontSize, fontName, lines);
      ctx.restore();

      // white background
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      return canvas;
    });
  }
};
