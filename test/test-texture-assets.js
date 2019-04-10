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

const { dirs } = require('../config');
const { existsSync, readFile } = require('fs');
const { expect } = require('chai');
const { promisify } = require('util');
const glob = require('fast-glob');
const path = require('path');

const readFileAsync = promisify(readFile);

const b64gifmime = 'data:image/gif;base64,';

describe('Texture asset set', () => {
  const allTextureFiles = glob(path.join(dirs.textures.gif, 't*.gif'));

  it('has respective JSON frames files', async () => {
    const files = await allTextureFiles;

    for (const file of files) {
      const id = path.basename(file).replace(/[^0-9]+/g, '');
      const expectedFile = path.join(dirs.textures.frames, `f${id}.json`);
      expect(existsSync(expectedFile), path.basename(expectedFile)).to.be.true;
    }
  });

  it('has initial.json with first frames', async () => {
    const initial = path.join(dirs.textures.frames, 'initial.json');

    expect(existsSync(initial), path.basename(initial)).to.be.true;

    const set = JSON.parse((await readFileAsync(initial)).toString());

    expect(set).to.have.lengthOf((await allTextureFiles).length);

    for (const data of Object.values(set)) {
      expect(data.startsWith(b64gifmime), 'Starts with base64 gif mimetype').to
        .be.true;
      expect(data, 'Non-empty data').to.have.length.greaterThan(
        b64gifmime.length
      );
    }
  });
});
