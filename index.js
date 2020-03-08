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

import { blue, cyan, magenta, red } from 'colors';
import { css as cssVars } from './src/index.scss.vars';
import { dirs, uglify as uglifyConfig } from './config';
import { minify as htmlminify } from 'html-minifier';
import { minify } from 'terser';
import { rollup } from 'rollup';
import { textures } from './builder/textures';
import babel from 'rollup-plugin-babel';
import bundleHtml from './builder/bundle-html';
import commonjs from '@rollup/plugin-commonjs';
import cssDeclarationSorter from 'css-declaration-sorter';
import cssnano from 'cssnano';
import del from 'del';
import docs from './builder/docs';
import express from 'express';
import fonts from './artifacts/fonts';
import fs from 'fs-extra';
import glob from 'fast-glob';
import log from 'fancy-log';
import mergeMediaQueries from './builder/postcss/merge-media-queries';
import path from 'path';
import postcss from 'postcss';
import postcssCalc from 'postcss-calc';
import postcssDefineProperty from 'postcss-define-property';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssScss from 'postcss-scss';
import postcssSimpleVars from 'postcss-simple-vars';
import rollupResolve from '@rollup/plugin-node-resolve';
import test from './builder/test';

async function copyOne(file) {
  const base = path.basename(file);
  await fs.mkdirp(dirs.dist.root);
  await fs.copyFile(file, path.join(dirs.dist.root, base));
  return base;
}

async function jsrollup(input) {
  const bundle = await rollup({
    input,
    plugins: [rollupResolve(), commonjs(), babel()],
  });
  await bundle.write({
    dir: dirs.dist.root,
    format: 'iife',
    name: 'bling',
  });
  return path.basename(input);
}

function js() {
  return Promise.all([
    copyOne('3p/gif.js/gif.worker.js', dirs.dist.root),
    jsrollup('src/index.js'),
    jsrollup('src/encoder.js'),
  ]);
}

async function css() {
  const from = 'src/index.scss';
  const to = path.join(dirs.dist.workspace, 'index.css');

  await fs.mkdirp(dirs.dist.workspace);

  const { css } = await postcss([
    postcssImport(),
    postcssDefineProperty({
      syntax: {
        atrule: true,
        parameter: '',
        separator: '',
      },
    }),
    postcssSimpleVars({ variables: cssVars }),
    // postcssMixins(),
    postcssNested(),
    postcssCalc(),
    mergeMediaQueries(),
    cssnano(),
    cssDeclarationSorter({ order: 'smacss' }),
    //
  ]).process(
    // sass({ file: from }).css,
    fs.readFileSync(from).toString(),
    {
      parser: postcssScss,
      to,
      from,
    }
  );

  await fs.writeFile(to, css);
}

function serve() {
  const port = 8000;
  const app = express();
  app.use(express.static(dirs.dist.root));
  app.listen(port);
  log(cyan(`http://localhost:8000`));
}

async function html() {
  const file = './src/index.html';
  const code = await bundleHtml(file, {
    fonts,
    js: path.join(dirs.dist.root, 'index.js'),
    css: path.join(dirs.dist.workspace, 'index.css'),
  });
  return fs.writeFile(path.join(dirs.dist.root, path.basename(file)), code);
}

async function minifyHtml() {
  for (const file of await glob(path.join(dirs.dist.root, '*.html'))) {
    const code = htmlminify(fs.readFileSync(file).toString(), {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      minifyCSS: true,
      removeAttributeQuotes: true,
      removeComments: true,
      sortAttributes: true,
      sortClassName: true,
    });
    await fs.writeFile(path.join(dirs.dist.root, path.basename(file)), code);
  }
}

async function terser(files) {
  for (const file of files) {
    const pathname = path.join(dirs.dist.root, file);
    const { error, code } = minify(
      { [pathname]: fs.readFileSync(pathname).toString() },
      uglifyConfig
    );
    if (error) throw error;
    await fs.writeFile(pathname, code);
  }
}

async function copyContents(from) {
  for (const file of await glob([`${from}/*`, '!*.md'])) {
    const pathname = path.join(dirs.dist.root, file);
    await fs.mkdirp(path.dirname(pathname));
    await fs.copyFile(file, pathname);
  }
}

async function bare() {
  const jsfiles = task(js);
  await Promise.all([jsfiles, task(css)]);
  await task(html);
  return jsfiles;
}

function assets() {
  return task(
    function copy(dirs) {
      return dirs.map(copyContents);
    },
    ['assets', dirs.textures.gif, dirs.textures.frames]
  );
}

async function postCleanup() {
  await del(dirs.dist.workspace);
  await del(path.join(dirs.dist.root, 'index.js'));
}

async function dist() {
  await task(clean);
  await Promise.all([
    task(bare).then(files => task(terser, files)),
    task(assets),
  ]);
  await task(html);
  await task(minifyHtml);
  await postCleanup();
}

function clean() {
  return del([dirs.dist.root, dirs.dist.workspace]);
}

async function integrate() {
  await task(dist);
  await task(test);
}

function build() {
  return Promise.all([task(bare), task(assets)]);
}

const tasks = {
  assets,
  bare,
  build,
  clean,
  dist,
  docs,
  integrate,
  serve,
  test,
  textures,
};

async function task(task, ...args) {
  const { name } = task;
  const step = (name, ...msg) =>
    args[0] !== undefined ? log(name, args[0], ...msg) : log(name, ...msg);
  step(magenta(name), '...');
  try {
    const result = await task.apply(null, args);
    step(blue(name), '✓');
    return result;
  } catch (error) {
    step(red(name), '!');
    throw error;
  }
}

const default_ = build;

const name = process.argv[2];
(name in tasks ? task(tasks[name]) : task(default_)).catch(({ stack }) =>
  console.error(stack)
);
