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

export default class State {
  constructor() {
    this.state_ = {};
    this.observerId_ = 0;
    this.observers_ = {};
  }

  set(dispatcher, state) {
    this.state_ = Object.assign(this.state_, state);
    return this.fire_(dispatcher, state);
  }

  get(field) {
    return this.state_[field];
  }

  on(listener, signal, handler) {
    const id = this.observerId_++;
    this.observers_[signal] =
      signal in this.observers_ ? this.observers_[signal] : {};
    this.observers_[signal][id] = { listener, handler };
    return () => this.remove_(signal, id);
  }

  remove_(signal, id) {
    delete this.observers_[signal][id];
  }

  fire_(dispatcher, state) {
    return Promise.all(
      Object.keys(state).map(signal => {
        if (!(signal in this.observers_)) {
          return;
        }
        return Promise.all(
          Object.values(this.observers_[signal]).map(
            ({ listener, handler }) => {
              if (listener == dispatcher) {
                return;
              }
              return handler(state[signal]);
            }
          )
        );
      })
    );
  }
}
