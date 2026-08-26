# DODREI — Architecture

Current artwork/runtime: **v1.0.24**  
Current visual engine: **v1.0.22**  
Current config schema: **1**

## 1. Design objective

DODREI is both:

1. a coherent browser-based media artwork;
2. a reusable browser media-system laboratory.

The current architecture favors explicit modules, bounded mobile cost, readable state, public/static deployment, and enough separation that the visual engine can later support a web book, game, hypertext work, or visual-novel-like memory system without being rewritten as one giant sketch.

## 2. Current runtime graph

```text
Mouse / Touch
     │
     ▼
Interaction
     │
     ├──────────────────────────────┐
     │                              │
     ▼                              ▼
MediaManager ── resident images ─> VideoAnalyzer
     │                              │
     │                              ├─ RGB / luminance
     │                              ├─ motion estimate
     │                              └─ local/global analysis
     │                                      │
     │                                      ▼
     │                                 AudioEngine
     │                                      │
     └──────────────────────────────> VisualEngine
                                            │
                                            ▼
                                         Canvas
                                            │
                                            ├─ Telemetry
                                            └─ HTML overlay layers
                                                 ├─ runtime controls
                                                 └─ Memory Recall prototype
```

The active artwork is PHOTO ONLY. Legacy video naming/modules remain for compatibility, but current behavior is driven by still-image pools, audio, interaction, Canvas2D visual processing, telemetry, and lightweight DOM overlays.

## 3. Application frame sequence

`sketch-v066.js` currently orchestrates:

1. `Interaction.update()`
2. `MediaManager.update()`
3. `VideoAnalyzer.update()`
4. `AudioEngine.update()`
5. `VisualEngine.render()`
6. `Telemetry.render()`

Telemetry stays last so it remains legible after processed visuals. Memory recall is a DOM overlay and does not add another full-frame Canvas processing pass.

## 4. Configuration architecture

```text
config.js
  runtime values
      │
      ├──────────────> artwork modules
      │
      ▼
config-schema.js
  metadata / validation / collection identity
      │
      ▼
control/
  import / merge / edit / export
```

### `config.js`

Canonical public runtime data. Current notable values include:

```text
app.version                  1.0.24
meta.configRevision          37
composition FPS              30
visual speed                 S2 / 0.50x
crop                         1.0x .. 8.0x
swipe threshold              0.15
POST chain                   HC -> GS -> FB -> ST -> GL
```

`window.P5LAB_CONFIG` remains a compatibility alias for older engine modules.

### `config-schema.js`

Editor metadata rather than runtime defaults. It describes value types, bounds, select options, collection identity, read-only structure and migration aliases.

### `control/`

Static editor with no GitHub write credentials. It can load deployed/current config, browser drafts, files, pasted config text, perform compatible merge, and export canonical `config.js`.

## 5. Version/display boundary

Artwork version and visual-engine version are intentionally separate.

Current state:

```text
artwork/runtime    1.0.24
visual engine      1.0.22
config schema      1
```

v1.0.23–24 add interaction/config/UI/prototype behavior without requiring another visual-engine subclass.

Important lesson from the v1.0.24 release: `index.html` start-note and `config.js app.version` must both be synchronized. Runtime presentation reads the config version, so a stale `app.version` can make a correctly deployed release appear old.

## 6. MediaManager

Responsibilities:

- discover image archive entries through GitHub Contents API;
- attach `setId` metadata;
- keep a bounded decoded working set;
- stage replacements in the background;
- evict old decoded references;
- isolate resident-pool selection from visual scene selection.

Current values:

```text
archive images          96
active decoded images   20
rotation batch          5
rotation interval       5 s
startup concurrency     3
runtime decode          sequential
resident candidate      shuffle-bag
```

### Two different randomness layers

Resident-pool rotation uses a shuffle bag to circulate archive content efficiently.

Visible scene selection does **not** use that bag. Visible slots select independently with replacement, so duplicates and immediate repeats are valid artistic behavior.

## 7. Image sets

Current configuration:

```js
imageSets: [
  { id: "default", subdir: "" }
]
```

Stable set IDs preserve room for future policies such as weighted sets, strict alternation, quotas, temporary exclusion, or cross-set pairing. Those policies belong in media selection, not in visual FX code.

## 8. Visual mode system

Current active mode order:

```text
01 PHOTO_DOUBLE_BLEND
02 PHOTO_FEEDBACK_CROP
03 PHOTO_RAPID_CROP
04 PHOTO_SHARD_SWAP
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

`PHOTO_DOUBLE_BLEND` is the default. `modeControl.startIndex = 0`. Automatic advance is currently OFF; manual next-mode remains available.

## 9. Visual engine chain

The project still uses additive versioned subclasses for compatibility. Relevant active tail:

```text
visual-engine-v1000.js
        ↓
visual-engine-v1003.js
        ↓
visual-engine-v1004.js
        ↓
visual-engine-v1007.js
        ↓
visual-engine-v1012.js
        ↓
visual-engine-v1015.js
        ↓
visual-engine-v1020.js
        ↓
visual-engine-v1021.js
        ↓
visual-engine-v1022.js   <- active class / engine version 1.0.22
```

Key responsibilities near the tail:

- `v1000` — swipe feedback / touch POST bypass;
- `v1003` — open random scene-slot selection and crop behavior;
- `v1007` — mobile 2x main composition;
- `v1012` — ordered global POST FB;
- `v1015` — performance diet / filter batching / reduced BL and FB buffers;
- `v1020` — irregular touch rupture and short release fracture behavior;
- `v1021` — GL sparse temporal slice glitch and original ST;
- `v1022` — ST film-style dimming only + resize resource disposal.

## 10. Visual pipeline and POST

Legacy/main stage graph:

```text
preset-composition
        ↓
common-crush
        ↓
touch-rupture
        ↓
preset-feedback
        ↓
swipe-feedback
        ↓
vignette
        ↓
waveform
```

Global POST common FX are ordered separately. Current startup chain:

```text
HC -> GS -> FB -> ST -> GL
```

Current roles:

- `HC` — high contrast/saturation stage;
- `GS` — grayscale;
- `FB` — temporal memory/feedback using reduced-resolution history;
- `ST` — film/projection luminance breathing and rare dim dips; overlay only;
- `GL` — sparse horizontal slice glitch at rest, much more active during touch.

## 11. Crop architecture

Each source draw can receive an independent adaptive crop.

Current default artistic zoom range:

```text
1.0x ... 8.0x
```

Cover-fit is calculated from source dimensions and target buffer aspect, then artistic zoom/pan uses available overflow and legal clamping. Deep crops are intentionally allowed.

## 12. Touch interaction

Mouse and one-finger touch normalize into a small downstream state:

```text
x
y
pressure
pressed
swipeSpeed
releaseEnergy
releaseAgeMs
```

While held, visual playback runs at `0.50x` of its normal virtual timeline.

### Touch rupture

Current rupture behavior:

- grayscale high-contrast base;
- irregular horizontal slice heights;
- most slices narrow, rare large fractures;
- only some slices displaced;
- mostly small displacement, occasional extreme displacement;
- short held patterns rather than per-frame random noise;
- velocity-aware release tail / brief fracture burst;
- reduced-resolution mobile path with frame skipping.

### Swipe feedback

Conditional activation:

```text
pressed == true
AND
normalized swipe speed > 0.15
```

The threshold was lowered in v1.0.24. v1.0.23 reduced feedback strength/alpha ceiling so 2–3 second drags keep decaying instead of saturating into a nearly permanent loop.

## 13. Audio

The stable audible path uses native HTML audio with a parallel Web Audio analysis/effect layer.

The current stack includes:

- PCM analysis window;
- waveform;
- filter control;
- delay/feedback;
- distortion;
- subtle playback-rate movement;
- touch-dependent wet amount;
- independent runtime mute;
- pause integration through `DODREI_SET_PAUSED`.

Current soundtrack:

`assets/audio/20220302 - sarabande.mp3`

## 14. Mobile visibility lifecycle

`js/mobile-visibility-v1024.js` handles mobile-only document visibility.

```text
hidden   -> DODREI_SET_PAUSED(true)
visible  -> resume only if this module auto-paused it
user PAU -> authoritative; do not auto-resume
```

Desktop is intentionally left unchanged.

This prevents mobile background playback/processing when the user switches apps, returns home, or moves to another hidden tab.

## 15. Memory recall prototype

`js/memory-recall-v1024.js` adds the first explicit content/recall layer without coupling narrative data to the visual engine.

Current prototype:

```text
long press            2 s
archive images        96
placeholder fragments 24
mapping                deterministic hash from archive key/index
presentation           centered DOM overlay + MEMORY ### id
release                fade out
```

### Current limitation

The target memory is based on the MediaManager's current archive entry captured at hold-start. In multi-image modes, especially `PHOTO_DOUBLE_BLEND`, this is not yet the same as selecting the exact visible image/layer under the finger.

### Intended architectural direction

If the prototype proves useful, introduce a dedicated memory/content layer rather than embedding story logic into `VisualEngine`:

```text
Memory / Scene Data
  ├─ memory id
  ├─ archive/image key
  ├─ text / audio / media payload
  ├─ discovery condition
  ├─ links / transitions
  ├─ persistent state
  └─ optional visual parameter cues

Interaction Resolver
  ├─ tap
  ├─ hold
  ├─ swipe
  ├─ wait
  └─ hotspot / scene-specific rules

Visual Engine
  └─ remains the memory-world surface / rendering physics
```

This preserves the option to evolve into an interactive book, web game, non-linear hypertext work, or visual-novel-like system without turning the renderer into a narrative monolith.

## 16. Telemetry and HTML UI

Telemetry is both instrumentation and artwork. It is rendered after processed visuals.

Runtime controls and memory recall are HTML overlays. Simple DOM text, state checks and hotspot logic are comparatively cheap; performance risk mainly comes from added visual media, full-frame Canvas passes, large CSS filters/backdrop blur, or concurrent video.

## 17. Mobile performance strategy

Current principles:

- `pixelDensity(1)`;
- main mobile composition at 2x CSS resolution;
- effective mobile long-edge cap about 1440 after oversample;
- reduced-resolution analysis;
- bounded decoded image pool;
- sequential background image decode;
- reduced touch rupture/swipe buffers;
- reduced GL scratch;
- reduced global FB history;
- mobile BL reduced scratch when enabled;
- ST uses only a translucent overlay;
- HC/GS/LS compatible Canvas filters batched where possible;
- no active halation/bloom pass;
- explicit disposal of stale graphics buffers on resize/fullscreen rebuild.

## 18. Startup sequence

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

## 19. Editing map

| Goal | Primary file |
|---|---|
| tune current artwork | `config.js` |
| edit config through UI | `control/` |
| validation/editor metadata | `config-schema.js` |
| image discovery/resident rotation | `js/media-manager.js` |
| visual algorithms / POST | active versioned visual-engine tail |
| normalized touch release | `js/interaction-v1020.js` |
| long-press recall prototype | `js/memory-recall-v1024.js` |
| mobile hide/show lifecycle | `js/mobile-visibility-v1024.js` |
| audio | `js/audio-engine-v050.js`, `js/audio-touch-v060.js`, `js/audio-mute-v105.js` |
| telemetry | telemetry modules |
| app frame/startup/pause/viewport | `sketch-v066.js` |
| PAU/MUT/UI/FS controls | `js/runtime-utility-controls-v105.js` |
| UI layout / memory text presentation | `style.css` |
| current script chain/cache key | `index.html` |

## 20. Source-of-truth / continuation rule

For a new session:

1. read `PROJECT_STATE.md` first;
2. verify `config.js` for actual defaults and `app.version`;
3. verify `index.html` for active modules, cache key and start-note;
4. inspect only the relevant active tail modules;
5. update docs at meaningful checkpoints.

Do not reconstruct current implementation from old version numbers or stale conversation memory when the repository can answer it directly.
