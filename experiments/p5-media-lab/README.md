# DODREI

DODREI is a mobile-first browser media-art experiment built with p5.js / JavaScript and hosted on GitHub Pages.

Current artwork/runtime: **v1.0.3**  
Current visual engine: **v1.0.3**  
Config schema: **1**

## Current defaults

```text
BASE FPS     24
VIS SPEED    S2 / 0.50x
CROP RANGE   1.0x .. 3.0x
POST MASTER  ON
POST CHAIN   HC -> LS -> BL -> DK
```

`BW / GS / CR / VG` start OFF. BL remains a subtle `1.20px` blur.

## Scene image selection

v1.0.3 changes visible scene selection from correlated arithmetic seed sequences to **independent per-slot random selection with replacement**.

Important semantics:

- a mode may still hold one selected image across several crop/layout states;
- each image layer/slot chooses independently when the image cut advances;
- immediate repeats are allowed;
- long runs without repeats are also allowed;
- there is deliberately **no recent-image ban, no scene shuffle-bag, and no duplicate suppression**;
- the goal is to remove machine-like cross-layer repetition patterns without artificially correcting randomness.

The archive/working-set manager is unchanged: it still keeps a bounded resident pool (normally 20 images) and uses its own shuffle-bag only to rotate which archive files are resident. Scene selection happens independently inside that resident pool.

## Crop behavior

Crop zoom is a true range, not a fixed zoom target. Each visual-state refresh samples a new zoom inside `sourceCropMinZoom .. sourceCropMaxZoom`, while the selected image itself can remain held until the next image cut.

Mode-specific crop intensity now biases the distribution instead of multiplying zoom past the maximum and then clamping it. This avoids many states collapsing to exactly the same maximum zoom.

## Runtime controls

```text
[ ›   ] next mode
[24   ] base visual FPS
[S2   ] visual speed
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

`js/url-preset.js` reads validated query parameters before the visual engine is created. Missing or invalid values are ignored.

```text
fps=15|24|30|60
speed=S1|S2|S3|S4|S5
post=0|1
fx=HC,LS,BL,DK
mode=<preset-id | internal preset name | displayed MODE alias>
crop=<min-max range>
```

Preferred crop notation:

```text
crop=10-30   -> 1.0x .. 3.0x
crop=12-35   -> 1.2x .. 3.5x
crop=15-25   -> 1.5x .. 2.5x
```

`crop=12_35` is accepted as an input alias, but `SHR` emits the clearer hyphen form. Legacy single-value links remain valid: `crop=30` keeps the current minimum and sets the maximum to `3.0x`.

Example:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL,DK&mode=photo-feedback-crop&crop=10-30
```

FX order is significant. `SHR` serializes current mode, FPS, speed, POST master state, active FX order, and crop min/max range.

## Typography / telemetry

DODREI uses **IBM Plex Mono** for DOM controls and p5 canvas telemetry. Telemetry is neutral off-gray:

```text
text color        RGB 214 / 214 / 210
primary alpha     0.52
secondary alpha   0.28
faint/event alpha 0.14
```

Existing transient character corruption remains, with occasional small line displacement and very slow overall drift.

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

`PHOTO_FULL` remains the final clean source mode. RGB tear and LUMA/mosaic modes remain removed/deferred.

## Important files

- `config.js` — canonical defaults;
- `js/url-preset.js` — URL override validation + share-link serializer;
- `js/visual-engine-v1000.js` — v1 POST master/blur/touch behavior;
- `js/visual-engine-v1003.js` — independent scene image slots + bounded crop range;
- `js/telemetry-v107.js` — distributed text corruption;
- `js/telemetry-v102.js` — IBM Plex Mono canvas telemetry renderer;
- `js/media-manager.js` — rolling resident working set;
- `js/mode-control-ui.js` — test controls + share button;
- `PROJECT_STATE.md` — implementation checkpoint.
