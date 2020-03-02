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

/* global scssVar */

import { decomposeTextShadow } from '../css-util/css-util';
import { fetchFrames } from '../../lib/textures';
import { getLengthNumeral } from '../../lib/css';
import debounce from 'lodash.debounce';
import loadImage from '../dom/load-image';
import once from 'lodash.once';

const asciiNormal = text =>
  text.normalize
    ? text.normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
    : text;

const toFilename = text =>
  `${asciiNormal(text.trim())
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')}.gif`;

export default class EncodeButton {
  constructor(win, state, { modules }) {
    this.win_ = win;
    this.doc_ = win.document;
    this.state_ = state;
    this.modules_ = modules;
    this.cancelHandler_ = null;

    this.attachPanelEvents_ = once(element => {
      const closeButton = element.querySelector('.close-button');
      closeButton.addEventListener('click', this.closePanel_.bind(this));
    });

    const button = win.document.querySelector('.encode-button');
    button.addEventListener('click', this.onClick_.bind(this));

    this.encodeDebounced_ = debounce(() => {
      this.encode_();
    }, 500);

    // TODO: Maybe this is nested somehow.
    // It's a bit naive to have a table of these state changes.
    this.state_.on(this, 'text', () => this.eagerEncode_());
    this.state_.on(this, 'hue', () => this.eagerEncode_());
    this.state_.on(this, 'font', () => this.eagerEncode_());
    this.state_.on(this, 'texture', () => this.eagerEncode_());
    this.state_.on(this, 'shadowDirection', () => this.eagerEncode_());
    this.state_.on(this, 'shadowIsFlat', () => this.eagerEncode_());
    this.state_.on(this, 'is3d', () => this.eagerEncode_());

    this.state_.on(this, 'panel', panel => {
      if (panel !== 'encoded') {
        this.clearPanel_();
      }
    });

    this.eagerEncode_();
  }

  eagerEncode_() {
    this.cancel_();
    this.encodeDebounced_();
  }

  cancel_() {
    this.promise_ = null;
    this.state_.set(this, { encoding: false });
    if (this.cancelHandler_ !== null) {
      this.cancelHandler_();
      this.cancelHandler_ = null;
    }
  }

  encode_() {
    if (this.promise_) {
      return this.promise_;
    }

    const framesPromise = fetchFrames(this.win_, this.state_.get('texture'));
    const encodeAsGifPromise = this.modules_.get('encodeAsGif');

    const computedShadowStyle = getComputedStyle(
      this.doc_.querySelector('.editable-shadow')
    );

    const background = [255, 255, 255];

    const { width: outerWidth, height: outerHeight } = this.doc_
      .querySelector('.editable-sentinel')
      .getBoundingClientRect();

    const margin = scssVar('marginUnit');
    const width = outerWidth - margin * 2;
    const height = outerHeight + margin * 2;

    const textShadow = decomposeTextShadow(computedShadowStyle['text-shadow']);
    const fontSize = getLengthNumeral(computedShadowStyle['font-size']);

    const text = this.state_.get('text');
    const font = this.state_.get('font');
    const hue = this.state_.get('hue');

    this.cancel_();

    this.promise_ = Promise.all([framesPromise, encodeAsGifPromise])
      .then(([frames, encodeAsGif]) => {
        const [promise, cancelHandler] = encodeAsGif(
          this.win_,
          width,
          height,
          frames,
          {
            text,
            textShadow,
            background,
            margin,
            hue,
            font,
            fontSize,
          }
        );
        this.cancelHandler_ = cancelHandler;
        return promise;
      })
      .then(url => {
        this.cancelHandler_ = null;
        return [url, text];
      });

    return this.promise_;
  }

  onClick_() {
    this.state_.set(this, { encoding: true });
    this.encode_().then(([url, text]) => {
      this.openPanel_(url, toFilename(text));
      this.state_.set(this, { encoding: false });
    });
  }

  openPanel_(url, filename) {
    const doc = this.doc_;
    const panel = doc.querySelector('.panel.encoded');

    const downloadButton = panel.querySelector('.download-button');
    downloadButton.href = url;
    downloadButton.download = filename;

    const imgContainer = panel.querySelector('.img-container');
    const imgLoadPromise = loadImage(doc, url);

    return imgLoadPromise.then(img => {
      this.state_.set(this, { panel: 'encoded' });
      imgContainer.appendChild(img);
      this.attachPanelEvents_(panel);
    });
  }

  closePanel_(e) {
    e.preventDefault();
    this.clearPanel_();
    this.state_.set(this, { panel: null });
  }

  clearPanel_() {
    const panel = this.doc_.querySelector('.panel.encoded');
    const imgContainer = panel.querySelector('.img-container');
    if (imgContainer.firstElementChild) {
      imgContainer.removeChild(imgContainer.firstElementChild);
    }
  }
}
