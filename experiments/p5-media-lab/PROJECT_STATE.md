# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.6`  
Current visual engine version: `1.0.4`  
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

## v1.0.6 — default preset + 9x crop + quieter title

### Default runtime preset

`config.js` now starts with:

```text
composition FPS    24
visual speed       S2 / 0.50x
start mode         PHOTO_DOUBLE_BLEND
crop range         1.0x .. 9.0x
POST master        ON
POST chain         HC -> LS -> BL
DK                  OFF
```

This matches the canonical URL shown above.

### Crop URL range

Implementation: `js/url-preset.js`.

`crop` now accepts zoom values through `9.0x`.

```text
crop=10-90  -> 1.0x .. 9.0x
crop=12-35  -> 1.2x .. 3.5x
crop=90     -> keep current min, set max 9.0x
crop=9      -> keep current min, set max 9.0x
```

Compact notation accepts `10..90`; direct notation accepts `1.0..9.0`. Share links serialize the explicit hyphen range.

The visual engine itself does not add an additional 5x clamp, so `sourceCropMaxZoom: 9.0` is honored by the active crop sampler.

### Start title presentation

The centered Cormorant Garamond start screen remains, but `DODREI` is deliberately quieter:

```text
font size   clamp(18px, 4.8vw, 32px)
ink alpha   0.30
spacing     0.08em
```

The action text remains more visible, so the title acts as a subdued label rather than the focal point.

## v1.0.5 — start screen + utility controls + source-label obfuscation

Automatic fullscreen entry remains removed.

Start screen:

```text
alignment      centered
ink            neutral gray
font           Cormorant Garamond
runtime font   IBM Plex Mono unchanged
```

### Display filename obfuscation

Implementation: `js/telemetry-filename-v105.js`.

Only the telemetry `SOURCE` display label is altered. Media paths, loading, archive selection, cache keys, and actual filenames are untouched.

```text
letters in basename   -> random A-Z / a-z
numbers               -> preserved
symbols/punctuation   -> preserved
file extension        -> preserved exactly
alias lifetime        -> one alias per real filename per page session
```

The renderer keeps a small `Map<realName, alias>` on the telemetry instance. Performance/memory cost is negligible next to decoded image buffers.

### PAU / MUT controls

Lower-right stack:

```text
[PAU]
[MUT]
[SHR]
```

`PAU` pauses/resumes the p5 visual loop while leaving audio transport running. `MUT` silences both native dry audio and the parallel wet-FX output. Pause/mute state is local runtime state and is not serialized by `SHR`.

## v1.0.4 — touch playback timing

Implementation: `js/visual-engine-v1004.js`, subclassing `DodreiVisualEngineV1003`.

While pointer/touch is held:

```text
virtual visual timeline multiplier = 0.50
```

Image cuts and crop/layout evolution both run at half their normal visual speed. Outer render FPS, touch rupture, swipe feedback, POST bypass, and audio are not slowed.

## Scene image selection

Visible scene selection remains **independent per-slot random selection with replacement**.

```text
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
long non-repeat run     ALLOWED
```

Each logical slot independently chooses from the current resident pool when its cut advances, then holds that selected image while crop/layout can continue refreshing faster.

The media manager remains separate: its archive-level shuffle-bag only decides which files are resident in the bounded pool (normally 20); it does not control visible scene order.

## Existing POST / touch semantics

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

- POST OFF bypasses the entire ordered POST chain;
- FX state/order are preserved;
- touch rupture transiently bypasses POST without changing manual master state;
- POST resumes after rupture only when manual master remains ON.

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
outer target fps         60
startup base fps         24
startup visual speed     S2 / 0.50x
touch visual speed       0.50x of current visual speed
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
active image pool        20
rotation batch           5
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
```

The 9x crop change changes draw scale, not resident image count or decode resolution. Extremely deep crops can look more abstract, but the crop selection itself remains arithmetic and lightweight.

## Important files

- `config.js` — v1.0.6 canonical defaults;
- `js/url-preset.js` — validated share-link overrides, now through 9x crop;
- `style.css` — control positions + subdued centered start-screen presentation;
- `assets/fonts/webfonts.css` — IBM Plex Mono + Cormorant Garamond registry;
- `js/telemetry-v102.js` — active IBM Plex Mono/off-gray telemetry renderer;
- `js/telemetry-filename-v105.js` — session-stable display filename aliases;
- `js/audio-touch-v060.js` — touch audio behavior;
- `js/audio-mute-v105.js` — runtime dry/wet mute patch;
- `js/runtime-utility-controls-v105.js` — PAU / MUT controls;
- `js/visual-engine-v1003.js` — independent with-replacement scene selection + crop randomization;
- `js/visual-engine-v1004.js` — 50% visual playback while touch is held;
- `js/media-manager.js` — rolling resident image pool / archive shuffle-bag;
- `js/mode-control-ui.js` — test controls + SHR;
- `sketch-v066.js` — app orchestration / pause hook / no fullscreen request;
- `index.html` — current test/control page.

## Checkpoint — v1.0.6

1. Default speed changed to `S2 / 0.50x`.
2. Default crop range expanded to `1.0x .. 9.0x`.
3. URL crop parser/share serializer expanded from 5x to 9x.
4. Default POST chain changed to `HC -> LS -> BL`; `DK` starts OFF.
5. Default mode remains `PHOTO_DOUBLE_BLEND` and base FPS remains 24.
6. Start-screen `DODREI` label made smaller and substantially dimmer.
7. All v1.0.5 filename, PAU/MUT, no-fullscreen, and v1.0.4 touch-playback behavior remains unchanged.
