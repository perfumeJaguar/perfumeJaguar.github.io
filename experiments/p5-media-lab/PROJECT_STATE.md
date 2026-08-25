# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.10.7`  
Current visual engine version: `0.10.7`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

Upper-right runtime controls:

```text
[ › ]  next mode
[30 ]  BASE VISUAL FPS: 15 / 24 / 30 / 60
[S1 ]  VISUAL SPEED: 0.25 / 0.50 / 0.70 / 1.00 / 1.50x

[BW ]  binary black/white POST FX
[GS ]  grayscale POST FX
[CR ]  Common Crush POST FX
[HC ]  strong color-preserving high contrast POST FX
[DK ]  darken overlay POST FX
[VG ]  very strong vignette POST FX
```

Startup POST FX state:

```text
HC ON -> DK ON
BW OFF
GS OFF
CR OFF
VG OFF
```

The order above is significant: startup chain is `HC -> DK`.

## v0.10.7 — ordered POST COMMON FX

```text
COMPOSITION LAYER
├─ MODE
└─ PRE COMMON FX
   └─ same sampled level as MODE; hook exists, no active PRE effect yet
        ↓
POST COMMON FX
└─ dynamic ordered chain
   ├─ BW
   ├─ GS
   ├─ CR
   ├─ HC
   ├─ DK
   └─ VG
        ↓
INTERACTION / FINAL FX
├─ touch rupture
├─ preset feedback
├─ swipe feedback
├─ existing mild vignette
└─ waveform
```

POST COMMON FX still runs before touch/gesture processing and its held result is cached.

### Order semantics

The previous fixed order is removed.

- turning an effect ON appends it to the active chain;
- turning an effect OFF removes it from the chain;
- turning it ON again moves it to the end;
- startup order comes from `visual.postCommonFx.order`;
- current startup order is `highContrast -> darken`.

Implementation: `js/visual-engine-v107.js` subclasses `DodreiVisualEngineV105`.

### POST FX behavior

- `BW`: two-level black/white threshold.
- `GS`: normal grayscale conversion.
- `CR`: Common Crush.
- `HC`: aggressive color-preserving contrast; baseline `3.2x` contrast.
- `DK`: black overlay; baseline alpha `0.46`.
- `VG`: intentionally strong vignette; edge opacity baseline `0.96`.

## Active mode order

Current runtime sequence:

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

`PHOTO_FULL` is deliberately last as the clean/no-effect source view.

### Removed/deferred modes

`PHOTO_RGB_TEAR` is removed from the active sequence because it was too slow. Its telemetry alias was `CHR_MA::W0UND`, which is the “WOUND” mode seen in the runtime text.

All LUMA/mosaic modes are removed from the active runtime sequence and moved to TODO:

```text
LUMA_BLOCKS
LUMA_VOID
LUMA_MONO
LUMA_DITHER
LUMA_PULSE
```

The implementation code is intentionally retained for later redesign/reuse; only the current runtime preset list no longer exposes them.

## Touch audio tuning

The touch-audio rupture remains based on the native dry track plus the parallel Web Audio FX path.

v0.10.7 reduces the loudness/strength jump by lowering:

- dry-track ducking;
- wet-layer gain;
- delay gain and feedback;
- distortion amount;
- filter resonance.

Current tuning lives in `config.js` under `audio.touchFx*` and is applied by `js/audio-touch-v060.js`.

## Telemetry text corruption

Text corruption is now deliberately more frequent and more widely distributed.

It can appear in:

- status rows;
- mode/FX labels;
- parameter names/rows;
- event log messages.

The corruption is transient pseudo-random damage per short time slot; underlying diagnostic values are not changed. Main tuning is:

```text
glitchIntervalMs  260
glitchChance      0.42
glitchLineChance  0.24
```

Implementation: `js/telemetry-v107.js` patches the existing telemetry renderer.

## Temporal model

The v0.10.4 cumulative virtual-time model remains active:

```text
VISUAL SPEED = how fast the artwork timeline progresses
BASE FPS     = how often that timeline is sampled
POST FX FPS  = actual available render callbacks
```

Speed presets:

```text
S1 0.25x -> state ≈ 5.6 Hz  / cut ≈ 960 ms
S2 0.50x -> state ≈ 11.1 Hz / cut ≈ 480 ms
S3 0.70x -> state ≈ 15.6 Hz / cut ≈ 343 ms
S4 1.00x -> state ≈ 22.2 Hz / cut ≈ 240 ms
S5 1.50x -> state ≈ 33.3 Hz / cut ≈ 160 ms
```

Startup defaults:

```text
BASE_FPS   30
VIS_SPEED  S1 / 0.25x
```

## Performance baseline

```text
outer target fps         60
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
active image pool        20
staging                   up to 5
halation / bloom          removed
RGB tear mode             removed from active sequence
LUMA/mosaic modes         deferred
```

Still images use GitHub archive discovery with `assets.js` fallback. Selection uses shuffle-bag with active/staging exclusion and bounded decoded residency.

## Rollback

For the v0.10.7 visual additions:

1. remove `js/visual-engine-v107.js` from `index.html`;
2. `visual-engine-v105.js` becomes active again;
3. remove/ignore the `GS` button and `grayscale` / `order` config fields.

For telemetry corruption, remove `js/telemetry-v107.js` from `index.html`.

The older engine implementations remain intact.

## Deferred / TODO

- Revisit LUMA/mosaic modes later as a separate redesign rather than keeping them in the current rotation.
- Mild GPU softness / analog texture remains under consideration and is not active.
- PRE COMMON FX has architecture only; no effect is implemented there yet.
- A future text layer may motivate moving `DARKEN` immediately before text.

## Checkpoint — 2026-08-25 23:xx KST

Requested changes implemented:

1. all LUMA/mosaic modes removed from active sequence and recorded as TODO;
2. slow `CHR_MA::W0UND` / `PHOTO_RGB_TEAR` mode removed from active sequence;
3. screenshot startup look set to HC ON + DK ON, with clean `PHOTO_FULL` moved to the end;
4. POST COMMON FX changed from fixed order to activation order;
5. grayscale POST FX added as `GS`;
6. touch audio FX strength/loudness reduced;
7. telemetry character corruption made more frequent and spread across parameter/status/event text.
