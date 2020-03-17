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

import { basename, join as pathJoin } from 'path';

import { Buffer } from 'buffer';
import { dirs } from '../config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { textureId } from '../lib/textures';
import { writeFile } from 'fs';
import glob from 'fast-glob';
import memoize from 'lodash.memoize';

const execAsync = promisify(exec);
const writeFileAsync = promisify(writeFile);

const gifGlobDir = pathJoin(dirs.textures, '*.gif');
const validNameRe = /\/([0-9]+)\.gif$/;

const b64mime = 'data:image/gif;base64,';

const all = () =>
  glob
    .sync(gifGlobDir)
    .filter(path => validNameRe.test(path))
    .sort((a, b) => parseInt(textureId(a), 10) - parseInt(textureId(b), 10));

const frameCount = async path =>
  parseInt((await execAsync(`exiftool -b -FrameCount ${path}`)).stdout, 10);

const writeJson = (path, content) =>
  writeFileAsync(path, JSON.stringify(content));

const unoptimize = memoize(async path => {
  const output = `${dirs.workspace}/${basename(path)}.u`;
  const expandColors = `${dirs.workspace}/${basename(path)}.e`;
  await execAsync(`gifsicle --colors=255 ${path} > ${expandColors}`);
  await execAsync(`gifsicle -U ${expandColors} > ${output}`);
  return output;
});

async function extractFrame(path, frame) {
  const unoptimized = await unoptimize(path);
  try {
    const cmd = `gifsicle ${unoptimized} '#${frame}'`;
    const { stdout } = await execAsync(cmd, { encoding: 'binary' });
    return Buffer.from(stdout, 'binary');
  } catch (_) {
    // meh. see `fallbackToPreviousFrame`
  }
}

const frameTob64 = frameBuffer =>
  [b64mime, frameBuffer.toString('base64')].join('');

function fallbackToPreviousFrame(allFrames, frame, i) {
  if (!frame) {
    if (i < 1) {
      throw new Error('Malformed frames.');
    }
    return fallbackToPreviousFrame(allFrames, allFrames[i - 1], i - 1);
  }
  return frame;
}

async function frameDelays(path) {
  const { stdout } = await execAsync(`exiftool -v ${path}`);
  const parts = stdout.split(/image\:/gi);
  parts.pop();
  return parts.map(
    part =>
      1000 *
      parseFloat(part.replace(/^[\s\S]+delay=([0-9\.]+)[\s\S]+$/gim, '$1'))
  );
}

async function extractFramesJson(fromGif, toJson) {
  const frameOptionals = Array(await frameCount(fromGif))
    .fill(null)
    .map((_, f) => extractFrame(fromGif, f));
  const allFrames = await Promise.all(frameOptionals);
  const delays = await frameDelays(fromGif);
  const sequence = allFrames.map((frame, i) => [
    delays[i],
    frameTob64(fallbackToPreviousFrame(allFrames, frame, i)),
  ]);
  await writeJson(toJson, sequence);
}

async function textures() {
  const firstFrameMap = {};

  await Promise.all(
    all().map(async path => {
      const i = basename(path).replace(/[^0-9]+/g, '');
      const initialFrame = await extractFrame(path, 0);
      firstFrameMap[i] = frameTob64(initialFrame);
      await writeFileAsync(
        pathJoin(dirs.textures, `${i}_i.gif`),
        initialFrame,
        { encoding: 'binary' }
      );
      await extractFramesJson(path, pathJoin(dirs.textures, `${i}.json`));
    })
  );

  const firstFrameSet = Object.keys(firstFrameMap)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map(k => firstFrameMap[k]);

  await writeJson(pathJoin(dirs.textures, 'initial.json'), firstFrameSet);
}

export { all, textures };
