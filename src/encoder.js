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

const CanvasRenderer = require('./canvas-renderer');
const Deferred = require('./promise/deferred');
const pushAsync = require('./app/push-async');

let downloadLink;

function createDownloadLink(doc) {
  const a = doc.createElement('a');
  a.style.display = 'none';
  doc.body.appendChild(a);
  return a;
}

function download(win, blob, fileName) {
  const url = win.URL.createObjectURL(blob);
  downloadLink = downloadLink || createDownloadLink(win.document);
  downloadLink.href = url;
  downloadLink.download = fileName;
  downloadLink.click();
  win.URL.revokeObjectURL(url);
}

function display(win, blob) {
  const url = win.URL.createObjectURL(blob);
  const img = win.document.createElement('img');
  img.src = url;
  img.style.position = 'absolute';
  img.style.zIndex = 1000;
  win.document.body.insertBefore(img, win.document.body.firstElementChild);
}

const toFileName = text =>
  `${text
    .toLowerCase()
    .trim()
    // TODO: this regex discriminates non-ascii readable characters
    .replace(/[^a-z]+/g, '-')}.gif`;

class Encoder {
  constructor(win) {
    this.win_ = win;
    this.renderer_ = new CanvasRenderer(win);
  }

  playback_({ frames, text, font, hue }, onFrame) {
    const { promise, resolve } = new Deferred();
    this.renderer_.setText(text, font, hue);
    this.playFrame_(frames, onFrame, resolve);
    return promise;
  }

  playFrame_(frames, onFrame, done) {
    const [delay, texture] = frames.shift();

    this.renderer_.setTexture(texture);

    this.renderer_
      .render()
      .then(canvas => onFrame(delay, canvas))
      .then(() => {
        if (frames.length == 0) {
          done();
          return;
        }

        this.win_.requestAnimationFrame(() => {
          this.playFrame_(frames, onFrame, done);
        });
      });
  }

  asGif(options) {
    const { promise, resolve } = new Deferred();
    const { text } = options;
    const gif = new GIF({
      workers: 2,
      quality: 10,
    });

    gif.on('finished', blob => {
      resolve();
      // download(this.win_, blob, toFileName(text));
      display(this.win_, blob);
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
