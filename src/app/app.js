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

import adoptAsync from '../async-modules/adopt-async';

import Editor from './editor';
import EncodeButton from './encode-button';
import FontSelector from './font-selector';
import Loader from './loader';
import FxPanel from './fx-panel';
import Toolbar from './toolbar';
import State from './state';
import Texturables from './texturables';
import TextureSelector from './texture-selector';

export default class App {
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
    new Toolbar(win, state, toolbar);
    new Texturables(win, state, texturables);
    new TextureSelector(win, state, textureSelector);
    new Loader(win, state);
    new FontSelector(win, state, fontSelector);
    new FxPanel(win, state, fxPanel);
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
}
