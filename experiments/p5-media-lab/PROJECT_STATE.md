# PROJECT_STATE — DODREI

Last updated: 2026-08-27  
Current artwork/runtime version: `1.0.28`  
Current visual engine version: `1.0.28`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

```text
BASE_FPS        30
VIS_SPEED       S2 / 0.50x
START_MODE      PHOTO_DOUBLE_BLEND / TWIN_EXPOSURE//NULL
MODE_ORDER      DOUBLE_BLEND first
CROP_MIN        1.0x
CROP_MAX        8.0x
POST            ON
POST_CHAIN      HC -> GS -> FB -> ST -> GL
POST_FB         ON
POST_ST         ON
POST_GL         ON
TOUCH_PLAYBACK  0.50x before recall activation
SWIPE_THRESHOLD 0.15
RUPTURE_RES     mobile 0.62 / desktop 0.80
SWIPE_FB_RES    mobile 0.60 / desktop 0.78
FULLSCREEN      manual FS button inside runtime UI
UI_DEFAULT      HIDDEN
AUDIO           20220302 - sarabande.mp3
IMAGE_ARCHIVE   96 files
RESIDENT_POOL   20 decoded images
MEMORY_HOLD     1000 ms
MEMORY_TEXT     64 deterministic mixed fragments
```

Canonical visual defaults:

```text
?fps=30&speed=S2&post=1&fx=HC,GS,FB,ST,GL&mode=photo-double-blend&crop=10-80
```

## v1.0.28 — thumbnail rollback / full-frame dim / text fade / mixed fragments

v1.0.28 keeps the v1.0.26 memory-source lock and v1.0.27 touch burst/lull + memory POST architecture, but simplifies recall presentation again.

### Active memory pipeline

```text
pointer down
  -> capture MediaManager current archive entry
  -> retain resident p5.Image

hold reaches 1000 ms
  -> memory ACTIVE
  -> fixed centered 1x cover memory source
  -> normal preset image selection stops
  -> random crop/layout stops
  -> PRE common FX stops
  -> preset feedback stops
  -> composition virtual clock stops
  -> old temporal buffers clear

while held
  -> touch rupture acts on fixed memory still
  -> swipe feedback can act downstream
  -> full-frame translucent black readability field is composited
  -> MEMORY NNN + fragment are composited with fade-in
  -> current POST COMMON FX is applied to the whole memory result
  -> default POST chain: HC -> GS -> FB -> ST -> GL

release
  -> recall inactive
  -> temporal buffers clear
  -> scene image slots reset
  -> normal composition refreshes cleanly
```

### Thumbnail rollback

The v1.0.27 original-aspect-ratio thumbnail was removed from the active renderer and from `index.html` markup. There is no visible thumbnail in recall.

Reason: the thumbnail made the memory interaction too explanatory and constrained future recall layouts. The recall presentation now reserves the whole frame for future text/media without assuming a central image card.

### Readability field

The local black panel from v1.0.27 was replaced by a full-frame translucent black field.

```text
local text panel         REMOVED
full-frame dim           black alpha ~106/255 before POST
shade fade               ~260 ms smoothstep
text/id fade             ~520 ms smoothstep, slightly delayed
text shadow              retained
```

This is not the old v1.0.25 opaque black plate: the fixed recalled image remains visible and touch effects continue underneath. The dim exists inside the p5 memory composite and therefore also participates in POST.

### Text remains inside POST

`MEMORY NNN` and the body fragment are drawn before POST. They therefore continue to receive the currently enabled POST chain, including feedback and glitch. Temporary loss of legibility during GL/FB events is currently accepted as part of the visual language.

### Fragment pool

The old 24-fragment pool was strongly biased toward polished, vaguely melancholic memory sentences. v1.0.28 replaces it with a 64-entry deterministic pool designed to feel less narratively uniform.

Content types now include:

- ordinary memory observations;
- shopping/practical notes;
- room/studio notes;
- times and percentages;
- number strings;
- incomplete sentences and interrupted records;
- neutral `IP:port` scraps using documentation-only or private address ranges;
- personal shorthand that may be meaningful only to its original writer.

The intent is **not** overt mystery, horror, ARG signaling or an implied cipher. It should resemble unrelated scraps whose original context is absent.

Archive mapping remains deterministic by archive key/index through the existing stable hash. With 96 images and 64 fragments, fragment reuse is still possible.

### Recall target limitation

Recall still captures the MediaManager current archive entry at hold-start. In `PHOTO_DOUBLE_BLEND` and other multi-image modes, this is not guaranteed to be the exact visually dominant or under-finger composited layer. Exact layer/hit resolution remains unresolved.

## v1.0.27 — retained touch burst/lull + memory POST

Retained behavior:

- memory overlay is p5 canvas content rather than a visible DOM layer;
- recall explicitly applies POST after memory overlay composition even though ordinary touch rupture normally bypasses POST;
- touch rupture pattern refresh alternates stochastic short bursts and longer lulls;
- burst windows force fresh rupture patterns on allowed heavy passes;
- lulls hold the previous fracture instead of reseeding continuously;
- movement energy shortens lulls modestly but does not eliminate them;
- touch raster scales were raised conservatively.

Approximate rupture timing:

```text
BURST   ~105-315 ms
LULL    ~220-780 ms before gesture-energy shortening
```

Current quality/performance compromise:

```text
feedback/swipe mobile     0.60
feedback/swipe desktop    0.78
rupture mobile            0.62
rupture desktop           0.80
rupture frame skip mobile 2
rupture frame skip desk   1
```

If mobile touch performance regresses, reduce these resolution scales before discarding burst timing.

## v1.0.26 — retained memory PRE-FX lock

v1.0.26 established the correct conceptual architecture: memory recall changes the actual visual source instead of covering a still-running random composition.

The captured resident `p5.Image` remains stable through resident-pool rotation for the duration of the hold. On release, ordinary scene slots and timing references are reset to avoid a large time jump.

## Earlier recall history

- `v1.0.24`: first 2-second text-only deterministic memory prototype; also mobile visibility and version-sync work.
- `v1.0.25`: hold reduced to 1 second; raw thumbnail added on an opaque full-screen DOM plate. Superseded.
- `v1.0.26`: real composition lock; transparent DOM thumbnail/text remained.
- `v1.0.27`: thumbnail/text moved into p5 before POST; local dark panel; burst/lull rupture timing.
- `v1.0.28`: thumbnail removed; full-frame dim + fading text retained before POST; fragment pool expanded and diversified.

## Touch rupture

- Grayscale palette: black / dark gray / mid gray / near-white.
- Irregular horizontal slice heights.
- Mostly narrow slices, occasional broad fractures.
- Only a subset of slices move.
- Shift is usually small with occasional extreme displacement.
- Release tail is short and velocity-aware.
- Burst/lull timing avoids uniform metronomic glitching.
- Mobile heavy pass still uses every-second-render-frame safeguard.
- Swipe feedback threshold remains `0.15`.
- During recall, touch effects operate on the fixed memory image.

## Global POST FX

Current ordered keys:

```text
BW GS LS BL FB GL ST CR HC DK VG
```

Startup chain:

```text
HC -> GS -> FB -> ST -> GL
```

Roles:

- `FB` — strong low-resolution temporal memory;
- `GL` — sparse temporal slice glitch, more active with touch;
- `ST` — film/projection luminance instability only;
- `HC/GS/LS` — compatible Canvas filters batched where possible;
- `BL` — reduced mobile scratch when enabled.

Outside recall, ordinary touch rupture still bypasses POST. Recall is an intentional exception: full-frame dim and typography are composed first and then the current POST chain is applied.

## Startup sequence

```text
0.0s   soundtrack begins immediately
2.0s   title/start screen disappears
2.0-3.0s black screen + music only
3.0s   telemetry stage 1
3.2s   telemetry stage 2
3.4s   telemetry stage 3
6.4s   main visual at 20% brightness
7.4s   main visual at 100% brightness
```

## Scene / resident-pool policy

Outside recall, visible scene draws use independent random selection with replacement:

```text
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
same image in slots     ALLOWED
```

Resident working-set rotation remains separate:

```text
archive metadata        96 images
active decoded pool     20
rotation batch          5
rotation interval       5 s
candidate policy        shuffle-bag
runtime decode          sequential
```

## Conceptual direction

Current direction remains **recollection / fading memory**: fragments whose original significance is uncertain but whose emotional or material residue persists.

Possible future layers remain open:

- interactive web book / hypertext;
- puzzle/game exploration;
- visual-novel-like scenes;
- hidden hotspots / hold / swipe / wait interactions;
- non-linear memory nodes and persistent discovery state;
- DODREI visual engine as the physics/surface of a memory world rather than a decorative background.

Avoid making every scene a conventional discoverable-button puzzle. Long stretches may contain nothing explicit.

Future explicit memory records should likely separate content from rendering:

```text
memory id
image/archive key
text / media payload
unlock / discovery condition
links to other memories
persistent discovered state
optional scene/FX parameters
```

## Important files

- `config.js` — canonical defaults / runtime version `1.0.28` / configRevision `41`;
- `index.html` — active script chain, start note and cache key `20260827-93`;
- `js/visual-engine-v1028.js` — active text-only recall overlay / full-frame dim / text fade;
- `js/visual-engine-v1027.js` — memory composite/POST base + burst/lull touch timing;
- `js/visual-engine-v1026.js` — memory PRE-FX composition lock;
- `js/visual-engine-v1022.js` — ST + resize disposal;
- `js/visual-engine-v1021.js` — GL;
- `js/visual-engine-v1020.js` — irregular touch rupture/release;
- `js/visual-engine-v1015.js` — performance diet;
- `js/visual-engine-v1012.js` — ordered global FB;
- `js/visual-engine-v1000.js` — swipe feedback / ordinary touch POST bypass;
- `js/interaction-v1020.js` — velocity-aware release;
- `js/memory-recall-v1028.js` — 1-second archive capture / activation timestamp / 64 fragments;
- `js/mobile-visibility-v1024.js` — mobile hidden/visible pause-resume;
- `sketch-v066.js` — startup and orchestration;
- `README.md` — public current-state summary.

## Checkpoint — v1.0.28

1. Canonical preset remains `30 FPS / S2 / HC -> GS -> FB -> ST -> GL / PHOTO_DOUBLE_BLEND / crop 1.0x..8.0x`.
2. Runtime and visual engine are synchronized at `1.0.28`; config revision is `41`.
3. Memory hold threshold remains `1000 ms`.
4. Recall locks the PRE source to one captured image and stops ordinary random scene/crop/PRE/preset-feedback progression.
5. Touch rupture and swipe continue on that fixed image.
6. Thumbnail presentation is completely removed from the active canvas and HTML markup.
7. Readability uses a full-frame translucent black field, not a local panel and not an opaque black plate.
8. MEMORY id/body copy fade in over ~520 ms and remain before POST, so current POST FX can glitch/feedback the text.
9. Fragment pool is now 64 mixed entries rather than 24 uniformly literary placeholders.
10. Exact under-finger composited-layer detection remains unresolved.

Deployment note: GitHub Pages deployment retriggered on 2026-08-27 after the previous v1.0.28 run was cancelled; no runtime code changed in this retrigger commit.
