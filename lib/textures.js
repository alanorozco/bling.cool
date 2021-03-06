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

import { dirs } from '../config';
import memoize from 'lodash.memoize';
import once from 'lodash.once';

export const textureUrl = index => `/${dirs.textures}/${index}.gif`;
export const textureFirstFrameUrl = index => `/${dirs.textures}/${index}_i.gif`;
export const textureFramesUrl = index => `/${dirs.textures}/${index}.json`;
export const textureId = urlOrPath => urlOrPath.replace(/[^0-9]+/gim, '');

export function toggleStaticTexture(element, isStatic) {
  element.classList.toggle('textured-static', isStatic);
}

export const fetchFrames = memoize(
  (win, tid) => win.fetch(textureFramesUrl(tid)).then(r => r.json()),
  (_, tid) => tid
);

export const initialFrames = once(win =>
  win.fetch(`/${dirs.textures}/initial.json`).then(response => response.json())
);
