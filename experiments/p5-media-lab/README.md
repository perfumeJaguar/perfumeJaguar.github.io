# DODREI

DODREI is a mobile-first browser media-art work built with p5.js / JavaScript and hosted on GitHub Pages. The current visual language is based on fragmented photographic memory: rapidly changing crops, temporal feedback, grayscale rupture, sparse signal glitches, film-like luminance instability, touch interaction, and a long-press memory-recall prototype.

Current artwork/runtime: **v1.0.25**  
Current visual engine: **v1.0.22**  
Config schema: **1**  
Current image archive: **96 images**  
Resident decoded working set: **20 images**

## Current defaults

```text
BASE FPS        30
VIS SPEED       S2 / 0.50x
CROP RANGE      1.0x .. 8.0x
START MODE      PHOTO_DOUBLE_BLEND / TWIN_EXPOSURE//NULL
POST MASTER     ON
POST CHAIN      HC -> GS -> FB -> ST -> GL
POST FB         ON
POST ST         ON
POST GL         ON
TOUCH SPEED     0.50x visual playback while held
SWIPE THRESHOLD 0.15
FULLSCREEN      manual FS inside runtime UI
UI CONTROLS     HIDDEN by default
AUDIO           20220302 - sarabande.mp3
```

Canonical visual defaults:

```text
?fps=30&speed=S2&post=1&fx=HC,GS,FB,ST,GL&mode=photo-double-blend&crop=10-80
```

## Active mode order

```text
01 PHOTO_DOUBLE_BLEND   <- default / TWIN_EXPOSURE//NULL
02 PHOTO_FEEDBACK_CROP
03 PHOTO_RAPID_CROP
04 PHOTO_SHARD_SWAP
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

Automatic mode advance is currently OFF. The preset array starts with `PHOTO_DOUBLE_BLEND`, and `modeControl.startIndex` is `0`. A valid `mode=` query parameter overrides the default.

## Touch behavior

Touch currently combines several behaviors:

- visual playback slows to `0.50x` while held;
- touch rupture uses grayscale palette quantization and irregular horizontal bands;
- rupture release has a short velocity-aware decay rather than a long sticky tail;
- swipe-feedback begins at normalized swipe speed `0.15`;
- swipe feedback strength/retain ceiling were reduced in v1.0.23 so sustained 2–3 second drags continue to decay instead of locking into a nearly permanent feedback accumulation;
- GL is sparse at rest and becomes much more active during touch.

The touch rupture / swipe / feedback paths remain deliberately lower resolution than the main mobile composition.

## Memory recall prototype — v1.0.25

Holding the artwork for **1 second** opens a full-screen black recall plate. The archive image captured at hold-start is shown as a small, centered, **unfiltered original-image thumbnail**, with its `MEMORY 000`-style identifier and memory text underneath. Releasing fades the recall plate away.

While the recall plate is visible, it sits above the p5 canvas, telemetry, and runtime controls, so the viewer sees only the mapped still image and its text rather than the continuing composited visual underneath.

The current implementation is intentionally a prototype:

- all 96 archive images are deterministically mapped by archive key/index;
- 24 placeholder English memory fragments are reused through a stable hash mapping;
- the image captured at hold-start remains the target even if the rolling resident pool changes during the hold;
- the thumbnail uses that target archive entry's original `path`, not the POST-processed p5 canvas;
- the memory module reads the orchestrator's global lexical `appStarted` / `mediaManager` bindings directly instead of incorrectly requiring `window.appStarted` / `window.mediaManager` properties;
- this does **not yet identify the exact composited image/layer under the finger** in multi-image modes such as `PHOTO_DOUBLE_BLEND`.

The likely next-stage architecture is to replace placeholder fragments with explicit memory records (`image -> text -> conditions -> links/state`) while keeping narrative/game logic separate from the visual engine.

## Mobile visibility behavior

On mobile devices only, `visibilitychange` pauses visual looping and audio when the page becomes hidden (home screen, app switch, other tab) and automatically resumes when the page becomes visible again **only if that module caused the pause**. A user-initiated `PAU` state remains paused.

Desktop behavior is unchanged.

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

## Mobile rendering / performance

The main mobile composition remains at `2.0x` CSS resolution, with the effective long-edge cap at about 1440 after oversampling. Performance-sensitive supporting paths remain reduced-resolution:

- HC/GS/LS compatible Canvas filters are batched where possible;
- mobile BL uses a reduced scratch surface when enabled;
- global FB history uses a reduced buffer;
- GL uses a reduced scratch buffer;
- ST is only a translucent black overlay (no positional jitter, no extra full-frame copy);
- touch rupture and swipe feedback stay low resolution;
- analysis remains reduced resolution;
- decoded image residency is bounded.

## Scene / crop behavior

Visible scene image selection is independent random selection **with replacement**. Immediate repeats and duplicates are allowed; there is no recent-image ban or scene-level shuffle bag.

The MediaManager separately uses a shuffle bag only to rotate images into/out of the bounded resident working set.

```text
crop=10-80   -> 1.0x .. 8.0x   current default
crop=12-35   -> 1.2x .. 3.5x
```

## Runtime controls

```text
[ ›    ] next mode
[30    ] composition FPS
[S2    ] visual speed
[POST  ] POST COMMON FX master

right column: BW / GS / LS / BL / FB / GL / ST
left column:  CR / HC / DK / VG

[PAU   ] pause/resume visuals + music output
[MUT   ] mute/unmute audio
[SHR   ] copy current settings as a share URL
[FS    ] fullscreen; hidden when runtime UI is hidden
[UI    ] hide/show runtime controls; intentionally almost invisible
```

## Important files

- `config.js` — canonical runtime defaults and tunable parameters;
- `js/visual-engine-v1022.js` — active visual engine, ST dimming and resize resource disposal;
- `js/visual-engine-v1021.js` — sparse GL and original ST layer;
- `js/visual-engine-v1020.js` — irregular touch rupture/release behavior;
- `js/visual-engine-v1015.js` — mobile performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1000.js` — swipe feedback and touch POST bypass behavior;
- `js/interaction-v1020.js` — faster velocity-aware touch release tail;
- `js/mobile-visibility-v1024.js` — mobile background pause/resume;
- `js/memory-recall-v1025.js` — 1-second recall plate / raw thumbnail / memory text;
- `sketch-v066.js` — application orchestration, startup and viewport rebuild;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL presets/share links;
- `PROJECT_STATE.md` — current implementation checkpoint and next-session handoff.

## Source of truth

For continuation work, read `PROJECT_STATE.md` first, then verify `config.js`, `index.html`, and the active versioned modules before changing behavior. Do not infer the current runtime from older versioned filenames alone.
