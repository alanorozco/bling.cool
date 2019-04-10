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
const { dirs } = require('../config');
const { pipedJsdom, elementWithFileContents } = require('./jsdom-util');
const { promisify } = require('util');
const { readFile } = require('fs');

const readFileAsync = promisify(readFile);

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

function setDefaultText(containers) {
  for (const container of containers) {
    container.textContent = container.textContent.replace(
      '[default.text]',
      'Hello World!'
    );
  }
}

function setFonts(doc, fonts, selectedFont) {
  const select = doc.querySelector('select#font');
  if (!select) {
    return;
  }
  fonts.forEach(([name], i) => {
    const option = doc.createElement('option');
    option.value = i;
    option.textContent = name;
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
  linkRel.setAttribute(
    'href',
    linkRel
      .getAttribute('href')
      .replace(
        '[font.all]',
        fonts.map(([name]) => name.replace(/\s+/, '+')).join('|')
      )
  );
  linkRel.removeAttribute('class');
}

function setTexture(doc, selected) {
  if (selected === undefined) {
    return;
  }
  for (const { style } of doc.querySelectorAll('.textured')) {
    style.backgroundImage = `url(${dirs.textures.gif}/t${selected}.gif)`;
  }
}

module.exports = function bundleIndex({
  css,
  js,
  fonts,
  selectedFont,
  selectedTexture,
}) {
  return pipedJsdom(async doc => {
    const { name, description, repository, author } = JSON.parse(
      (await readFileAsync('./package.json')).toString()
    );

    setTitle(doc, name);
    setDescription(doc, description);

    setFonts(doc, fonts, selectedFont);
    setFontPreload(doc.querySelector('link.font-preload'), fonts);

    setDefaultText(doc.querySelectorAll('.default-text-container'));

    setTexture(doc, selectedTexture);

    await bundleStyle(doc, css);

    if (js) {
      doc.body.appendChild(await elementWithFileContents(doc, 'script', js));
    }

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

    if (doc.documentElement.hasAttribute('amp')) {
      doc.head.innerHTML = doc.head.innerHTML.replace(
        '<!-- AMP_BOILERPLATE -->',
        (await readFileAsync('./artifacts/amp-boilerplate.html')).toString()
      );
    }
  });
};
