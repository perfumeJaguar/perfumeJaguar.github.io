# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.9.0`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`  
Live artwork: `https://perfumeJaguar.github.io/experiments/p5-media-lab/`  
Live control page: `https://perfumeJaguar.github.io/experiments/p5-media-lab/control/`

## Project identity

The browser media-art project is named **DODREI**. Legacy `P5Lab*` internal names and the `p5-media-lab` folder remain for compatibility; do not broadly rename them unless explicitly requested.

GitHub is the implementation source of truth.

## Current artistic baseline

PHOTO ONLY. Video code/assets may remain but are not active material.

Primary material and interaction:

- automatically discovered still-image archive;
- one original MP3;
- mouse / one-finger touch;
- hold -> high-contrast four-band rupture;
- fast swipe while holding -> additional recursive feedback above `0.30`;
- small upper-left `›` control -> manually advance visual mode;
- terminal-like telemetry.

Mobile portrait remains the primary target. Some lower mobile frame rate is artistically acceptable, but stability, touch latency, heat and long-run memory remain important.

## v0.9.0 — performance + manual mode control

### Mobile render buffer

`render.maxBufferLongEdgeMobile` changed:

```text
900 -> 720
```

Desktop remains `1280`.

This reduces the internal main visual-processing pixel count while the outer canvas still fills the device viewport.

### Touch rupture palette shader

Previous versions performed the final four-band palette with:

```text
loadPixels -> JavaScript loop over every rupture pixel -> updatePixels
```

v0.9.0 moves that final mapping to a p5 filter shader in `js/visual-engine-v090.js`.

The earlier stages remain intentionally unchanged:

```text
source scene
 -> reduced-resolution grayscale / contrast
 -> horizontal rupture bands
 -> GPU four-band palette
```

Current palette remains:

- black `[0,0,0]`;
- dark gray `[72,72,72]`;
- muted red `[238,94,90]`;
- near-white `[246,246,244]`.

The shader consumes the existing `visual.touchPalette` config values. If shader creation or application fails, the engine switches to the old CPU pixel-loop mapping and emits telemetry/console notice rather than failing the artwork.

This is deliberately a narrow GPU optimization; DODREI has **not** been converted wholesale from Canvas2D to WebGL.

### Manual mode control

Timed visual-mode advancement is now disabled by config:

```js
visual.modeControl.autoAdvance = false
visual.modeControl.manualButtonEnabled = true
```

`app.modeDurationSec = 11` remains stored and becomes active again if automatic advancement is re-enabled later.

The upper-left button calls `manualAdvanceMode()`. Manual stepping reuses the same mode policy already established in v0.8.0:

- enabled presets only;
- `sequence` or `shuffle` strategy;
- `loop` behavior for sequence;
- feedback buffers cleared at each mode step;
- telemetry announces the newly selected mode.

The button is visually small (`30 x 24 px`) but remains large enough to be reasonably tappable on mobile.

## Configuration system baseline

`config.js` is canonical runtime data. `config-schema.js` provides editor/validation metadata. `control/` reads both and can render additive unknown fields through inferred types.

Current identity:

```text
meta.project = DODREI
meta.schemaVersion = 1
meta.configRevision = 2
app.version = 0.9.0
```

The additive `modeControl.autoAdvance` and `manualButtonEnabled` fields do not break existing schema-1 configs, so schemaVersion remains `1`.

Import policy remains compatible partial merge. Stable-ID arrays such as presets, pipeline stages and image sets are compared by ID rather than array position.

## Image system

The complete archive remains lightweight metadata. Current rolling decoded working set:

- active images: `20`;
- staging: up to `5`;
- image-pool rotation interval: `5s` after swap completion;
- runtime decode concurrency: `1`;
- startup concurrency: `3`;
- selection: shuffle-bag;
- active/staging entries excluded from replacement candidates;
- candidate order reshuffled each cycle.

Image-set metadata remains extensible for future personA/personB or other folder-based sets. Current set mixing is generic pooling, not weighted/alternating.

## Crop baseline

Overflow-aware source cropping from v0.7.0 remains active.

- random crop zoom: `1.0x ... 2.5x`;
- cover-fit overflow is included in legal crop movement;
- random crop can traverse otherwise hidden source regions;
- touch bias is clamped inside legal overflow;
- no empty/letterboxed edge should be exposed.

## Current visual pipeline

```text
preset composition
 -> common PHOTO_CRUSH
 -> touch rupture
 -> preset feedback
 -> swipe feedback
 -> vignette
 -> waveform
```

Config exposes stable pipeline IDs and enable/disable state. Order remains locked.

Active preset playlist remains the 12 v0.8 presets, including PHOTO_FEEDBACK_CROP, PHOTO_RAPID_CROP, PHOTO_RGB_TEAR, PHOTO_SHARD_SWAP, PHOTO_DOUBLE_BLEND, PHOTO_BLEND_CYCLE, PHOTO_FULL, and five LUMA modes.

HALATION/BLOOM remains removed from active use because its blur cost is not justified by the present work.

## Performance baseline / next tests

Already active:

- `pixelDensity(1)`;
- mobile main buffer long edge `720`;
- mobile rupture buffer scale `0.50`;
- desktop rupture scale `0.70`;
- mobile rupture recalculation every second rendered frame;
- GPU palette shader with CPU fallback;
- feedback buffers run at reduced resolution;
- bounded decoded image pool;
- one runtime image decode at a time.

Next real-device checks:

1. Confirm telemetry reports `ENGINE 0.9.0`.
2. Confirm touch result visually matches the previous four-band palette.
3. Compare touch FPS before/after the shader change.
4. Check whether 720 remains visually acceptable on the target phone.
5. Confirm the upper-left `›` button advances exactly one enabled mode per tap and does not trigger the canvas touch effect.
6. Leave the artwork running for several minutes and watch heat, throttling and memory behavior.
7. If shader path is slower or unstable on a target browser, the automatic CPU fallback is valid; do not assume GPU is universally faster.

## Important edit points

- `config.js` — main tuning/config values;
- `config-schema.js` — control metadata;
- `control/` — config editor/import/export;
- `js/media-manager.js` — image archive, sets, rolling pool, shuffle-bag;
- `js/visual-engine-v070.js` — crop-space baseline;
- `js/visual-engine-v080.js` — config-driven mode/pipeline layer;
- `js/visual-engine-v090.js` — shader palette + manual mode advancement;
- `js/mode-control-ui.js` — manual mode button;
- `sketch-v066.js` — orchestrator;
- `js/telemetry.js` — terminal-like foreground UI.

## Known limits

- p5/Canvas2D remains the dominant renderer; only the final rupture palette is shader-accelerated.
- Browser/WebGL support and driver behavior differ by device; GPU path must be judged empirically.
- GitHub Pages cannot write config changes directly back to the repository.
- JavaScript reference removal only makes decoded images garbage-collection eligible; browser GC timing is uncontrollable.
- Fullscreen remains browser-dependent.
- Pipeline reordering is not yet safe.

## Continuity rule

For future DODREI work, read this file first and verify actual GitHub source before reconstructing implementation from conversation memory. At meaningful checkpoints, update this document with the current baseline, decisions, limitations and next tests.
