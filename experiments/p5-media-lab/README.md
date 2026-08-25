# DODREI

DODREI is a mobile-first browser media-art experiment built with **p5.js / JavaScript** and hosted on GitHub Pages.

Current baseline: **v1.0.0**  
Current visual engine: **1.0.0**  
Current config schema: **1**

## Runtime controls

Upper-right:

```text
[ › ]  next visual mode
[60 ]  BASE VISUAL FPS: 15 -> 24 -> 30 -> 60
[S5 ]  VISUAL SPEED: S1 -> S2 -> S3 -> S4 -> S5

[POST] POST COMMON FX master bypass
[BW  ] binary black/white
[GS  ] grayscale
[LS  ] low saturation (~50%)
[BL  ] subtle blur
[CR  ] Common Crush
[HC  ] high contrast color
[DK  ] darken overlay
[VG  ] strong vignette
```

Speed presets:

```text
S1 0.25x
S2 0.50x
S3 0.70x
S4 1.00x
S5 1.50x
```

Startup default is **S5 / 1.50x** at BASE FPS **60**.

Startup POST FX chain is:

```text
HC -> CR -> LS -> DK
```

`POST` starts ON. `BW / GS / BL / VG` start OFF. `LS` uses `saturate(0.50)`. `BL` uses a subtle `1.20px` canvas blur.

## v1.0.0 interaction / POST behavior

POST COMMON FX is an activation-ordered chain. Turning an effect ON appends it; turning it OFF removes it; turning it back ON moves it to the end.

The new `POST` master switch is a non-destructive bypass:

- POST OFF bypasses the whole global chain;
- individual POST FX buttons are disabled while bypassed;
- the active effect states and their order are not changed;
- POST ON restores the exact previous chain.

Touch rupture has its own transient POST bypass. While the screen touch rupture is active, POST COMMON FX is skipped automatically. When the touch effect ends, POST returns automatically **only if the POST master was already ON**. The touch bypass never changes the manual master state, so the two controls do not conflict.

Swipe feedback now activates at `0.25` instead of `0.30`, and its recursive transform/retention strength is multiplied by `2.0`.

## Visual architecture

```text
COMPOSITION
├─ MODE
└─ PRE COMMON FX      [same level as MODE; currently empty]
        ↓
POST COMMON FX        [ordered + cached]
├─ master bypass
├─ BW
├─ GS
├─ LS
├─ BL
├─ CR
├─ HC
├─ DK
└─ VG
        ↓
TOUCH / GESTURE
├─ touch rupture      [temporarily bypasses POST]
├─ preset feedback
└─ swipe feedback     [threshold 0.25 / strength 2.0]
        ↓
FINAL
├─ mild vignette
└─ waveform
```

## Active mode order

The heavy `PHOTO_RGB_TEAR` mode (telemetry alias `CHR_MA::W0UND`) remains removed from the active sequence. All LUMA/mosaic modes remain deferred to TODO. Their implementation code is retained for possible later reuse.

The clean source mode is deliberately last.

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

## Touch audio

Touch audio rupture still uses the native dry track plus the parallel Web Audio FX path. The quieter tuning introduced in v0.10.7 remains active.

## Telemetry text corruption

The pseudo-system text glitch remains distributed across status labels, parameter rows, mode/FX text, and event messages. Corruption is transient and pseudo-random; underlying telemetry values are unchanged.

## Temporal model

```text
VISUAL SPEED = timeline progression speed
BASE FPS     = sampling cadence of that timeline
POST FX FPS  = actual available render callbacks
```

The cumulative virtual-time model lives in `js/visual-engine-v104.js`; PRE/POST COMMON FX baseline lives in `js/visual-engine-v105.js`; activation-order POST FX + grayscale lives in `js/visual-engine-v107.js`; low-saturation support lives in `js/visual-engine-v108.js`; the v1 milestone behavior lives in `js/visual-engine-v1000.js`.

## Performance baseline

- `pixelDensity(1)`;
- mobile main processing buffer long edge: `720`;
- desktop main buffer long edge: `1280`;
- mobile rupture buffer scale: `0.50`;
- mobile rupture recalculation every second rendered frame;
- GPU four-band touch palette with CPU fallback;
- reduced-resolution feedback buffers;
- decoded active image pool: `20`;
- staging: up to `5`;
- halation/bloom removed;
- RGB tear removed from active modes;
- LUMA/mosaic modes deferred;
- POST result cached while active;
- BL is deliberately subtle, but blur is still more expensive than simple saturation/darken passes.

## Important files

- `config.js` — runtime values, startup chain, POST master/defaults, feedback tuning;
- `js/visual-engine-v104.js` — cumulative virtual visual time;
- `js/visual-engine-v105.js` — PRE/POST COMMON FX architecture and cached global effects;
- `js/visual-engine-v107.js` — activation-order POST FX chain and grayscale;
- `js/visual-engine-v108.js` — low-saturation POST FX;
- `js/visual-engine-v1000.js` — v1 blur, POST master/touch bypass, stronger swipe feedback;
- `js/audio-touch-v060.js` — touch-audio rupture with quieter tuning;
- `js/telemetry-v107.js` — distributed pseudo-random text corruption;
- `js/mode-control-ui.js` — mode/FPS/speed/POST controls;
- `PROJECT_STATE.md` — implementation checkpoint.

## Deferred

- Revisit/rebuild LUMA/mosaic modes later rather than keeping them in the current runtime rotation.
- Mild GPU softness / analog texture remains under consideration.
- PRE COMMON FX has a hook but no active effect yet.
