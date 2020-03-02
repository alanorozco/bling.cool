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
import calculateFontSize from './fonts/calculate-font-size';
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
  if (phrase.length === 1) {
    phrase.push({});
  }
  return phrase;
}

function getPhrase() {
  const phraseFromPathname = decodeURI(
    window.location.pathname
      .replace(/^\//, '')
      // + are always spaces, idc
      .replace(/\+/, ' ')
      .trim()
  );
  return fillPhrase(
    phraseFromPathname.length > 0 ? [phraseFromPathname] : pickRandom(phrases)
  );
}

const [text, phraseConfig] = getPhrase();

const randomFont = () =>
  pickRandom(
    Array.from(document.querySelectorAll('.font-option'))
  ).getAttribute('data-value');

const { document } = self;

const textureOptions = fetch(`/${dirs.textures}/initial.json`).then(response =>
  response.json()
);

const { ready } = new App(
  self,
  {
    textureSelector: { hoverUrl: textureUrl },
    editor: {
      fontLoader: new FontLoader(document),
      editableValueProp: 'innerHTML',
      sentinelContentProp: 'innerHTML',

      resizer(editable, sentinels) {
        const fontSize =
          calculateFontSize(
            document.querySelector('.editable-text-fitter'),
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
    font: phraseConfig.font ? fontId([phraseConfig.font, 400]) : randomFont(),
    fontSize: defaultFontSize,
    hue: phraseConfig.hue || Math.random(),
    texture: randomTill(textureAssetsCount),
    shadowDirection: 0.5,
    shadowIsFlat: false,
    is3d: true,
  }
);

ready.then(() => {
  document.body.classList.remove('not-ready');
  focusAtEnd(document.querySelector('#editable'));
});

Promise.all([ready, textureOptions]).then(([{ state }, textureOptions]) => {
  state.set('textureOptions', { textureOptions });
});
