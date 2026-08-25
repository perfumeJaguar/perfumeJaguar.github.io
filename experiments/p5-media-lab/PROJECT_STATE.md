# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `0.10.8`  
Current visual engine version: `0.10.8`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

Upper-right runtime controls:

```text
[ › ]  next mode
[60 ]  BASE VISUAL FPS: 15 / 24 / 30 / 60
[S5 ]  VISUAL SPEED: 0.25 / 0.50 / 0.70 / 1.00 / 1.50x

[BW ]  binary black/white POST FX
[GS ]  grayscale POST FX
[LS ]  low saturation POST FX
[CR ]  Common Crush POST FX
[HC ]  strong color-preserving high contrast POST FX
[DK ]  darken overlay POST FX
[VG ]  very strong vignette POST FX
```

Startup POST FX state/order:

```text
HC ON -> CR ON -> LS ON -> DK ON
BW OFF
GS OFF
VG OFF
```

`LS` uses a `0.50` saturation multiplier, i.e. approximately half the original saturation.

## v0.10.8 — LOW SATURATION + new startup defaults

POST COMMON FX remains an activation-ordered chain. `LS` is added as a normal independent effect and can be inserted anywhere by toggling effects in the desired order.

Startup chain:

```text
HC -> CR -> LS -> DK
```

Startup timing:

```text
BASE_FPS   60
VIS_SPEED  S5 / 1.50x
```

Implementation: `js/visual-engine-v108.js` subclasses `DodreiVisualEngineV107` and adds a lightweight `saturate(0.50)` pass.

## Ordered POST COMMON FX architecture

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
   ├─ LS
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

POST COMMON FX runs before touch/gesture processing and its held result is cached.

### Order semantics

- turning an effect ON appends it to the active chain;
- turning an effect OFF removes it from the chain;
- turning it ON again moves it to the end;
- startup order comes from `visual.postCommonFx.order`.

### POST FX behavior

- `BW`: two-level black/white threshold.
- `GS`: normal grayscale conversion.
- `LS`: low saturation, baseline `0.50` saturation multiplier.
- `CR`: Common Crush.
- `HC`: aggressive color-preserving contrast; baseline `3.2x` contrast.
- `DK`: black overlay; baseline alpha `0.46`.
- `VG`: intentionally strong vignette; edge opacity baseline `0.96`.

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

`PHOTO_FULL` remains deliberately last as the clean/no-effect source view.

### Removed/deferred modes

`PHOTO_RGB_TEAR` is removed from the active sequence because it was too slow. Its telemetry alias was `CHR_MA::W0UND`.

All LUMA/mosaic modes remain deferred to TODO:

```text
LUMA_BLOCKS
LUMA_VOID
LUMA_MONO
LUMA_DITHER
LUMA_PULSE
```

Their implementation code is retained for later redesign/reuse.

## Touch audio tuning

The touch-audio rupture remains based on the native dry track plus the parallel Web Audio FX path. The quieter v0.10.7 tuning remains unchanged.

## Telemetry text corruption

The broader pseudo-random telemetry corruption introduced in v0.10.7 remains unchanged. It can affect status rows, mode/FX labels, parameter names/rows, and event log messages without changing underlying values.

## Temporal model

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

Current startup defaults are `BASE_FPS 60` and `S5 / 1.50x`.

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

The LS pass uses the browser canvas `saturate()` filter and is expected to be much lighter than geometric or feedback-heavy modes, though actual mobile cost still depends on browser/GPU behavior.

## Rollback

For the v0.10.8 visual addition:

1. remove `js/visual-engine-v108.js` from `index.html`;
2. `visual-engine-v107.js` becomes active again;
3. remove/ignore the `LS` button and `lowSaturation` config fields.

Older engine implementations remain intact.

## Deferred / TODO

- Revisit LUMA/mosaic modes later as a separate redesign.
- Mild GPU softness / analog texture remains under consideration and is not active.
- PRE COMMON FX has architecture only; no effect is implemented there yet.
- A future text layer may motivate moving `DARKEN` immediately before text.

## Checkpoint — 2026-08-26 00:xx KST

Requested changes implemented:

1. `LS` Low Saturation POST FX added at approximately half saturation (`0.50`);
2. startup POST FX chain changed to `HC -> CR -> LS -> DK`;
3. startup BASE FPS changed to `60`;
4. startup visual speed changed to `S5 / 1.50x`.
