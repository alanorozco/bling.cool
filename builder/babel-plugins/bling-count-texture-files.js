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

const { join: pathJoin } = require('path');
const glob = require('fast-glob');

const declaratorName = 'textureAssetsCountReplaceMe';
const globDir = pathJoin(__dirname, '../../assets/t*.gif');
const validNameRe = /^.+\/t([0-9]+)\.gif$/;

module.exports = function({ types: t }) {
  const count =
    1 +
    glob
      .sync(globDir)
      .filter(path => validNameRe.test(path))
      .reduce(
        (max, path) =>
          Math.max(max, parseInt(path.replace(validNameRe, '$1'), 10)),
        -Infinity
      );

  return {
    visitor: {
      VariableDeclarator({ node }) {
        if (node.id.name !== declaratorName) {
          return;
        }
        if (!t.isNumericLiteral(node.init)) {
          return;
        }
        node.init = t.numericLiteral(count);
      },
    },
  };
};
