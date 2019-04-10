# `assets`

Holds texture files for ✨ dat bling ✨.

## Animated GIF naming

File name convention is deterministic, `^t[0-9]+.gif$`. The set **must** be
sequential and start from `0` as [it's only encoded to the client as `length`.](../builder/babel-plugins/bling-count-texture-files.js)

## JSON texture frame extraction format

In order to manipulate GIF playback at the client level, the [`frames`](./frames) subdir contains a re-encoded set of the texture GIFs, as plain base64-encoded GIF frames wrapped in JSON arrays.

Two types of files exist in this subdir:

- **`initial.json`** is a single file holding a flat array, where every item is the first frame of every texture.

- each of **`f[0-9]+.json`** holds a flat array representing the sequence of frames for a specific texture.

This file set can be rebuilt by running `gulp textures`. For prerequisites, [see the top-level `README`](../README.md#texture-toolkit).
