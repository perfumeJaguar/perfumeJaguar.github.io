# DODREI

DODREI is a mobile-first browser media-art experiment built with **p5.js / JavaScript** and hosted on GitHub Pages.

Current baseline: **v0.10.1**  
Current visual engine: **0.10.0**  
Current config schema: **1**

The repository path remains `experiments/p5-media-lab/` for continuity.

## Current artistic baseline

The active build is PHOTO ONLY. Still images are discovered from GitHub and a bounded decoded working set remains resident. One original MP3, mouse / one-finger touch, visual presets, and terminal-like telemetry form the piece.

Interaction:

- no touch: composition runs inside the current mode;
- hold: high-contrast four-band rupture + stronger audio processing;
- fast swipe while holding: recursive swipe feedback;
- upper-left `›`: manually advance to the next enabled visual mode;
- upper-left FPS number: cycle composition cadence through `15 -> 24 -> 30 -> 60`.

Automatic visual-mode advancement remains disabled by default.

## v0.10.1 — runtime composition FPS button

A second small runtime control now sits directly below the mode-step button.

```text
[ › ]  next visual mode
[30 ]  composition FPS
```

The FPS button cycles:

```text
15 -> 24 -> 30 -> 60 -> 15 ...
```

It changes only `timing.compositionFps` at runtime. It does **not** lower the outer p5 render target and does not change audio playback speed/time. `js/visual-engine-v100.js` already reads `P5LAB_CONFIG.timing.compositionFps` dynamically, so no new engine layer is required for this UI.

The current value is shown on the button and each change emits telemetry such as:

```text
COMPOSITION FPS 24
```

The control intercepts pointer/click propagation so tapping it should not trigger the canvas touch/rupture gesture.

## v0.10.0 — temporal cadence

DODREI separates **composition cadence** from the outer p5 render loop.

```text
outer render loop       target 60fps / actual device rate
        │
        ├── preset composition   sample-and-hold at 30fps default
        │
        └── post FX              every available render frame
```

Default timing config:

```js
timing: {
  compositionFps: 30,
  timeReferenceFps: 60,
  maxDeltaMs: 100,
}
```

Recommended composition tests:

```text
15 fps  strong stepped / sampled motion
24 fps  film-like cadence
30 fps  default compromise
60 fps  reference / original continuous behavior
```

`compositionFps` does not change audio playback time. It controls how often the preset composition buffer is regenerated. Held frames remain visible between composition updates while touch, feedback, waveform, telemetry, and other post-processing can continue at the device's available render rate.

If the device itself falls to 20–30fps, post FX cannot physically remain at 60fps. v0.10.0 instead keeps selected feedback behavior tied to **wall-clock time** using `deltaTime`.

### Time-normalized feedback

The following recursive feedback properties are normalized relative to a 60fps reference:

- recursive scale / zoom;
- previous-frame retention alpha;
- black fade / decay;
- swipe drift distance.

The frame-time sample is capped at `100ms` so returning from a stalled/background tab does not create an extreme single-frame jump.

The following remain intentionally frame-dependent:

- source-image injection into feedback;
- rupture/random corruption;
- other glitch texture that benefits from real performance instability.

This gives DODREI two temporal behaviors at once: stable real-time progression for feedback structure, and frame-sensitive texture for damage/glitch.

## Current performance baseline

- `pixelDensity(1)`;
- mobile main processing buffer long edge: `720`;
- desktop main buffer long edge: `1280`;
- mobile rupture buffer scale: `0.50`;
- mobile rupture recalculation every second rendered frame;
- four-band rupture palette uses a p5 GPU filter shader with CPU fallback;
- feedback runs on reduced-resolution buffers;
- decoded active image pool: `20`;
- staging pool: up to `5`;
- runtime image decode concurrency: `1`;
- halation/bloom remains removed;
- common `PHOTO_CRUSH` remains implemented but is **OFF by default**.

## Mode model

`visual.presets` is the mode playlist. Stable IDs identify presets independently of array position. Sequence order follows the array; disabled presets are skipped.

```js
visual.modeControl: {
  strategy: "sequence", // sequence | shuffle
  startIndex: 0,
  loop: true,
  autoAdvance: false,
  manualButtonEnabled: true,
}
```

The stored `app.modeDurationSec` value remains available for restoring timed mode changes later.

## Visual pipeline

Current fixed order:

```text
preset composition     [30fps sample-and-hold by default]
  -> common crush      [OFF by default]
  -> touch rupture
  -> preset feedback
  -> swipe feedback
  -> vignette
  -> waveform
```

Pipeline stages have stable IDs and enable/disable state. Order remains locked because several stages share dependent buffers.

## Configuration / Control

`config.js` is canonical runtime data.

`config-schema.js` provides optional editor metadata. The Control page also discovers unknown/additive config groups and infers basic controls, so the `timing` group remains editable without changing the schema contract.

Control page:

`/experiments/p5-media-lab/control/`

GitHub Pages cannot write repository files directly. Exported configs must still be committed separately.

## Important files

- `config.js` — current runtime values;
- `config-schema.js` — editor/validation metadata;
- `control/` — config import/edit/export UI;
- `js/media-manager.js` — archive, image sets, rolling resident pool;
- `js/visual-engine-v070.js` — overflow-aware crop;
- `js/visual-engine-v080.js` — config-driven mode/pipeline;
- `js/visual-engine-v090.js` — manual mode + GPU rupture palette;
- `js/visual-engine-v100.js` — composition cadence + delta-time feedback normalization;
- `js/mode-control-ui.js` — mode-step + runtime composition-FPS buttons;
- `sketch-v066.js` — outer 60fps-target orchestrator;
- `PROJECT_STATE.md` — implementation authority/checkpoint.

## Next visual experiment

A very mild GPU softness pass is being considered for a less digitally sharp texture. It is **not active yet**. Prefer a tiny shader-based softening pass over full-frame Canvas blur if this experiment proceeds.
