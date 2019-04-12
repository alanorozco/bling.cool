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

const { closestByClassName } = require('../dom');

const getPanel = (doc, id) => doc.querySelector(`.panel-${id}`);
const getPanelToggleButton = (doc, id) =>
  doc.querySelector(`.panel-toggle[data-toggle=${id}]`);

function closePanel(panel, button) {
  panel.setAttribute('hidden', 'hidden');
  button.classList.remove('selected');
}

function showPanel(panel, button) {
  panel.removeAttribute('hidden');
  button.classList.add('selected');
}

module.exports = class Toolbar {
  constructor(doc, state) {
    this.doc_ = doc;
    this.element_ = doc.querySelector('.toolbar');

    this.openPanel_ = null;

    this.element_.addEventListener('click', this.maybeTogglePanel_.bind(this));

    state.on(this, 'text', this.closePanel_.bind(this));
  }

  maybeTogglePanel_(e) {
    const { target } = e;
    const button = closestByClassName(target, 'panel-toggle');
    if (!button) {
      return;
    }
    const panelId = button.getAttribute('data-toggle');
    const panel = getPanel(this.doc_, panelId);
    if (!panel) {
      return;
    }
    e.preventDefault();
    if (panelId === this.openPanel_) {
      closePanel(panel, button);
      this.openPanel_ = null;
      return;
    }
    this.closePanel_();
    this.openPanel_ = panelId;
    showPanel(panel, button);
  }

  closePanel_() {
    if (!this.openPanel_) {
      return;
    }
    closePanel(
      getPanel(this.doc_, this.openPanel_),
      getPanelToggleButton(this.doc_, this.openPanel_)
    );
  }
};
