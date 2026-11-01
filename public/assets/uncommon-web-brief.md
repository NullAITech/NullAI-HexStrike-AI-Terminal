# Canvas UI — One boarding pass, six shaders

> WebGL effects that post-process real, interactive HTML

- section: kits  ·  framework: react  ·  tags: webgl, html-in-canvas, shader
- meta: MIT + Commons Clause · vregistry (fetched 2026-10-22)
- entry page: https://webdev.teknium.io/d/canvasui-html-effects/
- live demo: https://webdev.teknium.io/d/kits3/demos/canvasui-html-effects/
- catalog source: https://webdev.teknium.io/ (Uncommon Web field guide)

## Install

```
npx shadcn@latest add https://canvasui.dev/r/liquid-react.json https://canvasui.dev/r/shatter-react.json https://canvasui.dev/r/peel-react.json https://canvasui.dev/r/ripple-react.json https://canvasui.dev/r/cloth-react.json https://canvasui.dev/r/vhs-react.json
```

_registry add (shadcn-style): writes real source files into your project, usually with a paths prompt_

## Usage (site's own snippet)

```
<Peel side="right" mode="cursor" reveal={230} curl={200} shine={0.9}
  under={<Under />}>
  <Pass />
</Peel>

<Shatter radius={0.42} tileSize={34} shards={0.8} lift={46} refraction={1}>
  <Pass />
</Shatter>

<Ripple trigger="hover" interval={1.8} rings={3} dispersion={0.6}>
  <Pass />
</Ripple>
```

## Blurb

Each Canvas UI effect takes a live HTML subtree, captures it with Chrome's HTML-in-Canvas API and re-renders it as a liquid sim, glass shards, a page curl, water ripples, wind-blown cloth or VHS tape, while the seat buttons and check-in button keep working. Without the API, only the overlay-style shaders (Liquid, Ripple, VHS) are offered, and a badge names the chrome://flags switch that turns on the rest.

## Links

- site ↗: https://canvasui.dev
- source ↗: https://github.com/DavidHDev/canvas-ui
