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

import { expect } from 'chai';
import { htmlToLines } from '../src/app/editor';
import { JSDOM } from 'jsdom';

describe('htmlToLines', () => {
  let doc;

  before(() => {
    doc = new JSDOM().window.document;
  });

  [
    {
      raw: 'Hello World!',
      lines: ['Hello World!'],
    },
    {
      raw: 'Hello<br>World!',
      lines: ['Hello', 'World!'],
    },
    {
      raw: '<div>Hello World!</div>',
      lines: ['Hello World!'],
    },
    {
      raw: '<div><div><div>Hello World!</div></div></div>',
      lines: ['Hello World!'],
    },
    {
      raw: '<div>Hello </div><div>World!</div>',
      lines: ['Hello', 'World!'],
    },
    {
      raw: '<p>Hello World!</p><p>Hello World!</p>',
      lines: ['Hello World!', '', 'Hello World!'],
    },
    {
      raw:
        '<p>Hello World!</p><p>Hello World!</p>' +
        '<p>Hello World!</p><p>Hello World!</p>',
      lines: [
        'Hello World!',
        '',
        'Hello World!',
        '',
        'Hello World!',
        '',
        'Hello World!',
      ],
    },
    {
      raw:
        '<div><p>uno</p></div><p>dos</p>' +
        '<div><div><div>tres</div></div></div>' +
        '<p>cuatro</p>',
      lines: ['uno', '', 'dos', 'tres', '', 'cuatro'],
    },
    {
      raw: '<a href="bad">Bad</a><img src="whatever.png">' + "<p>I'm bad.</p>",
      lines: ['Bad', '', "I'm bad."],
    },
    {
      raw:
        '<div><div><div>' +
        'Hello <span><strong>Wor</strong>ld!</span>' +
        '</div></div></div>',
      lines: ['Hello World!'],
    },
    {
      raw: '<span>Hello</span> <strong>World!</strong>',
      lines: ['Hello World!'],
    },
    {
      raw: '<div>Hello</div><div>World!</div>',
      lines: ['Hello', 'World!'],
    },
    {
      raw: `<div>Hello</div>

            <div>World!</div>`,
      lines: ['Hello', 'World!'],
    },
    // Nothing available handles the following case properly.
    // TODO: Fix naive DOM rotation.
    // {
    //   raw:
    //     '<div>Me gustan</div>' +
    //     'los' +
    //     '<div><div><div>ta</div></div>cos</div>',
    //   lines: ['Me gustan', 'los', 'ta', 'cos'],
    // },
  ].forEach(({ raw, lines }) => {
    it(`sanitizes properly for "${raw}"`, async () => {
      expect(htmlToLines(doc, raw)).to.deep.equal(lines);
    });
  });
});
