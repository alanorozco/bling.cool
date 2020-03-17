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
import { FontLoader } from '../fonts/font-loader';
import { isEl, tryFocus } from '../dom/dom';
import { toggleStaticTexture } from '../../lib/textures';
import calculateFontSize from '../fonts/calculate-font-size';
import debounce from 'lodash.debounce';

export const Editor = () => (
  <label for="editable" class="editable-wrap">
    <div class="editable-sentinel editable-text-fitter" />
    <div class="editable-sentinel editable-shadow hued" />
    <div class="editable-sentinel textured" />
    <div
      id="editable"
      class="hued"
      spellcheck="false"
      contenteditable
      autofocus
    />
  </label>
);

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

export class EditorComponent {
  constructor(win, state) {
    this.win_ = win;
    this.doc_ = win.document;
    this.fontLoader_ = new FontLoader(this.doc_);
    this.state_ = state;

    this.editable_ = this.doc_.querySelector('#editable');
    this.sentinels_ = Array.from(
      this.doc_.querySelectorAll('.editable-sentinel')
    );

    this.initialTextSet_ = false;

    this.textContainers_ = [this.editable_].concat(this.sentinels_);

    state.on(this, 'font', this.setFont_.bind(this));
    state.on(this, 'fontSize', this.setFontSize_.bind(this));
    state.on(this, 'text', this.setText_.bind(this));
    state.on(this, 'hue', () => this.pauseTexture_());
    state.on(this, 'panel', panel => {
      this.toggleStaticTexture_(panel === 'encoded');
    });

    this.attachListeners_();

    this.scheduleResumeTexture_ = debounce(() => {
      this.toggleStaticTexture_(false);
    }, 300);

    // lol i hate doing this
    const { navigator, document } = win;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') > -1 && ua.indexOf('chrome') < 0) {
      document.body.classList.add('safari');
    }
  }

  onInput_({ target }) {
    const { innerHTML, innerText } = target;
    this.state_.set(this, {
      text: innerText.replace(/\n[^\n\S]*$/, ''),
    });
    this.setSentinelText_(innerHTML);
    this.resize_();
    this.pauseTexture_();
  }

  attachListeners_() {
    const editable = this.editable_;

    this.win_.addEventListener('resize', this.resize_.bind(this));

    editable.parentNode.addEventListener('click', () => tryFocus(editable));
    editable.addEventListener('input', this.onInput_.bind(this));
    editable.addEventListener('keypress', this.onInnerHtmlKeyPress_.bind(this));
    editable.addEventListener('paste', this.onInnerHtmlPaste_.bind(this));

    editable.addEventListener('focus', () => {
      // lol i hate doing this
      this.doc_.body.scrollTop = 0;
      this.toggleFocusClass_(true);
      this.state_.set(this, { panel: null });
    });
    editable.addEventListener('blur', () => this.toggleFocusClass_(false));
  }

  toggleFocusClass_(isFocused) {
    this.doc_.body.classList.toggle('focus', isFocused);
  }

  onInnerHtmlPaste_(e) {
    e.stopPropagation();
    e.preventDefault();

    const pastedData = (e.clipboardData || this.win_.clipboardData).getData(
      'text/html'
    );

    const selection = this.win_.getSelection();
    const range = selection.getRangeAt(0);

    const currentLineCount = (this.state_.text || '').split('\n').length;

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
    this.editable_.innerHTML = text;
    this.setSentinelText_(text);
    this.resize_();
    this.resize_();
  }

  setSentinelText_(text) {
    this.sentinels_.forEach(el => {
      el.innerHTML = text;
    });
  }

  getEditablePropAsPlainText_(element) {
    return element.innerText.replace(/\n[^\n\S]*$/, '');
  }

  setFont_(font) {
    const [name, weight] = expandFontId(font);
    return this.fontLoader_.load(font).then(() => {
      if (this.state_.font !== font) {
        return; // stale
      }
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
    const fontSize =
      calculateFontSize(
        document.querySelector('.editable-text-fitter'),
        0.4 * self.innerHeight,
        self.innerWidth - 80,
        /* minFontSize */ 24,
        /* maxFontSize */ 90
      ) + 'px';
    this.editable_.style.fontSize = fontSize;
    this.sentinels_.forEach(({ style }) => {
      style.fontSize = fontSize;
    });
  }

  pauseTexture_() {
    this.toggleStaticTexture_(true);
    this.scheduleResumeTexture_();
  }

  toggleStaticTexture_(isStatic) {
    toggleStaticTexture(this.editable_, isStatic);
  }
}
