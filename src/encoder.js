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

import CanvasRenderer from './canvas-renderer/renderer';
import Deferred from './promise/deferred';
import pushAsync from './async-modules/push-async';

class Encoder {
  constructor(win) {
    this.win_ = win;
    this.renderer_ = new CanvasRenderer(win);
  }

  playback_(
    {
      frames,
      text = 'Hola',
      textShadow,
      background,
      margin,
      font = 'Helvetica',
      fontSize = 72,
      hue = 0,
      width,
      height,
    },
    onFrame
  ) {
    const { promise, resolve } = new Deferred();
    this.renderer_.setOptions({
      text,
      textShadow,
      font,
      fontSize,
      margin,
      hue,
      background,
    });
    this.playFrame_(width, height, frames, onFrame, resolve);
    return promise;
  }

  playFrame_(width, height, frames, onFrame, done) {
    const [delay, texture] = frames.shift();

    this.renderer_.setTexture(texture);

    this.renderer_
      .render(width, height)
      .then(canvas => onFrame(delay, canvas))
      .then(() => {
        if (frames.length == 0) {
          done();
          return;
        }

        this.win_.requestAnimationFrame(() => {
          this.playFrame_(width, height, frames, onFrame, done);
        });
      });
  }

  asGif(options) {
    const { promise, resolve } = new Deferred();
    const { GIF } = this.win_;

    const gif = new GIF({
      workers: 2,
      quality: 10,
    });

    gif.on('finished', blob => {
      resolve(this.win_.URL.createObjectURL(blob));
    });

    this.playback_(options, (delay, canvas) => {
      gif.addFrame(canvas, { delay });
    }).then(() => {
      gif.render();
    });

    return promise;
  }
}

pushAsync(self, { Encoder });
