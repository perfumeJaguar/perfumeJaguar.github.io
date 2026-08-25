# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.10.4`  
Current visual engine version: `0.10.4`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Source of truth

GitHub is the implementation source of truth. Legacy `P5Lab*` internal names and `p5-media-lab` path remain for compatibility.

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

Interaction:

- hold -> four-band touch rupture;
- fast held swipe -> recursive swipe feedback;
- `›` -> manual next enabled mode;
- FPS number -> BASE VISUAL sampling `15 / 24 / 30 / 60`;
- `S1...S4` -> VISUAL SPEED `0.25x / 0.75x / 1.00x / 1.50x`.

Runtime controls:

```text
[ › ]  mode step
[30 ]  base visual fps
[S2 ]  visual speed
```

## Confirmed temporal model — v0.10.4

The v0.10.4 virtual-time experiment is visually confirmed to produce the intended separation between **timeline speed** and **sampling FPS**.

Earlier v0.10.3 changed image-cut timing but crop/layout/blend seeds still advanced from BASE-FPS frame state, so the speed control did not dominate apparent motion. v0.10.4 fixes this with a cumulative virtual clock.

```text
WALL CLOCK
   │
   ├── VISUAL SPEED
   │     S1 0.25x
   │     S2 0.75x  default
   │     S3 1.00x
   │     S4 1.50x
   │        │
   │        └── advances VIRTUAL TIME
   │              ├── visual-state tick
   │              ├── image-choice cut tick
   │              └── LUMA / time-driven base state
   │
   ├── BASE VISUAL FPS
   │     15 / 24 / 30 / 60
   │     samples the current virtual state
   │     and holds it between samples
   │
   └── POST FX / DISPLAY
         every available outer render callback
         rupture / recursive feedback / swipe / vignette / waveform
```

Architectural rule:

```text
VISUAL SPEED = how fast the artwork timeline progresses
BASE FPS     = how often that timeline is sampled
POST FX FPS  = actual available render callbacks
```

Changing BASE FPS must not change timeline speed. Changing S1-S4 must not change the requested outer p5 frame rate.

## Current timing config

```js
timing: {
  compositionFps: 30,
  visualSpeedLevel: "S2",
  visualSpeedMultiplier: 0.75,
  visualStateIntervalMs: 45,
  cutSpeedLevel: "S2", // legacy mirror
  cutIntervalMs: 240,  // measured on virtual time
  timeReferenceFps: 60,
  maxDeltaMs: 100,
}
```

The runtime speed preset table is currently:

```text
S1 0.25x -> state ≈ 5.6 Hz  / cut ≈ 960 ms
S2 0.75x -> state ≈ 16.7 Hz / cut ≈ 320 ms
S3 1.00x -> state ≈ 22.2 Hz / cut ≈ 240 ms
S4 1.50x -> state ≈ 33.3 Hz / cut ≈ 160 ms
```

`S1` was reduced from `0.50x` to `0.25x` after visual testing because the previous slowest preset was not sufficiently separated from S2.

The virtual clock accumulates wall-clock deltas multiplied by speed, so changing speed does not jump to a new absolute position. `maxDeltaMs=100` prevents large jumps after tab/background stalls.

Implementation:

- `js/visual-engine-v104.js` subclasses v0.10.3;
- v0.10.3 and earlier engine files remain for rollback;
- `js/mode-control-ui.js` owns the runtime speed preset values;
- `visual.photoCutMs = 90` remains only for inherited glitch/rupture/FX timing and compatibility.

## Diagnostics

Telemetry exposes:

```text
FPS         actual outer p5 rate
BASE_FPS    target / measured base refresh rate
VIS_SPEED   level / multiplier
STATE_HZ    effective virtual visual-state rate
CUT_EST     estimated real-time image cut interval
```

## Other current baseline values

```text
outer target fps         60
base visual fps default  30
visual speed default     S2 / 0.75x
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
common crush             OFF
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
active image pool        20
staging                   up to 5
```

Current visual presets remain the 12-mode PHOTO/LUMA playlist.

## Image/media baseline

- still images are discovered from the GitHub archive with `assets.js` fallback;
- active decoded pool: 20;
- staging: up to 5;
- runtime load concurrency: 1;
- startup concurrency: 3;
- pool rotation every 5 seconds after the previous swap completes;
- selection policy: shuffle-bag;
- future folder-based image sets remain anticipated but are not yet given weighting/alternation rules.

## Performance baseline

- mobile main buffer long edge: 720;
- desktop: 1280;
- mobile touch-rupture scale: 0.50;
- mobile rupture recalculation: every second rendered frame;
- GPU four-band palette with CPU fallback;
- reduced-resolution feedback buffers;
- halation/bloom removed;
- common PHOTO_CRUSH retained but OFF.

Performance should be judged primarily by touch latency, sustained heat/throttling, memory stability, visual quality, then raw FPS.

## Rollback

If v0.10.4 virtual-time behavior becomes undesirable:

1. remove `js/visual-engine-v104.js` from `index.html`;
2. `visual-engine-v103.js` becomes active again;
3. restore earlier speed semantics in `js/mode-control-ui.js` if desired.

No inherited engine implementation was deleted.

## Next likely work

1. Re-test S1 `0.25x` against S2 `0.75x` at BASE FPS 30.
2. Choose preferred default speed only after real-device viewing.
3. Continue comparing BASE FPS 15 / 24 / 30 / 60 independently from speed.
4. Mild GPU softness/analog texture remains a deferred visual experiment; not implemented yet.
