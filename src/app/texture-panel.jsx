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

import loadImage from '../dom/load-image';
import { closestByClassName } from '../dom/dom';
import { textureId, textureUrl } from '../../lib/textures';
import { Icon } from './icons.jsx';
import { Panel, PanelSlider } from './panel.jsx';

const containerClassName = 'texture-options';
const optionClassName = 'texture-option';
const textureIdAttr = 'data-texture-id';
const staticUrlAttr = 'data-static';

export const TexturePanel = () => (
  <Panel class="sliding hued" name="textures">
    <PanelSlider style="height: 100px">
      <div class="texture-options" />
    </PanelSlider>
    <label class="label-range fl-r" for="hue">
      <Icon name="bucket" />
      <input id="hue" type="range" min="0" max="1" step="0.05" value="0" />
    </label>
  </Panel>
);

function textureOption(doc, textureUrl, selected, opt_textureId) {
  const element = doc.createElement('div');
  element.classList.add('texture-option');
  element.setAttribute(
    'data-texture-id',
    opt_textureId !== undefined ? opt_textureId : textureId(textureUrl)
  );
  if (selected) {
    selectElementOption(element);
  }
  element.style.backgroundImage = `url(${textureUrl})`;
  return element;
}

function selectElementOption(element) {
  const { parentNode } = element;
  const selected = parentNode ? parentNode.querySelector('.selected') : null;
  element.classList.add('selected');
  if (!selected) {
    return;
  }
  selected.classList.remove('selected');
}

export class TexturePanelComponent {
  constructor(win, state) {
    const doc = win.document;

    this.doc_ = doc;
    this.state_ = state;
    this.element_ = doc.querySelector(`.${containerClassName}`);
    this.hoverUnlistener_ = this.listenToHover_();
    this.hoverEventId_ = 0;

    this.element_.addEventListener('click', ({ target }) => {
      const option = closestByClassName(target, optionClassName);
      if (!option) {
        return;
      }
      selectElementOption(option);
      state.set(this, { texture: option.getAttribute(textureIdAttr) });
    });

    state.on(this, 'texture', this.updateSelected_.bind(this));
    state.on(this, 'textureOptions', this.updateOptions_.bind(this));

    this.listenToHover_();
  }

  listenToHover_() {
    if (this.hoverUnlistener_) {
      this.hoverUnlistener_();
    }
    let options = this.getAllOptions_();
    let handlers = {
      mouseover: this.onOptionMouseOver_.bind(this),
      mouseout: this.onOptionMouseOut_.bind(this),
    };
    options.forEach(el => {
      Object.keys(handlers).forEach(event => {
        el.addEventListener(event, handlers[event]);
      });
    });
    this.hoverUnlistener_ = () => {
      options.forEach(el => {
        Object.keys(handlers).forEach(event => {
          el.removeEventListener(event, handlers[event]);
        });
      });
      options = null; // gc
      handlers = null; // gc
    };
  }

  onOptionMouseOver_({ target }) {
    const eventId = ++this.hoverEventId_;
    const url = textureUrl(target.getAttribute(textureIdAttr));
    loadImage(this.doc_, url).then(() => {
      if (eventId != this.hoverEventId_) {
        return;
      }
      target.style.backgroundImage = `url(${url})`;
    });
  }

  onOptionMouseOut_({ target }) {
    ++this.hoverEventId_;
    target.style.backgroundImage = `url(${target.getAttribute(staticUrlAttr)})`;
  }

  getAllOptions_() {
    return Array.from(this.element_.querySelectorAll(`.${optionClassName}`));
  }

  updateSelected_(textureIdOrDataUri) {
    if (textureIdOrDataUri.toString().startsWith('data')) {
      return;
    }
    const option = this.element_.querySelector(
      `.${optionClassName}[${textureIdAttr}="${textureIdOrDataUri}"]`
    );
    if (!option) {
      return;
    }
    selectElementOption(option);
  }

  updateOptions_(options) {
    const fragment = this.doc_.createDocumentFragment();
    options.forEach((dataUri, id) => {
      const option = textureOption(
        this.doc_,
        dataUri,
        id == this.state_.texture,
        id
      );
      fragment.appendChild(option);
      option.setAttribute(staticUrlAttr, dataUri);
    });
    this.element_.appendChild(fragment);
    this.listenToHover_();
  }
}
