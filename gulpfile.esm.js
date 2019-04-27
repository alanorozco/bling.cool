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

import { all as allTextures } from './builder/textures';
import { argv } from 'yargs';
import { dirs, uglify as uglifyConfig } from './config';
import { textureFirstFrameUrl, textureId } from './lib/textures';
import { textures } from './builder/textures';
import babel from 'rollup-plugin-babel';
import buffer from 'vinyl-buffer';
import bundleIndex from './builder/bundle-index';
import commonjs from 'rollup-plugin-commonjs';
import concat from 'gulp-concat';
import cssDeclarationSorter from 'css-declaration-sorter';
import cssnano from 'cssnano';
import del from 'del';
import docs from './builder/docs';
import express from 'express';
import fonts from './artifacts/fonts';
import fontsSubset from './builder/fonts-subset';
import gulp from 'gulp';
import htmlmin from 'gulp-html-minifier';
import path from 'path';
import postcss from 'gulp-postcss';
import postCssMergeMediaQueries from 'postcss-bling-merge-media-queries';
import rollup from 'rollup-stream';
import rollupResolve from 'rollup-plugin-node-resolve';
import sass from 'gulp-sass';
import source from 'vinyl-source-stream';
import test from './builder/test';
import uglify from 'gulp-uglifyjs';

function jsRollup(input) {
  return rollup({
    input: path.join('src', input),
    format: 'iife',
    name: 'bling',
    plugins: [rollupResolve(), commonjs(), babel()],
  }).pipe(source(input));
}

function jsDefault() {
  return jsRollup('index.js').pipe(gulp.dest(dirs.dist.workspace));
}

function jsAmp(done) {
  if (!argv.amp) {
    return done();
  }
  return jsRollup('index.amp.js').pipe(gulp.dest(dirs.dist.root));
}

async function jsEncoder() {
  await new Promise(resolve => {
    jsRollup('encoder.js')
      .pipe(gulp.dest(dirs.dist.workspace))
      .on('end', resolve);
  });

  await new Promise(resolve => {
    gulp
      .src(['3p/gif.js/gif.js', path.join(dirs.dist.workspace, 'encoder.js')])
      .pipe(concat('encoder.js'))
      .pipe(gulp.dest(dirs.dist.root))
      .on('end', resolve);
  });
}

function jsEncoderWorker() {
  return gulp.src('3p/gif.js/gif.worker.js').pipe(gulp.dest(dirs.dist.root));
}

const js = gulp.parallel(jsDefault, jsAmp, jsEncoder, jsEncoderWorker);

function css() {
  return gulp
    .src('./src/index.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(
      postcss([
        cssnano(),
        cssDeclarationSorter({ order: 'smacss' }),
        postCssMergeMediaQueries(),
      ])
    )
    .pipe(gulp.dest(dirs.dist.workspace));
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
  return gulp
    .src('./src/index.html')
    .pipe(buffer())
    .pipe(
      bundleIndex({
        fonts,
        js: path.join(dirs.dist.workspace, 'index.js'),
        css: path.join(dirs.dist.workspace, 'index.css'),
      })
    )
    .pipe(gulp.dest(dirs.dist.root));
}

function bundleAmp(done) {
  if (!argv.amp) {
    return done();
  }
  const [selectedFont] = fontsSubset[
    Math.floor(fontsSubset.length * Math.random())
  ];

  const textureSubsetSize = 15;
  const textureSubset = allTextures().slice(0, textureSubsetSize);

  return gulp
    .src('./src/index.amp.html')
    .pipe(buffer())
    .pipe(
      bundleIndex({
        css: path.join(dirs.dist.workspace, 'index.css'),
        fonts: fontsSubset,
        selectedFont,
        selectedTexture: Math.floor(textureSubsetSize * Math.random()),
        textureOptions: textureSubset.map(path =>
          textureFirstFrameUrl(textureId(path))
        ),
      })
    )
    .pipe(gulp.dest(dirs.dist.root));
}

const bundle = gulp.parallel(bundleDefault, bundleAmp);

function minifyHtml() {
  return gulp
    .src(path.join(dirs.dist.root, '*.html'))
    .pipe(
      htmlmin({
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: { ...uglifyConfig },
        removeAttributeQuotes: true,
        removeComments: true,
        sortAttributes: true,
        sortClassName: true,
      })
    )
    .pipe(gulp.dest(dirs.dist.root));
}

function uglifyJsItem(input) {
  return () =>
    gulp
      .src(path.join(dirs.dist.root, input))
      .pipe(uglify({ ...uglifyConfig }))
      .pipe(gulp.dest(dirs.dist.root));
}

// We have to do this separately because otherwise `gulp-uglify` does some weird
// shit.
const uglifyJs = gulp.parallel(
  uglifyJsItem('encoder.js'),
  uglifyJsItem('index.amp.js')
);

const minify = gulp.parallel(minifyHtml, uglifyJs);

function copyAssetFiles(from) {
  return gulp
    .src([path.join(from, '*'), '!*.md'])
    .pipe(gulp.dest(path.join(dirs.dist.root, from)));
}

const barebones = gulp.series(gulp.parallel(js, css), bundle);

const copyAssets = () => copyAssetFiles('assets');
const copyTextureFrames = () => copyAssetFiles(dirs.textures.frames);
const copyTextureGifs = () => copyAssetFiles(dirs.textures.gif);

const copyAllAssets = gulp.parallel(
  copyAssets,
  copyTextureGifs,
  copyTextureFrames
);

const dist = gulp.parallel(gulp.series(barebones, minify), copyAllAssets);

function watch() {
  serve();
  gulp.watch(
    [
      '3p/*',
      'artifacts/*',
      'assets/*',
      'src/*',
      'src/**/*',
      'lib/*',
      'lib/**/*',
      path.join(dirs.textures.gif, '*'),
      path.join(dirs.textures.frames, '*'),
    ],
    gulp.parallel(copyAllAssets, barebones)
  );
}

function clean() {
  return del([dirs.dist.root, dirs.dist.workspace]);
}

const integrate = gulp.series(dist, test);
const def = gulp.series(gulp.parallel(barebones, copyAllAssets), watch);

export { barebones, clean, dist, docs, test, textures, integrate };
export default def;
