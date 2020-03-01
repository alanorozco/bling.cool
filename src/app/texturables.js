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

import { composeTextShadow } from '../css-util/css-util';
import { textureFirstFrameUrl, textureUrl } from '../../lib/textures';

const definedOr = (value, fallback) => (value === undefined ? fallback : value);

const cssUrl = url => `url(${url})`;

export default class Texturables {
  constructor(win, state) {
    const doc = win.document;
    this.doc_ = doc;

    this.state_ = state;

    this.textured_ = Array.from(doc.querySelectorAll('.textured'));
    this.hued_ = this.textured_.concat(
      Array.from(doc.querySelectorAll('.hued'))
    );
    this.shaded_ = doc.querySelector('.editable-shadow');

    state.on(this, 'texture', this.setTexture_.bind(this));
    state.on(this, 'hue', this.setHueRotate_.bind(this));

    state.on(this, 'shadowDirection', direction =>
      this.setTextShadow_({ direction })
    );
    state.on(this, 'shadowIsFlat', isFlat => this.setTextShadow_({ isFlat }));
    state.on(this, 'is3d', is3d => this.setTextShadow_({ is3d }));
  }

  setTexture_(index) {
    if (isNaN(index)) throw new Error();
    const { style } = this.doc_.body;
    style.setProperty('--texture-animated', cssUrl(textureUrl(index)));
    style.setProperty('--texture-static', cssUrl(textureFirstFrameUrl(index)));
  }

  setHueRotate_(turns) {
    // filter won't work when setting CSS custom prop, so we set directly.
    const hueRotate = `hue-rotate(${360 * turns}deg)`;
    this.hued_.forEach(({ style }) => {
      style.filter = hueRotate;
    });
  }

  setTextShadow_({ direction, isFlat, is3d }) {
    const state = this.state_;

    this.shaded_.style.textShadow = composeTextShadow(
      definedOr(direction, state.get('shadowDirection')),
      definedOr(isFlat, state.get('shadowIsFlat')),
      definedOr(is3d, state.get('is3d'))
    );
  }
}
