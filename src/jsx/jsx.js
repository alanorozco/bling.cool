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

function appendChild(container, child) {
  const node =
    typeof child === 'string' ? document.createTextNode(child) : child;
  if (node) {
    container.appendChild(node);
  }
}

function createElement(type, props, ...children) {
  if (Array.isArray(children[0])) {
    children = children[0];
  }
  props = props || {};
  if (typeof type === 'string') {
    const el = document.createElement(type);
    Object.keys(props).forEach(name => {
      const val = props[name] === true ? '' : props[name];
      if (val !== false) {
        el.setAttribute(name, val);
      }
    });
    if (children) {
      children.forEach(child => {
        // while (Array.isArray(child))
        (Array.isArray(child) ? child : [child]).forEach(child => {
          appendChild(el, child);
        });
      });
    }
    return el;
  }
  let { className } = props;
  if (props.class) {
    if (className) {
      throw new Error(`${type.name} with both class & className`);
    }
    className = props.class;
  }
  return type(Object.assign(props, { class: className, className, children }));
}

function Fragment({ children }) {
  const fragment = document.createDocumentFragment();
  children.forEach(child => {
    appendChild(fragment, child);
  });
  return fragment;
}

export default { createElement, Fragment };
