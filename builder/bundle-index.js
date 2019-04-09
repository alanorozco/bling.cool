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
const { pipedJsdom, elementWithFileContents } = require('./jsdom-util');
const { promisify } = require('util');
const { readFile } = require('fs');

const readFileAsync = promisify(readFile);

module.exports = function bundleIndex({ css, js }) {
  return pipedJsdom(async doc => {
    const { name, description, repository, author } = JSON.parse(
      (await readFileAsync('./package.json')).toString()
    );

    const title = doc.querySelector('title');
    title.textContent = title.textContent.replace('[package.name]', name);

    const metaDesc = doc.querySelector('meta[name=description]');
    metaDesc.setAttribute(
      'content',
      metaDesc
        .getAttribute('content')
        .replace('[package.description]', description)
    );

    doc.head.appendChild(await elementWithFileContents(doc, 'style', css));
    doc.body.appendChild(await elementWithFileContents(doc, 'script', js));

    const h1 = doc.querySelector('h1');
    h1.textContent = description;

    const authorLink = doc.querySelector('a#meta-author');
    authorLink.setAttribute('href', author.url);
    authorLink.textContent = author.name;

    const repoLink = doc.querySelector('a#meta-repository');
    repoLink.setAttribute('href', repository);
  });
};
