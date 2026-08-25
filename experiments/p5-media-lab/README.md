# DODREI

DODREI is a mobile-first browser media-art experiment built with p5.js / JavaScript and hosted on GitHub Pages.

Current artwork/runtime: **v1.0.2**  
Current visual engine: **v1.0.0**  
Config schema: **1**

## Current defaults

```text
BASE FPS     24
VIS SPEED    S2 / 0.50x
MAX CROP     3.0x
POST MASTER  ON
POST CHAIN   HC -> LS -> BL -> DK
```

`BW / GS / CR / VG` start OFF. BL remains a subtle `1.20px` blur.

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

The share button is placed at the lower-right edge. Successful copy shows a brief `LINK COPIED` message.

## URL presets / share links

`js/url-preset.js` reads validated query parameters before the visual engine is created. Missing or invalid values are ignored and normal config defaults remain in effect.

Supported parameters:

```text
fps=15|24|30|60
speed=S1|S2|S3|S4|S5
post=0|1
fx=HC,LS,BL,DK     ordered POST chain; NONE is valid
mode=<preset-id | internal preset name | displayed MODE alias>
crop=25|30          shorthand for 2.5x / 3.0x
```

`crop` also accepts direct values from `1.0` to `5.0`, so `crop=2.5` and `crop=25` are equivalent.

Examples:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL,DK&mode=photo-feedback-crop&crop=30
?mode=NULL%2F%2FVEIL_7F&crop=25
```

For `mode`, all three forms are accepted:

```text
photo-feedback-crop   stable preset id
PHOTO_FEEDBACK_CROP   internal preset name
NULL//VEIL_7F         MODE text shown in telemetry
```

`SHR` always emits the stable preset id because it is cleaner and less likely to break if the display alias changes later.

FX order in the URL is significant. `SHR` serializes the current mode, FPS, speed, POST master state, active FX order, and current maximum crop value.

The URL preset layer is independent of the test controls, so a later public build can hide/remove the control UI while keeping the same share-link format.

## Typography / telemetry

DODREI v1.0.2 uses **IBM Plex Mono** for both DOM controls and p5 canvas telemetry. The canvas renderer now explicitly waits for/uses the webfont instead of relying on the first-frame generic monospace fallback.

The telemetry color is now neutral off-gray rather than gray-green:

```text
text color        RGB 214 / 214 / 210
primary alpha     0.52
secondary alpha   0.28
faint/event alpha 0.14
```

Existing transient character corruption remains, with occasional ~1.6px line displacement and a very slow ±1px overall drift. There is no text blur, multi-shadow stack, or chromatic split.

Reusable webfont declarations live in `assets/fonts/webfonts.css` for IBM Plex Mono, Space Mono, Share Tech Mono, and VT323. IBM Plex Mono is the only one used by DODREI at present.

## POST / touch behavior

POST COMMON FX remains activation-ordered and cached. `POST` is a non-destructive master bypass: turning it off disables individual FX controls without changing their state/order. Touch rupture transiently bypasses POST and restores it afterward only when the manual POST master is still enabled.

Swipe feedback remains at threshold `0.25` with strength `2.0`.

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

`PHOTO_FULL` remains the final clean source mode. `PHOTO_RGB_TEAR / CHR_MA::W0UND` and all LUMA/mosaic modes remain removed/deferred for performance.

## Important files

- `config.js` — canonical defaults;
- `js/url-preset.js` — URL override validation + share-link serializer;
- `js/visual-engine-v1000.js` — v1 blur, POST master/touch bypass, stronger swipe feedback;
- `js/telemetry-v107.js` — distributed text corruption;
- `js/telemetry-v102.js` — explicit IBM Plex Mono canvas telemetry renderer;
- `js/mode-control-ui.js` — test controls + share button;
- `assets/fonts/webfonts.css` — shared free webfont registry;
- `PROJECT_STATE.md` — implementation checkpoint.

## Performance note

Telemetry styling uses only font/color/alpha/coordinate changes. The URL/share layer is event-driven. Neither adds a meaningful graphics cost. BL is still the comparatively expensive global FX because blur samples neighboring pixels, but it remains deliberately weak.
