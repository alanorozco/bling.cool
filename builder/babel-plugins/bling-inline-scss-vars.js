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
import { getLengthNumeral } from '../../lib/css';
import { vars } from '../../src/index.scss.vars';

function inlineLiteral(t, name) {
  if (!name in vars) {
    throw new Error(`Unknown SCSS var "${name}".`);
  }
  const value = vars[name];
  if (Array.isArray(value)) {
    return t.arrayExpression(value.map(c => t.numericLiteral(c)));
  }
  if (/^[0-9]/.test(value)) {
    return t.numericLiteral(getLengthNumeral(value));
  }
  return t.stringLiteral(value);
}

export default function({ types: t }) {
  return {
    visitor: {
      CallExpression(path) {
        const { callee, arguments: args } = path.node;
        if (!t.isIdentifier(callee)) {
          return;
        }
        if (callee.name != 'scssVar') {
          return;
        }
        if (args.length != 1) {
          throw new Error('Incorrect scssVar usage. Must be 1 argument.');
        }
        if (!t.isStringLiteral(args[0])) {
          throw new Error(
            'Incorrect scssVar usage. Argument must be literal string'
          );
        }
        path.replaceWith(inlineLiteral(t, args[0].value));
      },
    },
  };
}
