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

import { blue, magenta } from 'colors';

import { exec } from 'child_process';
import { existsSync, lstatSync, readdir, readFile, writeFile } from 'fs';
import { parallel, series } from 'gulp';
import { promisify } from 'util';
import glob from 'fast-glob';
import fonts from '../artifacts/fonts';
import log from 'fancy-log';
import path from 'path';

const execAsync = promisify(exec);
const readdirAsync = promisify(readdir);
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

const readmePath = dir => path.join(dir, '/README.md');

const prettier = path => execAsync(`prettier --write ${path}`);

const parseFileJson = async path =>
  JSON.parse((await readFileAsync(path)).toString());

const parsePkg = dir => parseFileJson(path.join(dir, '/package.json'));

const maybeUrl = url => (url ? url.url || url : url);

const mdFontAttribution = name =>
  `- [**${name}**](https://fonts.google.com/specimen/${name.replace(
    /\s+/g,
    '+'
  )})`;

const mdAttribution = ({
  author,
  name,
  description,
  modificationPurpose,
  url,
  license,
}) => `- [**\`${name}\`**](${url})${
  modificationPurpose ? ' originally' : ''
} by ${mdAuthorAttribution(author)} (⚖ ${license || '**⚠ Unknown License**'})${
  modificationPurpose
    ? `<br>
  _${modificationPurpose}_`
    : ''
}

  ${description}
`;

const mdPkgAttribution = ({
  name,
  description,
  author,
  maintainers,
  contributors,
  license,
  licenses,
  homepage,
  repository,
}) =>
  mdAttribution({
    name,
    description,
    url: pkgUrl(maybeUrl(homepage) || maybeUrl(repository) || name),
    author: author || maintainers || contributors,
    license: license || (licenses ? licenses[0].type : licenses),
  });

const getActualAuthorName = author =>
  author
    .replace(/[^\s]+@[^\s]+/gi, '')
    .replace(/https?[^\s]+/gi, '')
    .replace(/[\(\{\[<\)\]\}>]/gi, '')
    .trim();

function mdAuthorAttribution(author, optUrl) {
  if (!author) {
    return '';
  }
  if (Array.isArray(author)) {
    return author.map(author => mdAuthorAttribution(author)).join(', ');
  }
  if (author.name) {
    return mdAuthorAttribution(author.name, author.url);
  }
  const actualName = getActualAuthorName(author);
  const maybeUrl = optUrl || urlFromAuthorName(author);
  return `**${maybeUrl ? `[${actualName}](${maybeUrl})` : actualName}**`;
}

function urlFromAuthorName(authorName) {
  const match = authorName.match(
    /([^\<\s]+@[^\>\s]+)|(https?:\/\/[^\>\)\]\}\s]+)/gim
  );
  if (!match) {
    return;
  }
  const [urlOrEmail] = Array.from(match).sort((a, _) =>
    a.startsWith('http') ? 0 : 1
  );
  if (urlOrEmail.startsWith('http')) {
    return urlOrEmail;
  }
  return `mailto:${urlOrEmail}`;
}

function pkgUrl(nameOrUrl) {
  if (/^https?:/i.test(nameOrUrl)) {
    return nameOrUrl;
  }
  if (
    nameOrUrl.startsWith('git://github.com') ||
    nameOrUrl.startsWith('git+https://')
  ) {
    return nameOrUrl
      .replace(/^(git:\/\/|git\+https:\/\/)/gim, 'https://')
      .replace(/\.git$/gim, '');
  }
  return `https://www.npmjs.com/package/${nameOrUrl}`;
}

function replaceGenerated(whole, partials) {
  for (let id of Object.keys(partials)) {
    const delStart = `<!-- gen:${id} -->`;
    const delEnd = `<!-- /gen:${id} -->`;
    const [head, staleTail] = whole.split(delStart);
    const [_, tail] = staleTail.split(delEnd);
    whole = `${head || ''}${delStart}\n${partials[id]}\n${delEnd}${tail || ''}`;
  }
  return whole;
}

const nonFileDependencies = dependencies =>
  Object.keys(dependencies).filter(k => !dependencies[k].startsWith('file:'));

async function threepAttribution() {
  const readme = readmePath('./3p');
  const content = (await readFileAsync(readme)).toString();

  const threepAttributionFiles = await glob('./3p/*/attribution.json');
  const threepAttribution = (await Promise.all(
    threepAttributionFiles.map(parseFileJson)
  ))
    .map(mdAttribution)
    .join('\n');

  const { dependencies, devDependencies } = await parsePkg('./');
  const allPkgs = nonFileDependencies(dependencies).concat(
    nonFileDependencies(devDependencies)
  );

  allPkgs.sort();

  const pkgAttribution = (await Promise.all(
    allPkgs.map(async pkg =>
      mdPkgAttribution(await parsePkg(path.join('./node_modules/', pkg)))
    )
  )).join('\n');

  const fontAttribution = fonts
    .map(([name]) => mdFontAttribution(name))
    .join('\n');

  await writeFileAsync(
    readme,
    replaceGenerated(content, {
      '3p': threepAttribution,
      packages: pkgAttribution,
      fonts: fontAttribution,
    })
  );

  log(
    blue('Wrote'),
    '3p attribution:',
    magenta(threepAttributionFiles.length),
    'direct attributions,',
    magenta(allPkgs.length),
    'npm packages Ɛ̸',
    magenta(fonts.length),
    'fonts.'
  );
}

async function writeFirstLevelReadmes() {
  const firstLevelDirsWithNoReadme = (await readdirAsync('./')).filter(
    dir =>
      lstatSync(dir).isDirectory() &&
      !path.basename(dir).endsWith('node_modules') &&
      !path.basename(dir).startsWith('.') &&
      !existsSync(readmePath(dir))
  );

  await Promise.all(
    firstLevelDirsWithNoReadme.map(dir =>
      writeFileAsync(readmePath(dir), `# \`${path.basename(dir)}\``)
    )
  );

  log(
    blue('Wrote'),
    magenta(firstLevelDirsWithNoReadme.length),
    'empty READMEs.'
  );
}

async function format() {
  await prettier('*.md */*.md **/*.md');
}

const docs = series(
  parallel(threepAttribution, writeFirstLevelReadmes),
  format
);

export default docs;
