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

const { basename, join: pathJoin } = require('path');
const { writeFile } = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const { Buffer } = require('buffer');
const glob = require('fast-glob');

const execAsync = promisify(exec);
const writeFileAsync = promisify(writeFile);

const rootDir = './assets/';
const framesDir = pathJoin(rootDir, 'frames');
const globDir = pathJoin(rootDir, 't*.gif');
const validNameRe = /^.+\/t([0-9]+)\.gif$/;

const b64mime = 'data:image/gif;base64,';

const all = () => glob.sync(globDir).filter(path => validNameRe.test(path));

const frameCount = async path =>
  parseInt((await execAsync(`exiftool -b -FrameCount ${path}`)).stdout, 10);

const writeJson = (path, content) =>
  writeFileAsync(path, JSON.stringify(content));

async function extractFrame(path, frame) {
  try {
    const cmd = `gifsicle ${path} '#${frame}'`;
    const { stdout } = await execAsync(cmd, { encoding: 'binary' });
    return [b64mime, Buffer.from(stdout, 'binary').toString('base64')].join('');
  } catch (_) {
    // meh. see `fallbackToPreviousFrame`
  }
}

function fallbackToPreviousFrame(allFrames, frame, i) {
  if (!frame) {
    if (i < 1) {
      throw new Error('Malformed frames.');
    }
    return fallbackToPreviousFrame(allFrames, allFrames[i - 1], i - 1);
  }
  return frame;
}

async function expandFrames(fromGif, toJson) {
  const promises = Array(await frameCount(fromGif))
    .fill(null)
    .map((_, f) => extractFrame(fromGif, f));
  const allResults = await Promise.all(promises);
  const sequence = allResults.map((frame, i) =>
    fallbackToPreviousFrame(allResults, frame, i)
  );
  await writeJson(toJson, sequence);
}

async function textures() {
  const firstFrameMap = {};

  await Promise.all(
    all().map(async path => {
      const i = basename(path).replace(/[^0-9]+/g, '');
      firstFrameMap[i] = await extractFrame(path, 0);
      await expandFrames(path, pathJoin(framesDir, `./f${i}.json`));
    })
  );

  await writeJson(pathJoin(framesDir, './initial.json'), firstFrameMap);
}

exports.all = all;
exports.textures = textures;