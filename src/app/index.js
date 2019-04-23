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

const adoptAsync = require('./adopt-async');
const Editor = require('./editor');
const EncodeButton = require('./encode-button');
const FontSelector = require('./font-selector');
const Loader = require('./loader');
const FxPanel = require('./fx-panel');
const Toolbar = require('./toolbar');
const State = require('./state');
const Texturables = require('./texturables');
const TextureSelector = require('./texture-selector');

module.exports = class App {
  constructor(
    win,
    {
      editor,
      encodeButton = {},
      fontSelector = {},
      fxPanel = {},
      texturables = {},
      textureSelector = {},
      toolbar = {},
    },
    opt_initialState
  ) {
    const state = new State();

    this.state = state;
    this.modules_ = adoptAsync(win);

    new Editor(win, state, editor);
    new Toolbar(win.document, state, toolbar);
    new Texturables(win.document, state, texturables);
    new TextureSelector(win.document, state, textureSelector);
    new Loader(win);
    new FontSelector(win.document, state, fontSelector);
    new FxPanel(win.document, state, fxPanel);
    new EncodeButton(
      win,
      state,
      Object.assign(encodeButton, { modules: this.modules_ })
    );

    this.ready = (opt_initialState
      ? state.set(this, opt_initialState)
      : Promise.resolve()
    ).then(() => this);
  }
};
