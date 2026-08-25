# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.10.1`  
Current visual engine version: `0.10.0`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`  
Live artwork: `https://perfumeJaguar.github.io/experiments/p5-media-lab/`  
Live control page: `https://perfumeJaguar.github.io/experiments/p5-media-lab/control/`

## Project identity

The artwork/project name is **DODREI**. Legacy `P5Lab*` internal names and the `p5-media-lab` folder remain for compatibility. Do not broadly rename them unless explicitly requested.

GitHub is the implementation source of truth.

## Current artistic baseline

PHOTO ONLY. Video modules/assets may remain but are not current visual material.

Primary behavior:

- automatically discovered still-image archive;
- one original MP3;
- mouse / one-finger touch;
- hold -> high-contrast four-band rupture;
- fast swipe -> recursive feedback;
- upper-left `›` -> manual next mode;
- upper-left FPS number -> cycle composition cadence `15 / 24 / 30 / 60`;
- telemetry remains a foreground visual subsystem.

Automatic mode advancement is currently OFF.

## v0.10.1 — runtime cadence control

A small `composition-fps-button` is now rendered directly below the existing mode-step button.

```text
[ › ]  mode step
[30 ]  composition FPS
```

Each tap cycles:

```text
15 -> 24 -> 30 -> 60 -> 15 ...
```

Implementation is intentionally lightweight:

- `js/mode-control-ui.js` owns both small runtime controls;
- the button writes directly to `P5LAB_CONFIG.timing.compositionFps`;
- `visual-engine-v100.js` already reads that value dynamically, so engine code is unchanged;
- button pointer/click events stop propagation and should not activate the canvas touch effect;
- telemetry emits `COMPOSITION FPS <value>` on each change;
- the button shows the live value rather than a generic label.

Versioning:

```text
app.version = 0.10.1
meta.configRevision = 5
ENGINE = 0.10.0
```

No new engine version is required because the temporal engine implementation itself did not change.

## v0.10.0 — temporal cadence model

The outer p5 loop still targets:

```text
app.targetFps = 60
```

This is the maximum requested render cadence, not a guarantee. Real devices may fluctuate below it.

Preset composition has an independent sample-and-hold cadence:

```js
timing: {
  compositionFps: 30,
  timeReferenceFps: 60,
  maxDeltaMs: 100,
}
```

Recommended test values for `compositionFps`:

```text
15 / 24 / 30 / 60
```

Default is `30`.

### Temporal split

```text
WALL CLOCK
   │
   ├── PRESET COMPOSITION
   │     target 30fps by default
   │     redraw only when cadence interval is due
   │     otherwise hold previous composition buffer
   │
   └── POST FX / DISPLAY
         runs every available outer render frame
         actual rate may be 60, 30, 20, etc.
```

Lowering composition cadence does **not** globally call `frameRate(15/24/30)` and does not deliberately slow the whole application.

The intended visual result is stepped source/composition motion with smoother post processing whenever the device has headroom.

### What happens under real performance drops

If the device itself falls from 60fps to 20–30fps, post FX cannot continue physically rendering at 60fps. There are fewer render callbacks.

v0.10.0 therefore time-normalizes selected recursive feedback behavior using p5 `deltaTime`.

Reference behavior:

```text
60fps -> frame ratio ≈ 1
30fps -> frame ratio ≈ 2
20fps -> frame ratio ≈ 3
```

The time sample is capped by:

```text
maxDeltaMs = 100
```

This follows ordinary transient slowdowns but prevents tab/background stalls from producing one huge transform.

### Time-normalized feedback values

Preset feedback:

- recursive scale;
- previous-frame retention alpha;
- black background fade.

Swipe feedback:

- recursive scale;
- previous-frame retention alpha;
- black fade;
- pointer-directed drift distance.

Implementation patterns:

```text
per-frame multiplicative value
  -> pow(valueAtReferenceFps, frameRatio)

retain alpha
  -> pow(normalizedRetain, frameRatio)

fade alpha
  -> 1 - pow(1 - normalizedFade, frameRatio)
```

### Intentionally frame-dependent behavior

Do NOT automatically time-normalize everything.

Currently left frame-dependent on purpose:

- current/source injection alpha inside feedback;
- rupture band/random texture;
- glitch/random corruption.

Reason: DODREI should keep some visible relationship to actual computational stress. When the device becomes overloaded, fine texture may change even though the larger feedback timing remains more stable.

This distinction is an architectural principle worth preserving:

```text
TIME-BASED behavior
  stable wall-clock motion / decay

FRAME-BASED behavior
  texture / glitch / computational damage
```

## v0.9.1 — common crush disabled

The global `common-crush` pipeline stage remains implemented but is OFF by default:

```js
{ id: "common-crush", enabled: false, locked: true }
```

Its parameters remain in config for reversible experiments.

## v0.9.0 — performance + manual mode baseline

Still active:

- mobile main processing long edge `720`;
- desktop long edge `1280`;
- GPU four-band touch palette with CPU fallback;
- upper-left manual mode button;
- automatic visual-mode advancement OFF;
- `app.modeDurationSec = 11` retained for later restoration.

## Touch rupture

Current palette:

```text
BLACK      [0,0,0]
DARK GRAY  [72,72,72]
MUTED RED  [238,94,90]
NEAR WHITE [246,246,244]
```

The final palette mapping uses the v0.9 p5 filter shader when supported. CPU pixel-loop fallback remains available.

Mobile rupture baseline:

- resolution scale `0.50`;
- desktop scale `0.70`;
- mobile recalculation every second rendered frame;
- fresh gesture forces immediate refresh.

## Current mode system

`visual.presets` is the actual mode playlist.

Current modes:

- PHOTO_FEEDBACK_CROP
- PHOTO_RAPID_CROP
- PHOTO_RGB_TEAR
- PHOTO_SHARD_SWAP
- PHOTO_DOUBLE_BLEND
- PHOTO_BLEND_CYCLE
- PHOTO_FULL
- LUMA_BLOCKS
- LUMA_VOID
- LUMA_MONO
- LUMA_DITHER
- LUMA_PULSE

Stable preset IDs are compatibility anchors. Disabled presets are skipped.

Current mode control:

```js
strategy: "sequence"
startIndex: 0
loop: true
autoAdvance: false
manualButtonEnabled: true
```

`sequence | shuffle` policy is shared by manual and future automatic advancement.

## Current visual pipeline

```text
preset-composition   ON   cadence-limited to 30fps default
common-crush        OFF
touch-rupture       ON
preset-feedback     ON
swipe-feedback      ON
vignette            ON
waveform            ON
```

Order is locked.

## Image system baseline

Archive discovery uses GitHub public Contents API with `assets.js` fallback.

Resident decoded pool:

```text
20 ACTIVE
up to 5 STAGING
runtime decode concurrency 1
startup concurrency 3
rotation interval 5s
selection policy shuffle-bag
```

Candidate selection remains separate from effects.

Unused candidates are consumed before reshuffling where possible; active/staging entries are excluded from replacements.

Image sets remain folder-oriented and stable-ID based. Current generic set pooling is ready for future personA/personB folders, but weighting/alternation/quotas are not implemented yet.

## Crop baseline

Overflow-aware crop from v0.7.0 remains active.

- source crop zoom: `1.0x ... 2.5x`;
- cover-fit overflow is included in legal movement;
- portrait sources can traverse vertically hidden regions on wide screens;
- wide sources can traverse horizontally on portrait screens;
- touch bias is clamped so no empty border is revealed.

## Performance baseline

Active optimizations:

- `pixelDensity(1)`;
- mobile main buffer `720`;
- small analysis buffers;
- bounded decoded image pool;
- sequential runtime image decoding;
- feedback buffers at reduced resolution;
- rupture buffer at reduced resolution;
- mobile rupture frame skip;
- GPU palette shader with CPU fallback;
- composition sample-and-hold defaults to `30fps`;
- halation/bloom removed from active modes;
- common crush OFF.

Performance should be judged primarily by:

1. touch latency;
2. heat / throttling after several minutes;
3. long-run memory behavior;
4. stability / crashes;
5. aesthetic quality of frame loss;
6. FPS only after the above.

## Configuration/control architecture

Canonical runtime values:

`config.js`

Metadata/validation:

`config-schema.js`

Static editor:

`control/`

The Control page automatically renders top-level config groups absent from schema metadata using inferred controls. Therefore `timing` is editable under schema 1.

GitHub Pages itself cannot write repository changes directly. Local draft/export remains convenience only; repository commits remain source of truth.

## Versioned visual-engine chain

Relevant active tail:

```text
visual-engine-v068.js
 -> visual-engine-v070.js
 -> visual-engine-v080.js
 -> visual-engine-v090.js
 -> visual-engine-v100.js
```

Do not delete inherited engine files while later classes depend on them.

## Important edit points

- `config.js` — current tuning and timing values;
- `config-schema.js` — control metadata;
- `control/` — config editor;
- `js/media-manager.js` — archive/rolling-pool policies;
- `js/visual-engine-v070.js` — crop-space behavior;
- `js/visual-engine-v080.js` — config-driven mode/pipeline;
- `js/visual-engine-v090.js` — manual mode + GPU rupture palette;
- `js/visual-engine-v100.js` — temporal cadence + deltaTime feedback normalization;
- `js/mode-control-ui.js` — manual mode + composition FPS runtime buttons;
- `sketch-v066.js` — 60fps-target outer loop;
- `js/telemetry.js` — instrumentation/foreground text.

## Next checks

On desktop and mobile:

1. verify start screen says `v0.10.1`;
2. verify telemetry still reports `ENGINE 0.10.0`;
3. tap FPS button and confirm `15 -> 24 -> 30 -> 60 -> 15`;
4. confirm the numeric button label changes with the active composition cadence;
5. confirm FPS-button taps do not activate canvas touch/rupture;
6. confirm audio speed/time does not change;
7. confirm mode button still changes exactly one mode per tap;
8. watch preset feedback at stable 60fps and during temporary 20–30fps drops;
9. compare decay/zoom speed rather than smoothness — smoothness must still follow actual render FPS;
10. run several minutes on mobile and watch temperature/memory.

## Deferred visual experiment

A very weak analog-style softness pass is under consideration. Preferred implementation is a small shader-based softening kernel, potentially paired later with restrained grain. It is **not implemented in v0.10.1**.

## Continuity rule

For future DODREI work, read this file first and verify actual GitHub implementation before relying on conversation memory. Update this file at meaningful checkpoints.
