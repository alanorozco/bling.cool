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

import { closestByClassName } from '../dom/dom';
import { fontId } from '../../lib/fonts';
import { expandFontId } from '../../lib/fonts';
import { loadFontStylesheet } from '../fonts/font-loader';
import { Panel, PanelSlider } from './panel.jsx';

const FontOption = ({ name, weight }) => (
  <div class="font-option" data-value={fontId([name, weight])}>
    <div class="font-preview" />
    <div class="font-name">{name}</div>
  </div>
);

export const FontPanel = ({ fonts }) => (
  <Panel class="sliding" name="font">
    <PanelSlider>
      <div class="font-options hued">
        {fonts.map(([name, weight]) => FontOption({ name, weight }))}
      </div>
    </PanelSlider>
  </Panel>
);

export class FontPanelComponent {
  constructor(win, state) {
    const doc = win.document;

    this.doc_ = doc;
    this.state_ = state;

    this.element_ = doc.querySelector('.font-options');
    this.button_ = doc.querySelector('.selected-font');

    this.element_.addEventListener('click', ({ target }) => {
      const option = closestByClassName(target, 'font-option');
      if (!option) {
        return;
      }
      const font = option.getAttribute('data-value');
      this.updateOption_(font);
      state.set(this, { font });
    });

    state.on(this, 'font', this.updateOption_.bind(this));
    state.on(this, 'panel', this.maybeSetup_.bind(this));
  }

  maybeSetup_(panel) {
    if (panel != 'font') {
      return;
    }

    const previews = Array.from(this.doc_.querySelectorAll('.font-preview'));
    const text = this.state_
      .get('text')
      .trim()
      .replace(/\s+/gim, ' ');

    const fontIds = previews
      .map(preview => {
        preview.textContent = text;
        if (preview.classList.contains('font-set')) {
          return;
        }
        const font = closestByClassName(preview, 'font-option').getAttribute(
          'data-value'
        );
        const [name, weight] = expandFontId(font);
        preview.style.fontFamily = `'${name}', sans-serif`;
        preview.style.fontWeight = weight;
        preview.classList.add('font-set');
        return font;
      })
      .filter(opt => !!opt);

    if (fontIds.length <= 0) {
      return;
    }

    // loadFontStylesheet(this.doc_, fontIds);
  }

  updateOption_(fontId) {
    const [name] = expandFontId(fontId);
    const option = this.element_.querySelector(`[data-value="${fontId}"]`);
    if (!option) {
      return;
    }
    const selected = this.element_.querySelector('.selected');
    if (selected) {
      selected.classList.remove('selected');
    }
    option.classList.add('selected');
    this.button_.textContent = name;
  }
}
