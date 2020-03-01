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
import { isEl, tryFocus } from '../dom/dom';
import { toggleStaticTexture } from '../../lib/textures';
import debounce from 'lodash.debounce';

const maxLineLength = 50;
const maxLines = 6;

const blockLevel = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ol',
  'ul',
  'pre',
  'address',
  'blockquote',
  'dl',
  'div',
  'fieldset',
  'form',
  'table',
];

function renderHtml(doc, html) {
  const el = doc.createElement('div');
  el.innerHTML = html;
  return el;
}

const directTextNode = ({ childNodes }) =>
  Array.from(childNodes).find(({ nodeType }) => nodeType == /* TEXT */ 3);

export function htmlToLines(doc, raw) {
  const holder = renderHtml(doc, raw.replace(/\n/g, ''));
  for (let el of holder.querySelectorAll('head, script, style, noscript')) {
    el.parentNode.removeChild(el);
  }
  const inlineLevel = `${blockLevel.map(t => `:not(${t})`).join('')}:not(br)`;
  for (let el of holder.querySelectorAll(inlineLevel)) {
    if (el.textContent) {
      el.replaceWith(doc.createTextNode(el.textContent));
    }
  }
  for (let el of holder.querySelectorAll('br')) {
    el.replaceWith(doc.createTextNode('\n'));
  }
  for (let el of holder.querySelectorAll('*')) {
    if (directTextNode(el)) {
      if (el.tagName == 'P') {
        el.parentNode.insertBefore(doc.createTextNode('\n'), el);
      }
      el.parentNode.insertBefore(doc.createTextNode('\n'), el);
    }
  }
  return holder.textContent
    .trim()
    .split('\n')
    .map(line => line.trim());
}

function wrap(lines, length = maxLineLength) {
  return lines
    .map(line => {
      if (line.length < length) {
        return line;
      }
      return Array.from(line.match(new RegExp(`.{1,${length}}(\s|$)`, 'g')));
    })
    .flat();
}

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

    state.on(this, 'font', this.setFont_.bind(this));
    state.on(this, 'fontSize', this.setFontSize_.bind(this));
    state.on(this, 'text', this.setText_.bind(this));

    this.attachListeners_();

    this.scheduleResumeTexture_ = debounce(() => {
      this.toggleStaticTexture_(false);
    }, 500);
  }

  onInput_({ target }) {
    const text = target[this.editableValueProp_];
    this.state_.set(this, {
      text: this.getEditablePropAsPlainText_(target, this.editableValueProp_),
    });
    this.setSentinelText_(this.prepareValue_(text));
    this.resize_();
  }

  attachListeners_() {
    const editable = this.editable_;

    this.win_.addEventListener('resize', this.resize_.bind(this));

    editable.parentNode.addEventListener('click', () => tryFocus(editable));
    editable.addEventListener('input', this.onInput_.bind(this));

    if (this.editableValueProp_ != 'innerHTML') {
      return;
    }

    editable.addEventListener('keypress', this.onInnerHtmlKeyPress_.bind(this));
    editable.addEventListener('paste', this.onInnerHtmlPaste_.bind(this));

    //   editable.addEventListener('focus', () => {
    //     setTimeout(() => {
    //       if (this.doc_.body.scrollTop > 0) {
    //         this.toggleWithKeyboard_(true);
    //       }
    //     }, 500);
    //   });
    //   editable.addEventListener('blur', () => this.toggleWithKeyboard_(false));
    // }

    // toggleWithKeyboard_(isWithKeyboard) {
    //   this.doc_.body.classList.toggle('editable-with-keyboard', isWithKeyboard);
  }

  onInnerHtmlPaste_(e) {
    e.stopPropagation();
    e.preventDefault();

    const pastedData = (e.clipboardData || this.win_.clipboardData).getData(
      'text/html'
    );

    const selection = this.win_.getSelection();
    const range = selection.getRangeAt(0);

    const currentLineCount = (this.state_.get('text') || '').split('\n').length;

    range.deleteContents();

    let lines = wrap(htmlToLines(this.doc_, pastedData));

    lines = lines.slice(0, Math.min(lines.length, maxLines - currentLineCount));

    lines.forEach((line, i) => {
      if (i > 0) {
        range.insertNode(this.doc_.createElement('br'));
      }
      const el = this.doc_.createTextNode(line);
      range.insertNode(el);
      if (i == lines.length - 1) {
        range.setStartAfter(el);
        range.setEndAfter(el);
      }
    });

    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);

    this.onInput_(e);
  }

  onInnerHtmlKeyPress_(e) {
    this.pauseTexture_();

    this.forceLineBreakAtEnd_(e.target);

    if (e.which !== /* ENTER */ 13) {
      return true;
    }

    e.preventDefault();
    e.stopPropagation();

    this.insertLineBreak_();
    this.onInput_(e);
  }

  forceLineBreakAtEnd_(element) {
    const { childNodes } = element;
    if (!childNodes || !isEl(childNodes[childNodes.length - 1], 'BR')) {
      element.appendChild(this.doc_.createElement('br'));
    }
  }

  insertLineBreak_() {
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
    return prop == 'innerHTML'
      ? element.innerText.replace(/\n[^\n\S]*$/, '')
      : element[prop];
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

  pauseTexture_() {
    this.toggleStaticTexture_(true);
    this.scheduleResumeTexture_();
  }

  toggleStaticTexture_(isStatic) {
    toggleStaticTexture(this.editable_, isStatic);
  }
}
