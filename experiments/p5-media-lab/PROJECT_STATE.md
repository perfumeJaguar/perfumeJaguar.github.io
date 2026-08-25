# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.8.0`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`  
Live artwork: `https://perfumeJaguar.github.io/experiments/p5-media-lab/`  
Live control page: `https://perfumeJaguar.github.io/experiments/p5-media-lab/control/`

## Project identity

The browser media-art project previously documented as `p5 Media Lab 01` is now named **DODREI**.

The repository path and most internal legacy `P5Lab*` class/global names remain unchanged for compatibility. Do not perform a broad namespace/folder rename unless explicitly requested.

`DODREI` is the user-facing project/artwork name.

## Current artistic baseline

The experiment remains PHOTO ONLY.

Video files/code may remain in the repository but are not part of the current active artistic baseline.

Primary material:

- automatically discovered still-image archive;
- one original MP3;
- mouse / one-finger touch;
- autonomous visual mode playlist;
- terminal-like telemetry.

Mobile portrait remains the primary target. The first gesture requests fullscreen.

## v0.8.0 focus — configuration/control architecture

The main change in v0.8.0 is a reusable configuration model intended to support both DODREI and possible future media-art projects.

The model has three layers:

```text
config.js
  canonical runtime values
        │
        ├──────────────> artwork runtime
        │
        ▼
config-schema.js
  type / range / identity / compatibility metadata
        │
        ▼
control/
  load / import / merge / edit / export
```

### Canonical runtime config

`config.js` now defines:

```js
window.DODREI_CONFIG = { ... };
window.P5LAB_CONFIG = window.DODREI_CONFIG;
```

The second line is a compatibility bridge for existing modules.

The config remains ordinary JavaScript data with comments so it is easy to edit manually.

It must not contain arbitrary executable functions/logic.

### Config identity/versioning

New metadata:

```text
meta.project = DODREI
meta.schemaVersion = 1
meta.configRevision = 1
```

Important distinction:

- `app.version` = artwork/runtime release;
- `meta.schemaVersion` = configuration contract/shape;
- `meta.configRevision` = optional tuning revision.

Do not increment schemaVersion merely because the artwork version changes.

## DODREI CONTROL

New static control page:

`control/index.html`

Supporting files:

- `control/control.js`
- `control/style.css`
- `config-schema.js`

The page can:

- read the currently deployed config;
- use a browser-local draft;
- import a local file;
- import pasted config text;
- parse JSON, JSON5 and canonical config.js text;
- merge compatible values;
- display compatibility reports;
- edit config fields;
- reorder the visual mode playlist;
- enable/disable modes;
- add/edit image sets;
- enable/disable supported visual pipeline stages;
- edit palette arrays and other structured values;
- download commented canonical `config.js`;
- download plain JSON;
- copy canonical config text.

GitHub Pages remains static. The control page does **not** contain GitHub credentials and cannot write back to the repository.

Normal manual workflow:

```text
deployed config
    ↓
CONTROL
    ↓
edit
    ↓
download config.js
    ↓
replace repository config.js
    ↓
commit
```

Browser `localStorage` is a convenience draft only and is not source of truth.

## Import/compatibility behavior

Imports use compatible partial merge rather than all-or-nothing replacement.

Rules:

- same current path + compatible value → import;
- current path missing from imported file → retain current-site value, warn as missing;
- imported path absent from current config → ignore as obsolete;
- incompatible type/range → ignore as invalid;
- schema mismatch → warn, then still attempt field-level merge;
- stable-ID structured collections compare by ID, not by array index.

Current stable-ID collections:

- `media.imageSets`
- `visual.presets`
- `visual.pipeline`

New `media.imageSets` IDs may be imported/created.

Unknown preset/pipeline IDs are rejected because config cannot create engine implementation by itself.

`config-schema.js` reserves migration aliases for future renamed paths.

## Comment policy

Hand-editing comments in `config.js` is encouraged.

However, imported comments are not semantic data.

When CONTROL exports a file, it regenerates canonical formatting/comments from schema metadata rather than trying to preserve arbitrary imported comment placement.

Compatibility must never depend on comments.

## Mode system — v0.8.0

`visual.presets` is the actual user-facing mode playlist.

Each entry now has:

```text
id
name
enabled
effect flags
```

Stable `id` is the compatibility anchor.

Array order is sequence order.

New `visual.modeControl`:

```js
{
  strategy: "sequence",
  startIndex: 0,
  loop: true
}
```

Supported strategies:

- `sequence`
- `shuffle`

Disabled presets are skipped.

`loop: false` currently applies to sequence mode and holds on the last enabled preset.

## Visual pipeline — v0.8.0

Current visual pipeline is now explicitly represented in config:

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

Each stage has:

```text
id
enabled
locked
```

`js/visual-engine-v080.js` now honors stage `enabled` values.

Pipeline order is currently locked because the stages are not independent nodes and several depend on previous buffers.

The ID-list representation is intentionally forward-compatible with a later engine that may permit safe reordering.

Telemetry is not in this list; the application orchestrator renders it after the visual engine.

## Touch palette — v0.8.0

The four-band touch palette is no longer hard-coded only in v0.6.8 engine logic.

Current config:

```js
touchPalette: {
  thresholds: [64, 128, 192],
  colors: [
    [0, 0, 0],
    [72, 72, 72],
    [238, 94, 90],
    [246, 246, 244]
  ]
}
```

The current reduced-saturation red remains approximately `RGB(238, 94, 90)`.

`visual-engine-v080.js` applies these configured palette values.

## Image system baseline carried from v0.7.0

The complete archive is discovered through GitHub's public Contents API.

`assets.js` remains fallback.

Rolling decoded working set:

- active decoded pool: `20`;
- staging pool: up to `5`;
- runtime rotation interval: `5` seconds after previous swap completes;
- runtime staging/decode concurrency: `1`;
- initial load concurrency: `3`;
- candidate selection: shuffle bag.

Old decoded references are removed on eviction so objects become garbage-collection eligible.

Browser garbage-collection timing remains outside application control.

## Candidate-selection policy

Current selection remains `shuffle-bag`.

- archive order shuffled per page session;
- current active/staging entries excluded from replacement candidates;
- unused candidates consumed before a new cycle where possible;
- next candidate cycle shuffled again.

Candidate selection remains isolated from visual source selection.

Future per-set weighting/alternation should be implemented in the media-manager policy layer.

## Image sets

Current default:

```js
imageSets: [
  { id: "default", subdir: "" }
]
```

Additional explicit subfolders may be configured.

Current set behavior still pools all configured sets into the generic shuffle-bag system.

Not yet implemented:

- per-set weighting;
- strict person-A/person-B alternation;
- quotas;
- recursive arbitrary folder discovery.

Do not add fake config fields for unsupported set policies. Implement the policy first, then expose its data contract.

## Crop system baseline

Current artistic zoom range:

```text
1.0x ... 2.5x
```

v0.7.0 overflow-aware crop remains the baseline.

For every source draw:

1. calculate cover-fit from actual source dimensions to current render buffer;
2. apply random zoom;
3. calculate total legal X/Y overflow;
4. choose random position over overflow;
5. add touch bias;
6. clamp to legal overflow.

This allows normally hidden portrait top/bottom regions to appear on wide viewports and equivalent left/right traversal for wide images on portrait displays.

`visual.sourceCropPanFactor` remains in config for compatibility but is not directly used by the final overflow-placement logic in v0.8.0.

## Touch / swipe baseline

Touch corruption pipeline remains:

```text
preset composition
→ PHOTO_CRUSH
→ touch rupture
→ optional preset feedback
→ optional fast-swipe feedback
→ vignette / waveform
```

Fast swipe feedback default threshold:

```text
0.30
```

Stationary press does not activate the second swipe-feedback layer.

Mobile rupture baseline remains:

- resolution scale `0.50`;
- calculation every second rendered frame;
- skipped frames reuse previous rupture output;
- new press forces an immediate refresh.

## Performance baseline

Still active:

- `pixelDensity(1)`;
- bounded main processing buffer;
- feedback at reduced resolution;
- mobile rupture at reduced resolution;
- mobile rupture frame skip;
- sequential runtime image decoding;
- bounded decoded image pool;
- halation/bloom removed.

Real-device testing should continue to watch both FPS and memory over several minutes.

## Audio baseline

Stable audible path:

native HTML audio element.

Parallel Web Audio analysis/effect layer provides:

- PCM analysis;
- waveform;
- filter;
- delay;
- feedback;
- distortion;
- subtle playback-rate modulation;
- touch-controlled wet layer.

## Telemetry

Telemetry remains a foreground visual subsystem.

It exposes real internal state but may cosmetically corrupt labels/characters.

Useful runtime authority:

- visible app version;
- `ENGINE` version;
- resident image count;
- archive count;
- staging count;
- image-set count;
- rotation state/cycle count.

After deployment/cache propagation, current expected engine authority is:

```text
ENGINE 0.8.0
```

## Versioned engine chain

Current active tail:

```text
visual-engine-v068.js
→ visual-engine-v070.js
→ visual-engine-v080.js
```

v0.8.0 intentionally extends v0.7.0 rather than rewriting the entire visual engine.

Do not delete older engine files while active inheritance depends on them.

## Primary edit points

- `config.js` — first place for current tuning;
- `config-schema.js` — editor metadata/validation/compatibility;
- `control/` — static configuration editor;
- `js/media-manager.js` — archive, set metadata, rolling pool, candidate policy;
- `js/visual-engine-v070.js` — overflow-aware crop;
- `js/visual-engine-v080.js` — mode/pipeline/palette config layer;
- `js/audio-engine-v050.js` + `js/audio-touch-v060.js` — audio;
- `js/interaction.js` — input state;
- `js/telemetry.js` — terminal UI;
- `sketch-v066.js` — application orchestration.

## Configuration architecture principles

Keep these rules unless later evidence suggests a better model:

1. one canonical runtime config;
2. schema describes config but does not duplicate defaults;
3. config contains data, never arbitrary executable logic;
4. stable IDs identify ordered semantic items;
5. imports merge by current paths/IDs, not by blind file replacement;
6. schema mismatch does not automatically destroy useful compatible values;
7. UI is generated from config + schema;
8. unknown future scalar values should still be editable by inferred type;
9. local drafts are never source of truth;
10. repository remains source of truth;
11. expose only behavior the current engine actually implements;
12. avoid turning the config into a custom programming language.

## Known limitations / next checks

- Verify live title/start screen shows DODREI v0.8.0.
- Verify telemetry reports `ENGINE 0.8.0`.
- Open `/control/` on desktop and mobile.
- Verify CURRENT SITE loads all sections.
- Verify local draft survives refresh.
- Verify downloaded `config.js` can replace repository `config.js` without syntax error.
- Verify pasted current config round-trips with zero incompatible values.
- Test import of an intentionally old/partial config and confirm missing values remain current defaults.
- Reorder preset playlist and confirm runtime order follows it.
- Disable a preset and confirm it is skipped.
- Test `sequence` and `shuffle`.
- Disable individual visual pipeline stages and confirm actual runtime effect.
- Edit touch palette red and confirm runtime color changes.
- Confirm pipeline UI does not imply that current stage order is reorderable.
- CONTROL currently does not perform advanced cross-field semantic validation such as every possible `min <= max` dependency.
- JSON5 parsing depends on the external JSON5 CDN on the control page.
- CONTROL does not provide GitHub write-back.
- Arbitrary user comments are regenerated, not preserved, on canonical export.
- Internal `P5Lab*` namespaces remain legacy compatibility names.

## Reuse potential

DODREI v0.8.0 should be treated as the first prototype for a reusable artwork-control model.

Possible future extraction, only after real use validates the model:

- reusable config/schema core;
- reusable control shell;
- formal migration registry;
- diff view;
- named snapshots;
- per-device profiles;
- dependency-aware validation;
- plugin/strategy registry;
- reorderable safe stage graph;
- renderer-specific control adapters.

Do not generalize these prematurely. DODREI should remain a working artwork first.

## Continuity rule

For future DODREI work:

1. read this file first;
2. verify implementation against GitHub;
3. treat `config.js` as current runtime values;
4. treat `config-schema.js` as editor/compatibility metadata;
5. do not reconstruct current implementation only from conversation memory;
6. update this document at meaningful checkpoints.
