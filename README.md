# bling.cool

✨ bling text for the 21st century ✨

## Using

[Write some bling text.](https://bling.cool)

_This is a buggy work in progress, things will break._ GIF and markup output are
TODO.

## Building

This project uses [`yarn`](https://yarnpkg.com) for package management.
[Install `yarn`,](https://yarnpkg.com/en/docs/install#mac-stable) then install
this project's dependencies through:

```sh
yarn
```

After that, you can build with:

```sh
gulp dist
```

This will output a single `dist/index.html` entry file and an `/assets/`
directory containing the texture files. `*.js` and `*.css` files in the `dist/`
directory are build artifacts and not necessary for deployment.

For active development, run `gulp` to build, watch and serve on port `:8000`.
