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

const { FontLoader } = require('./font-loader');
const once = require('lodash.once');

const fonts = require('../artifacts/fonts');
const phrases = require('../artifacts/phrases');

const textureAssetsCount = 1;

const defaultFontSize = 72;

const getEditable = once(doc => {
  const editable = doc.querySelector('div[contenteditable]');
  editable.parentElement.addEventListener('click', () => {
    // TODO: Focus on proper cursor position.
    editable.focus();
  });
  return editable;
});

const randomTill = n => Math.floor(n * Math.random());
const pickRandom = arr => arr[randomTill(arr.length)];

const pickPhrase = () => fillPhrase(pickRandom(phrases));
const pickTexture = () => randomTill(textureAssetsCount);

const pickHueRotate = () => Math.random();

function fillPhrase(phrase) {
  if (phrase.length == 1) {
    phrase.push({});
  }
  return phrase;
}

function fillFont(font) {
  if (font.length == 1) {
    font.push(400);
  }
  return font;
}

function setText(editable, shadowSentinel, text) {
  editable.innerText = text;
  setTextSentinels(editable, shadowSentinel, text);
}

function setTextSentinels(editable, shadowSentinel, text) {
  shadowSentinel.innerText = text;
  resize(editable, shadowSentinel);
}

function setTexture(border, editable, index) {
  const url = `url(/assets/glitter${index}.gif)`;
  editable.style.backgroundImage = url;
  border.style.backgroundImage = url;
}

function setHueRotate(border, editable, shadowSentinel, turns) {
  const filter = `hue-rotate(${360 * turns}deg)`;
  border.style.filter = filter;
  editable.style.filter = filter;
  shadowSentinel.style.filter = filter;
}

function setFontSize(editable, shadowSentinel, sizePx) {
  const fontSize = `${sizePx}px`;
  editable.style.fontSize = fontSize;
  shadowSentinel.style.fontSize = fontSize;
  resize(editable, shadowSentinel);
}

function resize(editable, shadowSentinel) {
  const { width } = editable.getBoundingClientRect();
  shadowSentinel.style.width = `${width}px`;
}

function setFont(loader, editable, shadowSentinel, fontName, fontWeight) {
  return Promise.all([
    loader.applyOn(editable, fontName, fontWeight),
    loader.applyOn(shadowSentinel, fontName, fontWeight),
  ]).then(() => {
    resize(editable, shadowSentinel);
  });
}

const { document: doc } = self;
const hueSlider = doc.querySelector('#hue');
const editable = getEditable(doc);
const shadowSentinel = doc.querySelector('.editable-shadow');
const border = doc.querySelector('.border');
const fontSelect = doc.querySelector('select');
const loader = new FontLoader(doc);

const [phraseText, phraseConfig] = pickPhrase();
const hueRotate = phraseConfig.hue || pickHueRotate();

hueSlider.value = hueRotate;

setText(editable, shadowSentinel, phraseText);
setTexture(border, editable, pickTexture());
setHueRotate(border, editable, shadowSentinel, hueRotate);

setFontSize(editable, shadowSentinel, defaultFontSize);

const setHueOnSlide = ({ target }) => {
  setHueRotate(border, editable, shadowSentinel, parseFloat(target.value));
};

const [fontName, fontWeight] = fillFont(pickRandom(fonts));

fonts.forEach(([name], i) => {
  const option = doc.createElement('option');
  option.value = i;
  option.innerText = name;
  if (name == fontName) {
    option.setAttribute('selected', '');
  }
  fontSelect.appendChild(option);
});

fontSelect.addEventListener('change', ({ target }) => {
  const [fontName, fontWeight] = fillFont(fonts[parseInt(target.value, 10)]);
  setFont(loader, editable, shadowSentinel, fontName, fontWeight);
});

setFont(loader, editable, shadowSentinel, fontName, fontWeight).then(() => {
  doc.body.classList.remove('not-ready');
});

editable.addEventListener('input', () => {
  setTextSentinels(editable, shadowSentinel, editable.innerText);
});

window.addEventListener('resize', () => {
  resize(editable, shadowSentinel);
});

['change', 'input'].forEach(e => {
  hueSlider.addEventListener(e, setHueOnSlide);
});
