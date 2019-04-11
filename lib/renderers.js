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

const { textureId } = require('./textures');

exports.textureOption = function textureOption(
  doc,
  textureUrl,
  selected,
  opt_textureId
) {
  const element = doc.createElement('div');
  element.classList.add('texture-option');
  element.setAttribute(
    'data-texture-id',
    opt_textureId !== undefined ? opt_textureId : textureId(textureUrl)
  );
  if (selected) {
    selectElementOption(element);
  }
  element.style.backgroundImage = `url(${textureUrl})`;
  return element;
};

function selectElementOption(element) {
  const { parentNode } = element;
  const selected = parentNode ? parentNode.querySelector('.selected') : null;
  element.classList.add('selected');
  if (!selected) {
    return;
  }
  selected.classList.remove('selected');
}

exports.selectElementOption = selectElementOption;
