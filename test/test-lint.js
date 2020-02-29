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

import { CLIEngine } from 'eslint';
import { expect } from 'chai';
import glob from 'fast-glob';

const toplevel = ['artifacts', 'builder', 'lib', 'src', 'test'];

const formatOrFilterMessage = ({ line, column, message, ruleId, severity }) =>
  severity < 2
    ? null
    : `ERROR at ${line}:${column} ${message.slice(0, -1)} - ${ruleId}\n`;

describe('eslint', () => {
  const { results } = new CLIEngine({ useEslintrc: true }).executeOnFiles(
    glob.sync(toplevel.map(dir => `${dir}/**/*.js`), {
      ignore: ['**/node_modules/**/*'],
    })
  );
  for (const { filePath, messages } of results) {
    it(`validates ${filePath}`, () => {
      const filtered = messages.map(formatOrFilterMessage).filter(m => !!m);

      if (filtered.length > 0) {
        expect.fail(`\n${filtered.join('\n')}`);
      }
    });
  }
});
