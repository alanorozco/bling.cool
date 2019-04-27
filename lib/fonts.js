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

const fontId = ([name, weight]) =>
  `${name.replace(/\s+/g, '+')}:${weight || 400}`;

const categoricalFontWeight = weight => (weight == 'bold' ? 'bold' : 'normal');

function expandFontId(id) {
  const [nameRaw, weightRaw] = id.split(':');
  const name = nameRaw.replace(/\+/g, ' ');
  const weight = parseInt(weightRaw, 10);
  return [name, weight];
}

function fontFamily(fontIdOrName, optFontWeight) {
  if (!optFontWeight) {
    const [name, weight] = expandFontId(fontIdOrName);
    return fontFamily(name, weight);
  }
  return `${categoricalFontWeight(
    optFontWeight
  )} '${fontIdOrName}', sans-serif`;
}

function googFontStylesheetUrl(fontIdOrIds) {
  if (Array.isArray(fontIdOrIds)) {
    return googFontStylesheetUrl(fontIdOrIds.join('|'));
  }
  return `https://fonts.googleapis.com/css?family=${fontIdOrIds}`;
}

export { expandFontId, googFontStylesheetUrl, fontId, fontFamily };
