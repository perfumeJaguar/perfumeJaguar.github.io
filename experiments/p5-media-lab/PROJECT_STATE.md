# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.26`  
Current visual engine version: `1.0.26`  
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

## v1.0.26 — memory PRE-FX composition lock

The previous v1.0.25 implementation was conceptually wrong for the intended interaction because it merely placed a full-screen black DOM plate above the still-running p5 composition.

v1.0.26 moves memory recall into the actual visual pipeline.

### Intended / current behavior

```text
pointer down
  -> capture MediaManager current archive entry
  -> retain that entry's resident p5.Image reference

hold reaches 1000 ms
  -> memory state becomes ACTIVE
  -> normal preset composition is intercepted
  -> random image-slot selection stops
  -> random crop/layout evolution stops
  -> PRE common FX stage is skipped
  -> preset feedback is bypassed
  -> base p5 buffer becomes one fixed centered 1x cover crop
     of the captured memory image
  -> old preset/swipe/global feedback buffers are cleared

while finger remains down
  -> base image stays unchanged
  -> touch rupture acts on that fixed image
  -> swipe feedback can act downstream on that fixed image
  -> ordinary composition / virtual visual clock does not advance

pointer release
  -> memory state becomes INACTIVE
  -> memory temporal buffers clear
  -> normal composition is forced to refresh
  -> scene image slots are reset
  -> virtual wall-clock reference is reset to avoid a time jump
```

### Thumbnail / text overlay

The DOM layer is now only an overlay and no longer hides the canvas.

```text
background          transparent
thumbnail           same archive image, original path, object-fit contain
thumbnail size      small centered presentation
text                MEMORY NNN + fragment below thumbnail
canvas underneath   visible and running touch FX on the locked memory still
```

The p5 memory image and DOM thumbnail deliberately serve different roles:

- **main canvas image:** fixed centered cover crop, then touch rupture / swipe feedback only;
- **thumbnail:** unfiltered original-path image preserving the source aspect ratio.

### Recall target semantics

Recall still targets the MediaManager current archive entry captured at hold-start. In multi-image presets such as `PHOTO_DOUBLE_BLEND`, that is not necessarily the exact composited layer under the finger. Exact under-finger layer/hit resolution remains unresolved and is not part of v1.0.26.

The captured resident `p5.Image` is retained by the memory state so background resident-pool rotation cannot invalidate the active recall image while the hold continues.

## v1.0.25 — superseded recall presentation

v1.0.25 reduced the hold threshold from 2 seconds to 1 second and added the mapped raw image thumbnail. It used a full-screen black DOM recall plate that hid the still-running canvas.

That black-plate behavior is superseded by v1.0.26. The useful pieces retained from v1.0.25 are:

- 1000 ms hold threshold;
- deterministic archive mapping;
- raw original-path thumbnail;
- `MEMORY NNN` + text presentation;
- direct access to the actual global lexical `appStarted` / `mediaManager` bindings rather than assuming `window.*` properties.

## v1.0.24 — memory prototype / mobile visibility / version-sync fix

The first memory prototype used a 2-second hold and text-only recall. It established deterministic archive-key/index mapping and the placeholder memory-fragment pool.

`js/mobile-visibility-v1024.js` remains active on mobile:

```text
document hidden  -> pause visual loop + audio
visible again    -> resume only if auto-pause caused the pause
user PAU state   -> remains paused across hide/show
```

The v1.0.24 version-display incident established an important continuation rule: verify both `index.html` start-note/cache key and `config.js app.version` before diagnosing a deployment mismatch.

## Touch rupture

- Touch palette is grayscale only: black / dark gray / mid gray / near-white.
- Release tail is faster than the original interaction model and velocity-aware.
- Horizontal rupture uses irregular slice heights instead of equal fixed bands.
- Most slices are narrow; occasional broad fractures appear.
- Only a subset of slices move.
- Shift amount is usually small with occasional extreme displacement.
- Patterns are held briefly rather than randomized every frame.
- Touch rupture remains on reduced-resolution buffers and mobile frame-skip path.
- Swipe-feedback activates while pressed above the current `0.15` threshold.
- During memory recall, the rupture source is the fixed mapped memory still rather than the changing preset composition.

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
- `GL` — sparse temporal slice glitch at rest, much more frequent/intense during touch;
- `ST` — extremely lightweight film/projection luminance breathing/dips; no positional jitter;
- `HC/GS/LS` — compatible CSS filters can be batched in the active performance layer;
- `BL` — reduced mobile scratch when enabled.

Normal touch rupture continues to bypass POST COMMON FX. Memory recall also bypasses ordinary preset composition/PRE/preset-feedback and keeps only touch-specific rupture/swipe processing downstream from the locked source.

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
feedback/swipe/rupture     lower-resolution surfaces
GL scratch                 lower-resolution surface
ST                         overlay only
analysis                   reduced resolution
resident decoded images    bounded to 20
background rotation        sequential decode
```

Memory locking is cheap: the locked base image is drawn into the main composition buffer only when a new recall target activates or the visual engine rebuilds. The ordinary random preset composition does not continue behind it.

## Scene image selection

Outside memory recall, visible scene selection and resident-pool rotation remain intentionally different policies.

Visible scene draws:

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

During memory recall, visible-scene selection is bypassed entirely and the captured memory image is used as the single source.

## Current conceptual direction / next-session context

The artwork direction remains **recollection / fading memory**: important memories that have mostly dissolved but still retain an emotional residue or "scent".

Possible future forms remain intentionally open:

- interactive web book / hypertext work;
- web game / puzzle exploration;
- visual-novel-like scene system;
- hidden hotspots and hold/swipe/wait interactions;
- non-linear memory nodes and discovery state;
- DODREI visual engine as the surface/physics of the memory world rather than a decorative background.

Design preference: avoid turning every scene into a conventional "find all buttons" game. Long stretches may contain no discoverable event; occasional hidden responses should make the viewer wonder whether a memory contains something deeper.

A future explicit content model should likely separate memory data from rendering, for example:

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

- `config.js` — canonical defaults / runtime version / POST state / crop / speed / swipe threshold;
- `index.html` — active script chain, start-note version and cache key;
- `js/visual-engine-v1026.js` — active visual engine; memory PRE-FX composition lock / touch-only downstream path;
- `js/visual-engine-v1022.js` — ST / resize graphics disposal base;
- `js/visual-engine-v1021.js` — GL and original ST implementation;
- `js/visual-engine-v1020.js` — touch rupture refinement;
- `js/visual-engine-v1015.js` — performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1000.js` — swipe-feedback implementation / touch POST bypass;
- `js/visual-engine-v1007.js` — mobile 2x main rendering;
- `js/interaction-v1020.js` — velocity-aware release tail;
- `js/memory-recall-v1026.js` — 1-second archive capture, memory state bridge, raw thumbnail + text;
- `js/mobile-visibility-v1024.js` — mobile hidden/visible auto pause/resume;
- `js/video-analyzer.js` — analysis buffer with resize disposal;
- `sketch-v066.js` — startup / runtime pause hook / viewport rebuild;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL preset/share contract;
- `style.css` — runtime control layout and transparent memory overlay presentation.

## Checkpoint — v1.0.26

1. Current canonical preset: `30 FPS / S2 / HC -> GS -> FB -> ST -> GL / PHOTO_DOUBLE_BLEND / crop 1.0x..8.0x`.
2. Runtime version, start screen, and active visual engine are synchronized at `1.0.26`; `configRevision` is `39`.
3. Memory hold threshold remains `1 second`.
4. Memory activation replaces the normal PRE-FX/preset-composition result with one fixed mapped archive image on the p5 canvas; it no longer uses a black plate to hide a continuing composition.
5. Random preset image selection, random crop/layout evolution, preset feedback, and the visual composition clock stop for the duration of active recall.
6. Touch rupture and swipe feedback continue downstream from the locked image. Existing feedback histories are cleared on recall entry so prior random images do not contaminate the memory state.
7. The original source image is separately displayed as a small transparent DOM thumbnail with `MEMORY NNN` and text underneath.
8. On release, temporal buffers and scene-slot state reset and ordinary composition is forced to refresh cleanly.
9. Exact under-finger composited-layer detection remains unresolved; hold-start MediaManager current archive entry is still the recall target.
10. Mobile visibility pause/resume, swipe threshold `0.15`, resize/fullscreen disposal, mobile 2x main rendering, startup sequence, audio, and outside-recall random scene selection remain intact.
