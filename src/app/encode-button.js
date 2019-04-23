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

const { getLengthNumeral } = require('../../lib/css');
const { textureFramesUrl } = require('../../lib/textures');

const fetchFrames = textureId =>
  fetch(textureFramesUrl(textureId)).then(response => response.json());

module.exports = class EncodeButton {
  constructor(win, state, { modules }) {
    const button = win.document.querySelector('.encode-button');
    const loader = win.document.querySelector('.loader');

    button.addEventListener('click', () => {
      const framesPromise = fetchFrames(state.get('texture'));
      const EncoderPromise = modules.get('Encoder');

      loader.classList.add('active');

      const { width, height } = win.document
        .querySelector('.editable-sentinel')
        .getBoundingClientRect();

      Promise.all([framesPromise, EncoderPromise])
        .then(([frames, Encoder]) =>
          new Encoder(win).asGif({
            frames,
            width,
            height,
            hue: state.get('hue'),
            font: state.get('font'),
            fontSize: getLengthNumeral(
              win.document.querySelector('#editable').style.fontSize
            ),
            text: state.get('text'),
          })
        )
        .then(() => {
          loader.classList.remove('active');
        });
    });
  }
};
