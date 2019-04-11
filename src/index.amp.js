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

const Editor = require('./app/editor');
const Toolbar = require('./app/toolbar');
const State = require('./app/state');
const Texturables = require('./app/texturables');

const state = new State();

new Editor(self, state, {
  editableValueProp: 'value',
  sentinelContentProp: 'innerHTML',

  fontLoader: {
    load(unusedFontId) {
      // Fonts are loaded all at once.
      return Promise.resolve();
    },
  },

  resizer(unusedEditable, unusedSentinels) {
    // NOOP. worker-dom does not support measurements.
  },

  prepareValue(value) {
    // Convert whitespace so it's actually visible
    return value.replace(/\n/g, '<br>').replace(/ /g, '<span>\u00A0</span>');
  },
});

new Toolbar(self.document, state);
new Texturables(self.document, state);
