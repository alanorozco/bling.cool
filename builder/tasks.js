/**
 * Copyright 2020 Alan Orozco <alan@orozco.xyz>
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
import { blue, cyan, gray, magenta, red } from 'colors';
import { css as cssVars } from '../src/index.scss.vars';
import { dirs, uglify as uglifyConfig } from '../config';
import { minify as htmlminify } from 'html-minifier';
import { JSDOM } from 'jsdom';
import { minify as jsminify } from 'terser';
import { readFileSync } from 'fs-extra';
import { rollup } from 'rollup';
import { Script } from 'vm';
import { textures } from './textures';
import babel from 'rollup-plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import cssDeclarationSorter from 'css-declaration-sorter';
import cssnano from 'cssnano';
import del from 'del';
import docs from './docs';
import express from 'express';
import fancylog from 'fancy-log';
import fonts from '../artifacts/fonts';
import fs from 'fs-extra';
import glob from 'fast-glob';
import inject from '@rollup/plugin-inject';
import mergeMediaQueries from './postcss/merge-media-queries';
import path from 'path';
import postcss from 'postcss';
import postcssCalc from 'postcss-calc';
import postcssDefineProperty from 'postcss-define-property';
import postcssImport from 'postcss-import';
import postcssNested from 'postcss-nested';
import postcssScss from 'postcss-scss';
import postcssSimpleVars from 'postcss-simple-vars';
import rollupResolve from '@rollup/plugin-node-resolve';
import test from './test';

const log = process.argv.includes('--timed') ? fancylog : console.log;

const outputFilename = filename => filename.replace(/\.jsx$/, '.js');

async function copy(file, flat = false) {
  const dir = dirs.dist;
  const outFile = path.join(dir, flat ? path.basename(file) : file);
  await fs.mkdirp(path.dirname(outFile));
  await fs.copyFile(file, outFile);
  return outputFilename(outFile);
}

async function copydir(from) {
  for (const file of await glob([`${from}/*`, '!*.md'])) {
    await copy(file);
  }
}

async function jsrollup(input, opts = {}) {
  const bundle = await rollup({
    input,
    plugins: [
      rollupResolve(),
      commonjs(),
      babel(opts.babel || {}),
      inject({
        include: '**/*.jsx',
        exclude: 'node_modules/**',
        modules: { React: path.resolve('src/jsx/jsx.js') },
      }),
    ],
  });
  const { dir = dirs.dist } = opts;
  await bundle.write({
    dir,
    format: 'iife',
    name: 'bling',
  });
  return outputFilename(`${dir}/${path.basename(input)}`);
}

async function jsrollupentry(entry, method, ...args) {
  const { workspace } = dirs;
  const filename = `${workspace}/${path.basename(entry)}`;
  const importpath = path.relative(workspace, entry);
  fs.writeFileSync(
    filename,
    `import { ${method} } from './${importpath}'; ${method}(self);`
  );
  return verbose(jsrollup, filename, ...args);
}

function js() {
  return Promise.all([
    verbose(copy, '3p/gif.js/gif.worker.js', /* flat */ true),
    // TODO: These are render steps
    verbose(jsrollup, 'src/encoder.js'),
  ]);
}

async function css() {
  const from = 'src/index.scss';
  const to = path.join(dirs.workspace, 'index.css');

  await fs.mkdirp(dirs.workspace);

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
    postcssNested(),
    postcssCalc(),
    mergeMediaQueries(),
    cssnano(),
    cssDeclarationSorter({ order: 'smacss' }),
  ]).process(fs.readFileSync(from).toString(), {
    parser: postcssScss,
    to,
    from,
  });

  await fs.writeFile(to, css);
}

function serve() {
  const port = 8000;
  const app = express();
  app.use(({ method, path }, _, next) => {
    log(method, gray(path));
    next();
  });
  app.use(express.static(dirs.dist));
  app.listen(port);
  log(cyan(`http://localhost:8000`));
}

async function render(input) {
  const { workspace, dist } = dirs;

  const uppercased = path
    .basename(input, '.jsx')
    .replace(/^[a-z]/, l => l.toUpperCase());

  const run = await verbose(jsrollupentry, input, `${uppercased}Component`);
  const render = await verbose(jsrollupentry, input, uppercased, {
    dir: workspace,
  });

  const basename = path.basename(input, '.jsx');
  const renderer = readFileSync(render).toString();

  const dom = new JSDOM('', { runScripts: 'outside-only' });
  const vmContext = dom.getInternalVMContext();
  const script = new Script(renderer);

  vmContext._INIT = {
    fonts,
    js: fs.readFileSync(run).toString(),
    css: fs.readFileSync(`${workspace}/${basename}.css`).toString(),
    pkg: JSON.parse(fs.readFileSync('package.json').toString()),
  };

  script.runInContext(vmContext);

  return fs.writeFile(`${dist}/${basename}.html`, dom.serialize());
}

async function html() {
  return Promise.all(
    (await glob('src/*.jsx')).map(input => verbose(render, input))
  );
}

function htmlmin(file) {
  const code = htmlminify(fs.readFileSync(file).toString(), {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    minifyCSS: true,
    removeAttributeQuotes: true,
    removeComments: true,
    sortAttributes: true,
    sortClassName: true,
  });
  return fs.writeFile(path.join(dirs.dist, path.basename(file)), code);
}

async function minify() {
  return Promise.all([
    ...(await glob(path.join(dirs.dist, '*.html'))).map(file =>
      verbose(htmlmin, file)
    ),
    ...(await glob(path.join(dirs.dist, '*.js'))).map(file =>
      verbose(terser, file)
    ),
  ]);
}

async function terser(pathname) {
  const { error, code } = jsminify(
    { [pathname]: fs.readFileSync(pathname).toString() },
    uglifyConfig
  );
  if (error) throw error;
  await fs.writeFile(pathname, code);
}

async function bare() {
  const jsfiles = task(js);
  await Promise.all([jsfiles, task(css)]);
  await task(html);
  return jsfiles;
}

function assets() {
  return Promise.all(
    ['assets', dirs.textures].map(dir => verbose(copydir, dir))
  );
}

async function postCleanup() {
  await del(dirs.workspace);
  await del(path.join(dirs.dist, 'index.js'));
}

async function dist() {
  await task(clean);
  await Promise.all([task(bare).then(() => task(minify)), task(assets)]);
  await postCleanup();
}

function clean() {
  return del([dirs.dist, dirs.workspace]);
}

async function integrate() {
  await task(dist);
  await task(test);
}

function build() {
  return Promise.all([task(bare), task(assets)]);
}

export async function task(fn, ...args) {
  return _run(fn, true, ...args);
}

export function verbose(fn, ...args) {
  return _run(
    fn,
    process.argv.includes('-v') ||
      process.argv.includes('dist') ||
      process.argv.includes('build'),
    ...args
  );
}

export async function _run(fn, logOuter = false, ...args) {
  const { name } = fn;
  const step = (name, ...msg) =>
    args[0] !== undefined ? log(name, ...msg, args[0]) : log(name, ...msg);
  if (logOuter) {
    step(magenta(name), '...');
  }
  try {
    const result = await fn(...args);
    if (logOuter) {
      step(blue(name), '✓');
    }
    return result;
  } catch (error) {
    step(red(name), '!');
    throw error;
  }
}

export const tasks = {
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

export function runTask(name, default_ = build) {
  (name in tasks ? task(tasks[name]) : task(default_)).catch(({ stack }) =>
    console.error(stack)
  );
}
