# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.15`  
Current visual engine version: `1.0.15`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

```text
BASE_FPS        24
VIS_SPEED       S2 / 0.50x
START_MODE      PHOTO_DOUBLE_BLEND
CROP_MIN        1.0x
CROP_MAX        9.0x
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
?fps=24&speed=S2&post=1&fx=HC,LS,BL&mode=photo-double-blend&crop=10-90
```

## v1.0.15 — conservative performance diet

Main mobile composition quality is preserved at 2x CSS resolution. Touch rupture/swipe behavior is unchanged.

Optimizations:

```text
HC + GS + LS consecutive Canvas filters
    -> batched into one full-resolution raster pass

BL on mobile
    -> processed on 0.65x POST scratch surface
    -> upsampled back to full POST surface
    -> configured blur radius compensated for scratch scale

Global POST FB history
    -> 0.60x of the already-low preset feedback buffer
    -> no change to main 2x composition raster
```

Default chain `HC -> LS -> BL` therefore removes one full-resolution filter/copy pass compared with v1.0.14, while HC/LS remain full-resolution. BL is the only default POST effect intentionally moved to a reduced mobile scratch raster because its purpose is already softening.

No live device benchmark has been run from ChatGPT; this is a source-level/static optimization pass. Visual inspection on the target phone remains the final check.

## v1.0.14 — UI / touch-audio balance

- FS moved above the UI button and now hides with the rest of the runtime controls.
- UI toggle remains visible while controls are hidden and is intentionally almost invisible.
- Touch audio modulation was reduced roughly 15–20% across wet/delay/distortion/feedback/resonance-related gains.

## v1.0.13 — startup gap

START gesture timeline:

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

The ordered global POST effect remains available:

```text
button/token       FB
config key         feedback
default            OFF
share URL          fx=...,FB,... supported
order              activation order, same contract as HC/LS/BL/etc.
history retain     58
feedback scale     0.996
current history    218
history raster     0.60x of preset-feedback buffer in v1.0.15
```

## Mobile sharpness

Mobile ordinary composition and full-resolution POST surfaces remain at `2.0x` CSS resolution. Example:

```text
CSS viewport       360 x 642
main composition   ~720 x 1284
```

Feedback, swipe, touch rupture, analyzer, and now mobile BL scratch remain performance-oriented lower-resolution surfaces. Desktop main behavior remains unchanged; desktop BL scale remains 1.0.

## Scene image selection

Visible scene selection remains independent per-slot random selection with replacement.

```text
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
long non-repeat run     ALLOWED
```

## Crop range semantics

```text
crop=10-90  -> 1.0x .. 9.0x
crop=12-35  -> 1.2x .. 3.5x
```

## POST / touch semantics

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

Current ordered POST keys:

```text
BW GS LS BL FB CR HC DK VG
```

Startup default:

```text
HC -> LS -> BL
```

Swipe feedback remains separate from global `FB`:

```text
threshold 0.25
strength  2.00
```

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND   <- default / TWIN_EXPOSURE//NULL
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

## Important files

- `config.js` — current defaults + performance parameters;
- `assets.js` — soundtrack;
- `js/startup-sequence-v1010.js` — staged telemetry reveal;
- `sketch-v066.js` — startup/brightness timeline;
- `js/runtime-presentation-v108.js` — telemetry opacity only; version-neutral as of v1.0.15;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS controls;
- `js/post-feedback-ui-v1012.js` — FB control;
- `js/visual-engine-v1015.js` — active performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1007.js` — mobile 2x main composition/POST surfaces;
- `js/visual-engine-v1004.js` — touch playback slowdown;
- `js/visual-engine-v1003.js` — independent scene selection + crop randomization;
- `js/url-preset.js` — URL preset/share contract;
- `index.html` — current page and cache key.

## Checkpoint — v1.0.15

1. Main 2x mobile image quality retained.
2. Touch visual pipeline retained unchanged.
3. Default HC+LS now share one full-resolution Canvas-filter pass.
4. Mobile BL uses a 0.65x scratch surface; desktop BL remains full-resolution.
5. Global FB history reduced to 0.60x of the existing low-resolution feedback surface.
6. Default visible settings and URL contract are unchanged.
7. Runtime presentation no longer overwrites the canonical app version.
