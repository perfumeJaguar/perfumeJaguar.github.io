# DODREI — Asset Guide

Current baseline: **photo-only**.

## Images

Recommended working format:

- JPEG or WebP for most photographic material;
- long edge roughly 1200–1800 px as a practical starting point;
- portrait / landscape / square may be mixed;
- avoid unnecessarily huge originals while the browser renderer remains Canvas2D/p5 based.

Current default folder:

```text
assets/images/
```

DODREI discovers the archive through GitHub's public Contents API and keeps only a bounded decoded working set resident.

## Future image sets

Additional sets can be stored as explicit subfolders:

```text
assets/images/
├── personA/
├── personB/
└── ...
```

and configured in `config.js`:

```js
imageSets: [
  { id: "person-a", subdir: "personA" },
  { id: "person-b", subdir: "personB" }
]
```

The `id` is the stable configuration identity. `subdir` is the actual folder path relative to the configured image root.

Current runtime behavior pools configured sets into the same shuffle-bag candidate system. Weighting, quotas, strict alternation, and other cross-set policies are not implemented yet.

## Audio

One original composition is preferable because it exposes real musical density, dynamics and spectral balance.

Recommended:

- MP3;
- 44.1 kHz or 48 kHz;
- 192–320 kbps;
- one complete track.

Current audio path uses native HTML audio for stable audible playback plus a separate Web Audio analysis/effect layer.

## Video

Video code/assets may remain in the repository for earlier experiments, but video is not part of the current DODREI artistic baseline.

Do not optimize or expand the video asset workflow unless video becomes active again.

## Naming

Filename order is not the playback order.

Current image candidate selection is shuffle-bag based. Therefore filenames may stay human-readable without being used as sequencing instructions.

Prefer stable, simple names and avoid renaming large archives without reason because Git history and browser caches become noisier.

## Practical test diversity

Useful image archives should contain enough variation to expose the visual system:

- dark / bright;
- low / high contrast;
- portrait / landscape;
- close texture / wider scene;
- dominant-color / near-monochrome;
- different subject placement.

Because every source draw receives an independent crop, composition near image edges can become visible in unexpected viewports. Test with both portrait mobile and wide desktop layouts.

## Source of truth

Asset paths and runtime behavior should be verified against:

- `config.js`
- `PROJECT_STATE.md`
- actual repository folders

Do not reconstruct asset rules from older `p5 Media Lab 01` documentation when current DODREI files can be checked.
