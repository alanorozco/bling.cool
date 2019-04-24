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

class ModuleGetter {
  constructor(win) {
    const boundPush = this.push_.bind(this);

    this.promises_ = [];
    this.resolvers_ = [];

    win.BLING = win.BLING || [];
    win.BLING.push = boundPush;
    win.BLING.forEach(boundPush);
  }

  push_(props) {
    Object.keys(props).forEach(k => {
      this.fire_(k, props[k]);
    });
  }

  get(key) {
    return this.buildPromise_(key);
  }

  buildPromise_(key) {
    if (!this.promises_[key]) {
      this.promises_[key] = new Promise(resolver => {
        this.resolvers_[key] = resolver;
      });
    }
    return this.promises_[key];
  }

  fire_(key, value) {
    this.buildPromise_(key);
    this.resolvers_[key](value);
  }
}

export default win => new ModuleGetter(win);
