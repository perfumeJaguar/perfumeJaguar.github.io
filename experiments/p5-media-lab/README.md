# p5 Media Lab 01

A mobile-first browser media-art laboratory built with **p5.js / JavaScript** and hosted on GitHub Pages.

This is an independent experiment, not part of the portfolio site's design system. It currently lives under `perfumeJaguar.github.io/experiments/` for deployment convenience and may later move into a media-art repository.

## Current baseline — v0.7.0

Current study: **photo-only**. Video code/assets may remain in the repository, but the active build discovers still images from `assets/images/` and keeps only a bounded decoded working set in memory.

The current interaction vocabulary is deliberately small:

- no touch: autonomous image composition;
- hold: four-tone black / dark-gray / muted-red / white rupture plus stronger audio processing;
- fast swipe while holding: additional recursive feedback proportional to swipe speed.

Audio is the user's original MP3. A native `<audio>` path provides reliable dry playback on mobile, while a parallel Web Audio layer provides interactive filtering, delay, feedback, and distortion.

## Where to edit first

### 1. `config.js` — start here

This is intentionally the main tuning panel written as code.

Important current values:

```js
modeDurationSec: 11,

activeImageLimit: 20,
rotationBatchSize: 5,
rotationIntervalSec: 5,
rotationLoadConcurrency: 1,

sourceCropMinZoom: 1.0,
sourceCropMaxZoom: 2.5,
sourceCropOverflowPan: 1.0,

swipeFeedbackThreshold: 0.30,
```

Change only a few values at once. This makes it easier to see or hear what a parameter actually changes.

## Image archive and rolling working set

The full file archive is discovered through GitHub's public Contents API. `assets.js` remains a fallback if discovery fails.

Unlike the older implementation, v0.7.0 does **not** decode the entire discovered archive before start.

```text
FULL ARCHIVE
lightweight path / set metadata
        ↓
SHUFFLE-BAG SELECTION
        ↓
20 decoded ACTIVE images
        +
up to 5 decoded STAGING images during rotation
        ↓
5-second interval after each completed swap
```

Initial loading uses a small bounded concurrency for startup speed. Runtime replacement is intentionally sequential (`rotationLoadConcurrency: 1`) to avoid decode spikes.

When staging completes successfully, old active references are removed from the active pool and cache. Those decoded images then become eligible for browser garbage collection. Memory return is controlled by the browser and is not guaranteed to appear immediately in OS process statistics.

### Selection behavior

The current policy is a **shuffle bag**:

- archive order is randomized on every page session;
- active images are excluded from replacement candidates;
- unused candidates are consumed before a new shuffled cycle begins where possible;
- visual effects still choose freely from the current resident pool.

Candidate selection is isolated inside the media manager rather than being embedded in effects. This is deliberate: later policies can add per-set quotas, weighted selection, or A/B alternation without rewriting the renderer.

## Future image sets

The media layer already assigns every archive item a `setId`. The current configuration uses one set:

```js
imageSets: [{ id: "default", subdir: "" }]
```

The intended future folder layout can therefore become, for example:

```text
assets/images/personA/
assets/images/personB/
```

with configuration such as:

```js
imageSets: [
  { id: "personA", subdir: "personA" },
  { id: "personB", subdir: "personB" },
]
```

At present all configured sets enter the same shuffle-bag pool. More specific mixing policies are intentionally left for later rather than hard-coded now.

## Adaptive crop space

Each visual source draw receives an independent crop. The artistic zoom range is currently fixed to **1.0x–2.5x**.

The important v0.7.0 change is that crop position no longer considers only the extra zoom. It calculates the actual drawable overflow produced by:

1. fitting the source to the current output using cover behavior; and
2. applying the extra crop zoom.

The crop can then move across the entire legal overflow range without revealing letterbox.

This means a tall portrait image shown on a wide monitor can progressively reveal areas that the centered cover would normally hide above and below the viewport. A wide image on a portrait display receives the equivalent treatment on the horizontal axis.

```text
source image
    ↓
cover-fit to current buffer aspect ratio
    ↓
extra random zoom (1.0–2.5x)
    ↓
calculate total X/Y overflow
    ↓
random position across full legal overflow
```

The canvas/browser viewport is the relevant target ratio, not the physical monitor ratio.

## Visual pipeline

The important architectural distinction remains:

```text
RESIDENT IMAGE POOL
  ↓
independent random crop PER SOURCE DRAW
  ↓
preset composition
  ↓
COMMON PHOTO_CRUSH
  ↓
TOUCH RUPTURE (only while pressed)
  ↓
mode feedback / swipe feedback when applicable
  ↓
vignette + waveform + telemetry
```

The current engine chain ends in `visual-engine-v070.js`. Older versioned files remain in place because later engines inherit previous behavior.

## Adding photographs

Put supported files into:

```text
experiments/p5-media-lab/assets/images/
```

Supported extensions are configured in `config.js` and currently include JPG, JPEG, PNG, WebP, GIF, and AVIF.

For future multi-set operation, put files into configured subfolders and add corresponding `imageSets` entries. No visual-effect code should need to change.

## Preset composition

The active playlist is at the bottom of `config.js`. The array order is playback order during the present experiment. Presets are a test/composition mechanism; media rotation does **not** depend on preset changes, so the rolling cache remains valid if the final artwork later uses only one visual mode.

## Extensibility principles

- **archive discovery** knows about source sets and paths, not effects;
- **resident-cache policy** knows which decoded images should remain available, not how they are drawn;
- **candidate selection** is a replaceable policy boundary;
- **visual source selection/cropping** is reusable across effects;
- **presets** choose combinations of effects rather than owning asset loading;
- **interaction** exposes normalized position, pressure, and swipe speed;
- **audio analysis/output** stays separate from visual rendering;
- **telemetry presentation** stays separate from honest internal data;
- **configuration** holds common artistic/performance parameters.

## Current limitations

JavaScript can remove strong references to evicted `p5.Image` objects, but the browser decides when garbage collection actually returns decoded-image memory. Browser HTTP caches may also retain compressed source files, which is separate from the much larger decoded bitmap memory.

GitHub Pages remains static, so directory discovery depends on GitHub's public API. The current optional multi-set support expects explicitly configured subfolders rather than recursively crawling arbitrary folder trees.

Several p5/Canvas2D operations—especially pixel loops and recursive feedback—remain more expensive than equivalent shader implementations. If the project grows into much denser displacement or multi-pass compositing, WebGL/Three.js may eventually be a better renderer.

For current decisions and debugging history, read `PROJECT_STATE.md` before making major structural changes.
