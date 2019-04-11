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

module.exports = class Toolbar {
  constructor(doc, state) {
    this.fontSelect_ = doc.querySelector('select');
    this.hueSlider_ = doc.querySelector('input[type=range]');

    this.fontSelect_.addEventListener('change', ({ target }) => {
      state.set(this, { font: target.value });
    });

    state.on(this, 'font', this.updateSelectedFontOption_.bind(this));

    const setHueOnSlide = ({ target }) => {
      state.set(this, { hue: parseFloat(target.value) });
    };

    ['change', 'input'].forEach(e => {
      this.hueSlider_.addEventListener(e, setHueOnSlide);
    });

    state.on(this, 'hue', value => {
      this.hueSlider_.value = value;
    });
  }

  updateSelectedFontOption_(fontId) {
    const option = this.fontSelect_.querySelector(`option[value="${fontId}"]`);
    if (!option) {
      return;
    }
    const selected = this.fontSelect_.querySelector(`[selected]`);
    if (selected) {
      selected.removeAttribute('selected');
    }
    option.setAttribute('selected', '');
  }
};
