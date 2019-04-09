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

const { dest, parallel, series, src, watch: gulpWatch } = require('gulp');
const { JSDOM } = require('jsdom');
const { promisify } = require('util');
const { Readable } = require('stream');
const { readFile } = require('fs');
const express = require('express');
const babel = require('rollup-plugin-babel');
const buffer = require('vinyl-buffer');
const commonjs = require('rollup-plugin-commonjs');
const htmlmin = require('gulp-html-minifier');
const rollup = require('rollup-stream');
const rollupResolve = require('rollup-plugin-node-resolve');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const through = require('through2');

const readFileAsync = promisify(readFile);

function toStream(str) {
  const s = new Readable();
  s.push(str);
  s.push(null);
  return s;
}

function pipedJsdom(mutate) {
  return through.obj(async function(file, encoding, callback) {
    const html = file.contents.toString(encoding);
    const { document: doc } = new JSDOM(html).window;
    await mutate(doc);
    file.contents = toStream(doc.documentElement.outerHTML);
    this.push(file);
    callback();
  });
}

function elementWithContents(doc, tagName, contents) {
  const element = doc.createElement(tagName);
  element.innerHTML = contents;
  return element;
}

async function elementWithFileContents(doc, tagName, path) {
  return elementWithContents(
    doc,
    tagName,
    (await readFileAsync(path)).toString()
  );
}

function bundleIndex({ css, js }) {
  return pipedJsdom(async doc => {
    const { name, description, repository, author } = JSON.parse(
      (await readFileAsync('./package.json')).toString()
    );
    doc.head.appendChild(
      elementWithContents(doc, 'title', `${name}: ${description}`)
    );
    doc.head.appendChild(await elementWithFileContents(doc, 'style', css));
    doc.body.appendChild(await elementWithFileContents(doc, 'script', js));
    doc.querySelector('h1').textContent = description;

    const authorLink = doc.querySelector('a#meta-author');
    authorLink.setAttribute('href', author.url);
    authorLink.textContent = author.name;

    const repoLink = doc.querySelector('a#meta-repository');
    repoLink.setAttribute('href', repository);
  });
}

function js() {
  return rollup({
    input: 'src/index.js',
    format: 'iife',
    name: 'bling',
    plugins: [rollupResolve(), commonjs(), babel()],
  })
    .pipe(source('index.js'))
    .pipe(dest('./dist'));
}

function css() {
  return src('./src/index.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('./dist'));
}

function serve() {
  const app = express();
  app.use(express.static('dist'));
  app.listen(8000);
}

function bundle() {
  return src('./src/index.html')
    .pipe(buffer())
    .pipe(
      bundleIndex({
        js: './dist/index.js',
        css: './dist/index.css',
      })
    )
    .pipe(dest('./dist'));
}

function minify() {
  return src('./dist/*.html')
    .pipe(
      htmlmin({
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: { toplevel: true },
      })
    )
    .pipe(dest('./dist'));
}

const barebones = series(parallel(js, css), bundle);

function watch() {
  serve();
  gulpWatch(
    ['src/*', 'artifacts/*', 'assets/*'],
    parallel(copyassets, barebones)
  );
}

function copyassets() {
  return src('./assets/*').pipe(dest('./dist/assets'));
}

exports.barebones = barebones;
exports.default = series(parallel(barebones, copyassets), watch);
exports.dist = parallel(series(barebones, minify), copyassets);
