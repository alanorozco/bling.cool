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
import { getLengthNumeral } from '../../lib/css';
import { textureFramesUrl } from '../../lib/textures';
import loadImage from '../dom/load-image';
import once from 'lodash.once';

const fetchFrames = textureId =>
  fetch(textureFramesUrl(textureId)).then(response => response.json());

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

    this.attachLightboxEvents_ = once(lightbox => {
      const closeButton = lightbox.querySelector('.close-button');
      closeButton.addEventListener('click', this.closeLightbox_.bind(this));
    });

    const button = win.document.querySelector('.encode-button');
    button.addEventListener('click', this.onClick_.bind(this));
  }

  onClick_() {
    const framesPromise = fetchFrames(this.state_.get('texture'));
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

    this.state_.set(this, { encoding: true });

    Promise.all([framesPromise, encodeAsGifPromise])
      .then(([frames, encodeAsGif]) =>
        encodeAsGif(this.win_, width, height, frames, {
          text,
          textShadow,
          background,
          margin,
          hue,
          font,
          fontSize,
        })
      )
      .then(url => this.openLightbox_(url, toFilename(text)))
      .then(() => {
        this.win_.setTimeout(() => {
          this.state_.set(this, { encoding: false });
        }, scssVar('lightboxAnimationDuration'));
      });
  }

  openLightbox_(url, filename) {
    const doc = this.doc_;
    const lightbox = doc.querySelector('.encoded-lightbox');

    const downloadButton = lightbox.querySelector('.download-button');
    downloadButton.href = url;
    downloadButton.download = filename;

    const imgContainer = lightbox.querySelector('.img-container');
    const imgLoadPromise = loadImage(doc, url);
    return imgLoadPromise.then(img => {
      imgContainer.appendChild(img);
      lightbox.removeAttribute('hidden');
      this.attachLightboxEvents_(lightbox);
    });
  }

  closeLightbox_(e) {
    e.preventDefault();
    const lightbox = this.doc_.querySelector('.encoded-lightbox');
    const imgContainer = lightbox.querySelector('.img-container');
    if (imgContainer.firstElementChild) {
      imgContainer.removeChild(imgContainer.firstElementChild);
    }
    lightbox.setAttribute('hidden', 'hidden');
  }
}
