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

const { textureUrl } = require('../../lib/textures');

module.exports = class Texturables {
  constructor(doc, state) {
    this.textured_ = Array.from(doc.querySelectorAll('.textured'));
    this.hued_ = this.textured_.concat(
      Array.from(doc.querySelectorAll('.hued'))
    );

    state.on(this, 'texture', this.setTexture_.bind(this));
    state.on(this, 'hue', this.setHueRotate_.bind(this));
  }

  setTexture_(indexOrData) {
    const url = indexOrData.toString().startsWith('data')
      ? indexOrData
      : textureUrl(indexOrData);
    const backgroundImage = `url(${url})`;
    this.textured_.forEach(({ style }) => {
      style.backgroundImage = backgroundImage;
    });
  }

  setHueRotate_(turns) {
    const hueRotate = `hue-rotate(${360 * turns}deg)`;
    this.hued_.forEach(({ style }) => {
      style.filter = hueRotate;
    });
  }
};
