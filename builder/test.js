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

import { argv } from 'yargs';

import { exec } from 'child_process';
import { magenta } from 'colors';
import { promisify } from 'util';
import glob from 'fast-glob';
import log from 'fancy-log';
import Mocha from 'mocha';

const execAsync = promisify(exec);

const modifiedFilesGitCmd = 'git diff-tree --no-commit-id --name-only -r HEAD';

const modifiedFiles = async () =>
  (await execAsync(modifiedFilesGitCmd)).stdout.trim().split('\n');

export default async function test() {
  const reporter = argv.travis ? 'dot' : 'nyan';

  const mocha = new Mocha({ reporter });

  if (argv.travis) {
    if (!(await modifiedFiles()).find(f => /\.(js|json|gif)$/.test(f))) {
      log(magenta('No affecting files modified.'));
      log('Skipping tests.');
      return;
    }
  }

  for (const file of await glob('./test/test-*.js')) {
    mocha.addFile(file);
  }

  return new Promise(resolve => {
    mocha.run(failures => {
      process.exitCode = failures ? 1 : 0;
      resolve();
    });
  });
}
