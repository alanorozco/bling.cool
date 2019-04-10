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
const { textures } = require('./builder/textures');
const express = require('express');
const babel = require('rollup-plugin-babel');
const buffer = require('vinyl-buffer');
const bundleIndex = require('./builder/bundle-index');
const commonjs = require('rollup-plugin-commonjs');
const docs = require('./builder/docs');
const htmlmin = require('gulp-html-minifier');
const rollup = require('rollup-stream');
const rollupResolve = require('rollup-plugin-node-resolve');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const test = require('./builder/test');

function js() {
  return rollup({
    input: 'src/index.js',
    format: 'iife',
    name: 'bling',
    plugins: [rollupResolve(), commonjs(), babel()],
  })
    .pipe(source('index.js'))
    .pipe(dest('./dist/.workspace'));
}

function css() {
  return src('./src/index.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('./dist/.workspace'));
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
        js: './dist/.workspace/index.js',
        css: './dist/.workspace/index.css',
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
const dist = parallel(series(barebones, minify), copyassets);

function watch() {
  serve();
  gulpWatch(
    ['3p/*', 'artifacts/*', 'assets/*', 'src/*'],
    parallel(copyassets, barebones)
  );
}

function copyassets() {
  return src(['./assets/*', './assets/**/*', '!*.md']).pipe(
    dest('./dist/assets')
  );
}

exports.barebones = barebones;
exports.default = series(parallel(barebones, copyassets), watch);
exports.dist = dist;
exports.docs = docs;
exports.integrate = series(dist, test);
exports.test = test;
exports.textures = textures;
