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

const { fontId } = require('../lib/fonts');
const { FontLoader } = require('./fonts/font-loader');
const Editor = require('./ui/editor');
const Panel = require('./ui/panel');
const State = require('./ui/state');
const focusAtEnd = require('./input/focus-at-end');
const Texturables = require('./ui/texturables');

const fonts = require('../artifacts/fonts');
const phrases = require('../artifacts/phrases');

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

const state = new State();

new Editor(self, state, {
  fontLoader: new FontLoader(self.document),
  editableValueProp: 'innerText',
  sentinelContentProp: 'innerText',

  resizer(editable, sentinels) {
    const { width } = editable.getBoundingClientRect();
    sentinels.forEach(s => {
      s.style.width = `${width}px`;
    });
  },

  prepareValue(value) {
    // passthru.
    return value;
  },
});

new Panel(self.document, state);
new Texturables(self.document, state);

const [text, phraseConfig] = fillPhrase(pickRandom(phrases));

state
  .set('initial', {
    text,
    font: fontId(phraseConfig.font || pickRandom(fonts)),
    fontSize: defaultFontSize,
    hue: phraseConfig.hue || Math.random(),
    texture: randomTill(textureAssetsCount),
  })
  .then(() => {
    self.document.body.classList.remove('not-ready');
    focusAtEnd(editable);
  });
