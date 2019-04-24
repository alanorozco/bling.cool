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

import { dirs } from '../config';
import { fontId } from '../lib/fonts';
import { FontLoader } from './fonts/font-loader';
import { textureUrl } from '../lib/textures';
import App from './app/app';
import focusAtEnd from './input/focus-at-end';
import phrases from '../artifacts/phrases';

const defaultFontSize = 72;

// The following count is dynamically generated at build-time.
// If this name changes, so must the `bling-count-texture-files` babel plugin.
const textureAssetsCountReplaceMe = 1;

// Indirection for naïve scope safety.
const textureAssetsCount = textureAssetsCountReplaceMe;

const randomTill = n => Math.floor(n * Math.random());
const pickRandom = arr => arr[randomTill(arr.length)];

function fillPhrase(phrase) {
  if (phrase.length == 1) {
    phrase.push({});
  }
  return phrase;
}

// From AMPHTML: https://git.io/fj3uF
function calculateFontSize(
  measurer,
  expectedHeight,
  expectedWidth,
  minFontSize,
  maxFontSize
) {
  maxFontSize++;
  // Binomial search for the best font size.
  while (maxFontSize - minFontSize > 1) {
    const mid = Math.floor((minFontSize + maxFontSize) / 2);
    measurer.style.fontSize = `${mid}px`;
    const height = measurer./*OK*/ offsetHeight;
    const width = measurer./*OK*/ offsetWidth;
    if (height > expectedHeight || width > expectedWidth) {
      maxFontSize = mid;
    } else {
      minFontSize = mid;
    }
  }
  return minFontSize;
}

const [text, phraseConfig] = fillPhrase(pickRandom(phrases));

const randomFont = () =>
  pickRandom(
    Array.from(self.document.querySelectorAll('.font-option'))
  ).getAttribute('data-value');

new App(
  self,
  {
    textureSelector: { hoverUrl: textureUrl },
    editor: {
      fontLoader: new FontLoader(self.document),
      editableValueProp: 'innerHTML',
      sentinelContentProp: 'innerHTML',

      resizer(editable, sentinels) {
        const fontSize =
          calculateFontSize(
            self.document.querySelector('.editable-text-fitter'),
            0.4 * self.innerHeight,
            self.innerWidth - 80,
            /* minFontSize */ 24,
            /* maxFontSize */ 90
          ) + 'px';
        editable.style.fontSize = fontSize;
        sentinels.forEach(({ style }) => {
          style.fontSize = fontSize;
        });
      },
    },
  },
  {
    text,
    font: phraseConfig.font ? fontId(phraseConfig.font) : randomFont(),
    fontSize: defaultFontSize,
    hue: phraseConfig.hue || Math.random(),
    texture: randomTill(textureAssetsCount),
  }
).ready.then(app => {
  self.document.body.classList.remove('not-ready');
  focusAtEnd(self.document.querySelector('#editable'));

  fetch(`/${dirs.textures.frames}/initial.json`)
    .then(response => response.json())
    .then(textureOptions => {
      app.state.set('textureOptions', { textureOptions });
    });
});
