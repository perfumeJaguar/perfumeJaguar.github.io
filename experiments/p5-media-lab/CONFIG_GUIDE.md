# DODREI Configuration Guide

Current config schema: **1**  
Current artwork/runtime: **1.0.24**  
Current config revision: **37**

## 1. Purpose

DODREI keeps runtime tuning in one canonical browser-side data file:

`config.js`

The file is intentionally readable/editable by hand and machine-readable by the static `control/` editor.

```text
config.js
   │ values
   ▼
DODREI runtime

config-schema.js
   │ meaning / validation / editor metadata
   ▼
DODREI CONTROL
```

The schema explains the config; it does not replace it.

## 2. Public browser configuration

These are artwork/runtime parameters, not secrets. GitHub Pages is a static public host, so `config.js` must never contain passwords, tokens, API secrets, private URLs, credentials, or other secret deployment data.

## 3. Canonical shape

```js
window.DODREI_CONFIG = {
  meta: {},
  app: {},
  timing: {},
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

`P5LAB_CONFIG` remains a compatibility alias for older modules.

## 4. Version model

Keep these separate:

```text
app.version
```
Artwork/runtime release. This is also consumed by runtime presentation/telemetry and must be updated whenever the displayed release changes.

```text
meta.schemaVersion
```
Configuration contract version. Change only for meaningfully incompatible config-shape changes.

```text
meta.configRevision
```
Human revision for tuning/config snapshots.

### Important v1.0.24 lesson

`index.html` can display a new start-note while `config.js app.version` still contains an older release string. That happened during v1.0.24: Pages had the new code, but telemetry/runtime presentation still showed `1.0.23` because `app.version` had not been updated.

Before declaring a deployment/version mismatch, verify both:

```text
index.html start-note / cache key
config.js app.version
```

## 5. Current canonical defaults

```text
app.version                 1.0.24
timing.compositionFps       30
timing.visualSpeedLevel     S2
timing.visualSpeedMultiplier 0.50
visual.sourceCropMinZoom    1.0
visual.sourceCropMaxZoom    8.0
visual.swipeFeedbackThreshold 0.15
visual.postCommonFx.masterEnabled true
visual.postCommonFx.order   HC -> GS -> FB -> ST -> GL
```

Canonical share shape:

```text
?fps=30&speed=S2&post=1&fx=HC,GS,FB,ST,GL&mode=photo-double-blend&crop=10-80
```

## 6. Stable IDs

Ordered object collections use stable IDs.

Example:

```js
presets: [
  {
    id: "photo-double-blend",
    name: "PHOTO_DOUBLE_BLEND",
    enabled: true
  }
]
```

The `id` is compatibility identity. Visible name or array position may change; the ID should not change casually.

This applies to:

- visual presets;
- visual pipeline stages;
- image sets.

## 7. Import / merge rules

DODREI CONTROL uses compatible partial merge.

- **Compatible**: current path/ID exists and imported value validates -> use imported value.
- **Missing**: current config has a value absent from imported file -> retain current-site value.
- **Obsolete**: imported path/ID is unknown -> ignore.
- **Invalid**: known path but wrong type/range/structure -> ignore.
- **Added**: collections that explicitly allow new IDs may accept them; current example is `media.imageSets`.

Preset and pipeline IDs are not open-ended because unknown effect/stage names do not create engine implementation.

A schema-version mismatch does not automatically reject the whole file. The editor warns and still attempts compatible path/ID-level merge.

## 8. Renamed fields

`config-schema.js` reserves an `aliases` map for migration.

```js
aliases: {
  "visual.oldThreshold": "visual.swipeFeedbackThreshold"
}
```

Prefer explicit migration aliases instead of indefinitely supporting duplicate field names.

## 9. Config is data, not code

Do not place functions, callbacks, arbitrary expressions or executable snippets inside the config object.

Bad:

```js
value: () => Math.random()
```

Good:

```js
strategy: "sequence"
swipeFeedbackThreshold: 0.15
```

Behavior belongs in modules; config selects supported behavior and supplies parameters.

## 10. Mode playlist

`visual.presets` is the current artwork mode playlist.

Current order:

```text
01 photo-double-blend
02 photo-feedback-crop
03 photo-rapid-crop
04 photo-shard-swap
05 photo-blend-cycle
06 photo-full
```

Current mode control:

```js
modeControl: {
  strategy: "sequence",
  startIndex: 0,
  loop: true,
  autoAdvance: false,
  manualButtonEnabled: true
}
```

Automatic mode advance is currently OFF.

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

The stage representation is stable-ID based, but the active runtime still owns the actual ordering/compatibility rules. Do not add an unknown stage in config and expect it to execute.

Global POST common FX are handled separately through `visual.postCommonFx` with ordered keys such as:

```text
BW GS LS BL FB GL ST CR HC DK VG
```

Current startup POST chain is:

```text
HC -> GS -> FB -> ST -> GL
```

## 12. Touch-related parameters

Current notable values:

```text
touchPlaybackSpeedMultiplier 0.50
swipeFeedbackThreshold       0.15
swipeFeedbackStrength        1.8
swipeFeedbackAlphaMin        42
swipeFeedbackAlphaMax        128
```

The threshold was lowered from `0.25` in v1.0.24 so small drags can trigger feedback. The retain/strength damping from v1.0.23 remains to avoid long drags saturating into a near-non-decaying feedback loop.

Touch rupture palette is grayscale only.

## 13. Image sets and residency

Current structure:

```js
imageSets: [
  { id: "default", subdir: "" }
]
```

Current archive/runtime values:

```text
archive files          96
active decoded limit   20
rotation batch         5
rotation interval      5 s
startup concurrency    3
runtime rotation load  sequential
```

Additional sets can be added as explicit subfolders and stable IDs. Future weighting/alternation/quotas belong in media-selection policy, not visual-effect code.

Visible scene selection is independent random-with-replacement. The MediaManager shuffle bag is only for resident working-set rotation.

## 14. Memory recall and narrative state

The v1.0.24 memory-recall prototype is implemented in `js/memory-recall-v1024.js`, not in `config.js` yet.

Current behavior:

```text
hold time             2000 ms
mapping               archive key/index -> deterministic placeholder fragment
placeholder fragments 24
archive images        96
```

Future explicit narrative content should preferably move into a dedicated data structure/file rather than bloating `config.js` with story content. Config can expose supported timing/visual parameters later, while memory text/link/state data should remain its own content layer.

## 15. Mobile visibility pause

`js/mobile-visibility-v1024.js` handles mobile-only `visibilitychange` pause/resume. This behavior is code-owned, not currently configurable.

It pauses only when the page becomes hidden and resumes only if the module itself caused the pause. User PAU state remains authoritative.

## 16. Local drafts

The Control page may store a browser `localStorage` draft. This is convenience only, not a backup or source of truth.

Important tuning states should be exported and/or committed to Git.

## 17. Static deployment workflow

Normal workflow:

```text
1. Open DODREI CONTROL (optional)
2. Load current site / local draft / file / pasted config
3. Edit and review warnings
4. Export config.js if using Control
5. Replace config.js
6. Commit
7. Verify index.html start-note/cache key
8. Verify config.js app.version
9. Verify live runtime/telemetry
```

The static browser control page has no repository write credentials.

## 18. Adding a parameter

Preferred sequence:

```text
1. Add runtime value to config.js.
2. Make module code read that path.
3. Add config-schema metadata if useful.
4. Test Control import/export.
5. Update README / PROJECT_STATE / architecture docs when behavior is user-visible or structural.
```

## 19. Current limitations

The config/control system does not yet provide:

- dependency rules between fields;
- full semantic pair validation for every min/max relationship;
- GitHub write-back from the public control page;
- undo/redo history;
- general graph/node editing;
- automatic plugin discovery;
- a formal memory/narrative content schema;
- arbitrary POST graph reordering beyond currently supported runtime behavior.

## 20. Source of truth

For continuation work:

1. read `PROJECT_STATE.md`;
2. verify `config.js`;
3. verify `index.html` active script chain/cache key;
4. inspect the active tail modules only as needed.

Do not reconstruct current defaults from old versioned module names or stale prose.
