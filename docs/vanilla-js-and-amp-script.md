# Pairing non-AMP applications with `amp-script`

This project can be built as an `amp-script` application by running `gulp --amp`.

This is mostly meant as a tech demo to showcase `amp-script` capabilities
themselves, as some features of the project are not possible within the AMP UX model.

`amp-script` is designed to be framework-agnostic, so you'll only have to change code in a few places, depending on what your application does and how it's bootstrapped.

Most of the application code for the vanilla JS app and the `amp-script` version
in this project is shared, but building an application that works independently
and also within the `amp-script` constraints proves some interesting challenges.

This document attempts to summarize some of the issues porting this application
to `amp-script` and suggests some strategies to deal with similar issues
generally.

## Outstanding `amp-script` issues

`amp-script` code runs in a [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker) separate from the main thread, so it uses the fantastic
[`worker-dom`](https://github.com/ampproject/worker-dom) layer under the hood to
be able to access the main thread's DOM from the worker.

This means that the DOM API in the worker is (at the moment) incomplete. This
particular application relies on
[`contenteditable`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable) which proves problems since its support in `worker-dom` is
incomplete ([`ampproject/worker-dom#430`](https://github.com/ampproject/worker-dom/issues/430)).

In most scenarios, you can work around `worker-dom` gaps by using alternative APIs.
In this case, instead of using a `contenteditable` it uses a `<textarea>` with transparent text and background with the actual rendered text underneath it.
This has the same effect as using a `contenteditable`, with some layout challenges between the differences of using a `<textarea>` vs. a `<div>`.

## Dependencies and bundle size

[Dead-code elimination](https://en.wikipedia.org/wiki/Dead_code_elimination) and minification are very important since `amp-script`
limits the size of Javascript that will be run on a page.

**Choose your dependencies wisely.** If you only need a small subset of a
library, consider finding an alternative or writing one yourself. In terms of
relying on libraries, some are better than others regardless of size: the
[purer](https://en.wikipedia.org/wiki/Pure_function) its modules are (i.e. the less shared state they have) the more likely they are to be DCE'd effectively.

If you have type information available, [the Closure Compiler](https://github.com/google/closure-compiler)
does a very good job at eliminating dead code based on types and module
boundaries.

## Static vs. client-side rendering

This application relies heavily on first-hydration, since it selects some
initial render parameters randomly. This is not possible since `amp-script`
requires the first hydration to match the initial static DOM for UX reasons.

So whatever you need to do on the client-side, do it as a build-step. If you
need fresh dynamic data, leverage [`amp-list`](https://amp.dev/documentation/components/amp-list) to be able to client-side render content
while allowing use of the [AMP cache](https://developers.google.com/amp/cache/).

In this project's case, the random-pick feature can be forgoed in the `amp-script` version. Instead, default values are set as a build-step. If you use this strategy,
it's useful to keep the build-step code and the client-side rendering code shared.
[`jsdom`](https://www.npmjs.com/package/jsdom) is a great tool that will allow
you to run the same sort of manipulations you do on the client as a build-step.

## Combinatorial complexity

It's important that your application is as agnostic to platform (e.g AMP vs.
non-AMP) as possible.

However, because of AMP's UX model, some activities might have to be performed
differently depending on platform. For example, this project has some differences
in its AMP and non-AMP implementations, like a font/hue/phrase being selected
at random on load (AMP doesn't allow this, as the hydrated content should match
the static DOM).

Some strategies can be useful:

- Generalize where possible and keep units small. Smaller units are less likely
  to care about the differences between platforms. If they can generally be
  applied, design their APIs so that they can take many forms of modules or
  elements.

- In cases where the implementations for each platform have to divert,
  **avoid checking for platform conditionally**. Instead, you can use different
  source entry points for your `amp-script` and non-AMP script. Leverage
  [dependency injection](https://en.wikipedia.org/wiki/Dependency_injection) in
  shared modules so that you're less likely to include conditions that make the
  code more complex and harder to maintain.

Sometimes the two platforms need to render content slightly differenly, in which
case you'll probably have to conditionally apply CSS so that your rules don't
get too crazy. With SASS this is super easy:

```scss
.my-element {
  background: black;

  amp-script & {
    background: white;
  }
}
```

As with Javascript, do this only when you have to. Sometimes it's a better
strategy to modify the main application slightly to match the AMP application in
order to have fewer logic combinations to maintain.

## Do less

It's a valid strategy to limit your `amp-script` app for better UX given its
constraints. You may find that by doing this thought experiment, you'll encounter
superfluous sections of your application that make it slower and more
complex and on a second thought aren't totally required.

If you are however deriving business value from a particular feature that is not
possible to implement with `amp-script`, consider navigating into a non-AMP page.
You can think of your `amp-script` application as an entry point of sorts, so
that basic interaction is possible but additional work is performed elsewhere.

For example, this project has a goal to output animated GIFs directly from the client.
The encoding task is not possible with `amp-script`, since it relies on fancy
web features like `<canvas>` and depends on a very large library. The
`amp-script` version can simply have a button that redirects to the full-blown
application while passing the rendered state, so that encoding can be performed
outside the limits of an `amp-script`.
