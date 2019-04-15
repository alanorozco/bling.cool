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

const pushAsync = require('./app/push-async');
const html2Canvas = require('html2canvas');

pushAsync(self, {
  encoder: class Encoder {
    constructor(unusedDoc, state) {
      this.state_ = state;
      this.playbackPromise_ = null;
      this.playbackResolver_ = null;
    }

    playback_(frames, cb) {
      if (!this.playbackPromise_) {
        this.playbackPromise_ = new Promise(resolve => {
          this.playbackResolver_ = resolve;
        });
      }

      this.state_.set(this, { texture: frames.shift() });

      Promise.resolve(cb()).then(() => {
        if (frames.length == 0) {
          this.playbackResolver_();
          return;
        }
        setTimeout(() => {
          this.playback_(frames, cb);
        }, 100);
      });

      return this.playbackPromise_;
    }

    asGif(frames) {
      const gif = new GIF({
        workers: 2,
        quality: 10,
      });
      gif.on('finished', blob => {
        window.open(URL.createObjectURL(blob));
      });

      this.playback_(frames, () =>
        html2Canvas(document.querySelector('.editable-wrap')).then(canvas => {
          gif.addFrame(canvas, {
            // TODO: Each texture has different delay params, extract in build
            // process.
            delay: 100,
          });
        })
      ).then(() => {
        gif.render();
      });
    }
  },
});
