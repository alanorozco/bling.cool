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

import { fontId, googFontStylesheetUrl } from '../lib/fonts';
import { fontOption } from '../lib/renderers';
import { JSDOM } from 'jsdom';
import { promisify } from 'util';
import { readFile, readFileSync } from 'fs-extra';

export function elementWithContents(doc, tagName, contents) {
  const element = doc.createElement(tagName);
  element.innerHTML = contents;
  return element;
}

export async function elementWithFileContents(doc, tagName, path) {
  return elementWithContents(doc, tagName, readFileSync(path).toString());
}

const readFileAsync = promisify(readFile);

async function bundleJs(doc, js) {
  if (!js) {
    return;
  }
  const script = await elementWithFileContents(doc, 'script', js);
  if (doc.lastElementChild.tagName == 'SCRIPT') {
    doc.body.insertBefore(script, doc.lastElementChild);
    return;
  }
  doc.body.appendChild(script);
}

async function bundleStyle(doc, css) {
  const existingStyle = doc.head.querySelector('style');
  const style = await elementWithFileContents(doc, 'style', css);

  if (existingStyle) {
    for (const { name, value } of existingStyle.attributes) {
      style.setAttribute(name, value);
    }
    existingStyle.replaceWith(style);
  } else {
    doc.head.appendChild(style);
  }
}

function replacePkgAccess(doc, pkg) {
  for (const node of getTextNodes(doc)) {
    node.textContent = replacePkgProp(node.textContent, pkg);
  }

  replacePkgAccessAttr(doc, pkg, 'meta', 'content');
  replacePkgAccessAttr(doc, pkg, 'a', 'href');
}

function replacePkgAccessAttr(doc, pkg, tagName, attr) {
  for (const element of doc.querySelectorAll(`${tagName}[${attr}]`)) {
    element.setAttribute(attr, replacePkgProp(element.getAttribute(attr), pkg));
  }
}

const replacePkgProp = (str, pkg) =>
  str.replace(/\[package\.(.+)\]/g, (full, access) => {
    let val = pkg;
    const props = access.split('.');
    while (props.length) {
      val = val[props.shift()];
    }
    if (typeof val !== 'string') {
      return full;
    }
    return val;
  });

function setFonts(doc, fonts) {
  const container = doc.querySelector('.font-options');
  if (!container) {
    return;
  }
  const template = container.querySelector('template');
  if (!template) {
    return;
  }
  container.removeChild(template);
  fonts.forEach(([name, weight]) => {
    const option = fontOption(
      template.content.firstElementChild.cloneNode(/* deep */ true),
      name,
      weight
    );
    container.appendChild(option);
  });
}

function setFontPreload(linkRel, fonts) {
  if (!linkRel) {
    return;
  }
  linkRel.setAttribute('href', googFontStylesheetUrl(fonts.map(fontId)));
  linkRel.removeAttribute('class');
}

function getTextNodes(node) {
  let all = [];
  for (node = node.firstChild; node; node = node.nextSibling) {
    if (node.nodeType === 3) {
      all.push(node);
    } else {
      all = all.concat(getTextNodes(node));
    }
  }
  return all;
}

export default async function bundleHtml(file, { css, js, fonts }) {
  const dom = new JSDOM(readFileSync(file).toString());

  const { document } = dom.window;

  const pkg = JSON.parse((await readFileAsync('./package.json')).toString());

  replacePkgAccess(document, pkg);

  setFonts(document, fonts);
  setFontPreload(document.querySelector('link.font-preload'), fonts);

  await bundleStyle(document, css);
  await bundleJs(document, js);

  return dom.serialize();
}
