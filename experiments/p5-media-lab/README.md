# DODREI

DODREI is a mobile-first browser media-art experiment built with p5.js / JavaScript and hosted on GitHub Pages.

Current artwork/runtime: **v1.0.6**  
Current visual engine: **v1.0.4**  
Config schema: **1**

## Current defaults

```text
BASE FPS     24
VIS SPEED    S2 / 0.50x
CROP RANGE   1.0x .. 9.0x
START MODE   PHOTO_DOUBLE_BLEND
POST MASTER  ON
POST CHAIN   HC -> LS -> BL
TOUCH SPEED  0.50x visual playback while held
FULLSCREEN   OFF
```

These visual defaults match:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL&mode=photo-double-blend&crop=10-90
```

When those URL parameters are absent, the config above is used. URL parameters still override only the values they explicitly provide.

## v1.0.6 default / presentation update

- default speed is now `S2 / 0.50x`;
- default crop range is now `1.0x .. 9.0x`;
- default POST chain is `HC -> LS -> BL`, with `DK` starting OFF;
- `crop=10-90` is now a valid URL range and means `1.0x .. 9.0x`;
- the start-screen `DODREI` title is smaller and significantly dimmer so it acts as a quiet label rather than the visual focal point.

## v1.0.5 presentation / utility changes

The start screen is centered and uses a neutral gray palette. Its display typeface is **Cormorant Garamond**, while runtime telemetry and test controls remain IBM Plex Mono. Automatic fullscreen entry is removed.

Telemetry source filenames are display-obfuscated only:

- the real filename/path is untouched;
- digits and punctuation are preserved;
- letters in the basename are replaced by random alphabetic characters;
- the extension is preserved exactly;
- each real filename receives one alias per page session and reuses that alias afterward.

The alias cache contains only short strings, so its performance/memory cost is negligible relative to decoded image buffers.

Two lower-right utility controls sit above `SHR`:

```text
[PAU] pause/resume visual playback
[MUT] mute/unmute audio output
[SHR] copy current settings as a share URL
```

`PAU` freezes the p5 visual loop but does not pause the audio transport. `MUT` silences both the native dry audio and the parallel wet-FX output.

## Touch playback behavior

While pointer/touch is held, the virtual visual timeline advances at half speed. Image cuts and crop/layout evolution slow together. Touch rupture, swipe feedback, POST bypass behavior, audio FX, and the outer render FPS are not slowed by this setting.

## Scene image selection

Scene selection remains **independent per-slot random selection with replacement**:

- immediate repeats are allowed;
- long non-repeating runs are allowed;
- no recent-image ban;
- no scene shuffle-bag;
- no duplicate suppression.

A selected image is held for its image cut while crop/layout can refresh faster inside that cut.

## Crop behavior

Crop zoom is sampled inside the configured range. Current default is `1.0x .. 9.0x`.

Preferred URL notation:

```text
crop=10-90   -> 1.0x .. 9.0x
crop=12-35   -> 1.2x .. 3.5x
```

Direct values from `1.0` through `9.0` are also valid. `crop=12_35` is accepted as input; share links emit the hyphen form. A legacy single value such as `crop=30` keeps the current minimum and sets max to `3.0x`.

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

[PAU  ] pause/resume visuals
[MUT  ] mute/unmute audio
[SHR  ] copy current settings as a share URL
```

## URL presets / share links

```text
fps=15|24|30|60
speed=S1|S2|S3|S4|S5
post=0|1
fx=<ordered comma-separated FX tokens>
mode=<preset-id | internal preset name | displayed MODE alias>
crop=<min-max range, up to 9.0x>
```

FX order is significant. `SHR` serializes current mode, FPS, speed, POST master state, active FX order, and crop min/max range. Pause/mute state is intentionally not serialized.

## Typography / telemetry

Start screen: **Cormorant Garamond**, neutral gray, with the `DODREI` label deliberately small/dim.  
Runtime controls + p5 telemetry: **IBM Plex Mono**, neutral off-gray telemetry.

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

Default start mode is `PHOTO_DOUBLE_BLEND`.

## Important files

- `config.js` — canonical defaults;
- `js/url-preset.js` — URL override validation including 9x crop ranges;
- `style.css` — runtime controls + start-screen presentation;
- `assets/fonts/webfonts.css` — webfont registry including Cormorant Garamond;
- `js/telemetry-filename-v105.js` — session-stable display filename aliases;
- `js/audio-mute-v105.js` — dry + wet audio mute layer;
- `js/runtime-utility-controls-v105.js` — PAU / MUT controls;
- `js/visual-engine-v1003.js` — independent scene image slots + bounded crop randomization;
- `js/visual-engine-v1004.js` — 50% visual playback while touch is held;
- `js/mode-control-ui.js` — test controls + share button;
- `PROJECT_STATE.md` — implementation checkpoint.
