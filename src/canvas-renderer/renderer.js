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

import { expandFontId } from '../../lib/fonts';
import { getLengthNumeral } from '../../lib/css';
import { hueRotate } from './colors';
import { splitLines } from './text';
import loadImage from '../dom/load-image';
import scssVars from 'variables!../index.scss';

const BLUE = [
  getLengthNumeral(scssVars.blueR),
  getLengthNumeral(scssVars.blueG),
  getLengthNumeral(scssVars.blueG),
];

const MARGIN = 2 * getLengthNumeral(scssVars.marginUnit);

// Same as .editable-shadow in index.scss
const SHADOW = {
  x: getLengthNumeral(scssVars.shadowX),
  y: getLengthNumeral(scssVars.shadowY),
  blur: getLengthNumeral(scssVars.shadowBlur),
  opacity: getLengthNumeral(scssVars.shadowOpacity),
};

const fontDef = (name, size) => `${size}px '${name}', sans-serif`;
const rgba = (...parts) => `rgba(${parts.join(',')})`;

function createCanvas(doc, width, height) {
  const canvas = doc.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
}

function fillText(canvas, ctx, fontSize, fontName, lines, margin) {
  const lineHeight = Math.floor((canvas.height - margin * 2) / lines.length);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = fontDef(fontName, fontSize);
  lines.forEach((text, i) => {
    ctx.fillText(
      text,
      canvas.width / 2,
      margin + lineHeight / 2 + i * lineHeight,
      canvas.width - margin * 2
    );
  });
}

export default class CanvasRenderer {
  constructor(win) {
    this.win_ = win;

    this.options_ = null;
    this.img_ = null;
  }

  setOptions(options) {
    this.options_ = options;
  }

  setTexture(texture) {
    this.img_ = loadImage(this.win_.document, texture);
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

      ctx.fillStyle = rgba(...BLUE.concat([1]));
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const { data } = imgData;

      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b] = hueRotate(data.slice(i, i + 3), this.options_.hue);

        data[i + 0] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }

      ctx.putImageData(imgData, 0, 0);

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

    ctx.font = fontDef(fontName, fontSize);
    const lines = splitLines(ctx, text, canvas.width, MARGIN);

    return this.renderTexture_(width, height).then(texture => {
      // clipped text.
      ctx.save();
      ctx.beginPath();
      fillText(canvas, ctx, fontSize, fontName, lines, MARGIN);
      ctx.fill();
      ctx.beginPath();
      ctx.globalCompositeOperation = 'source-in';
      ctx.drawImage(texture, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.globalCompositeOperation = 'destination-over';

      // Hack to remove separate layer text jaggies.
      ctx.fillStyle = rgba(1, 1, 1, SHADOW.opacity);
      ctx.shadowColor = rgba(...hueRotate(BLUE, hue).concat([1]));

      ctx.shadowOffsetX = SHADOW.x;
      ctx.shadowOffsetY = SHADOW.y;
      ctx.shadowBlur = SHADOW.blur;
      fillText(canvas, ctx, fontSize, fontName, lines, MARGIN);
      ctx.restore();

      // white background
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      return canvas;
    });
  }
}
