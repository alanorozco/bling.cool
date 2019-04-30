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

function bidirectionalInput(
  caller,
  state,
  stateKey,
  el,
  events,
  { setAs = value => value, inputKey = 'value' }
) {
  const wrapped = e =>
    state.set(caller, { [stateKey]: setAs(e.target[inputKey]) });
  events.forEach(event => {
    el.addEventListener(event, wrapped);
  });
  state.on(caller, stateKey, value => {
    el[inputKey] = value;
  });
  return el;
}

const bidirectionalSlider = (caller, state, key, el) =>
  bidirectionalInput(caller, state, key, el, ['change', 'input'], {
    setAs: parseFloat,
  });

const bidirectionalToggle = (caller, state, key, el) =>
  bidirectionalInput(caller, state, key, el, ['change'], {
    inputKey: 'checked',
  });

function Toggle3d(el, state) {
  return bidirectionalToggle(this, state, 'is3d', el);
}

function ToggleFlatShadow(el, state) {
  return bidirectionalToggle(this, state, 'shadowIsFlat', el);
}

function SlideShadowDirection(el, state) {
  return bidirectionalSlider(this, state, 'shadowDirection', el);
}

function SlideHue(el, state) {
  return bidirectionalSlider(this, state, 'hue', el);
}

export default function FxPanel(win, state) {
  const { document } = win;

  new SlideHue(document.querySelector('#hue'), state);
  new SlideShadowDirection(document.querySelector('#shadow-direction'), state);
  new ToggleFlatShadow(document.querySelector('#shadow-is-flat'), state);
  new Toggle3d(document.querySelector('#is-3d'), state);
}
