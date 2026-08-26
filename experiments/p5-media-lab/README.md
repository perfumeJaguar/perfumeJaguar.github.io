# DODREI

DODREI is a mobile-first browser media-art work built with p5.js / JavaScript and hosted on GitHub Pages. The current visual language is based on fragmented photographic memory: rapidly changing crops, temporal feedback, grayscale rupture, sparse signal glitches, film-like luminance instability, touch interaction, and a long-press memory-recall system.

Current artwork/runtime: **v1.0.27**  
Current visual engine: **v1.0.27**  
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
TOUCH SPEED     0.50x visual playback while held before recall activation
SWIPE THRESHOLD 0.15
TOUCH RUPTURE   mobile 0.62x / desktop 0.80x
SWIPE/FEEDBACK  mobile 0.60x / desktop 0.78x
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

- visual playback slows to `0.50x` while held before memory recall activates;
- touch rupture uses grayscale palette quantization and irregular horizontal bands;
- rupture release has a short velocity-aware decay rather than a long sticky tail;
- swipe-feedback begins at normalized swipe speed `0.15`;
- touch rupture timing now uses a burst/lull envelope instead of a nearly metronomic pattern refresh;
- short burst windows rapidly refresh rupture patterns, while longer lull windows hold the previous fracture in place;
- the burst/lull rhythm is stochastic and movement energy only shortens lulls modestly, so high-speed touch does not become a constant flicker;
- GL remains sparse at rest and much more active during touch whenever POST is active.

Touch-path raster quality was raised modestly in v1.0.27 without removing the existing mobile rupture frame-skip safeguard:

```text
rupture mobile     0.50 -> 0.62
rupture desktop    0.70 -> 0.80
swipe/FB mobile    0.52 -> 0.60
swipe/FB desktop   0.72 -> 0.78
mobile rupture skip remains every 2nd render frame
```

## Memory recall — v1.0.27

Holding the artwork for **1 second** activates memory recall.

The underlying memory lock from v1.0.26 is retained:

```text
hold-start           capture MediaManager archive entry + resident p5.Image
1 second             activate memory state
PRE-FX source        lock to that one archive image
main image framing   fixed centered 1x cover crop
preset image mixing  stopped
random crop/layout   stopped
composition clock    stopped while recall is active
preset feedback      bypassed while recall is active
old feedback history cleared on entry
TOUCH FX             rupture + swipe continue on the fixed still
release              recall ends, temporal buffers clear, normal scene refreshes
```

v1.0.27 changes the memory presentation pipeline. The thumbnail and text are no longer a visible DOM overlay. They are drawn directly into a full-resolution p5 memory-composite buffer after touch rupture/swipe and before POST COMMON FX:

```text
fixed memory still
  -> touch rupture / swipe feedback
  -> local semi-transparent black readability panel
  -> original-aspect-ratio thumbnail (~98% opacity)
  -> MEMORY NNN + memory text
  -> current ordered POST COMMON FX
  -> vignette / waveform presentation
```

This means the thumbnail and memory text now receive the same currently enabled POST chain as the memory scene, including the default `HC -> GS -> FB -> ST -> GL`. The local dark panel improves readability against bright or high-contrast memory images without returning to the old full-screen black recall plate.

The thumbnail still uses the original recalled image and preserves its aspect ratio. The main recalled background remains the fixed centered cover crop and continues to be the target of touch rupture/swipe.

The current implementation remains a prototype:

- all 96 archive images are deterministically mapped by archive key/index;
- 24 placeholder English memory fragments are reused through a stable hash mapping;
- the archive entry and resident p5.Image are captured at hold-start so resident-pool rotation cannot change the active memory source;
- this still does **not identify the exact composited image/layer under the finger** in multi-image modes such as `PHOTO_DOUBLE_BLEND`; recall targets the MediaManager current archive entry captured at hold-start.

The likely next-stage architecture is to replace placeholder fragments with explicit memory records (`image -> text -> conditions -> links/state`) while keeping narrative/game logic separate from the visual engine.

## Mobile visibility behavior

On mobile devices only, `visibilitychange` pauses visual looping and audio when the page becomes hidden and automatically resumes when the page becomes visible again **only if that module caused the pause**. A user-initiated `PAU` state remains paused.

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
- ST is only a translucent black overlay;
- touch rupture and swipe feedback remain reduced-resolution, but slightly higher than v1.0.26;
- mobile rupture still recalculates only every second render frame during a continuous hold;
- analysis remains reduced resolution;
- decoded image residency is bounded.

The v1.0.27 touch-quality increase is intentionally conservative. If mobile frame rate again collapses under long touch gestures, the first rollback target should be the two touch-resolution scales rather than the burst timing logic.

## Scene / crop behavior

Outside memory recall, visible scene image selection is independent random selection **with replacement**. Immediate repeats and duplicates are allowed; there is no recent-image ban or scene-level shuffle bag.

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

- `config.js` — canonical runtime defaults, touch-resolution scales, POST state, crop, speed and runtime version;
- `js/visual-engine-v1027.js` — active engine; memory canvas overlay, memory POST path, touch burst/lull timing;
- `js/visual-engine-v1026.js` — memory PRE-FX composition lock base;
- `js/visual-engine-v1022.js` — ST dimming and resize resource disposal;
- `js/visual-engine-v1021.js` — sparse GL and original ST layer;
- `js/visual-engine-v1020.js` — irregular touch rupture/release behavior;
- `js/visual-engine-v1015.js` — mobile performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB implementation;
- `js/visual-engine-v1000.js` — swipe feedback and ordinary touch POST-bypass behavior;
- `js/interaction-v1020.js` — faster velocity-aware touch release tail;
- `js/mobile-visibility-v1024.js` — mobile background pause/resume;
- `js/memory-recall-v1027.js` — 1-second archive capture and engine state bridge; DOM is aria-only;
- `sketch-v066.js` — application orchestration, startup and viewport rebuild;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS;
- `js/url-preset.js` — URL presets/share links;
- `PROJECT_STATE.md` — current implementation checkpoint and next-session handoff.

## Source of truth

For continuation work, read `PROJECT_STATE.md` first, then verify `config.js`, `index.html`, and the active versioned modules before changing behavior. Do not infer the current runtime from older versioned filenames alone.
