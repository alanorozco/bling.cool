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

const { argv } = require('yargs');
const { dest, parallel, series, src, watch: gulpWatch } = require('gulp');
const { dirs } = require('./config');
const { textures } = require('./builder/textures');
const { textureFirstFrameUrl, textureId } = require('./lib/textures');
const express = require('express');
const babel = require('rollup-plugin-babel');
const buffer = require('vinyl-buffer');
const bundleIndex = require('./builder/bundle-index');
const commonjs = require('rollup-plugin-commonjs');
const docs = require('./builder/docs');
const htmlmin = require('gulp-html-minifier');
const path = require('path');
const rollup = require('rollup-stream');
const rollupResolve = require('rollup-plugin-node-resolve');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const test = require('./builder/test');
const uglify = require('gulp-uglifyjs');

const fonts = require('./artifacts/fonts');
const fontsSubset = require('./builder/fonts-subset');
const textureSet = require('./builder/textures');

function jsRollup(input) {
  return rollup({
    input: path.join('src', input),
    format: 'iife',
    name: 'bling',
    plugins: [rollupResolve(), commonjs(), babel()],
  }).pipe(source(input));
}

function jsDefault() {
  return jsRollup('index.js').pipe(dest(dirs.dist.workspace));
}

function jsAmp(done) {
  if (!argv.amp) {
    return done();
  }
  return jsRollup('index.amp.js').pipe(dest(dirs.dist.root));
}

const js = parallel(jsDefault, jsAmp);

function css() {
  return src('./src/index.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest(dirs.dist.workspace));
}

function serve() {
  const port = 8000;
  const app = express();
  app.use(
    express.static(dirs.dist.root, {
      setHeaders(res, _) {
        if (!argv.amp) {
          return;
        }
        res.setHeader(
          'AMP-Access-Control-Allow-Source-Origin',
          `http://localhost:${port}`
        );
      },
    })
  );
  app.listen(port);
}

function bundleDefault() {
  return src('./src/index.html')
    .pipe(buffer())
    .pipe(
      bundleIndex({
        fonts,
        js: path.join(dirs.dist.workspace, 'index.js'),
        css: path.join(dirs.dist.workspace, 'index.css'),
      })
    )
    .pipe(dest(dirs.dist.root));
}

function bundleAmp(done) {
  if (!argv.amp) {
    return done();
  }
  const [selectedFont] = fontsSubset[
    Math.floor(fontsSubset.length * Math.random())
  ];
  const textureSubset = textureSet.all().slice(0, 10);

  return src('./src/index.amp.html')
    .pipe(buffer())
    .pipe(
      bundleIndex({
        css: path.join(dirs.dist.workspace, 'index.css'),
        fonts: fontsSubset,
        selectedFont,
        selectedTexture: Math.floor(textureSubset.length * Math.random()),
        textureOptions: textureSubset.map(path =>
          textureFirstFrameUrl(textureId(path))
        ),
      })
    )
    .pipe(dest(dirs.dist.root));
}

const bundle = parallel(bundleDefault, bundleAmp);

function minifyHtml() {
  return src(path.join(dirs.dist.root, '*.html'))
    .pipe(
      htmlmin({
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: { toplevel: true },
        removeAttributeQuotes: true,
        removeComments: true,
        sortAttributes: true,
        sortClassName: true,
      })
    )
    .pipe(dest(dirs.dist.root));
}

function uglifyJs() {
  return src(path.join(dirs.dist.root, '*.js'))
    .pipe(uglify())
    .pipe(dest(dirs.dist.root));
}

const minify = parallel(minifyHtml, uglifyJs);

function copyTextureFiles(from) {
  return src([path.join(from, '*'), '!*.md']).pipe(
    dest(path.join(dirs.dist.root, from))
  );
}

const barebones = series(parallel(js, css), bundle);

const copyTextureFrames = () => copyTextureFiles(dirs.textures.frames);
const copyTextureGifs = () => copyTextureFiles(dirs.textures.gif);

const copyTextures = parallel(copyTextureGifs, copyTextureFrames);

const dist = parallel(series(barebones, minify), copyTextures);

function watch() {
  serve();
  gulpWatch(
    [
      '3p/*',
      'artifacts/*',
      'src/*',
      'src/**/*',
      'lib/*',
      'lib/**/*',
      path.join(dirs.textures.gif, '*'),
      path.join(dirs.textures.frames, '*'),
    ],
    parallel(copyTextures, barebones)
  );
}

exports.barebones = barebones;
exports.default = series(parallel(barebones, copyTextures), watch);
exports.dist = dist;
exports.docs = docs;
exports.integrate = series(dist, test);
exports.test = test;
exports.textures = textures;
