# DODREI

DODREI is a mobile-first browser media-art experiment built with **p5.js / JavaScript** and hosted on GitHub Pages.

Current baseline: **v0.10.4**  
Current visual engine: **0.10.4**  
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
- upper-left `S1...S4`: cycle VISUAL SPEED.

Automatic visual-mode advancement remains disabled by default.

## v0.10.4 — virtual visual time

The visible base timeline is separated from sampling FPS.

```text
VISUAL SPEED
  S1 0.25x  slowest
  S2 0.75x  default
  S3 1.00x
  S4 1.50x  fastest
      │
      └── advances VIRTUAL TIME
            ├── crop / layout / blend state
            ├── image-choice cut state
            └── LUMA/time-driven base state

BASE VISUAL FPS
  15 / 24 / 30 / 60
  samples the current virtual state and holds it

POST FX
  every available outer render frame
  touch rupture / recursive feedback / swipe / vignette / waveform
```

The important rule is:

```text
VISUAL SPEED = how fast the artwork timeline progresses
BASE FPS     = how often that timeline is sampled
POST FX FPS  = actual available render callbacks
```

Changing visual speed preserves the accumulated virtual timeline position; it only changes future progression. Changing BASE FPS does not change timeline speed.

Runtime controls:

```text
[ › ]  next mode
[30 ]  BASE VISUAL FPS
[S2 ]  VISUAL SPEED
```

Current speed presets:

```text
S1 0.25x -> state ≈ 5.6 Hz  / cut ≈ 960 ms
S2 0.75x -> state ≈ 16.7 Hz / cut ≈ 320 ms
S3 1.00x -> state ≈ 22.2 Hz / cut ≈ 240 ms
S4 1.50x -> state ≈ 33.3 Hz / cut ≈ 160 ms
```

The S1 value was tuned from `0.50x` to `0.25x` after visual testing so the slowest state is meaningfully separated from S2.

Telemetry exposes:

```text
FPS         actual outer p5 render rate
BASE_FPS    target / measured base refresh rate
VIS_SPEED   level / multiplier
STATE_HZ    effective virtual visual-state rate
CUT_EST     estimated real-time image cut interval
```

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
preset composition     [BASE VISUAL FPS sample-and-hold]
  -> common crush      [OFF]
  -> touch rupture
  -> preset feedback
  -> swipe feedback
  -> vignette
  -> waveform
```

## Important timing config

```js
timing: {
  compositionFps: 30,
  visualSpeedLevel: "S2",
  visualSpeedMultiplier: 0.75,
  visualStateIntervalMs: 45,
  cutSpeedLevel: "S2", // legacy mirror
  cutIntervalMs: 240,  // measured on virtual time
  timeReferenceFps: 60,
  maxDeltaMs: 100,
}
```

## Important files

- `config.js` — current runtime values;
- `js/visual-engine-v100.js` — delta-time feedback normalization;
- `js/visual-engine-v102.js` — sampled BASE VISUAL CLOCK;
- `js/visual-engine-v103.js` — intermediate cut-clock experiment;
- `js/visual-engine-v104.js` — cumulative virtual visual-time model;
- `js/mode-control-ui.js` — mode/FPS/visual-speed runtime buttons;
- `js/telemetry.js` — FPS/base/speed diagnostics;
- `PROJECT_STATE.md` — implementation checkpoint.

## Rollback

If the virtual-time experiment is wrong, remove the `visual-engine-v104.js` script load from `index.html`; v0.10.3 becomes active again. Earlier engine implementations remain intact.

## Deferred visual experiment

A very mild GPU softness pass is still under consideration. It is not active yet.
