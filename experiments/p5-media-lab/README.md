# DODREI

DODREI is a mobile-first browser media-art experiment built with **p5.js / JavaScript** and hosted on GitHub Pages.

Current baseline: **v0.10.6**  
Current visual engine: **0.10.5**  
Current config schema: **1**

## Runtime controls

Upper-right:

```text
[ › ]  next visual mode
[30 ]  BASE VISUAL FPS: 15 -> 24 -> 30 -> 60
[S1 ]  VISUAL SPEED: S1 -> S2 -> S3 -> S4 -> S5

[BW ]  binary black/white
[CR ]  Common Crush
[HC ]  high contrast color
[DK ]  darken overlay
[VG ]  strong vignette
```

Speed presets:

```text
S1 0.25x
S2 0.50x
S3 0.70x
S4 1.00x
S5 1.50x
```

Startup default is **S1 / 0.25x** at BASE FPS **30**. All POST FX buttons start OFF.

## Visual architecture

```text
COMPOSITION
├─ MODE
└─ PRE COMMON FX      [same level as MODE; currently empty]
        ↓
POST COMMON FX        [runtime toggles]
├─ CRUSH
├─ HIGH CONTRAST
├─ BINARY B/W
├─ DARKEN
└─ STRONG VIGNETTE
        ↓
INTERACTION / FINAL FX
├─ touch rupture
├─ preset feedback
├─ swipe feedback
├─ mild vignette
└─ waveform
```

POST COMMON FX is deliberately before touch/gesture processing. Its output is cached from the held base composition and recomputed only when composition changes or a toggle changes.

`DARKEN` may later move immediately before a future text layer if that gives better readability control.

## Mode order

`PHOTO_FULL` is the first, clean reference mode.

```text
PHOTO_FULL
PHOTO_FEEDBACK_CROP
PHOTO_RAPID_CROP
PHOTO_RGB_TEAR
PHOTO_SHARD_SWAP
PHOTO_DOUBLE_BLEND
PHOTO_BLEND_CYCLE
LUMA_BLOCKS
LUMA_VOID
LUMA_MONO
LUMA_DITHER
LUMA_PULSE
```

## Temporal model

```text
VISUAL SPEED = timeline progression speed
BASE FPS     = sampling cadence of that timeline
POST FX FPS  = actual available render callbacks
```

The cumulative virtual-time model lives in `js/visual-engine-v104.js`; PRE/POST COMMON FX lives in `js/visual-engine-v105.js`.

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
- Common Crush starts OFF and can be toggled as POST COMMON FX.

## Important files

- `config.js` — runtime values and POST COMMON FX parameters;
- `js/visual-engine-v104.js` — cumulative virtual visual time;
- `js/visual-engine-v105.js` — PRE/POST COMMON FX architecture and cached global effects;
- `js/mode-control-ui.js` — mode/FPS/speed/POST-FX buttons;
- `js/telemetry.js` — runtime diagnostics;
- `PROJECT_STATE.md` — implementation checkpoint.

## Deferred

A mild GPU softness / analog texture pass is still under consideration. PRE COMMON FX has a hook but no active effect yet.
