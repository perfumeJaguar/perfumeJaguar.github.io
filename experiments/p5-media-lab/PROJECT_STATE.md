# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.10.5`  
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
- upper-right `›` -> manual next enabled mode;
- upper-right FPS number -> BASE VISUAL sampling `15 / 24 / 30 / 60`;
- upper-right `S1...S5` -> VISUAL SPEED `0.25x / 0.50x / 0.70x / 1.00x / 1.50x`.

Runtime controls:

```text
                              [ › ]  mode step
                              [30 ]  base visual fps
                              [S1 ]  visual speed
```

The controls moved from the upper-left to upper-right because mobile telemetry occupies the left side of the artwork.

## v0.10.5 — speed preset + UI checkpoint

The v0.10.4 virtual-time engine is retained unchanged. This checkpoint changes runtime presets/defaults and control placement only.

Speed presets:

```text
S1 0.25x -> state ≈ 5.6 Hz  / cut ≈ 960 ms
S2 0.50x -> state ≈ 11.1 Hz / cut ≈ 480 ms
S3 0.70x -> state ≈ 15.6 Hz / cut ≈ 343 ms
S4 1.00x -> state ≈ 22.2 Hz / cut ≈ 240 ms
S5 1.50x -> state ≈ 33.3 Hz / cut ≈ 160 ms
```

Startup default:

```text
BASE_FPS     30
VIS_SPEED    S1 / 0.25x
```

Config revision is `9`.

## Confirmed temporal model — v0.10.4

The v0.10.4 virtual-time experiment is visually confirmed to produce the intended separation between **timeline speed** and **sampling FPS**.

```text
WALL CLOCK
   │
   ├── VISUAL SPEED
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

Changing BASE FPS must not change timeline speed. Changing S1-S5 must not change the requested outer p5 frame rate.

## Current timing config

```js
timing: {
  compositionFps: 30,
  visualSpeedLevel: "S1",
  visualSpeedMultiplier: 0.25,
  visualStateIntervalMs: 45,
  cutSpeedLevel: "S1", // legacy mirror
  cutIntervalMs: 240,  // measured on virtual time
  timeReferenceFps: 60,
  maxDeltaMs: 100,
}
```

The virtual clock accumulates wall-clock deltas multiplied by speed, so changing speed does not jump to a new absolute position. `maxDeltaMs=100` prevents large jumps after tab/background stalls.

Implementation:

- `js/visual-engine-v104.js` subclasses v0.10.3 and owns virtual-time behavior;
- `js/mode-control-ui.js` owns the runtime five-step speed preset table;
- `config.js` owns the startup speed/default;
- v0.10.3 and earlier engine files remain for rollback;
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
visual speed default     S1 / 0.25x
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

1. Re-test five speed steps at BASE FPS 30, especially S1/S2/S3 spacing.
2. Continue comparing BASE FPS 15 / 24 / 30 / 60 independently from speed.
3. Re-check upper-right control placement on desktop as well as mobile.
4. Mild GPU softness/analog texture remains a deferred visual experiment; not implemented yet.
