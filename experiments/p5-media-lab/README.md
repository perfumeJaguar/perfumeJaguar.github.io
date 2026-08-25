# DODREI

DODREI is a mobile-first browser media-art experiment built with p5.js / JavaScript and hosted on GitHub Pages.

Current artwork/runtime: **v1.0.4**  
Current visual engine: **v1.0.4**  
Config schema: **1**

## Current defaults

```text
BASE FPS     24
VIS SPEED    S1 / 0.25x
CROP RANGE   1.0x .. 5.0x
START MODE   PHOTO_DOUBLE_BLEND
POST MASTER  ON
POST CHAIN   HC -> LS -> BL -> DK
TOUCH SPEED  0.50x visual playback while held
```

These defaults match:

```text
?fps=24&speed=S1&post=1&fx=HC,LS,BL,DK&mode=photo-double-blend&crop=10-50
```

When those URL parameters are absent, the config above is used. URL parameters still override only the values they explicitly provide.

## Touch playback behavior

v1.0.4 adds a dedicated `touchPlaybackSpeedMultiplier: 0.50`.

While pointer/touch is held, the **virtual visual timeline** advances at half speed. Therefore image cuts and crop/layout evolution slow together. Touch rupture, swipe feedback, POST bypass behavior, audio FX, and the outer render FPS are not slowed by this setting.

The older cut-only `touchTransitionSlowdown` is now `0.0` so the touch slowdown is a clean 50% playback multiplier rather than stacking two slowdown systems.

## Scene image selection

Scene selection remains **independent per-slot random selection with replacement**:

- immediate repeats are allowed;
- long non-repeating runs are allowed;
- no recent-image ban;
- no scene shuffle-bag;
- no duplicate suppression.

A selected image is held for its image cut while crop/layout can refresh faster inside that cut.

## Crop behavior

Crop zoom is sampled inside the configured range rather than treated as a fixed zoom. Current default is `1.0x .. 5.0x`.

Preferred URL notation:

```text
crop=10-50   -> 1.0x .. 5.0x
crop=12-35   -> 1.2x .. 3.5x
```

`crop=12_35` is accepted as input; share links emit the hyphen form. A legacy single value such as `crop=30` keeps the current minimum and sets max to `3.0x`.

## Runtime controls

```text
[ ›   ] next mode
[24   ] base visual FPS
[S1   ] visual speed
[POST ] POST COMMON FX master bypass
[BW   ] binary black/white
[GS   ] grayscale
[LS   ] low saturation
[BL   ] subtle blur
[CR   ] Common Crush
[HC   ] high contrast
[DK   ] darken
[VG   ] strong vignette

[SHR  ] copy current settings as a share URL
```

## URL presets / share links

```text
fps=15|24|30|60
speed=S1|S2|S3|S4|S5
post=0|1
fx=<ordered comma-separated FX tokens>
mode=<preset-id | internal preset name | displayed MODE alias>
crop=<min-max range>
```

FX order is significant. `SHR` serializes current mode, FPS, speed, POST master state, active FX order, and crop min/max range.

## Typography / telemetry

DODREI uses **IBM Plex Mono** for DOM controls and p5 canvas telemetry. Telemetry remains neutral off-gray:

```text
text color        RGB 214 / 214 / 210
primary alpha     0.52
secondary alpha   0.28
faint/event alpha 0.14
```

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

Default start mode is now `PHOTO_DOUBLE_BLEND`.

## Important files

- `config.js` — canonical defaults;
- `js/url-preset.js` — URL override validation + share-link serializer;
- `js/visual-engine-v1003.js` — independent scene image slots + bounded crop randomization;
- `js/visual-engine-v1004.js` — 50% visual playback while touch is held;
- `js/visual-engine-v1000.js` — POST master/blur/touch rupture behavior;
- `js/media-manager.js` — rolling resident working set;
- `js/mode-control-ui.js` — test controls + share button;
- `PROJECT_STATE.md` — implementation checkpoint.
