<p align="center">
  <a href="https://bling.cool/" target="_blank">
    <img src="https://i.imgur.com/2upuTBM.gif" alt="bling.cool">
  </a><br>
  ✨ bling text for the 21st century ✨<br>
</p>

<p align="center">
  <em>webfonts (ligatures!), CSS transforms, live editing!</em>
</p>

## Using

[Write some bling text.](https://bling.cool) Modify it as you please. Click the `GIF` button to get a GIF. ✨

🐞 _This is a buggy work in progress, things will break._ ~~GIF~~ Markup output is
TODO. 🐞

## 3rd party code Ɛ̸ assets

This project uses a variety of [3rd party resources](./3p/README.md) to bling it up.

## Building

1. `npm install`
2. `npm run start dist`

This will output a `dist/` directory to be served from a static server's root.

(Its `dist/.workspace/` directory contains intermediate build artifacts that are _not_ necessary for deployment.)

### Active development

To build, watch and serve on port `:8000`, run:

```sh
npm run start
```

## Tools

### Texture frame extractor

In order to manipulate GIF playback at a frame level on the client, this project extracts frames from the [animated textures](/textures) into
base64-encoded sequences of plain GIFs wrapped in a JSON format.

The texture frame extractor requires [`exiftool`](https://www.sno.phy.queensu.ca/~phil/exiftool/) and [`gifsicle`](https://www.lcdf.org/gifsicle/) installed on the local `PATH`. On macOS, these can be easily installed with [Homebrew](https://brew.sh/):

```sh
brew install gifsicle exiftool
```

Once installed, textures can be rebuilt via:

```sh
npm run start textures
```

### Documentation generator

A documentation generator is bundled as part of the build system, runnable via:

```sh
npm run start docs
```

This generates the attributions on [`3p/README.md`](./3p/README.md) and an
empty `README.md` file for every top-level directory that doesn't contain one.
