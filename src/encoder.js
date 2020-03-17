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
  const cancelled = { cancelled: false };
  const cancel = () => {
    cancelled.cancelled = true;
  };
  playFrame(
    win,
    width,
    height,
    frames,
    rendererOptions,
    onFrame,
    resolve,
    cancelled
  );
  return { promise, cancel };
}

function playFrame(
  win,
  width,
  height,
  frames,
  rendererOptions,
  onFrame,
  done,
  cancelled
) {
  if (cancelled.cancelled) {
    return;
  }

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
        playFrame(
          win,
          width,
          height,
          frames,
          rendererOptions,
          onFrame,
          done,
          cancelled
        );
      });
    });
}

function encodeAsGif(win, width, height, frames, rendererOptions) {
  const { promise, resolve } = new Deferred();

  let gif = new GIF({
    workers: 2,
    quality: 10,
  });

  gif.on('finished', blob => {
    resolve(win.URL.createObjectURL(blob));
  });

  // Copy to modify
  frames = [].concat(frames);

  const { promise: playbackPromise, cancel: cancelPlayback } = playback(
    win,
    width,
    height,
    frames,
    rendererOptions,
    (delay, canvas) => {
      gif.addFrame(canvas, { delay });
    }
  );

  playbackPromise.then(() => {
    gif.render();
  });

  return [
    promise,
    () => {
      gif.abort();
      cancelPlayback();
      gif = null;
    },
  ];
}

function encodeAsMp4(win, width, height, frames, rendererOptions) {
  const { promise, resolve } = new Deferred();

  // Copy to modify
  frames = [].concat(frames);

  const outputFrames = [];

  let i = 0;
  const { promise: playbackPromise, cancel: cancelPlayback } = playback(
    win,
    width,
    height,
    frames,
    rendererOptions,
    (delay, canvas) => {
      // TODO: delay
      canvas.toBlob(blob => {
        blob.arrayBuffer().then(data => {
          outputFrames.push({ name: `${i++}.jpg`, data });
        });
      }, 'image/jpeg');
    }
  );

  let worker;

  const format = 'mp4';

  const ffmpegArguments = [
    '-loglevel',
    'debug',
    // '-framerate',
    // '1',
    '-i',
    '%d.jpg',
    // '-c:v',
    // 'libvpx',
    // '-pix_fmt',
    // 'yuv420p',
    // Dimensions have to be divisible by two for some reason
    '-s',
    `${width - (width % 2)}x${height - (height % 2)}`,
    `out.${format}`,
  ];

  let stderr = '';
  playbackPromise.then(() => {
    worker = new Worker(`/ffmpeg-worker-${format}.js`);

    worker.onmessage = e => {
      const { type, data } = e.data;
      console.log(type);
      switch (type) {
        case 'ready':
          worker.postMessage({
            type: 'run',
            MEMFS: [].concat(outputFrames),
            arguments: ffmpegArguments,
          });
          break;
        case 'stderr':
          stderr += data + '\n';
          break;
        case 'done':
          console.log('done', data);
          break;
        case 'exit':
          console.log('Process exited with code', data);
          if (data > 0) {
            console.error(stderr);
          }
          worker.terminate();
          worker = null;
          stderr = null;
          break;
      }
    };
  });

  return [
    promise,
    () => {
      if (worker) {
        worker.terminate();
        worker = null;
        stderr = null;
      }
      cancelPlayback();
    },
  ];
}

pushAsync(self, { encodeAsGif, encodeAsMp4 });
