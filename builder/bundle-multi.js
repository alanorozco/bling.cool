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

import { dirs, uglify as uglifyConfig } from './config';
import babel from 'rollup-plugin-babel';
import buffer from 'vinyl-buffer';
import bundleIndex from './bundle-index';
import commonjs from 'rollup-plugin-commonjs';
import gulp from 'gulp';
import htmlmin from 'gulp-html-minifier';
import path from 'path';
import rollup from 'rollup-stream';
import rollupResolve from 'rollup-plugin-node-resolve';
import source from 'vinyl-source-stream';
import terser from 'gulp-terser';

function jsRollup(input) {
  return rollup({
    input: path.join('src', input),
    format: 'iife',
    name: 'bling',
    plugins: [rollupResolve(), commonjs(), babel()],
  })
    .pipe(source(input))
    .pipe(gulp.dest(dirs.dist.root));
}

function task(name, fn) {
  function wrapped(...opts) {
    return fn(...opts);
  }
  wrapped.displayName = name;
  return wrapped;
}

function uglifyJsItem(input) {
  return gulp
    .src(path.join(dirs.dist.root, input))
    .pipe(terser({ ...uglifyConfig }))
    .pipe(gulp.dest(dirs.dist.root));
}

export function bundle(bundles, minify) {
  const builders = [];
  const bundlers = [];
  const minifiers = [];

  for (const { name, js, inlineJs, html, ...bundleIndexOpts } of bundles) {
    if (js) {
      builders.push(task(`js:${name}`, () => jsRollup(`${name}.js`)));

      if (minify) {
        minifiers.push(
          task(`min:js:${name}`, () => uglifyJsItem(`${name}.js`))
        );
      }
    }

    if (html) {
      bundlers.push(
        task(`html:${name}`, () =>
          gulp
            .src(path.join('src', `${name}.html`))
            .pipe(buffer())
            .pipe(
              bundleIndex({ js: inlineJs ? js : undefined, ...bundleIndexOpts })
            )
        ).pipe(gulp.dest(dirs.dist.root))
      );
    }
  }

  if (minify && bundlers.length > 0) {
    minifiers.push(
      task(`min:html:*`, () =>
        gulp
          .src(path.join(dirs.dist.root, '*.html'))
          .pipe(
            htmlmin({
              collapseBooleanAttributes: true,
              collapseWhitespace: true,
              minifyCSS: true,
              removeAttributeQuotes: true,
              removeComments: true,
              sortAttributes: true,
              sortClassName: true,
            })
          )
          .pipe(gulp.dest(dirs.dist.root))
      )
    );
  }

  const series = [builders, bundlers, minifiers]
    .filter(({ length }) => length > 0)
    .map(parallel => gulp.parallel(...parallel));

  return gulp.series(...series);
}
