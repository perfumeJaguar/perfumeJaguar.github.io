# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.2`  
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

## v1.0.2 — URL mode/crop expansion + telemetry font fix

### URL preset contract

Implementation: `js/url-preset.js`.

Supported parameters:

```text
fps=15|24|30|60
speed=S1|S2|S3|S4|S5
post=0|1
fx=<ordered comma-separated FX tokens>
mode=<preset id | internal preset name | displayed telemetry MODE alias>
crop=<max crop zoom>
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

`fx=NONE` is valid. Unknown/duplicate FX tokens invalidate the `fx` parameter as a whole.

### Mode parameter

The URL parser accepts all of these for the same mode:

```text
photo-feedback-crop   stable preset id
PHOTO_FEEDBACK_CROP   internal preset name
NULL//VEIL_7F         displayed telemetry alias
```

Displayed aliases mirror `telemetry.aliasMode()`.

`SHR` deliberately serializes the stable preset id rather than the display alias, because the id is intended to remain stable even if the pseudo-system display language changes later.

### Crop parameter

`crop` writes `visual.sourceCropMaxZoom` before engine construction.

Two notations are accepted:

```text
crop=25   -> 2.5x
crop=30   -> 3.0x
```

Direct values are also accepted from `1.0` through `5.0`:

```text
crop=2.5
crop=3
```

`SHR` includes the current maximum crop in compact form, e.g. `crop=30` for `3.0x`.

### Share serialization

`SHR` serializes:

- current mode;
- base FPS;
- visual speed level;
- POST master state;
- active POST FX;
- current POST FX activation order;
- current maximum crop value.

The URL layer remains independent from the test control UI so a later public build can omit controls and still consume the same URL contract.

## Typography / telemetry style

Runtime font: **IBM Plex Mono**.

The v1.0.1 style wrapper did not reliably make the p5 canvas telemetry leave its initial generic monospace fallback on every browser. v1.0.2 replaces that presentation wrapper with an explicit renderer: `js/telemetry-v102.js`.

It requests IBM Plex Mono through the browser FontFaceSet and explicitly applies the family to the p5/canvas text renderer once available.

Current telemetry treatment:

```text
text color        RGB 214 / 214 / 210
primary alpha     0.52
secondary alpha   0.28
faint alpha       0.14
line jitter       ~1.6 px, occasional
slow drift        ±1 px / ~7 s slot
```

The previous green cast has been removed; the ink is now neutral off-gray.

Existing v0.10.7 character corruption remains active. There is still no text blur, stacked text-shadow, or chromatic-aberration pass.

Reusable webfont registry: `assets/fonts/webfonts.css`.

Registered families:

- IBM Plex Mono;
- Space Mono;
- Share Tech Mono;
- VT323.

Only IBM Plex Mono is used by DODREI at present.

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

Displayed telemetry aliases for the active set:

```text
PHOTO_FEEDBACK_CROP  -> NULL//VEIL_7F
PHOTO_RAPID_CROP     -> CUT.RASTER//19
PHOTO_SHARD_SWAP     -> SHARD.BLEED//A3
PHOTO_DOUBLE_BLEND   -> TWIN_EXPOSURE//NULL
PHOTO_BLEND_CYCLE    -> MIX.CYCLE//BROKEN
PHOTO_FULL           -> SOURCE//UNMARKED
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

URL parsing/share-copy is event-driven and negligible. Telemetry v1.0.2 still uses only font/color/alpha/coordinate changes. BL remains the most expensive current startup POST effect but is deliberately weak.

## Font asset note

`assets/fonts/webfonts.css` and `assets/fonts/README.md` are committed as reusable repository assets. The current GitHub connector can write UTF-8 text files but cannot commit binary `.woff2` / `.ttf` payloads, so font binaries are not vendored in this checkpoint. Runtime uses hosted Google Fonts with normal monospace fallback.

## Important files

- `config.js` — canonical v1.0.2 defaults;
- `js/url-preset.js` — validated URL overrides + share serializer;
- `js/visual-engine-v1000.js` — v1 visual engine;
- `js/telemetry-v107.js` — text corruption;
- `js/telemetry-v102.js` — explicit IBM Plex Mono/off-gray canvas renderer;
- `js/mode-control-ui.js` — test controls + SHR clipboard action;
- `assets/fonts/webfonts.css` — shared font registry;
- `assets/fonts/README.md` — font asset notes;
- `index.html` — current test/control page.

## Future deployment direction

The current page remains the test/control build. A later public build should use the same runtime/URL preset contract but omit the visible control UI. Do not fork the preset semantics between test and public versions; keep `js/url-preset.js` shared.

## Checkpoint — 2026-08-26 01:xx KST

v1.0.2 changes:

1. p5 canvas telemetry now explicitly uses IBM Plex Mono rather than relying on a generic monospace fallback;
2. telemetry green cast removed; neutral off-gray color/alpha hierarchy adopted;
3. `mode=` now accepts stable preset id, internal preset name, or the exact displayed telemetry alias;
4. `crop=` added for maximum source crop, including `25 -> 2.5x` and `30 -> 3.0x` shorthand;
5. SHR links now include the current crop value;
6. v1.0.1 telemetry presentation wrapper is no longer loaded; `telemetry-v102.js` is the active presentation layer.
