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

const { fontId, googFontStylesheetUrl } = require('../lib/fonts');
const { pipedJsdom, elementWithFileContents } = require('./jsdom-util');
const { promisify } = require('util');
const { readFile } = require('fs');
const { textureUrl } = require('../lib/textures');
const renderers = require('../lib/renderers');

const readFileAsync = promisify(readFile);

async function bundleJs(doc, js) {
  if (!js) {
    return;
  }
  doc.body.appendChild(await elementWithFileContents(doc, 'script', js));
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
  const select = doc.querySelector('select#font');
  if (!select) {
    return;
  }
  fonts.forEach(([name, weight]) => {
    const option = renderers.fontOption(doc, name, weight);
    if (name == selectedFont) {
      option.setAttribute('selected', '');
    }
    select.appendChild(option);
  });
  for (const { style } of doc.querySelectorAll('.default-font')) {
    style.fontFamily = `'${selectedFont}', sans-serif`;
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
      renderers.textureOption(container.ownerDocument, url, selected === index)
    )
    .forEach(el => {
      container.appendChild(el);
    });
}

module.exports = function bundleIndex({
  css,
  js,
  fonts,
  selectedFont,
  selectedTexture,
  textureOptions,
}) {
  return pipedJsdom(async doc => {
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
    h1.textContent = description;

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
  });
};
