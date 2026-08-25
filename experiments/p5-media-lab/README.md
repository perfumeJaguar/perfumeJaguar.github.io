# DODREI

DODREI is a mobile-first browser media-art experiment built with **p5.js / JavaScript** and hosted on GitHub Pages.

Current baseline: **v0.10.3**  
Current visual engine: **0.10.3**  
Current config schema: **1**

The repository path remains `experiments/p5-media-lab/` for continuity.

## Current artistic baseline

The active build is PHOTO ONLY. Still images are discovered from GitHub and a bounded decoded working set remains resident. One original MP3, mouse / one-finger touch, visual presets, and terminal-like telemetry form the piece.

Interaction:

- no touch: composition runs inside the current mode;
- hold: high-contrast four-band rupture + stronger audio processing;
- fast swipe while holding: recursive swipe feedback;
- upper-left `›`: manually advance to the next enabled visual mode;
- upper-left FPS number: cycle BASE VISUAL FPS `15 -> 24 -> 30 -> 60`;
- upper-left `S1...S4`: cycle independent image cut speed.

Automatic visual-mode advancement remains disabled by default.

## v0.10.3 — independent cut speed

v0.10.2 successfully made the BASE VISUAL FPS visible, but its image-choice `cutTick` was derived from the base-frame sample timestamp. That made image changes feel coupled to BASE FPS.

v0.10.3 separates the clocks completely:

```text
CUT CLOCK
  wall-clock millis()
  S1 320ms  slowest
  S2 240ms  default
  S3 170ms
  S4 110ms  fastest

BASE VISUAL CLOCK
  15 / 24 / 30 / 60 fps
  crop / layout / blend / LUMA state
  sampled and held between base frames

POST FX CLOCK
  every available outer p5 render frame
  touch rupture / recursive feedback / swipe / vignette / waveform
```

The visible image-choice tempo now uses `timing.cutIntervalMs`. The old `visual.photoCutMs = 90` remains for inherited glitch/rupture timing and compatibility; it no longer defines visible image cut speed in the active v0.10.3 base engine.

Runtime controls:

```text
[ › ]  next mode
[30 ]  BASE VISUAL FPS
[S2 ]  CUT SPEED
```

Each cut-speed tap cycles:

```text
S1 -> S2 -> S3 -> S4 -> S1
```

Changing cut speed forces an immediate base sample so the UI cannot appear to lag behind the engine state.

Telemetry exposes:

```text
FPS         actual outer p5 render rate
BASE_FPS    target / measured base refresh rate
CUT_SPEED   level / milliseconds
```

## v0.10.2 — experimental base visual clock

`compositionFps` is used as the BASE VISUAL CLOCK rather than merely a performance cap. It drives sampled crop/layout/blend/LUMA state for PHOTO and LUMA modes while post FX continue on the outer render loop.

Recommended values:

```text
15 fps  strong stepped motion
24 fps  film-like cadence
30 fps  default compromise
60 fps  reference / smoother base state
```

The active v0.10.3 engine subclasses v0.10.2; earlier engine files are kept for rollback.

## v0.10.0 — time-normalized recursive feedback

Recursive feedback scale, retention, fade and swipe drift are normalized to wall-clock time using `deltaTime` with a capped stall interval. Source injection and random/glitch texture intentionally remain frame-sensitive.

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

Current 12 presets:

- PHOTO_FEEDBACK_CROP
- PHOTO_RAPID_CROP
- PHOTO_RGB_TEAR
- PHOTO_SHARD_SWAP
- PHOTO_DOUBLE_BLEND
- PHOTO_BLEND_CYCLE
- PHOTO_FULL
- LUMA_BLOCKS
- LUMA_VOID
- LUMA_MONO
- LUMA_DITHER
- LUMA_PULSE

## Visual pipeline

```text
preset composition     [BASE VISUAL FPS]
  -> common crush      [OFF by default]
  -> touch rupture
  -> preset feedback
  -> swipe feedback
  -> vignette
  -> waveform
```

## Configuration / Control

`config.js` is canonical runtime data. `config-schema.js` provides optional editor metadata. The Control page discovers additive timing fields with inferred controls even when schema metadata is not explicit.

Important timing values:

```js
timing: {
  compositionFps: 30,
  cutSpeedLevel: "S2",
  cutIntervalMs: 240,
  timeReferenceFps: 60,
  maxDeltaMs: 100,
}
```

## Important files

- `config.js` — current runtime values;
- `js/visual-engine-v100.js` — delta-time feedback normalization;
- `js/visual-engine-v102.js` — sampled BASE VISUAL CLOCK;
- `js/visual-engine-v103.js` — wall-clock CUT SPEED separation;
- `js/mode-control-ui.js` — mode/FPS/cut runtime buttons;
- `js/telemetry.js` — FPS/base/cut diagnostics;
- `PROJECT_STATE.md` — implementation checkpoint.

## Rollback

If the cut-speed experiment is wrong, remove the `visual-engine-v103.js` script load from `index.html`; v0.10.2 becomes active again. No inherited engine implementation was deleted.

## Deferred visual experiment

A very mild GPU softness pass is still under consideration. It is not active yet.
