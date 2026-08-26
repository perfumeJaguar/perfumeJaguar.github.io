# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.24`  
Current visual engine version: `1.0.22`  
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
TOUCH_PLAYBACK  0.50x while held
SWIPE_THRESHOLD 0.15
FULLSCREEN      manual FS button inside runtime UI
UI_DEFAULT      HIDDEN
AUDIO           20220302 - sarabande.mp3
IMAGE_ARCHIVE   96 files
RESIDENT_POOL   20 decoded images
```

Canonical visual defaults:

```text
?fps=30&speed=S2&post=1&fx=HC,GS,FB,ST,GL&mode=photo-double-blend&crop=10-80
```

## v1.0.24 — memory recall / mobile visibility / version-sync fix

### Memory recall prototype

A 2-second long press now reveals a centered memory fragment.

Current behavior:

```text
hold threshold      2000 ms
archive mapping     deterministic by archive image key/index
archive size        96 images
placeholder pool    24 English memory fragments
release behavior    overlay fades away
identifier          MEMORY 001-style archive number
```

Important implementation limitation:

- `PHOTO_DOUBLE_BLEND` and other multi-image modes can display several archive images at once.
- The current recall prototype captures the MediaManager's current archive entry at hold-start.
- It does **not** yet resolve which composited image/layer is visually under the finger.

This prototype is meant to test the broader `memory` direction before committing to a full narrative/state system. A future explicit content model should likely separate memory data from rendering, for example:

```text
memory id
image/archive key
text / media payload
unlock / discovery condition
links to other memories
persistent discovered state
optional scene/FX parameters
```

### Mobile visibility pause/resume

`js/mobile-visibility-v1024.js` is loaded after the main orchestrator.

On mobile only:

```text
document hidden  -> pause visual loop + audio
visible again    -> resume only if auto-pause caused the pause
user PAU state   -> remains paused across hide/show
```

Desktop behavior remains unchanged.

### Runtime version-display bug

The original v1.0.24 page and Pages artifact were deployed correctly, but `config.js` still contained:

```text
app.version = 1.0.23
```

This caused telemetry/runtime presentation to keep showing `1.0.23` on multiple devices even though `index.html` and the deployed artifact already contained v1.0.24/memory-recall code.

The fix synchronizes `config.js` to `app.version = 1.0.24` and increments `configRevision` to `37`. This incident is an important continuation rule: **verify both `index.html` start-note/cache key and `config.js app.version`; do not infer deployment failure from one displayed version string.**

### Swipe threshold

Swipe-feedback activation threshold was lowered:

```text
swipeFeedbackThreshold   0.15   (was 0.25)
swipeFeedbackStrength    1.8
swipeFeedbackAlphaMin    42
swipeFeedbackAlphaMax    128
max effective retain     ~230
```

The lower threshold makes small drags responsive while the v1.0.23 damping still prevents sustained feedback from saturating into a nearly non-decaying accumulation.

## v1.0.23 — touch swipe-feedback damping

A high-speed 2–3 second drag could previously clamp the temporal retain alpha to 255 and create a nearly permanent-looking recursive accumulation.

v1.0.23 kept the same basic swipe geometry while reducing feedback strength/retain range:

```text
swipeFeedbackStrength    1.8    (was 2.0)
swipeFeedbackAlphaMin    42
swipeFeedbackAlphaMax    128    (was 178)
max effective retain     ~230   instead of 255 clamp
```

## v1.0.22 — film dimming + resize stability

### ST

`ST` is film/projection-style luminance instability only. Positional jitter was removed.

```text
normal dim plateaus   ~0–2.2%
rare short dips       ~4.5–7.5%
implementation        translucent black overlay only
```

### Resize / fullscreen stability

Older visual-engine layers recreated `p5.Graphics` surfaces without always removing previous instances. The analyzer had a similar analysis-buffer issue. Repeated resize/fullscreen changes could therefore retain stale GPU/canvas resources.

Current mitigation:

```text
active visual engine  disposes inherited Graphics surfaces before rebuild
video analyzer        removes previous analysis buffer before rebuild
resize debounce       320 ms
fullscreen events     use the same debounced viewport rebuild path
```

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

The narrative/memory state itself is computationally cheap. Future text, hotspot, branch, discovery, or game-state systems can be extensive without becoming a major renderer cost. Performance risk comes mainly from additional simultaneous visual media, large DOM filters/backdrop blur, extra videos, or additional full-frame render passes.

## Scene image selection

Visible scene selection and resident-pool rotation are intentionally different policies.

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

## Current conceptual direction / next-session context

The artwork was discussed as more than a portfolio background. Current conceptual direction is **recollection / fading memory**: important memories that have mostly dissolved but still retain an emotional residue or "scent".

Possible future forms remain intentionally open:

- interactive web book / hypertext work;
- web game / puzzle exploration;
- visual-novel-like scene system;
- hidden hotspots and hold/swipe/wait interactions;
- non-linear memory nodes and discovery state;
- DODREI visual engine as the surface/physics of the memory world rather than a decorative background.

Design preference for future interaction: avoid turning every scene into a conventional "find all buttons" game. Long stretches may contain no discoverable event; occasional hidden responses should make the viewer wonder whether a memory contains something deeper.

## Important files

- `config.js` — canonical defaults / POST state / crop / speed / swipe threshold;
- `index.html` — active script chain, start-note version and cache key;
- `js/visual-engine-v1022.js` — active engine / ST / resize graphics disposal;
- `js/visual-engine-v1021.js` — GL and original ST implementation;
- `js/visual-engine-v1020.js` — touch rupture refinement;
- `js/visual-engine-v1015.js` — performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1000.js` — swipe-feedback implementation / touch POST bypass;
- `js/visual-engine-v1007.js` — mobile 2x main rendering;
- `js/interaction-v1020.js` — velocity-aware release tail;
- `js/memory-recall-v1024.js` — long-press memory prototype;
- `js/mobile-visibility-v1024.js` — mobile hidden/visible auto pause/resume;
- `js/video-analyzer.js` — analysis buffer with resize disposal;
- `sketch-v066.js` — startup / runtime pause hook / viewport rebuild;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL preset/share contract;
- `style.css` — runtime control layout and memory-recall presentation.

## Checkpoint — v1.0.24

1. Current canonical preset: `30 FPS / S2 / HC -> GS -> FB -> ST -> GL / PHOTO_DOUBLE_BLEND / crop 1.0x..8.0x`.
2. Runtime version and start screen are synchronized at `1.0.24`; active visual-engine class remains `1.0.22` because v1.0.23–24 are interaction/config/UI/prototype layers rather than a new engine subclass.
3. Swipe threshold is now `0.15`; sustained feedback damping from v1.0.23 remains.
4. Current image archive has 96 files; decoded resident pool remains 20.
5. 2-second memory recall prototype is active and currently uses deterministic placeholder-text mapping, not exact under-finger composited-layer selection.
6. Mobile background visibility now auto-pauses and returns to playback only when appropriate; user PAU remains authoritative.
7. Resize/fullscreen resource disposal, mobile 2x main rendering, startup sequence, audio, and open-random visible scene selection remain intact.
8. `README.md`, `ARCHITECTURE.md`, `CONFIG_GUIDE.md`, and this file were refreshed at session end so the next session should start from repository docs rather than conversational reconstruction.
