# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.5`  
Current visual engine version: `1.0.4`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

```text
BASE_FPS        24
VIS_SPEED       S1 / 0.25x
START_MODE      PHOTO_DOUBLE_BLEND
CROP_MIN        1.0x
CROP_MAX        5.0x
POST            ON
POST_CHAIN      HC -> LS -> BL -> DK
TOUCH_PLAYBACK  0.50x while held
FULLSCREEN      OFF
```

Canonical visual defaults are equivalent to:

```text
?fps=24&speed=S1&post=1&fx=HC,LS,BL,DK&mode=photo-double-blend&crop=10-50
```

## v1.0.5 — start screen + utility controls + source-label obfuscation

### Start screen

Automatic fullscreen entry has been removed. `config.js` now sets:

```text
requestFullscreenOnStart = false
```

The start gesture no longer calls a fullscreen request.

The first screen remains black but is now visually centered and neutral rather than terminal/cyber styled:

```text
alignment      centered
ink            neutral gray
font           Cormorant Garamond
runtime font   IBM Plex Mono unchanged
```

`assets/fonts/webfonts.css` registers Cormorant Garamond from Google Fonts. It is used only by `#start-screen`; telemetry and runtime controls remain IBM Plex Mono.

### Display filename obfuscation

Implementation: `js/telemetry-filename-v105.js`.

Only the telemetry `SOURCE` display label is altered. Media paths, loading, archive selection, cache keys, and actual filenames are untouched.

Rules:

```text
letters in basename   -> random A-Z / a-z
numbers               -> preserved
symbols/punctuation   -> preserved
file extension        -> preserved exactly
alias lifetime        -> one alias per real filename per page session
```

The renderer keeps a small `Map<realName, alias>` on the telemetry instance. This is negligible next to decoded image memory and avoids recalculating/changing the alias every frame.

### PAU / MUT controls

Lower-right stack:

```text
[PAU]
[MUT]
[SHR]
```

Implementation: `js/runtime-utility-controls-v105.js`.

`PAU`:

- pauses/resumes the p5 visual loop via `noLoop()` / `loop()`;
- audio transport is intentionally not paused;
- UI remains interactive because the controls are DOM elements;
- on resume, the virtual visual clock's last-wall-time marker is reset so the paused wall-clock gap does not become a visual-time jump;
- viewport rebuild does not auto-resume while the explicit pause flag is active.

`MUT`:

Implementation helper: `js/audio-mute-v105.js`.

- mutes native dry `<audio>` output;
- forces parallel Web Audio direct/delay output gains to zero;
- mute patch loads **after** `audio-touch-v060.js` so touch-FX gain updates cannot override mute;
- unmute restores normal output on subsequent audio updates.

Pause/mute state is local runtime state and is deliberately not serialized by `SHR`.

## v1.0.4 — touch playback timing

Implementation: `js/visual-engine-v1004.js`, subclassing `DodreiVisualEngineV1003`.

While pointer/touch is held:

```text
virtual visual timeline multiplier = 0.50
```

Image cuts and crop/layout evolution both run at half their normal visual speed. Outer render FPS, touch rupture, swipe feedback, POST bypass, and audio are not slowed.

The older cut-only `touchTransitionSlowdown` remains `0.0` to avoid stacking slowdowns.

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

## Crop range semantics

`sourceCropMinZoom` and `sourceCropMaxZoom` define a true random zoom range.

Current default:

```text
1.0x .. 5.0x
```

Mode-specific crop intensity biases distribution inside the legal range rather than multiplying past max and collapsing samples onto the clamp boundary.

URL examples:

```text
crop=10-50  -> 1.0x .. 5.0x
crop=12-35  -> 1.2x .. 3.5x
crop=15-25  -> 1.5x .. 2.5x
```

`crop=12_35` remains accepted as an input alias. Share links emit the hyphen form.

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
startup visual speed     S1 / 0.25x
touch visual speed       0.50x of current visual speed
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
active image pool        20
rotation batch           5
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
```

v1.0.5 additions are lightweight: filename aliasing happens once per encountered source label, PAU stops the draw loop, and MUT only updates native mute state / existing gain nodes.

## Important files

- `config.js` — v1.0.5 canonical defaults;
- `style.css` — control positions + centered start-screen presentation;
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

## Future deployment direction

Current `index.html` remains the test/control page. A later public page may hide/remove test controls while keeping the same engine and URL preset contract.

## Checkpoint — v1.0.5

1. Removed automatic fullscreen entry.
2. Centered/restyled the start screen with neutral gray Cormorant Garamond typography.
3. Added session-stable display-only source filename obfuscation while preserving extensions, digits, and punctuation.
4. Added `PAU` visual pause/resume control above `MUT` and `SHR`.
5. Added `MUT` control that silences both dry and wet audio output.
6. Preserved all v1.0.4 visual defaults and touch-playback timing.
