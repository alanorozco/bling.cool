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

const getPanel = (doc, id) => doc.querySelector(`[data-panel="${id}"]`);
const getPanelToggleButton = (doc, id) =>
  doc.querySelector(`.panel-toggle[data-toggle=${id}]`);

function closePanel(panel, button) {
  panel.setAttribute('hidden', 'hidden');
  button.classList.remove('selected');
}

function openPanel(panel, button) {
  panel.removeAttribute('hidden');
  button.classList.add('selected');
  scrollSliderToSelected(panel);
}

function scrollSliderToSelected(panel) {
  const slider = panel.querySelector('.panel-slider');
  if (!slider) return;

  const selected = slider.querySelector('.selected');
  if (!selected) return;

  const { offsetWidth } = selected;
  const { left } = selected.getBoundingClientRect();
  const { offsetWidth: outerWidth } = slider;

  slider.scrollLeft = Math.max(
    0,
    slider.scrollLeft + left - outerWidth / 2 + offsetWidth / 2
  );
}

export default class Toolbar {
  constructor(win, state) {
    this.doc_ = win.document;
    this.state_ = state;
    this.element_ = win.document.querySelector('.toolbar');

    this.element_.addEventListener('click', e => this.togglePanelFromClick_(e));

    state.on(this, 'text', this.closePanel_.bind(this));
    state.on(this, 'encoding', isEncoding => {
      if (isEncoding) {
        this.closePanel_();
      }
    });

    state.on(this, 'panel', panel => this.togglePanelFromState_(panel));
  }

  togglePanelFromClick_(e) {
    const { target } = e;
    const button = closestByClassName(target, 'panel-toggle');
    if (!button) {
      return;
    }
    const panel = button.getAttribute('data-toggle');
    if (!panel) {
      return;
    }
    e.preventDefault();
    if (this.state_.get('panel') === panel) {
      this.closePanel_();
    } else {
      this.openPanel_(panel);
    }
  }

  togglePanelFromState_(panel) {
    if (panel === null) {
      this.closePanel_();
    } else {
      this.openPanel_(panel);
    }
  }

  openPanel_(panel) {
    const element = getPanel(this.doc_, panel);
    if (!element) {
      return;
    }
    const open = this.doc_.querySelector('.panel:not([hidden])');
    if (open && open !== element) {
      this.closePanel_();
    }
    if (open === element) {
      return;
    }
    openPanel(element, getPanelToggleButton(this.doc_, panel));
    this.state_.set(this, { panel });
  }

  closePanel_() {
    const element = this.doc_.querySelector('.panel:not([hidden])');
    if (!element) {
      return;
    }
    closePanel(
      element,
      getPanelToggleButton(this.doc_, element.getAttribute('data-panel'))
    );
    this.state_.set(this, { panel: null });
  }
}
