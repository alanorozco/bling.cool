/**
 * Copyright 2020 Alan Orozco <alan@orozco.xyz>
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
import { shuffleStyle } from '../random';

export const ShuffleButton = ({ children }) => (
  <button class="shuffle">{children}</button>
);

function timeout(promise, timeMs) {
  let bail;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      bail = setTimeout(function() {
        reject();
      }, timeMs);
    }),
  ]).then(
    v => {
      clearTimeout(bail);
      return v;
    },
    error => {
      clearTimeout(bail);
      throw error;
    }
  );
}

let lastShuffleEvent = 0;
export function ShuffleButtonComponent(win, state) {
  win.document.querySelector('.shuffle').addEventListener('click', () => {
    const { font, ...sansFont /* lol */ } = shuffleStyle();
    const shuffleEvent = ++lastShuffleEvent;
    const currentFont = state.font;

    // Reset font when too slow to load
    timeout(state.set(this, { font }), 500)
      .then(
        () => true,
        () => false
      )
      // Then set other style values.
      .then(wasSet => {
        if (lastShuffleEvent !== shuffleEvent) {
          return; // stale
        }
        if (!wasSet) {
          sansFont.font = currentFont;
        }
        state.set(this, sansFont);
      });
  });
}
