# DODREI Configuration Guide

Current config schema: **1**  
Current artwork/runtime: **0.8.0**

## 1. Purpose

DODREI keeps runtime tuning in a single canonical data file:

`config.js`

The file is intentionally readable and editable by hand. It is also machine-readable by `control/`.

The basic contract is:

```text
config.js
   │ values
   ▼
DODREI runtime

config-schema.js
   │ meaning / validation / UI metadata
   ▼
DODREI CONTROL
```

The schema never replaces the config. It only explains it.

## 2. Why config.js instead of .env

These values are browser runtime/artwork parameters, not secret deployment environment variables.

A GitHub Pages site cannot safely use `.env` in the same way as a server application. DODREI therefore uses a public runtime config object.

Do not place passwords, GitHub tokens, API secrets, private URLs, or credentials in `config.js`.

## 3. Canonical shape

```js
window.DODREI_CONFIG = {
  meta: {},
  app: {},
  render: {},
  media: {},
  interaction: {},
  audio: {},
  visual: {},
  telemetry: {},
  control: {}
};

window.P5LAB_CONFIG = window.DODREI_CONFIG;
```

`P5LAB_CONFIG` is currently a compatibility alias for older engine modules.

## 4. Version model

Keep these separate:

```text
app.version
```

Artwork/runtime release. Change this when behavior or implementation changes meaningfully.

```text
meta.schemaVersion
```

Configuration contract version. Change this only when the config shape becomes meaningfully incompatible or requires migration logic.

```text
meta.configRevision
```

Optional human revision for tuning snapshots.

A v0.9.0 artwork can still use schema 1.

## 5. Stable IDs

Ordered object collections use stable IDs.

Example:

```js
presets: [
  {
    id: "photo-feedback-crop",
    name: "PHOTO_FEEDBACK_CROP",
    enabled: true
  }
]
```

The `id` is the compatibility identity.

The visible `name` can change.  
The array position can change.  
The `id` should not change casually.

The same principle applies to:

- visual presets;
- visual pipeline stages;
- image sets.

This allows old files to be compared by meaning instead of array position.

## 6. Import rules

DODREI CONTROL uses compatible partial merge.

### Compatible

The current config contains the path/ID and the imported value passes current validation.

Action: imported value is used.

### Missing

The current config contains a value that does not exist in the imported file.

Action: current-site value is retained.

This is normal when importing an older file into a newer build.

### Obsolete

The imported file contains a path or stable ID that the current config/runtime does not recognize.

Action: ignored.

### Invalid

The path exists, but type/range/structural validation fails.

Action: ignored.

### Added

Some collections explicitly allow new IDs.

Current example: `media.imageSets`.

Action: accepted.

Preset and pipeline IDs are not open-ended because adding an unknown effect/stage does not magically add engine implementation.

## 7. Schema mismatch

A different `meta.schemaVersion` does not automatically reject the whole file.

The editor warns about the mismatch and still attempts path/ID-level compatible merge.

This is deliberate. A file can be partly useful even when its schema differs.

When a future schema change truly requires transformation, add a migration alias/rule to `config-schema.js`.

## 8. Renamed fields

`config-schema.js` reserves an `aliases` map.

Example:

```js
aliases: {
  "visual.oldThreshold": "visual.swipeFeedbackThreshold"
}
```

When a field is renamed, prefer an explicit migration alias instead of supporting both names indefinitely.

## 9. Comments

Hand-written `config.js` comments are useful and encouraged.

However, imported comments are not treated as data.

The control page:

1. parses values;
2. edits/merges the data model;
3. exports a newly formatted canonical `config.js`;
4. regenerates standard comments from schema metadata.

Therefore arbitrary comments from an imported file are not guaranteed to survive export.

This is intentional. Compatibility decisions must never depend on prose comments.

## 10. Mode playlist

`visual.presets` is the current artwork mode playlist.

Array order is the sequence order.

Each mode can be disabled without removing it:

```js
{
  id: "photo-rgb-tear",
  enabled: false,
  ...
}
```

Current mode-control options:

```js
modeControl: {
  strategy: "sequence",
  startIndex: 0,
  loop: true
}
```

`sequence` advances in array order.

`shuffle` chooses among enabled presets without immediately repeating the current preset.

`loop: false` currently applies to sequential playback and holds the final enabled mode.

## 11. Visual pipeline

Current stage IDs:

```text
preset-composition
common-crush
touch-rupture
preset-feedback
swipe-feedback
vignette
waveform
```

The current v0.8.0 engine honors `enabled`.

The current engine does not honor arbitrary reordering.

Why: the stages are not independent nodes yet. Some consume buffers produced by previous stages.

The config uses an ordered ID list anyway because it provides a clean future migration path toward reorderable compatible stages.

Do not add an unknown pipeline stage in config and expect it to execute. New stage implementation belongs in engine code first.

## 12. Image sets

Current structure:

```js
imageSets: [
  { id: "default", subdir: "" }
]
```

A new folder set can be added without engine changes:

```js
imageSets: [
  { id: "person-a", subdir: "personA" },
  { id: "person-b", subdir: "personB" }
]
```

Current media selection pools configured sets together.

Future weighting, quotas, alternation, and cross-set rules should be implemented as media selection policies, not as visual-effect logic.

## 13. Local drafts

The Control page automatically stores the working config in browser `localStorage`.

This is convenience only.

It is not:

- a backup guarantee;
- repository history;
- portable between browsers/devices;
- source of truth.

Export important tuning states to a file and/or commit them to Git.

## 14. Static deployment workflow

Normal workflow:

```text
1. Open DODREI CONTROL
2. Load CURRENT SITE / LOCAL DRAFT / FILE / PASTED TEXT
3. Edit
4. Review modified count and import warnings
5. Download config.js
6. Replace experiments/p5-media-lab/config.js
7. Commit
8. Verify live DODREI version / ENGINE telemetry
```

ChatGPT/GitHub tooling may also update the repository directly when explicitly requested, but the browser control page itself has no repository write credentials.

## 15. Adding a new scalar parameter

Preferred sequence:

```text
1. Add the runtime value to config.js.
2. Make engine/module code read that path.
3. Add schema metadata if useful.
4. Test the Control page.
5. Document behavior if it affects architecture.
```

Even before step 3, the Control page should render ordinary scalar values using inferred type.

## 16. Adding a new structured collection

Use stable IDs if:

- items can reorder;
- items can be enabled/disabled;
- items may be compared across versions;
- human names can change independently.

Then add an entry to `schema.collections`.

Avoid using array index as semantic identity.

## 17. Boundary: config is data, not code

Do not put functions, conditionals, callbacks, arbitrary JavaScript expressions, or executable snippets inside the config object.

Bad:

```js
value: () => Math.random()
```

Bad:

```js
condition: "if (touch > .3) ..."
```

Good:

```js
strategy: "shuffle"
```

Good:

```js
swipeFeedbackThreshold: 0.30
```

The engine owns behavior. Config chooses among supported behavior and supplies parameters.

This boundary is what makes validation, import compatibility, editing UI and future migrations tractable.

## 18. Current limitations

The control/schema system does not yet provide:

- dependency rules between fields;
- automatic semantic validation such as `min <= max` for every pair;
- GitHub write-back;
- undo/redo history;
- diff visualization between two arbitrary external files;
- formal JSON Schema compliance;
- arbitrary pipeline graph editing;
- plugin discovery.

Those are possible later. They are intentionally outside v0.8.0 until the current model proves useful in real artwork iteration.
