# DODREI

DODREI is a mobile-first browser media-art experiment built with **p5.js / JavaScript** and hosted on GitHub Pages.

The project began as `p5 Media Lab 01`; `DODREI` is now the artwork/project name. The repository path remains `experiments/p5-media-lab/` for continuity.

Current baseline: **v0.8.0**.

## Current study

The active build is PHOTO ONLY. Video code/assets may remain in the repository, but still images are the current visual material.

Interaction remains deliberately small:

- no touch: autonomous image composition;
- hold: four-band rupture and stronger audio processing;
- fast swipe while holding: additional recursive feedback above the configured threshold.

The current image archive is discovered from GitHub, while only a bounded decoded working set is kept resident.

## Start here

### Artwork

`index.html`

### Main runtime configuration

`config.js`

This is the canonical human-editable configuration file. It is ordinary JavaScript data with comments and contains no executable configuration logic.

Existing modules still read `window.P5LAB_CONFIG`; v0.8.0 defines the canonical object as:

```js
window.DODREI_CONFIG = { ... };
window.P5LAB_CONFIG = window.DODREI_CONFIG;
```

The alias avoids a large compatibility rewrite while the project name changes.

### Configuration schema

`config-schema.js`

The schema does **not** contain runtime values. It describes how the values in `config.js` should be understood:

- type;
- min/max/step;
- select options;
- read-only structural values;
- group descriptions;
- stable-ID collection behavior;
- import compatibility rules;
- comments used by the control-page exporter.

Fields without explicit schema metadata are still rendered by inferred type. This is intentional so future parameters do not disappear from the editor merely because schema metadata has not yet been added.

### Control page

`control/index.html`

Live path:

`/experiments/p5-media-lab/control/`

The Control page is static. It can:

- load the currently deployed `config.js`;
- load/save a browser-local draft with `localStorage`;
- import `.js`, `.json`, `.json5`, or text;
- accept pasted config text;
- merge compatible fields from older/newer configs;
- report missing, obsolete, invalid and newly accepted values;
- edit every current config value;
- reorder the visual mode playlist;
- enable/disable individual presets;
- enable/disable supported visual pipeline stages;
- edit image sets;
- download a canonical commented `config.js`;
- download plain JSON;
- copy the generated `config.js`.

GitHub Pages cannot write repository files. The normal workflow is therefore:

```text
CURRENT SITE config
        ↓
DODREI CONTROL
        ↓
edit / import / compare
        ↓
download config.js
        ↓
replace repository config.js
        ↓
commit
```

For detailed rules, read `CONFIG_GUIDE.md`.

## Config compatibility model

Two version numbers are intentionally separate:

```text
app.version          artwork/runtime version
meta.schemaVersion   configuration-shape version
```

An artwork update does not necessarily change the config schema.

Imports are **compatible partial merges**, not all-or-nothing replacements.

Current behavior:

- matching path + compatible type/range → import;
- current field missing from imported file → keep current-site value and warn;
- imported field absent from current config → ignore and mark obsolete;
- invalid type/range → ignore and mark incompatible;
- stable-ID collections → compare by `id`, not array index;
- image sets may introduce new IDs;
- preset/pipeline IDs not recognized by the current runtime are rejected;
- schema mismatch warns, then still attempts field-level compatibility.

This keeps old tuning files useful without pretending that incompatible structures are safe.

## Mode model

The user-facing mode sequence is `visual.presets`.

Each preset has a stable `id`, a visible `name`, an `enabled` flag and its existing effect flags.

The current engine supports:

```js
visual.modeControl.strategy = "sequence" | "shuffle"
visual.modeControl.startIndex
visual.modeControl.loop
```

Array order is the sequence order. Disabled presets are skipped.

## Visual pipeline model

The v0.8.0 visual pipeline is represented explicitly:

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

Each stage has a stable ID and an `enabled` value in `visual.pipeline`.

The current engine allows stage enable/disable but **does not allow pipeline reordering**. Order is locked because several stages depend on buffers produced by earlier stages. Keeping the pipeline represented as an ID list is still useful: later engines can unlock compatible ordering without changing the saved config format.

Telemetry remains outside this visual-stage list because it is rendered by the application orchestrator after the visual engine.

## Image archive and rolling working set

The archive is discovered through GitHub's public Contents API. `assets.js` remains a fallback.

Current defaults:

```text
20 decoded ACTIVE images
up to 5 STAGING images
5-second rotation interval
runtime decode concurrency 1
startup concurrency 3
selection policy: shuffle-bag
```

Selection remains a replaceable media-manager policy boundary.

### Image sets

Current default:

```js
imageSets: [
  { id: "default", subdir: "" }
]
```

Future sets can point to subfolders such as:

```text
assets/images/personA/
assets/images/personB/
```

The current runtime pools configured sets into the same shuffle-bag candidate system. Weighting/alternation is intentionally not implemented yet.

## Crop system

Each source draw receives an independent crop.

Current zoom default:

```text
1.0x ... 2.5x
```

v0.7.0+ crop placement calculates overflow created by both cover-fit and extra zoom, then chooses a legal random position over that complete overflow. This lets portrait sources reveal vertically hidden regions on wide viewports and vice versa.

`sourceCropPanFactor` remains in config for compatibility but is not directly used by the current v0.8 overflow-aware placement layer.

## Touch palette

The final rupture palette is now configuration data rather than hard-coded engine color values:

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

The current third band is the reduced-saturation red established in v0.6.8.

## Extensibility principles

- runtime values live in one canonical config;
- schema describes values but does not own them;
- configuration contains data, never arbitrary JavaScript logic;
- stable IDs identify ordered/structured items;
- import compatibility is path/ID based, not file-version equality;
- editor UI is generated from config + schema rather than hard-coded per parameter;
- unknown future scalar fields can still fall back to inferred controls;
- media selection remains separate from visual rendering;
- mode playlist remains separate from decoded-image rotation;
- pipeline representation remains separate from implementation details;
- local browser drafts are convenience only, never source of truth;
- GitHub remains implementation source of truth.

## Important files

- `config.js` — canonical runtime values;
- `config-schema.js` — editor/validation metadata;
- `control/index.html` — configuration UI;
- `control/control.js` — import/merge/edit/export logic;
- `control/style.css` — control-page presentation;
- `js/media-manager.js` — discovery, set metadata and rolling pool;
- `js/visual-engine-v070.js` — overflow-aware crop baseline;
- `js/visual-engine-v080.js` — config-driven mode/pipeline/palette layer;
- `sketch-v066.js` — current application orchestrator;
- `PROJECT_STATE.md` — current implementation state;
- `CONFIG_GUIDE.md` — configuration contract and workflow.

## Limitations

The configuration model is deliberately more extensible than the current artwork, but it is not intended to become a general-purpose visual programming language.

In particular:

- pipeline order is currently fixed;
- adding a completely new preset effect still requires engine code;
- adding a new media selection strategy still requires media-manager code;
- GitHub Pages cannot save changes back to the repository;
- exported `config.js` regenerates canonical comments from schema metadata rather than preserving arbitrary comments from an imported file;
- browser garbage-collection timing remains outside application control;
- Canvas2D/p5 pixel loops remain a performance ceiling for much heavier future effects.

Read `PROJECT_STATE.md` before major changes.
