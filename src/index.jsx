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
import { Editor, EditorComponent } from './app/editor.jsx';
import {
  EncodeButton,
  EncodePanel,
  EncodeButtonComponent,
} from './app/encode-button.jsx';
import { FontPanel, FontPanelComponent } from './app/font-selector.jsx';
import { FxPanel, FxPanelComponent } from './app/fx-panel.jsx';
import { googFontStylesheetUrl, fontId } from '../lib/fonts';
import { Icon, IconDefs } from './app/icons.jsx';
import { Loader, LoaderComponent } from './app/loader.jsx';
import {
  ShuffleButton,
  ShuffleButtonComponent,
} from './app/shuffle-button.jsx';
import { TexturePanel, TexturePanelComponent } from './app/texture-panel.jsx';
import { Toolbar, ToolbarComponent } from './app/toolbar.jsx';
import adoptAsync from './async-modules/adopt-async';
import State from './app/state';
import Texturables from './app/texturables';
import { initialFrames } from '../lib/textures';
import { pickRandom, shuffleStyle } from './random';
import focusAtEnd from './input/focus-at-end';
import phrases from '../artifacts/phrases';

const Footer = ({ pkg = { author: {} } }) => (
  <footer class="meta hued">
    {'by  '}
    <a href={pkg.author.url} id="meta-author" target="_blank">
      {pkg.author.name}
    </a>
    {' — '}
    <a href={pkg.repository} id="meta-repository" target="_blank">
      fork on github
    </a>
  </footer>
);

const Main = ({ children }) => (
  <>
    <IconDefs />
    <div class="border textured textured-static" />
    <main>
      <Loader />
      {children}
    </main>
  </>
);

export function Index({ document, _INIT }) {
  const { css, js, fonts = [], pkg } = _INIT;

  document.head.appendChild(
    <>
      <title>{`${pkg.name} ✨`}</title>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width,maximum-scale=1,minimum-scale=1,initial-scale=1"
      />
      <meta
        name="description"
        content={`${pkg.description} &ndash; generate glitter, blingy GIFs`}
      />
      <link rel="preconnect" href="https://fonts.google.com" crossorigin />
      <link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin />
      <link rel="stylesheet" href={googFontStylesheetUrl(fonts.map(fontId))} />
      <style>{css}</style>
    </>
  );

  document.body.className = 'not-ready';

  document.body.appendChild(
    <>
      <Main>
        <Toolbar>
          <ShuffleButton>
            <Icon name="shuffle" />
          </ShuffleButton>
          {[
            <button>
              <Icon name="diamond" />
              <label class="hide-on-small">texture</label>
            </button>,
            <TexturePanel />,
          ]}
          {[
            <button>
              <Icon name="font" />
              <label class="hide-on-small selected-font" />
            </button>,
            <FontPanel fonts={fonts} />,
          ]}
          {[
            <button>
              <Icon name="wand" />
            </button>,
            <FxPanel />,
          ]}
          {[
            <EncodeButton>
              <Icon name="sparkles" />
              <label>gif</label>
            </EncodeButton>,
            <EncodePanel />,
            { async: true },
          ]}
        </Toolbar>
        <Editor />
        <Footer pkg={pkg} />
      </Main>
      <script>{js}</script>
      <script src="/encoder.js" async />
    </>
  );
}

function getPhrase({ pathname }) {
  const phraseFromPathname = decodeURI(
    pathname
      .replace(/^\//, '')
      // + are always spaces, idc
      .replace(/\+/, ' ')
      .trim()
  );
  return phraseFromPathname.length > 0
    ? [phraseFromPathname]
    : pickRandom(phrases);
}

export function IndexComponent(window) {
  const { document, location } = window;

  const [text, phraseConfig] = getPhrase(location);

  const initial = Object.assign(shuffleStyle(phraseConfig), {
    text,
    fontSize: 72,
  });

  const state = new State();
  const modules = adoptAsync(window);

  new EditorComponent(window, state);
  new ToolbarComponent(window, state);
  new Texturables(window, state);
  new TexturePanelComponent(window, state);
  new LoaderComponent(window, state);
  new FontPanelComponent(window, state);
  new FxPanelComponent(window, state);
  new EncodeButtonComponent(window, state, { modules });
  new ShuffleButtonComponent(window, state);

  Promise.all([state.set('initial', initial), initialFrames(self)]).then(
    ([_, textureOptions]) => {
      state.set(state, { textureOptions });
      document.body.classList.remove('not-ready');
      focusAtEnd(document.querySelector('#editable'));
    }
  );
}
