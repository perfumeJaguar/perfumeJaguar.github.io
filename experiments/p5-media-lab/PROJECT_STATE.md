# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.19`  
Current visual engine version: `1.0.15`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

```text
BASE_FPS        30
VIS_SPEED       S2 / 0.50x
START_MODE      PHOTO_DOUBLE_BLEND / TWIN_EXPOSURE//NULL
MODE_ORDER      DOUBLE_BLEND first
CROP_MIN        1.0x
CROP_MAX        8.0x
POST            ON
POST_CHAIN      HC -> GS -> FB
POST_FB         ON
TOUCH_PLAYBACK  0.50x while held
FULLSCREEN      manual FS button inside runtime UI
UI_DEFAULT      HIDDEN
AUDIO           20220302 - sarabande.mp3
```

Canonical visual defaults:

```text
?fps=30&speed=S2&post=1&fx=HC,GS,FB&mode=photo-double-blend&crop=10-80
```

## v1.0.19 — final canonical default correction

The requested canonical preset is now:

```text
FPS       30
SPEED     S2 / 0.50x
POST      ON
FX ORDER  HC -> GS -> FB
MODE      PHOTO_DOUBLE_BLEND
CROP      1.0x .. 8.0x
```

This replaces the mistaken temporary 15 FPS default from v1.0.18. Valid URL parameters still override these defaults.

## Recent retained behavior

- `PHOTO_DOUBLE_BLEND` is preset #1 and `modeControl.startIndex = 0`.
- Global POST `FB` is intentionally strong: retain `96`, scale `0.992`, current-history alpha `236`.
- Mobile main composition remains 2x CSS resolution.
- Mobile BL uses a reduced scratch surface when enabled, but BL is not part of the current default chain.
- Global FB history remains at `0.60x` of the already-low preset-feedback buffer.
- UI is hidden by default; the nearly invisible UI toggle remains accessible.
- FS sits inside the runtime UI and hides with it.
- Touch audio modulation is reduced from earlier versions.
- Touch visual pipeline remains unchanged.

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

- `config.js` — canonical defaults / preset order / FX parameters;
- `assets.js` — soundtrack;
- `js/visual-engine-v1015.js` — active performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1007.js` — mobile 2x main rendering;
- `sketch-v066.js` — startup/brightness timeline;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL preset/share contract;
- `index.html` — current page and cache key.

## Checkpoint — v1.0.19

1. Canonical FPS corrected from 15 to 30.
2. Canonical FX chain is `HC -> GS -> FB` with POST enabled.
3. Default mode remains `PHOTO_DOUBLE_BLEND` first.
4. Default crop remains `1.0x .. 8.0x` (`crop=10-80`).
5. Existing performance optimizations, startup timing, UI behavior, soundtrack, and touch behavior remain unchanged.
