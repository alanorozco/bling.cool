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

const FontFaceObserver = require('fontfaceobserver');
const googFontsUrl = require('./goog-fonts-url');
const loadPromise = require('./load-promise');

const fontId = (name, weight) => `${name}:${weight}`;

function loadFontStylesheet(doc, name, weight) {
  const href = googFontsUrl(name, weight);
  const link = doc.createElement('link');
  link.setAttribute('href', href);
  link.setAttribute('rel', 'stylesheet');
  const promise = loadPromise(link);
  doc.head.appendChild(link);
  return promise;
}

class FontLoader {
  constructor(doc) {
    this.doc_ = doc;
    this.loadPromises_ = {};
  }

  applyOn(element, name, weight) {
    return this.load_(name, weight).then(() => {
      element.style.fontFamily = `'${name}', sans-serif`;
      element.style.fontWeight = weight;
    });
  }

  load_(name, weight) {
    const id = fontId(name, weight);
    if (id in this.loadPromises_) {
      return this.loadPromises_[id];
    }
    const stylesheetLoaded = loadFontStylesheet(this.doc_, name, weight);
    let observer = new FontFaceObserver(name, { weight });
    const promise = stylesheetLoaded
      .then(() => observer.load())
      .then(() => {
        observer = null; // gc
      });
    return (this.loadPromises_[id] = promise);
  }
}

exports.FontLoader = FontLoader;
