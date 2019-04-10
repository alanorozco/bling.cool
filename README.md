<p align="center">
  <a href="https://bling.cool/" target="_blank">
    <img src="https://i.imgur.com/2upuTBM.gif" alt="bling.cool">
  </a><br>
  ✨ bling text for the 21st century ✨
</p>

<p align="center">
  <a href="https://travis-ci.com/alanorozco/bling.cool">
    <img alt="Build Status" src="https://travis-ci.com/alanorozco/bling.cool.svg?branch=master">
  </a>
</p>

## Using

[Write some bling text.](https://bling.cool)

🐞 _This is a buggy work in progress, things will break._ GIF and markup output are
TODO. 🐞

## 3rd party code Ɛ̸ assets

This project uses a variety of [3rd party resources](./3p/README.md) to bling it up.

## Building

[`yarn`](https://yarnpkg.com) is used for package management.
[Install `yarn`,](https://yarnpkg.com/en/docs/install#mac-stable) then install
this project's dependencies through:

```sh
yarn
```

Make sure you've [installed `gulp-cli` globally.](https://gulpjs.com/docs/en/getting-started/quick-start) After that, you can build with:

```sh
gulp dist
```

This will output a `dist/index.html` entry file and a `dist/assets/`
directory containing the texture files. Both of these can be served from a static server's root.

Additionally, a `dist/.workspace/` directory contains intermediate build artifacts that are _not_ necessary for deployment.

### Active development

To build, watch and serve on port `:8000`, run:

```sh
gulp
```

## Tools

### Texture toolkit

In order to manipulate GIF playback at a frame level on the client, this project extracts frames from the [texture files](/assets) into a set of
base64-encoded sequences of frames in a JSON format.

The texture frame generator requires [`exiftool`](https://www.sno.phy.queensu.ca/~phil/exiftool/) and [`gifsicle`](https://www.lcdf.org/gifsicle/) installed on the local `PATH`. On macOS, these can be easily installed with [Homebrew](https://brew.sh/):

```sh
brew install gifsicle exiftool
```

Once installed, textures can be rebuilt via:

```sh
gulp textures
```

### Documentation generator

A documentation generator is bundled as part of the build system, runnable via:

```sh
gulp docs
```
