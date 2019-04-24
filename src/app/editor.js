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

import { expandFontId } from '../../lib/fonts';

export default class Editor {
  constructor(
    win,
    state,
    {
      editableValueProp,
      sentinelContentProp,
      resizer,
      fontLoader,
      prepareValue = v => v,
    }
  ) {
    this.win_ = win;
    this.doc_ = win.document;
    this.fontLoader_ = fontLoader;
    this.resizer_ = resizer;
    this.state_ = state;
    this.prepareValue_ = prepareValue;

    this.editableValueProp_ = editableValueProp;
    this.sentinelContentProp_ = sentinelContentProp;

    this.editable_ = this.doc_.querySelector('#editable');
    this.sentinels_ = Array.from(
      this.doc_.querySelectorAll('.editable-sentinel')
    );

    this.initialTextSet_ = false;

    this.textContainers_ = [this.editable_].concat(this.sentinels_);

    this.editable_.parentNode.addEventListener('click', () => {
      try {
        this.editable_.focus();
      } catch (_) {}
    });

    win.addEventListener('resize', this.resize_.bind(this));

    this.editable_.addEventListener('input', this.onInput_.bind(this));
    this.editable_.addEventListener('keypress', this.onKeypress_.bind(this));

    state.on(this, 'font', this.setFont_.bind(this));
    state.on(this, 'fontSize', this.setFontSize_.bind(this));
    state.on(this, 'text', this.setText_.bind(this));
  }

  onInput_({ target }) {
    const text = target[this.editableValueProp_];
    this.state_.set(this, {
      text: this.getEditablePropAsPlainText_(target, this.editableValueProp_),
    });
    this.setSentinelText_(this.prepareValue_(text));
    this.resize_();
  }

  onKeypress_(e) {
    if (this.editableValueProp_ != 'innerHTML') {
      return true;
    }

    if (e.which != /* ENTER */ 13) {
      return true;
    }

    e.preventDefault();

    if (this.win_.navigator.userAgent.indexOf('msie') > 0) {
      insertHtml('<br />');
      return;
    }

    const selection = this.win_.getSelection();
    const range = selection.getRangeAt(0);
    const br = this.win_.document.createElement('br');

    range.deleteContents();
    range.insertNode(br);
    range.setStartAfter(br);
    range.setEndAfter(br);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);

    this.onInput_(e);
  }

  setText_(text) {
    this.setEditableProp_(this.editable_, this.editableValueProp_, text);
    this.setSentinelText_(text);
    this.resize_();
    this.resize_();
  }

  setSentinelText_(text) {
    this.sentinels_.forEach(el => {
      this.setEditableProp_(el, this.sentinelContentProp_, text);
    });
  }

  setEditableProp_(element, prop, value) {
    element[prop] = value;
  }

  getEditablePropAsPlainText_(element, prop) {
    return prop == 'innerHTML' ? element.innerText : element[prop];
  }

  setFont_(fontId) {
    const [name, weight] = expandFontId(fontId);
    return this.fontLoader_.load(fontId).then(() => {
      this.setStyles_({
        fontFamily: `'${name}', sans-serif`,
        fontWeight: weight,
      });
      this.resize_();
    });
  }

  setFontSize_(size) {
    this.setStyles_({ fontSize: `${size}px` });
    this.resize_();
  }

  setStyles_(styles) {
    this.textContainers_.forEach(({ style }) => {
      Object.keys(styles).forEach(prop => {
        style[prop] = styles[prop];
      });
    });
  }

  resize_() {
    this.resizer_(this.editable_, this.sentinels_);
  }
}
