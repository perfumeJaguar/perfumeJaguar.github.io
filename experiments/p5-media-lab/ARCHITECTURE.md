# DODREI — Architecture

Current artwork/runtime: **v0.8.0**  
Current config schema: **1**

## 1. Design objective

DODREI has two simultaneous purposes:

1. operate as a coherent browser-based media artwork;
2. act as a reusable laboratory for browser media-system architecture.

The current architecture favors explicit modules, bounded mobile cost, readable state, and a configuration model that can be reused in later projects.

## 2. Runtime graph

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
                                            ▼
                                        Telemetry
```

The project is currently PHOTO ONLY. Legacy video-related modules may remain for continuity, but active artwork behavior is based on still-image pools, audio, interaction, visual processing, and telemetry.

## 3. Application frame sequence

The current orchestrator runs:

1. `Interaction.update()`
2. `MediaManager.update()`
3. `VideoAnalyzer.update()`
4. `AudioEngine.update()`
5. `VisualEngine.render()`
6. `Telemetry.render()`

Telemetry remains last so it stays legible after heavy visual processing.

## 4. Configuration architecture

v0.8.0 adds a distinct configuration layer.

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

Canonical runtime data.

It is designed to be:

- readable by hand;
- directly executable as a classic browser script;
- easy to replace through Git;
- compatible with the existing `P5LAB_CONFIG` module interface.

Canonical object:

```js
window.DODREI_CONFIG = { ... };
window.P5LAB_CONFIG = window.DODREI_CONFIG;
```

### `config-schema.js`

Editor metadata, not runtime defaults.

It describes:

- value type;
- bounds and steps;
- select options;
- structural read-only fields;
- collection identity rules;
- top-level group presentation;
- migration aliases.

A missing schema field does not hide the runtime parameter. Scalar control type is inferred from the live config.

### `control/`

Static editor.

It has no server credentials and cannot write GitHub directly.

It supports:

- current deployed config;
- browser-local drafts;
- file import;
- pasted JSON / JSON5 / config.js;
- compatible partial merge;
- change visualization;
- canonical config.js export.

## 5. Compatibility model

Config compatibility is semantic, not purely version-number based.

Scalar identity:

```text
object path
```

Structured collection identity:

```text
stable item id
```

Examples:

```text
visual.swipeFeedbackThreshold
visual.presets.photo-rgb-tear
visual.pipeline.touch-rupture
media.imageSets.default
```

Import does not replace the entire config blindly. Compatible current fields are merged into current-site defaults.

This allows older tuning files to survive later additions.

## 6. MediaManager

Primary responsibilities:

- discover image archive entries;
- attach `setId` metadata;
- keep only a bounded decoded working set;
- stage replacements;
- evict old decoded references;
- isolate candidate-selection policy from renderer behavior.

Current defaults:

```text
archive: lightweight metadata
active decoded images: 20
staging: up to 5
runtime load concurrency: 1
startup concurrency: 3
rotation interval: 5 s
candidate policy: shuffle-bag
```

Future image-set weighting or alternation belongs here, not inside effects.

## 7. Image-set boundary

Current configuration:

```js
imageSets: [
  { id: "default", subdir: "" }
]
```

Stable set IDs make later structures possible without changing image entries or rendering code.

Possible future policy examples:

```text
strict alternation A/B
weighted set selection
quota per active pool
unseen-first per set
temporary set exclusion
cross-set pairing
```

These should be implemented as selection strategies.

## 8. Visual mode system

`visual.presets` is the current mode playlist.

Each mode contains:

- stable `id`;
- visible `name`;
- `enabled`;
- effect-selection flags.

The engine consumes only enabled presets.

`modeControl` currently supports:

```text
sequence
shuffle
```

Sequence uses array order.

Shuffle uses a bag of enabled preset indexes and avoids immediate repetition where possible.

## 9. Visual pipeline

The current stage graph is linear:

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

v0.8.0 reads each stage's `enabled` value from config.

The current pipeline order is locked.

This is a deliberate boundary: configuration can select and parameterize supported operations, but does not yet become a general visual graph language.

The representation still uses stable stage IDs so later engines can unlock compatible reordering without changing saved config shape.

## 10. Crop architecture

Every source draw receives an independent crop.

v0.7.0 introduced overflow-aware placement:

1. calculate cover-fit from real source dimensions;
2. apply extra artistic zoom;
3. calculate horizontal and vertical overflow;
4. choose a random point over legal overflow;
5. add modest touch bias;
6. clamp to legal limits.

Current zoom defaults:

```text
1.0x ... 2.5x
```

The relevant target aspect ratio is the current render buffer / browser viewport.

## 11. Touch rupture

Current touch flow:

```text
current visual stage
      ↓
lower-resolution monochrome contrast pass
      ↓
horizontal rupture bands
      ↓
four-band palette quantization
```

Mobile rupture calculation is intentionally lower resolution and frame-skipped.

v0.8.0 moves final palette thresholds/colors into config.

This creates a clean boundary between the rupture algorithm and artwork color tuning.

## 12. Swipe feedback

Swipe feedback is conditional:

```text
pressed == true
AND
normalized swipe speed > swipeFeedbackThreshold
```

Current default threshold:

```text
0.30
```

Stationary hold does not trigger this second recursive layer.

## 13. Audio

The stable audible path uses a native HTML audio element.

A parallel analysis/effect layer provides:

- PCM windowing;
- waveform;
- filter control;
- delay;
- feedback;
- distortion;
- subtle playback-rate movement;
- touch-dependent wet amount.

Audio remains separate from media caching and visual mode selection.

## 14. Interaction

Mouse and one-finger touch are normalized into one state.

Important concepts:

```text
x
y
pressure
pressed
swipeSpeed
```

This small interface keeps downstream audio/visual systems independent from browser event details.

## 15. Telemetry

Telemetry is both instrumentation and artwork.

It exposes real state while allowing restrained cosmetic corruption.

It remains outside the configurable visual-stage list because the application orchestrator renders it after the visual engine.

## 16. Mobile performance strategy

Current principles:

- `pixelDensity(1)`;
- capped processing-buffer long edge;
- reduced-resolution analysis;
- bounded decoded image pool;
- sequential runtime decode;
- reduced rupture buffer on mobile;
- rupture recalculation every second frame on mobile;
- feedback at scaled resolution;
- no active halation/bloom pass;
- native-size telemetry after processed visuals.

The browser still controls garbage collection and HTTP cache behavior.

## 17. Versioned engine chain

The project currently keeps versioned visual-engine files because later versions inherit prior behavior.

Relevant tail:

```text
visual-engine-v068.js
        ↓
visual-engine-v070.js
        ↓
visual-engine-v080.js
```

v0.8.0 is intentionally additive.

It does not rewrite every legacy `P5Lab*` class name merely to rename the project. Public project identity and config are now DODREI while internal compatibility names can be migrated gradually.

## 18. Editing map

| Goal | Primary file |
|---|---|
| tune current artwork | `config.js` |
| edit through UI | `control/` |
| change validation/editor metadata | `config-schema.js` |
| change image discovery/rotation policy | `js/media-manager.js` |
| change base visual algorithms | versioned visual-engine files |
| change current mode/pipeline control layer | `js/visual-engine-v080.js` |
| change audio behavior | `js/audio-engine-v050.js`, `js/audio-touch-v060.js` |
| change normalized input | `js/interaction.js` |
| change telemetry | `js/telemetry.js` |
| change application frame order/start/fullscreen | `sketch-v066.js` |

## 19. Deliberate boundaries

The configuration system should not become an accidental programming language.

Config may contain:

- values;
- stable IDs;
- ordered lists;
- enabled flags;
- strategy names;
- supported mode identifiers.

Config should not contain:

- arbitrary JavaScript functions;
- executable conditions;
- callbacks;
- code strings;
- runtime plugin source.

When new behavior is needed, implement behavior in a module, then expose a clean data contract in config.

## 20. Future architectural options

If the current model proves useful, later projects can extend it toward:

- dependency-aware schema validation;
- reusable config-schema package;
- formal migrations between schema versions;
- config diff view;
- named config snapshots;
- per-device profiles;
- media-selection strategy registry;
- reorderable compatible visual stages;
- WebGL/Three.js shader stages;
- project-specific control-page themes;
- a shared DODREI-derived control shell used by other artworks.

These are directions, not current commitments.
