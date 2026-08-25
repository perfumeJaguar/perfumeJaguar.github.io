# DODREI

DODREI is a mobile-first browser media-art experiment built with **p5.js / JavaScript** and hosted on GitHub Pages.

Current baseline: **v0.9.0**.  
Current config schema: **1**.

The project began as `p5 Media Lab 01`; the repository path remains `experiments/p5-media-lab/` for continuity.

## Current artistic baseline

The active build is PHOTO ONLY. Still images are discovered from GitHub and a bounded decoded working set remains resident. One original MP3, mouse / one-finger touch, visual presets, and terminal-like telemetry form the current piece.

Interaction:

- no touch: autonomous image composition inside the current visual mode;
- hold: four-band rupture + stronger audio processing;
- fast swipe while holding: additional recursive feedback above the configured threshold;
- upper-left `›` button: advance to the next enabled visual mode.

## v0.9.0 changes

### Mobile main buffer: 720px

`render.maxBufferLongEdgeMobile` is reduced from `900` to `720`.

The viewport canvas still fills the display; this only lowers the internal main processing buffer on mobile. Desktop remains `1280`.

### GPU four-band rupture palette

The high-contrast grayscale / rupture-band construction remains Canvas2D. The final black / dark-gray / muted-red / near-white mapping no longer normally performs a JavaScript `loadPixels()` loop.

`js/visual-engine-v090.js` creates a p5 filter shader and applies the palette mapping on the GPU. If shader creation/application is unavailable or fails, the former CPU pixel-loop path is used automatically.

Telemetry reports the active path as `GPU` or `CPU` through the visual snapshot.

### Manual visual-mode advancement

Timed mode advancement is disabled by default:

```js
visual.modeControl: {
  strategy: "sequence",
  startIndex: 0,
  loop: true,
  autoAdvance: false,
  manualButtonEnabled: true,
}
```

The existing `app.modeDurationSec` value remains in config. It is ignored while `autoAdvance` is false, so automatic playback can be restored later without rebuilding the mode system.

The small upper-left `›` button calls the visual engine's `manualAdvanceMode()` method. It uses the same enabled-preset list and the same `sequence | shuffle` policy as automatic advancement.

## Configuration / Control

`config.js` is the canonical human-editable runtime configuration:

```js
window.DODREI_CONFIG = { ... };
window.P5LAB_CONFIG = window.DODREI_CONFIG;
```

`config-schema.js` contains editor/validation metadata. The Control page also renders unknown/additive fields using inferred types, so new config values remain editable before explicit schema metadata is added.

Control page:

`/experiments/p5-media-lab/control/`

It can load the deployed config, use a browser-local draft, import files or pasted JSON/JSON5/config text, merge compatible fields, edit/reorder supported structures, and export `config.js` or JSON.

GitHub Pages itself cannot write repository files. The normal write-back path remains:

```text
DODREI CONTROL
  -> edit
  -> download/copy config.js
  -> replace repository config.js
  -> commit
```

## Mode model

`visual.presets` is the mode playlist. Stable `id` values identify presets independently of array position. Array order is sequence order; disabled presets are skipped.

`visual.modeControl.strategy` can still be `sequence` or `shuffle`. Manual and automatic advancement intentionally share the same policy code.

## Visual pipeline

The current fixed-order pipeline remains:

```text
preset composition
  -> common crush
  -> touch rupture
  -> preset feedback
  -> swipe feedback
  -> vignette
  -> waveform
```

Stages can be enabled/disabled from config but are not reorderable yet because current buffers have dependencies.

## Image archive / memory

Current defaults:

```text
20 decoded ACTIVE images
up to 5 STAGING images
5-second image-pool rotation interval
runtime decode concurrency 1
startup concurrency 3
selection policy: shuffle-bag
```

Image-pool rotation is independent from visual-mode changes.

## Important files

- `config.js` — canonical runtime values;
- `config-schema.js` — editor/validation metadata;
- `control/` — configuration UI;
- `js/media-manager.js` — discovery, set metadata and rolling pool;
- `js/visual-engine-v070.js` — overflow-aware crop baseline;
- `js/visual-engine-v080.js` — config-driven mode/pipeline/palette baseline;
- `js/visual-engine-v090.js` — manual-mode + GPU palette layer;
- `js/mode-control-ui.js` — upper-left mode-step button;
- `sketch-v066.js` — current application orchestrator;
- `PROJECT_STATE.md` — current implementation state.

## Limitations / opposing considerations

The GPU palette removes the large JavaScript per-pixel remap from the normal touch path, but it still has GPU upload/filter cost and may not outperform the CPU path on every browser/device. The fallback exists for compatibility, and real-device FPS/heat should decide whether the change is actually beneficial.

Reducing the mobile main buffer to 720 lowers processing cost substantially, but it also reduces source detail before effects. DODREI's destructive visual language should hide much of that loss; nevertheless the artistic result matters more than the nominal FPS gain.

The configuration system is deliberately not a general-purpose visual programming language. New algorithms and genuinely new pipeline dependencies still belong in engine code.
