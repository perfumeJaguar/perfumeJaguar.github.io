# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.1`  
Current visual engine version: `1.0.0`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

Startup timing / crop:

```text
BASE_FPS        24
VIS_SPEED       S2 / 0.50x
SOURCE_CROP_MAX 3.0x
```

Startup POST state/order:

```text
POST ON
HC ON -> LS ON -> BL ON -> DK ON
BW OFF
GS OFF
CR OFF
VG OFF
```

BL remains the subtle `1.20px` blur introduced at v1.0.0.

## Runtime controls

Upper-right test controls:

```text
[ ›   ] next mode
[24   ] BASE VISUAL FPS: 15 / 24 / 30 / 60
[S2   ] VISUAL SPEED: S1 / S2 / S3 / S4 / S5

[POST ] POST master bypass
[BW   ] binary black/white
[GS   ] grayscale
[LS   ] low saturation
[BL   ] subtle blur
[CR   ] Common Crush
[HC   ] high contrast
[DK   ] darken
[VG   ] strong vignette
```

Lower-right:

```text
[SHR] copy current runtime setting as a URL
```

A successful copy shows a brief `LINK COPIED` message.

## v1.0.1 — URL preset / share-link layer

Implementation: `js/url-preset.js`.

The script runs immediately after `config.js` and before engine construction. It validates URL query parameters and mutates only recognized runtime controls. Invalid or malformed values are ignored, leaving the canonical config defaults untouched.

Supported parameters:

```text
fps=15|24|30|60
speed=S1|S2|S3|S4|S5
post=0|1
fx=<ordered comma-separated FX tokens>
mode=<preset id>
```

FX tokens:

```text
BW  binary black/white
GS  grayscale
LS  low saturation
BL  blur
CR  Common Crush
HC  high contrast
DK  darken
VG  strong vignette
```

`fx=NONE` is valid. Unknown/duplicate FX tokens invalidate the `fx` parameter as a whole, so defaults remain intact rather than partially applying a malformed chain.

Example:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL,DK&mode=photo-feedback-crop
```

### Share serialization

`SHR` reads current runtime state and serializes:

- current mode;
- base FPS;
- visual speed level;
- POST master state;
- active POST FX;
- current POST FX activation order.

The current page URL is copied to the clipboard. FX order is preserved because POST processing is order-sensitive.

This URL layer deliberately does not depend on the control UI. A future public/deployment page can remove or hide the test controls and still accept exactly the same URL preset parameters.

## Typography / telemetry style

Runtime font: **IBM Plex Mono**.

Reusable webfont registry: `assets/fonts/webfonts.css`.

Registered families:

- IBM Plex Mono;
- Space Mono;
- Share Tech Mono;
- VT323.

Only IBM Plex Mono is used in DODREI at the moment.

Current telemetry treatment:

```text
text color        RGB 190 / 215 / 196
primary alpha     0.56
secondary alpha   0.30
faint alpha       0.16
line jitter       ~1.6 px, occasional
slow drift        ±1 px / ~7 s slot
```

Existing v0.10.7 character corruption remains active. v1.0.1 adds only font/color/alpha/coordinate styling; there is no text blur, stacked text-shadow, or chromatic-aberration pass. This is intentional to preserve a restrained institutional/backrooms character and near-zero added rendering cost.

Implementation: `js/telemetry-v101.js` patches the v0.10.7 telemetry renderer without changing underlying telemetry values.

## Existing v1 POST / touch semantics

The v1.0.0 visual engine remains `js/visual-engine-v1000.js`.

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

- POST OFF bypasses the whole ordered global chain;
- individual FX buttons lock while POST is OFF;
- effect booleans/order are not changed;
- POST ON restores the same chain;
- touch rupture temporarily bypasses POST without modifying master state;
- touch release restores POST only when the manual POST master is ON.

Swipe feedback remains:

```text
threshold  0.25
strength   2.00
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

`PHOTO_FULL` remains last as the clean/no-effect reference.

Removed/deferred:

```text
PHOTO_RGB_TEAR / CHR_MA::W0UND
LUMA_BLOCKS
LUMA_VOID
LUMA_MONO
LUMA_DITHER
LUMA_PULSE
```

Implementation code is retained for possible redesign/reuse.

## Performance baseline

```text
outer target fps         60
startup base fps         24
startup visual speed     S2 / 0.50x
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
active image pool        20
staging                   up to 5
halation / bloom          removed
RGB tear                  removed from active sequence
LUMA/mosaic               deferred
```

URL parsing/share-copy is event-driven and negligible. Telemetry v1.0.1 adds only tiny coordinate/color/font changes. BL remains the most expensive of the current startup POST chain but is deliberately weak.

## Font asset note

`assets/fonts/webfonts.css` and `assets/fonts/README.md` are committed as reusable repository assets. The current GitHub connector can write UTF-8 text files but cannot commit binary `.woff2` / `.ttf` payloads, so font binaries are not vendored in this checkpoint. Runtime therefore uses the hosted Google Fonts webfont source with normal monospace fallback.

## Important files

- `config.js` — canonical v1.0.1 defaults;
- `js/url-preset.js` — validated URL overrides + share serializer;
- `js/visual-engine-v1000.js` — v1 visual engine;
- `js/telemetry-v107.js` — text corruption;
- `js/telemetry-v101.js` — IBM Plex Mono/backrooms presentation patch;
- `js/mode-control-ui.js` — test controls + SHR clipboard action;
- `assets/fonts/webfonts.css` — shared font registry;
- `assets/fonts/README.md` — font asset notes;
- `index.html` — current test/control page.

## Future deployment direction

The current page remains the test/control build. A later public build should use the same runtime/URL preset contract but omit the visible control UI. Do not fork the preset semantics between test and public versions; keep `js/url-preset.js` shared.

## Checkpoint — 2026-08-26 01:xx KST

v1.0.1 changes:

1. startup chain changed to `HC -> LS -> BL -> DK`;
2. startup BASE FPS changed to `24`;
3. startup VIS SPEED changed to `S2 / 0.50x`;
4. source maximum crop increased `2.5x -> 3.0x`;
5. validated URL presets added for FPS/speed/POST/FX order/mode;
6. `SHR` button added at lower-right with `LINK COPIED` feedback;
7. IBM Plex Mono adopted for UI/telemetry;
8. telemetry shifted to muted gray-green, lower opacity, subtle drift/jitter;
9. reusable webfont registry added for IBM Plex Mono / Space Mono / Share Tech Mono / VT323.
