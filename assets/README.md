# `assets`

Holds texture files for ✨ dat bling ✨.

File name convention is deterministic, `^t[0-9]+.gif$`. The set **must** be
sequential and start from `0` as [it's only encoded to the client as `length`.](../builder/babel-plugins/bling-count-texture-files.js)
