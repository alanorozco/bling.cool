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
import { hueRotate } from './colors';
import { splitLines } from './text';
import loadImage from '../dom/load-image';
import memoize from 'lodash.memoize';

const hueRotateMemoized = memoize(hueRotate, (...args) => args.join(','));

const fontDef = (name, size) => `${size}px '${name}', sans-serif`;
const rgba = (...parts) => `rgba(${parts.join(',')})`;

function createCanvas(doc, width, height) {
  const canvas = doc.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
}

function fillText(
  canvas,
  ctx,
  fontSize,
  fontName,
  lines,
  margin,
  offsetX = 0,
  offsetY = 0
) {
  const lineHeight = Math.floor((canvas.height - margin * 2) / lines.length);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = fontDef(fontName, fontSize);
  lines.forEach((text, i) => {
    ctx.fillText(
      text,
      canvas.width / 2 + offsetX,
      margin + lineHeight / 2 + i * lineHeight + offsetY,
      canvas.width - margin * 2
    );
  });
}

function drawTextShadow(
  canvas,
  ctx,
  fontSize,
  fontName,
  lines,
  margin,
  textShadow,
  background
) {
  textShadow.forEach(([x, y, spread, color]) => {
    ctx.save();
    ctx.beginPath();
    ctx.globalCompositeOperation = 'destination-over';

    const [r, g, b, a = 1] = color;

    if (spread == 0) {
      ctx.fillStyle = rgba(r, g, b, a);
      fillText(canvas, ctx, fontSize, fontName, lines, margin, x, y);
    } else {
      // Hack to remove separate layer text jaggies.
      ctx.fillStyle = rgba(...background.concat(a));
      ctx.shadowColor = rgba(r, g, b, 1);
      ctx.shadowOffsetX = x;
      ctx.shadowOffsetY = y;
      ctx.shadowBlur = spread;
      fillText(canvas, ctx, fontSize, fontName, lines, margin);
    }

    ctx.restore();
  });
}

function drawTexturedText(
  canvas,
  ctx,
  fontSize,
  fontName,
  lines,
  margin,
  texture
) {
  ctx.save();
  ctx.beginPath();
  fillText(canvas, ctx, fontSize, fontName, lines, margin);
  ctx.fill();
  ctx.beginPath();
  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(texture, 0, 0);
  ctx.restore();
}

const renderTexture = memoize(
  (doc, texture, width, height) => {
    const { canvas, ctx } = createCanvas(doc, width, height);
    return loadImage(doc, texture).then(img => {
      const { naturalWidth, naturalHeight } = img;
      const imgsPerRow = Math.ceil(width / naturalWidth);
      const imgsPerColumn = Math.ceil(height / naturalHeight);

      for (let x = 0; x < imgsPerRow; x++) {
        for (let y = 0; y < imgsPerColumn; y++) {
          ctx.drawImage(img, x * naturalWidth, y * naturalHeight);
        }
      }

      return canvas;
    });
  },
  (_unusedDoc, ...rest) => rest.join(',')
);

function hueRotatePixels(canvas, ctx, turns) {
  if (turns == 0 || turns == 1) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imgData;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];

    if (a == 0) {
      continue;
    }

    const [r, g, b] = hueRotateMemoized(data.slice(i, i + 3), turns);

    data[i + 0] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }

  ctx.putImageData(imgData, 0, 0);
}

function renderSolidBackground(canvas, ctx, color) {
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = rgba(...color);
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export default function renderOnCanvas(doc, width, height, options) {
  const {
    background,
    font,
    fontSize,
    hue,
    margin,
    text,
    textShadow,
    texture,
  } = options;

  const [fontName] = expandFontId(font);

  const { canvas, ctx } = createCanvas(
    doc,
    Math.ceil(width),
    Math.ceil(height)
  );

  ctx.font = fontDef(fontName, fontSize);
  const lines = splitLines(ctx, text, canvas.width, margin);

  return renderTexture(doc, texture, width, height).then(texture => {
    drawTexturedText(canvas, ctx, fontSize, fontName, lines, margin, texture);
    drawTextShadow(
      canvas,
      ctx,
      fontSize,
      fontName,
      lines,
      margin,
      textShadow,
      background
    );

    hueRotatePixels(canvas, ctx, hue);
    renderSolidBackground(canvas, ctx, background.concat(1));

    return canvas;
  });
}
