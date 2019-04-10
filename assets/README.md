# `assets`

Holds texture files for ✨ dat bling ✨.

## Animated GIF naming

File name convention is deterministic, `^t[0-9]+.gif$`. The set **must** be
sequential and start from `0` as [it's only encoded to the client as `length`.](../builder/babel-plugins/bling-count-texture-files.js)

## JSON texture format

The [`frames`](./frames) subdir contains a marshalled-reencoding of the texture GIFs, where every frame is encoded as an individual GIF as base64 wrapped in JSON.

This allows manipulation of frame playback at the client level.

Two types of files exist in this subdir:

- **`initial.json`** holds the first frame of every texture file.
- **`f[0-9]+.json`** hold a flat array with every frame of a specific texture file by id.

This fileset can be rebuilt by running `gulp textures`.
