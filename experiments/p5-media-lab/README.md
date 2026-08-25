# DODREI

DODREI is a mobile-first browser media-art experiment built with p5.js / JavaScript and hosted on GitHub Pages.

Current artwork/runtime: **v1.0.16**  
Current visual engine: **v1.0.15**  
Config schema: **1**

## Current defaults

```text
BASE FPS     24
VIS SPEED    S2 / 0.50x
CROP RANGE   1.0x .. 8.0x
START MODE   PHOTO_DOUBLE_BLEND / TWIN_EXPOSURE//NULL
POST MASTER  ON
POST CHAIN   HC -> LS -> BL
POST FB      OFF
TOUCH SPEED  0.50x visual playback while held
FULLSCREEN   manual FS inside runtime UI
UI CONTROLS  HIDDEN by default
```

Canonical visual defaults:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL&mode=photo-double-blend&crop=10-80
```

## Active mode order

```text
01 PHOTO_DOUBLE_BLEND   <- default / TWIN_EXPOSURE//NULL
02 PHOTO_FEEDBACK_CROP
03 PHOTO_RAPID_CROP
04 PHOTO_SHARD_SWAP
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

The preset array itself starts with `PHOTO_DOUBLE_BLEND`, and `modeControl.startIndex` is `0`. A valid `mode=` query parameter intentionally overrides the default when present.

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

## Mobile rendering / performance

The main mobile composition remains at `2.0x` CSS resolution. The v1.0.15 performance pass keeps HC/LS full-resolution but batches compatible Canvas filters, runs mobile BL on a `0.65x` scratch surface, and stores global FB history at `0.60x` of the already-low preset-feedback buffer.

## Scene / crop behavior

Scene selection remains independent per-slot random selection with replacement. Immediate repeats are allowed; there is no recent-image ban or duplicate suppression.

```text
crop=10-80   -> 1.0x .. 8.0x   current default
crop=12-35   -> 1.2x .. 3.5x
```

## Runtime controls

```text
[ ›   ] next mode
[24   ] base visual FPS
[S2   ] visual speed
[POST ] POST COMMON FX master
[BW] [GS] [LS] [BL] [FB] [CR] [HC] [DK] [VG]

[PAU  ] pause/resume visuals + music output
[MUT  ] mute/unmute audio
[SHR  ] copy current settings as a share URL
[FS   ] fullscreen; hidden when runtime UI is hidden
[UI   ] hide/show runtime controls; intentionally almost invisible
```

## Important files

- `config.js` — canonical defaults;
- `js/visual-engine-v1015.js` — active performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `sketch-v066.js` — startup/brightness sequence;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL presets/share links;
- `PROJECT_STATE.md` — implementation checkpoint.
