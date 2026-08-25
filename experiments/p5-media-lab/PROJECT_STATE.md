# PROJECT_STATE — DODREI

Last updated: 2026-08-26 01:57 KST  
Current artwork/runtime version: `1.0.3`  
Current visual engine version: `1.0.3`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

```text
BASE_FPS        24
VIS_SPEED       S2 / 0.50x
CROP_MIN        1.0x
CROP_MAX        3.0x
POST            ON
POST_CHAIN      HC -> LS -> BL -> DK
```

`BW / GS / CR / VG` start OFF. BL remains `1.20px`.

## v1.0.3 — independent scene selection

The visible repetition problem was traced to image layers deriving their choices from related arithmetic seed sequences (`cutTick * constant + offset`). The scene renderer now uses independent per-slot random choices.

Implementation: `js/visual-engine-v1003.js`, subclassing `DodreiVisualEngineV1000`.

### Required semantics

Scene image selection is **with replacement**.

```text
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
long non-repeat run     ALLOWED
```

The goal is not to make the sequence look evenly distributed. The goal is to remove visible mechanical correlation between simultaneous image layers while preserving genuine random outcomes.

Each logical image slot has its own held selection, for example:

```text
PHOTO_RAPID_CROP     primary / secondary
PHOTO_DOUBLE_BLEND   primary / secondary
PHOTO_BLEND_CYCLE    slot 0 / 1 / 2
PHOTO_FEEDBACK_CROP  primary / secondary
PHOTO_SHARD_SWAP     base / individual band slots
PHOTO_FULL           primary
```

A slot draws a new random resident image when the image `cutTick` changes. During that cut the selected image is held, while crop/layout can still change on the faster visual-state clock. Therefore the existing rhythm — one source image shown through several crop/layout variations before the next image cut — is preserved.

### Resident working set remains separate

`js/media-manager.js` is unchanged.

The full archive still feeds a bounded decoded working set (normally 20 resident images). The media manager's archive-level shuffle-bag only decides which files become resident; it does **not** control scene order. The new scene-order logic randomly chooses from the current resident pool with replacement.

## Crop range semantics

`sourceCropMinZoom` and `sourceCropMaxZoom` now represent an actual random zoom range.

At each visual-state refresh, zoom is sampled inside that range. Mode-specific intensity values no longer multiply the sampled zoom beyond max and then clamp it. Instead they bias the distribution inside the legal range, preventing many states from piling up at exactly `maxZoom`.

Current default:

```text
1.0x .. 3.0x
```

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

Preferred crop notation:

```text
crop=10-30  -> 1.0x .. 3.0x
crop=12-35  -> 1.2x .. 3.5x
crop=15-25  -> 1.5x .. 2.5x
```

`crop=12_35` is accepted as an input alias. Share links always serialize the hyphen form. Existing single-value links remain compatible: `crop=30` keeps the current minimum and sets maximum to `3.0x`.

`SHR` serializes current mode, FPS, speed, POST master, ordered FX chain, and current crop min/max.

## Existing v1 POST / touch behavior

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

Runtime text uses IBM Plex Mono. Canvas telemetry is explicitly rendered with the webfont through `js/telemetry-v102.js`.

```text
text RGB         214 / 214 / 210
primary alpha    0.52
secondary alpha  0.28
faint alpha      0.14
```

The old green cast is removed. Existing transient character corruption, small line jitter, and slow drift remain.

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
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
startup visual speed     S2 / 0.50x
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
active image pool        20
rotation batch           5
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
```

The v1.0.3 scene-selection change is negligible in graphics cost: each slot stores one image reference and performs a random choice only when its cut changes. Crop changes are arithmetic only. BL remains the relatively expensive default POST stage.

## Important files

- `config.js` — v1.0.3 defaults and selection policy marker;
- `js/url-preset.js` — validated share-link overrides including crop ranges;
- `js/visual-engine-v1000.js` — v1 POST master/blur/touch behavior;
- `js/visual-engine-v1003.js` — independent with-replacement scene selection + bounded crop randomization;
- `js/media-manager.js` — rolling resident image pool / archive shuffle-bag;
- `js/telemetry-v107.js` — pseudo-random text corruption;
- `js/telemetry-v102.js` — IBM Plex Mono/off-gray canvas renderer;
- `js/mode-control-ui.js` — test controls + share button;
- `index.html` — current test/control page.

## Future deployment direction

Current `index.html` remains the test/control page. A later public page should hide/remove controls while keeping the same runtime and `js/url-preset.js` contract.

## Checkpoint — v1.0.3

1. Removed correlated arithmetic image-choice sequences from active scene layers.
2. Added independent per-slot random selection **with replacement**.
3. Deliberately did not add recent-image blocking, scene shuffle bags, or duplicate suppression.
4. Preserved the current image-cut vs faster crop/layout-state rhythm.
5. Changed crop zoom to stay distributed inside configured min/max instead of accumulating at the maximum clamp.
6. Expanded URL crop syntax to explicit ranges such as `crop=12-35`; legacy `crop=30` remains valid.
