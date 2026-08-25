# PROJECT_STATE — DODREI

Last updated: 2026-08-26 02:12 KST  
Current artwork/runtime version: `1.0.4`  
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
```

These defaults are exactly equivalent to:

```text
?fps=24&speed=S1&post=1&fx=HC,LS,BL,DK&mode=photo-double-blend&crop=10-50
```

If URL parameters are absent, the canonical config values above are used. Valid URL parameters override only the fields they provide; invalid values are ignored.

## v1.0.4 — touch playback timing

Implementation: `js/visual-engine-v1004.js`, subclassing `DodreiVisualEngineV1003`.

While pointer/touch is held:

```text
virtual visual timeline multiplier = 0.50
```

This means image cuts and crop/layout evolution both run at half their normal visual speed during the hold. The slowdown is applied to the shared virtual visual clock rather than only to the cut interval.

Not slowed by this change:

```text
outer render FPS
touch rupture rendering
swipe feedback rendering
POST touch-bypass logic
audio FX / audio clock
```

The older cut-only `touchTransitionSlowdown` remains in config for compatibility but is now set to `0.0`, preventing an additional slowdown from stacking on top of the new exact 50% visual playback multiplier.

## v1.0.3 — independent scene selection

Visible scene image selection remains **independent per-slot random selection with replacement**.

```text
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
long non-repeat run     ALLOWED
```

The intent is not even distribution. Repeats remain legitimate random outcomes; only artificial correlation between simultaneous image layers was removed.

Each logical slot keeps its selected image through one image cut while crop/layout continues to refresh on the faster visual-state clock.

Examples of independent slots:

```text
PHOTO_RAPID_CROP     primary / secondary
PHOTO_DOUBLE_BLEND   primary / secondary
PHOTO_BLEND_CYCLE    slot 0 / 1 / 2
PHOTO_FEEDBACK_CROP  primary / secondary
PHOTO_SHARD_SWAP     base / individual band slots
PHOTO_FULL           primary
```

The media manager remains separate: the archive-level shuffle-bag only determines which files are resident in the bounded working pool. It does not control visible scene order.

## Crop range semantics

`sourceCropMinZoom` and `sourceCropMaxZoom` define an actual random zoom range. Current default:

```text
1.0x .. 5.0x
```

At each visual-state refresh the engine samples a zoom inside the legal range. Mode-specific crop intensity biases the distribution within that range rather than multiplying past max and collapsing many samples onto the maximum clamp.

## URL preset contract

Implementation: `js/url-preset.js`.

```text
fps=15|24|30|60
speed=S1|S2|S3|S4|S5
post=0|1
fx=<ordered comma-separated FX tokens>
mode=<preset id | internal preset name | displayed telemetry alias>
crop=<min-max>
```

Crop examples:

```text
crop=10-50  -> 1.0x .. 5.0x
crop=12-35  -> 1.2x .. 3.5x
crop=15-25  -> 1.5x .. 2.5x
```

`crop=12_35` is accepted as an input alias; share links emit the hyphen form. A legacy single value such as `crop=30` keeps the current minimum and sets max to `3.0x`.

`SHR` serializes current mode, FPS, speed, POST master, ordered FX chain, and crop min/max range.

## Existing POST / touch semantics

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

- POST OFF bypasses the entire ordered POST chain;
- individual FX controls lock while manually bypassed;
- FX state/order are preserved;
- touch rupture temporarily bypasses POST without changing manual state;
- POST resumes after rupture only when manual master remains ON.

Swipe feedback remains:

```text
threshold 0.25
strength  2.00
```

## Typography / telemetry

Runtime text uses IBM Plex Mono. Canvas telemetry is rendered through `js/telemetry-v102.js`.

```text
text RGB         214 / 214 / 210
primary alpha    0.52
secondary alpha  0.28
faint alpha      0.14
```

Existing transient character corruption, small line jitter, and slow drift remain.

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND   <- current default start mode
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

Displayed aliases:

```text
PHOTO_FEEDBACK_CROP  -> NULL//VEIL_7F
PHOTO_RAPID_CROP     -> CUT.RASTER//19
PHOTO_SHARD_SWAP     -> SHARD.BLEED//A3
PHOTO_DOUBLE_BLEND   -> TWIN_EXPOSURE//NULL
PHOTO_BLEND_CYCLE    -> MIX.CYCLE//BROKEN
PHOTO_FULL           -> SOURCE//UNMARKED
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

The v1.0.4 timing change adds only a multiplier to the existing virtual clock and should have negligible performance cost.

## Important files

- `config.js` — v1.0.4 canonical defaults;
- `js/url-preset.js` — validated share-link overrides including crop ranges;
- `js/visual-engine-v1000.js` — POST master/blur/touch rupture behavior;
- `js/visual-engine-v1003.js` — independent with-replacement scene selection + bounded crop randomization;
- `js/visual-engine-v1004.js` — 50% visual playback while touch is held;
- `js/media-manager.js` — rolling resident image pool / archive shuffle-bag;
- `js/telemetry-v107.js` — pseudo-random text corruption;
- `js/telemetry-v102.js` — IBM Plex Mono/off-gray canvas renderer;
- `js/mode-control-ui.js` — test controls + share button;
- `index.html` — current test/control page.

## Future deployment direction

Current `index.html` remains the test/control page. A later public page should hide/remove controls while keeping the same runtime and `js/url-preset.js` contract.

## Checkpoint — v1.0.4

1. Default visual speed changed from `S2 / 0.50x` to `S1 / 0.25x`.
2. Default start mode changed to `PHOTO_DOUBLE_BLEND`.
3. Default crop range changed to `1.0x .. 5.0x` (`crop=10-50`).
4. Default POST state remains `HC -> LS -> BL -> DK`, master ON.
5. Added exact `0.50x` virtual visual playback while touch/pointer is held.
6. Removed stacked cut-only slowdown by setting `touchTransitionSlowdown` to `0.0`.
7. v1.0.3 independent with-replacement scene-selection behavior remains unchanged.
