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
import {
  fontOption,
  selectElementOption,
  textureOption,
} from '../lib/renderers';
import { JSDOM } from 'jsdom';
import { promisify } from 'util';
import { readFile, readFileSync } from 'fs-extra';
import { textureUrl } from '../lib/textures';
import emojiStrip from 'emoji-strip';

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

function setTitle(doc, name) {
  const title = doc.querySelector('title');
  title.textContent = title.textContent.replace('[package.name]', name);
}

function setDescription(doc, description) {
  const metaDesc = doc.querySelector('meta[name=description]');
  metaDesc.setAttribute(
    'content',
    metaDesc
      .getAttribute('content')
      .replace('[package.description]', description)
  );
}

function setDefaultText(doc, text) {
  for (const container of doc.querySelectorAll(
    '#editable, .editable-sentinel'
  )) {
    container.textContent = container.textContent.replace(
      '[default.text]',
      text
    );
  }
}

function setFonts(doc, fonts, selectedFont) {
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
    if (name == selectedFont) {
      selectElementOption(option);
    }
    container.appendChild(option);
  });
  for (const { style } of doc.querySelectorAll('.default-font')) {
    style.fontFamily = `'${selectedFont}', sans-serif`;
  }
  if (selectedFont) {
    doc.querySelector('.selected-font').textContent = selectedFont;
  }
}

function setFontPreload(linkRel, fonts) {
  if (!linkRel) {
    return;
  }
  linkRel.setAttribute('href', googFontStylesheetUrl(fonts.map(fontId)));
  linkRel.removeAttribute('class');
}

function setTexture(doc, selected) {
  if (selected === undefined) {
    return;
  }
  for (const { style } of doc.querySelectorAll('.textured')) {
    style.backgroundImage = `url(${textureUrl(selected)})`;
  }
}

function setTextureOptions(doc, options, selected) {
  if (!options) {
    return;
  }
  const container = doc.querySelector('.texture-options');
  if (!container) {
    return;
  }
  options
    .map((url, index) =>
      textureOption(container.ownerDocument, url, selected === index)
    )
    .forEach(el => {
      container.appendChild(el);
    });
}

export default async function bundleIndex(
  file,
  {
    css,
    js,
    fonts,
    selectedFont,
    selectedTexture,
    textureOptions, // unused
  }
) {
  const dom = new JSDOM(readFileSync(file));

  const { document: doc } = dom.window;

  const { name, description, repository, author } = JSON.parse(
    (await readFileAsync('./package.json')).toString()
  );

  let match;
  const partialsRe = /<!-- partial:([^\s]+) -->/;
  do {
    match = partialsRe.exec(doc.documentElement.innerHTML);
    if (match) {
      const [fullMatch, id] = match;
      const content = (await readFileAsync(
        `src/partials/${id}.html`
      )).toString();
      doc.documentElement.innerHTML = doc.documentElement.innerHTML.replace(
        fullMatch,
        content
      );
    }
  } while (match);

  setTitle(doc, name);
  setDescription(doc, description);

  setFonts(doc, fonts, selectedFont);
  setFontPreload(doc.querySelector('link.font-preload'), fonts);

  setDefaultText(doc, 'Hello World!');

  setTexture(doc, selectedTexture);
  setTextureOptions(doc, textureOptions, selectedTexture);

  await bundleStyle(doc, css);
  await bundleJs(doc, js);

  const h1 = doc.querySelector('h1');
  h1.textContent = h1.textContent.replace(
    '[package.description]',
    emojiStrip(description).trim()
  );

  const authorLink = doc.querySelector('a#meta-author');
  if (authorLink) {
    authorLink.setAttribute('href', author.url);
    authorLink.textContent = authorLink.textContent.replace(
      '[package.author.name]',
      author.name
    );
  }

  const repoLink = doc.querySelector('a#meta-repository');
  if (repoLink) {
    repoLink.setAttribute('href', repository);
  }

  return dom.serialize();
}
