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

import Deferred from './promise/deferred';
import GIF from '../3p/gif.js/gif';
import pushAsync from './async-modules/push-async';
import renderOnCanvas from './canvas-renderer/renderer';

function playback(win, width, height, frames, rendererOptions, onFrame) {
  const { promise, resolve } = new Deferred();
  playFrame(win, width, height, frames, rendererOptions, onFrame, resolve);
  return promise;
}

function playFrame(win, width, height, frames, rendererOptions, onFrame, done) {
  const [delay, texture] = frames.shift();
  const cookedRendererOptions = Object.assign({ texture }, rendererOptions);

  renderOnCanvas(win.document, width, height, cookedRendererOptions)
    .then(canvas => onFrame(delay, canvas))
    .then(() => {
      if (frames.length == 0) {
        done();
        return;
      }

      win.requestAnimationFrame(() => {
        playFrame(win, width, height, frames, rendererOptions, onFrame, done);
      });
    });
}

function encodeAsGif(
  win,
  width,
  height,
  frames,
  rendererOptions,
  unusedScale = 1
) {
  const { promise, resolve } = new Deferred();

  const gif = new GIF({
    workers: 2,
    quality: 10,
  });

  gif.on('finished', blob => {
    resolve(win.URL.createObjectURL(blob));
  });

  playback(win, width, height, frames, rendererOptions, (delay, canvas) => {
    gif.addFrame(canvas, { delay });
  }).then(() => {
    gif.render();
  });

  return promise;
}

pushAsync(self, { encodeAsGif });
