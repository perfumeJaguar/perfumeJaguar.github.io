# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.16`  
Current visual engine version: `1.0.15`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

```text
BASE_FPS        24
VIS_SPEED       S2 / 0.50x
START_MODE      PHOTO_DOUBLE_BLEND / TWIN_EXPOSURE//NULL
MODE_ORDER      DOUBLE_BLEND first
CROP_MIN        1.0x
CROP_MAX        8.0x
POST            ON
POST_CHAIN      HC -> LS -> BL
POST_FB         OFF
TOUCH_PLAYBACK  0.50x while held
FULLSCREEN      manual FS button inside runtime UI
UI_DEFAULT      HIDDEN
AUDIO           20220302 - sarabande.mp3
```

Canonical visual defaults:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL&mode=photo-double-blend&crop=10-80
```

## v1.0.16 — default mode/order + crop range

`PHOTO_DOUBLE_BLEND` is now physically the first enabled preset and `modeControl.startIndex` is `0`.

```text
01 PHOTO_DOUBLE_BLEND   <- default / TWIN_EXPOSURE//NULL
02 PHOTO_FEEDBACK_CROP
03 PHOTO_RAPID_CROP
04 PHOTO_SHARD_SWAP
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

This avoids relying on a non-zero start index for the normal default path. A valid `mode=` URL parameter still intentionally overrides the default.

Default crop range changed from `1.0x .. 9.0x` to:

```text
1.0x .. 8.0x
crop=10-80
```

The URL parser still supports values up to 9.0x for explicit shared/custom presets; only the canonical default changed.

## v1.0.15 — conservative performance diet

Main mobile composition quality remains at 2x CSS resolution. Touch rupture/swipe behavior is unchanged.

```text
HC + GS + LS consecutive Canvas filters
    -> batched into one full-resolution raster pass

BL on mobile
    -> processed on 0.65x POST scratch surface
    -> upsampled back to full POST surface

Global POST FB history
    -> 0.60x of the already-low preset feedback buffer
```

Default `HC -> LS -> BL` therefore uses fewer full-resolution passes than v1.0.14 while preserving the main raster.

## v1.0.14 — UI / touch-audio balance

- FS sits above UI and hides with runtime controls.
- UI toggle remains visible while controls are hidden and is intentionally almost invisible.
- Touch audio modulation reduced roughly 15–20% across wet/delay/distortion/feedback/resonance-related gains.

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

## Global FB POST FX

```text
button/token       FB
config key         feedback
default            OFF
share URL          fx=...,FB,... supported
history retain     58
feedback scale     0.996
current history    218
history raster     0.60x of preset-feedback buffer
```

## Mobile sharpness

```text
CSS viewport       360 x 642 example
main composition   ~720 x 1284
mobile oversample  2.0x
```

Feedback, swipe, touch rupture, analyzer, mobile BL scratch, and global FB history remain lower-resolution performance surfaces.

## Scene image selection

```text
policy                  independent random with replacement
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
long non-repeat run     ALLOWED
```

## POST / touch semantics

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

Current ordered POST keys:

```text
BW GS LS BL FB CR HC DK VG
```

Startup POST chain:

```text
HC -> LS -> BL
```

## Important files

- `config.js` — canonical defaults / preset order;
- `assets.js` — soundtrack;
- `js/visual-engine-v1015.js` — active performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1007.js` — mobile 2x main rendering;
- `sketch-v066.js` — startup/brightness timeline;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL preset/share contract;
- `index.html` — current page and cache key.

## Checkpoint — v1.0.16

1. `PHOTO_DOUBLE_BLEND` is preset #1 and default start mode.
2. `modeControl.startIndex = 0`.
3. Default crop is `1.0x .. 8.0x` (`crop=10-80`).
4. Custom URL crop support up to 9.0x is retained.
5. v1.0.15 performance optimizations and all startup/UI/audio behavior remain unchanged.
