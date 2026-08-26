# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.23`  
Current visual engine version: `1.0.22`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

```text
BASE_FPS        30
VIS_SPEED       S1 / 0.25x
START_MODE      PHOTO_DOUBLE_BLEND / TWIN_EXPOSURE//NULL
MODE_ORDER      DOUBLE_BLEND first
CROP_MIN        1.0x
CROP_MAX        8.0x
POST            ON
POST_CHAIN      HC -> GS -> FB -> ST -> GL
POST_FB         ON
POST_ST         ON
POST_GL         ON
TOUCH_PLAYBACK  0.50x while held
FULLSCREEN      manual FS button inside runtime UI
UI_DEFAULT      HIDDEN
AUDIO           20220302 - sarabande.mp3
```

Canonical visual defaults:

```text
?fps=30&speed=S1&post=1&fx=HC,GS,FB,ST,GL&mode=photo-double-blend&crop=10-80
```

## v1.0.23 — touch swipe-feedback damping

The touch/swipe temporal feedback previously multiplied the speed-mapped retain alpha by `swipeFeedbackStrength=2.0`. At high swipe speed this could clamp to alpha 255, producing an effectively non-decaying feedback loop during a sustained 2–3 second drag.

Current tuning keeps the same activation threshold and geometry range but prevents that saturation:

```text
swipeFeedbackThreshold   0.25   unchanged
swipeFeedbackStrength    1.8    (was 2.0)
swipeFeedbackAlphaMin    42     unchanged
swipeFeedbackAlphaMax    128    (was 178)
max effective retain     ~230   instead of 255 clamp
```

The goal is to keep the swipe-feedback character while ensuring old frames continue to decay during a sustained drag rather than locking into a permanent-looking accumulation.

## v1.0.22 — film dimming + resize stability

### ST

`ST` is film/projection-style luminance instability only. Positional jitter was removed.

```text
normal dim plateaus   ~0–2.2%
rare short dips       ~4.5–7.5%
implementation        translucent black overlay only
```

### Resize / fullscreen stability

A concrete resource-retention bug was identified in the inherited resize path: older visual-engine layers recreated multiple `p5.Graphics` surfaces without first removing the previous instances. The analyzer did the same with its analysis buffer. Repeated window/fullscreen changes could therefore leave stale graphics/GPU canvas resources behind and cause progressive slowdown.

Current mitigation while keeping visual engine version `1.0.22`:

```text
active visual engine  disposes inherited Graphics surfaces before rebuild
video analyzer        removes previous analysis buffer before rebuild
resize debounce       320 ms
fullscreen events     feed the same debounced viewport rebuild path
```

A fullscreen viewport can still legitimately cost more than a smaller window because the final render buffer may be larger, up to the existing long-edge caps. The resource accumulation itself should no longer persist across repeated resize/fullscreen cycles.

## Touch rupture

- Touch palette is grayscale only: black / dark gray / mid gray / near-white.
- Release tail is faster than the older interaction model and is velocity-aware.
- Irregular horizontal rupture bands use mostly narrow slices with occasional larger fractures.
- Touch rupture remains on the existing low-resolution buffers and mobile frame-skip path.
- Swipe-feedback remains active only while pressed and above the `0.25` swipe threshold; v1.0.23 reduces its temporal accumulation ceiling.

## Global POST FX

Current ordered keys include:

```text
BW GS LS BL FB GL ST CR HC DK VG
```

Current startup chain:

```text
HC -> GS -> FB -> ST -> GL
```

`FB` remains intentionally strong and low-resolution temporal memory. `GL` is sparse temporal slice glitch at rest and becomes much more active during touch. `ST` is lightweight film-like dimming.

## Startup sequence

```text
0.0s   soundtrack begins immediately
2.0s   title/start screen disappears
2.0-3.0s black screen + music only
3.0s   telemetry stage 1
3.2s   telemetry stage 2
3.4s   telemetry stage 3
6.4s   main visual at 20% brightness
7.4s   main visual at 100% brightness
```

## Mobile sharpness / performance

```text
main mobile composition   2x CSS resolution
mobile long-edge cap      1440 effective after oversample
feedback/swipe/rupture     lower-resolution surfaces
GL scratch                 lower-resolution surface
ST                         overlay only
```

HC/GS/LS consecutive Canvas filters are batched into one full-resolution pass. BL, when enabled, uses reduced mobile scratch rendering. Global FB history remains lower-resolution.

## Scene image selection

```text
policy                  independent random with replacement
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
long non-repeat run     ALLOWED
```

## Important files

- `config.js` — canonical defaults / preset order / FX parameters / swipe-feedback tuning;
- `assets.js` — soundtrack;
- `js/visual-engine-v1022.js` — active engine / ST / resize graphics disposal;
- `js/visual-engine-v1021.js` — GL and original ST layer;
- `js/visual-engine-v1020.js` — touch rupture refinement;
- `js/visual-engine-v1015.js` — performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1000.js` — swipe-feedback implementation and POST touch bypass;
- `js/visual-engine-v1007.js` — mobile 2x main rendering;
- `js/video-analyzer.js` — analysis buffer with resize disposal;
- `sketch-v066.js` — startup and debounced viewport rebuild;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL preset/share contract;
- `index.html` — current page and cache key.

## Checkpoint — v1.0.23

1. Canonical preset remains `30 FPS / S1 / HC -> GS -> FB -> ST -> GL / PHOTO_DOUBLE_BLEND / crop 1.0x..8.0x`.
2. Runtime version is `1.0.23`; active visual-engine class remains `1.0.22` because this revision is config-only touch-feedback tuning.
3. Touch swipe-feedback strength is slightly reduced and its retain range no longer reaches the 255 non-decaying clamp at maximum swipe speed.
4. Resize/fullscreen disposal patch, image quality caps, touch rupture/release behavior, startup sequence, UI behavior, and soundtrack remain unchanged.
