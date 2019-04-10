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

const { blue, red } = require('colors');
const glob = require('fast-glob');
const log = require('fancy-log');
const path = require('path');

function createRunner(runners, print, error) {
  return (sentence, test) => {
    runners.push(async () => {
      try {
        await test();
        print('🆗');
      } catch (e) {
        print('❗');
        error(e, sentence);
      }
    });
  };
}

module.exports = async function test() {
  const files = await glob('./test/test-*.js');
  const errors = [];
  const line = [];
  const runners = [];

  const leftPadding = Array('[00:00:00]'.length)
    .fill(' ')
    .join('');

  const printToLine = c => {
    line.push(c);
    if (line.length > 1) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    }
    process.stdout.write(`${leftPadding} ${line.join(' ')}`);
  };

  log(blue('Running tests...'));

  for (const file of files) {
    const pushError = (e, sentence) => {
      errors.push([e, path.basename(file), title, sentence]);
    };

    const runner = createRunner(runners, printToLine, pushError);
    const [title, tasks] = require(require.resolve(
      path.relative(__dirname, file)
    ));

    tasks(runner);
  }

  await Promise.all(runners.map(fn => fn()));

  process.stdout.write('\n');

  for (const [e, file, title, sentence] of errors) {
    console.log(`${red(file)}:`, title, sentence);
    console.log(e.stack);
  }

  if (errors.length > 0) {
    process.exit(1);
  }
};
