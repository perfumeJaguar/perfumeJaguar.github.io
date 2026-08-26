# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.27`  
Current visual engine version: `1.0.27`  
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
TOUCH_PLAYBACK  0.50x while held before recall activation
SWIPE_THRESHOLD 0.15
RUPTURE_RES     mobile 0.62 / desktop 0.80
SWIPE_FB_RES    mobile 0.60 / desktop 0.78
FULLSCREEN      manual FS button inside runtime UI
UI_DEFAULT      HIDDEN
AUDIO           20220302 - sarabande.mp3
IMAGE_ARCHIVE   96 files
RESIDENT_POOL   20 decoded images
MEMORY_HOLD     1000 ms
```

Canonical visual defaults:

```text
?fps=30&speed=S2&post=1&fx=HC,GS,FB,ST,GL&mode=photo-double-blend&crop=10-80
```

## v1.0.27 — memory overlay enters POST + touch burst/lull timing

v1.0.27 keeps the v1.0.26 memory PRE-FX lock, but changes how the memory overlay and touch fracture are presented.

### Memory pipeline

The active memory pipeline is now:

```text
hold-start archive entry / resident p5.Image
  -> 1000 ms activation
  -> fixed centered 1x cover memory source
  -> normal preset composition/random crop/PRE FX remain stopped
  -> touch rupture
  -> optional swipe feedback
  -> full-resolution memory composite buffer
       -> local semi-transparent black readability panel
       -> original-aspect-ratio thumbnail (~98% opacity)
       -> MEMORY NNN
       -> memory text
  -> current ordered POST COMMON FX
  -> vignette / waveform
```

Important consequence: the thumbnail and memory text are now part of the p5 canvas **before POST**, so they receive the currently enabled POST chain. With current defaults that means `HC -> GS -> FB -> ST -> GL` affects the memory overlay as well as the main recalled image.

The ordinary touch rule still bypasses POST COMMON FX outside recall. Memory recall is an intentional exception because the overlay itself is meant to belong to the processed artwork surface.

The visible DOM recall layer from v1.0.26 is no longer used. `memory-recall-v1027.js` keeps the DOM node only as an aria-live mirror and exports the memory state to the visual engine.

### Readability

v1.0.26 placed transparent text directly over the recalled image, which could become unreadable on bright/non-black backgrounds.

v1.0.27 draws a local dark panel behind the thumbnail and text:

```text
full-screen black plate   NO
local panel               black, alpha ~126/255 before POST
thumbnail                 original aspect ratio, alpha ~250/255
text                      bright serif + dark canvas shadow
POST                      applies after panel/thumbnail/text composition
```

This improves local contrast while preserving the recalled image across the rest of the frame.

### Touch rupture timing

The previous rupture pattern refresh could read as evenly spaced `tick ... tick ... tick ...` motion.

v1.0.27 adds a deliberately simple stochastic envelope rather than a complicated event script:

```text
BURST
  ~105-315 ms depending on random value / gesture energy
  inherited rupture pattern forced fresh on each allowed heavy render pass

LULL
  base ~220-780 ms
  faster movement shortens lull by at most ~26%
  previous fracture pattern is held instead of continuously reseeded
```

Because the existing mobile frame-skip remains active, rapid burst refresh does not mean the expensive pixel remap runs on every mobile render frame. The intended perceptual result is closer to `buzz-buzz-buzz ... quiet ... buzz ... buzz-buzz` than a uniformly faster glitch.

### Touch-path resolution

Touch-related low-resolution buffers were raised modestly:

```text
feedback/swipe mobile     0.52 -> 0.60
feedback/swipe desktop    0.72 -> 0.78
rupture mobile            0.50 -> 0.62
rupture desktop           0.70 -> 0.80
rupture frame skip mobile 2    unchanged
rupture frame skip desk   1    unchanged
```

This is a calculated quality/performance tradeoff. v0.6.7 originally reduced rupture resolution and added the mobile every-second-frame path after full-resolution touch dropped some phones toward ~15 fps. If touch performance regresses, reduce the resolution scales first; keep burst timing unless it is independently shown to be expensive.

## v1.0.26 — memory PRE-FX composition lock

v1.0.26 moved recall from a black DOM cover into the actual p5 visual pipeline.

```text
pointer down
  -> capture MediaManager current archive entry
  -> retain resident p5.Image reference

hold reaches 1000 ms
  -> memory ACTIVE
  -> normal preset composition intercepted
  -> random image-slot selection stopped
  -> random crop/layout stopped
  -> PRE common FX skipped
  -> preset feedback bypassed
  -> one fixed centered cover memory image becomes the base
  -> temporal buffers cleared

while held
  -> fixed image remains unchanged
  -> touch rupture / swipe operate downstream
  -> virtual composition clock does not advance

release
  -> memory inactive
  -> temporal buffers clear
  -> scene image slots reset
  -> normal composition refreshes
  -> virtual wall-clock reference resets to avoid a time jump
```

The recall target is still the MediaManager current archive entry captured at hold-start. Exact under-finger composited-layer resolution in multi-image modes remains unresolved.

## v1.0.25 — superseded recall presentation

v1.0.25 reduced the hold threshold from 2 seconds to 1 second and added the mapped raw image thumbnail, but used a full-screen black DOM plate. That plate was superseded by v1.0.26 and the remaining visible DOM overlay was superseded by v1.0.27.

## v1.0.24 — memory prototype / mobile visibility / version-sync fix

The first memory prototype used a 2-second hold and text-only recall. It established deterministic archive-key/index mapping and the placeholder fragment pool.

`js/mobile-visibility-v1024.js` remains active on mobile:

```text
document hidden  -> pause visual loop + audio
visible again    -> resume only if auto-pause caused the pause
user PAU state   -> remains paused across hide/show
```

The v1.0.24 version-display incident established a continuation rule: verify both `index.html` start-note/cache key and `config.js app.version` before diagnosing a deployment mismatch.

## Touch rupture

- Touch palette is grayscale only: black / dark gray / mid gray / near-white.
- Release tail is velocity-aware and short.
- Horizontal rupture uses irregular slice heights.
- Most slices are narrow; occasional broad fractures appear.
- Only a subset of slices move.
- Shift is usually small with occasional extreme displacement.
- v1.0.27 wraps pattern refresh in burst/lull timing rather than uniformly speeding it up.
- Touch rupture remains reduced-resolution and retains the mobile every-second-frame heavy-pass safeguard.
- Swipe-feedback activates while pressed above `0.15`.
- During memory recall, the rupture source is the fixed mapped memory still.

## Global POST FX

Current ordered keys:

```text
BW GS LS BL FB GL ST CR HC DK VG
```

Current startup chain:

```text
HC -> GS -> FB -> ST -> GL
```

Roles:

- `FB` — intentionally strong, low-resolution temporal memory;
- `GL` — sparse temporal slice glitch at rest, much more frequent/intense during touch when POST is active;
- `ST` — film/projection luminance breathing/dips only;
- `HC/GS/LS` — compatible Canvas filters batched where possible;
- `BL` — reduced mobile scratch when enabled.

Outside recall, active touch rupture still causes the normal POST master path to be bypassed. During recall, v1.0.27 explicitly applies POST after the memory overlay is composited so the thumbnail/text can participate in the current POST aesthetics.

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

## Mobile sharpness / performance

```text
main mobile composition   2x CSS resolution
mobile long-edge cap      ~1440 effective after oversample
rupture                    0.62x mobile, every 2nd render frame
swipe/feedback             0.60x mobile
global FB                  reduced relative to feedback buffer
GL scratch                 reduced-resolution surface
ST                         overlay only
analysis                   reduced resolution
resident decoded images    bounded to 20
background rotation        sequential decode
```

Memory locking itself remains cheap. The new memory composite adds one full-resolution copy/overlay pass while recall is active, followed by the already-existing POST chain that is now intentionally enabled in recall.

## Scene image selection

Outside memory recall:

```text
policy                  independent random with replacement
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
same image in slots     ALLOWED
```

Resident working-set rotation:

```text
archive metadata        full archive
active decoded pool     20
rotation batch          5
rotation interval       5 s
candidate policy        shuffle-bag
runtime decode          sequential
```

During recall, visible-scene selection is bypassed entirely and the captured memory image is the single base source.

## Current conceptual direction / next-session context

The artwork direction remains **recollection / fading memory**: important memories that have mostly dissolved but still retain an emotional residue or "scent".

Possible future forms remain open:

- interactive web book / hypertext work;
- web game / puzzle exploration;
- visual-novel-like scene system;
- hidden hotspots and hold/swipe/wait interactions;
- non-linear memory nodes and discovery state;
- DODREI visual engine as the surface/physics of the memory world rather than a decorative background.

Design preference: avoid turning every scene into a conventional "find all buttons" game. Long stretches may contain no discoverable event; occasional hidden responses should make the viewer wonder whether a memory contains something deeper.

A future explicit content model should likely separate memory data from rendering:

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

- `config.js` — canonical defaults / runtime version / touch resolution / POST state / crop / speed;
- `index.html` — active script chain, start-note version and cache key;
- `js/visual-engine-v1027.js` — active visual engine; memory p5 overlay + memory POST + touch burst/lull envelope;
- `js/visual-engine-v1026.js` — memory PRE-FX lock base;
- `js/visual-engine-v1022.js` — ST / resize graphics disposal base;
- `js/visual-engine-v1021.js` — GL and original ST implementation;
- `js/visual-engine-v1020.js` — irregular touch rupture / release behavior;
- `js/visual-engine-v1015.js` — performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1000.js` — swipe-feedback / ordinary touch POST bypass;
- `js/visual-engine-v1007.js` — mobile 2x main rendering;
- `js/interaction-v1020.js` — velocity-aware release tail;
- `js/memory-recall-v1027.js` — 1-second archive capture and engine state bridge; DOM aria mirror only;
- `js/mobile-visibility-v1024.js` — mobile hidden/visible auto pause/resume;
- `js/video-analyzer.js` — analysis buffer with resize disposal;
- `sketch-v066.js` — startup / runtime pause hook / viewport rebuild;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL preset/share contract.

## Checkpoint — v1.0.27

1. Canonical preset remains `30 FPS / S2 / HC -> GS -> FB -> ST -> GL / PHOTO_DOUBLE_BLEND / crop 1.0x..8.0x`.
2. Runtime version and active visual engine are `1.0.27`; `configRevision` is `40`.
3. Memory hold threshold remains `1000 ms` and PRE composition remains locked to one captured image during recall.
4. Thumbnail + MEMORY id + text are now drawn inside p5 after touch rupture/swipe, on a local translucent black panel, and before current POST COMMON FX.
5. Therefore the overlay and main memory result share the current POST chain; default is `HC -> GS -> FB -> ST -> GL`.
6. DOM memory presentation is no longer visible; it is retained only as an aria-live mirror/state companion.
7. Touch rupture now alternates stochastic rapid bursts with longer held/lull intervals rather than refreshing at a near-even cadence.
8. Touch rupture resolution is now `0.62` mobile / `0.80` desktop; swipe/feedback is `0.60` mobile / `0.78` desktop. Mobile rupture frame-skip remains `2`.
9. If mobile touch performance regresses, lower those resolution scales before changing the burst timing model.
10. Exact under-finger composited-layer detection remains unresolved; hold-start MediaManager current archive entry is still the recall target.
