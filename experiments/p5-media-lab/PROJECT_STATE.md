# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.7`  
Current visual engine version: `1.0.7`  
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
TOUCH_PLAYBACK  0.50x while held
FULLSCREEN      OFF
```

Canonical visual defaults are equivalent to:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL&mode=photo-double-blend&crop=10-90
```

If URL parameters are absent, the canonical config values above are used. Valid URL parameters override only the fields they provide; invalid values are ignored.

## v1.0.7 — mobile main-render oversampling

Implementation: `js/visual-engine-v1007.js`, subclassing `DodreiVisualEngineV1004`.

The mobile browser viewport is expressed in CSS pixels. On a typical phone a telemetry viewport such as `360 x 642` can represent a physically much denser panel. Prior builds created the ordinary composition buffer from those CSS dimensions, so the image could look soft when stretched across the physical display.

v1.0.7 keeps the visible canvas/UI dimensions unchanged but renders the ordinary mobile composition at `2.0x` internally:

```text
mobileMainOversample = 2.0
example viewport      360 x 642
main composition      720 x 1284
```

The oversampling applies only to:

```text
main composition buffer
common crush buffer
POST common buffer
POST common scratch
```

The expensive performance-sensitive buffers deliberately keep their inherited mobile sizes:

```text
feedback / swipe feedback   unchanged
touch rupture               unchanged (0.50 scale, every second frame)
analyzer                     unchanged (128px width)
```

This is intended to improve ordinary image sharpness without multiplying the heaviest touch/feedback costs by four. Desktop behavior is unchanged.

The mobile main long-edge cap scales with the oversample factor (`720 * 2 = 1440`), so very large CSS viewports remain bounded.

## v1.0.6 — default preset + 9x crop + quieter title

Current default runtime preset:

```text
composition FPS    24
visual speed       S2 / 0.50x
start mode         PHOTO_DOUBLE_BLEND
crop range         1.0x .. 9.0x
POST master        ON
POST chain         HC -> LS -> BL
DK                  OFF
```

`crop` accepts zoom values through `9.0x`, for example:

```text
crop=10-90  -> 1.0x .. 9.0x
crop=12-35  -> 1.2x .. 3.5x
```

The centered Cormorant Garamond start-screen `DODREI` label remains subdued (`18–32px`, alpha `0.30`).

## v1.0.5 — start screen + utility controls + source-label obfuscation

Automatic fullscreen entry remains removed. Start screen is centered, neutral gray, Cormorant Garamond; runtime telemetry/controls remain IBM Plex Mono.

Telemetry source filename display rules:

```text
letters in basename   -> random A-Z / a-z
numbers               -> preserved
symbols/punctuation   -> preserved
file extension        -> preserved exactly
alias lifetime        -> one alias per real filename per page session
```

Lower-right controls:

```text
[PAU] visual pause/resume
[MUT] dry + wet audio mute/unmute
[SHR] copy share URL
```

Pause/mute state is local runtime state and is not serialized by `SHR`.

## Touch playback

While pointer/touch is held:

```text
virtual visual timeline multiplier = 0.50
```

Image cuts and crop/layout evolution slow together. Outer render FPS, touch rupture, swipe feedback, POST bypass, and audio are not slowed.

## Scene image selection

Visible scene selection remains independent per-slot random selection with replacement.

```text
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
long non-repeat run     ALLOWED
```

The media-manager archive shuffle-bag only determines which images are resident in the bounded pool; it does not control visible scene order.

## Existing POST / touch semantics

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

Swipe feedback remains:

```text
threshold 0.25
strength  2.00
```

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND   <- default start mode
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

RGB tear and all LUMA/mosaic modes remain removed/deferred from the active sequence.

## Performance baseline

```text
outer target fps             60
startup base fps             24
startup visual speed         S2 / 0.50x
touch visual speed           0.50x of current visual speed
mobile CSS viewport          device/browser dependent
mobile main oversample       2.0x
mobile main max long edge    1440 effective cap
desktop main max long edge   1280
active image pool            20
rotation batch               5
mobile rupture scale         0.50
mobile rupture skip          every second rendered frame
mobile analyzer width        128
```

## Important files

- `config.js` — v1.0.7 canonical defaults + mobileMainOversample;
- `js/url-preset.js` — validated share-link overrides through 9x crop;
- `js/visual-engine-v1007.js` — 2x mobile ordinary composition/POST rendering;
- `js/visual-engine-v1004.js` — 50% visual playback while touch is held;
- `js/visual-engine-v1003.js` — independent with-replacement scene selection + crop randomization;
- `js/visual-engine-v1000.js` — POST master/blur/touch rupture behavior;
- `js/telemetry-v102.js` — active IBM Plex Mono/off-gray telemetry renderer;
- `js/telemetry-filename-v105.js` — session-stable display filename aliases;
- `js/audio-mute-v105.js` — runtime dry/wet mute patch;
- `js/runtime-utility-controls-v105.js` — PAU / MUT controls;
- `js/media-manager.js` — rolling resident image pool / archive shuffle-bag;
- `index.html` — current test/control page.

## Checkpoint — v1.0.7

1. Added `mobileMainOversample: 2.0`.
2. Added `visual-engine-v1007.js` and made it the active engine.
3. Mobile ordinary composition, crush, and POST buffers now render at approximately 2x CSS resolution.
4. Feedback, swipe, rupture, and analyzer mobile resolutions remain unchanged to contain cost.
5. Desktop rendering remains unchanged.
6. All v1.0.6 defaults and v1.0.5 utility/presentation behavior remain unchanged.
