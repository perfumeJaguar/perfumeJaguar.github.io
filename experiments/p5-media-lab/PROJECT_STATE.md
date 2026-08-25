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
- `S1...S4` -> VISUAL SPEED `0.50x / 0.75x / 1.00x / 1.50x`.

Runtime controls:

```text
[ › ]  mode step
[30 ]  base visual fps
[S2 ]  visual speed
```

## v0.10.4 — virtual visual time

v0.10.3 changed image-cut timing, but crop/layout/blend seeds still advanced from the sampled BASE-FPS frame index. Therefore S1-S4 could change cut timing without clearly slowing the apparent visual motion.

v0.10.4 replaces that model with a cumulative virtual clock.

```text
WALL CLOCK
   │
   ├── VISUAL SPEED
   │     S1 0.50x
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

Important rule:

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

At the default S2:

```text
visual-state changes ≈ 16.7 Hz
image cut estimate   ≈ 320 ms real time
```

Approximate S1-S4 behavior:

```text
S1 0.50x -> state ≈ 11.1 Hz / cut ≈ 480 ms
S2 0.75x -> state ≈ 16.7 Hz / cut ≈ 320 ms
S3 1.00x -> state ≈ 22.2 Hz / cut ≈ 240 ms
S4 1.50x -> state ≈ 33.3 Hz / cut ≈ 160 ms
```

The virtual clock is accumulated using wall-clock deltas, so switching speed does not jump to a different absolute timeline position. `maxDeltaMs=100` prevents large jumps after tab/background stalls.

Implementation:

- `js/visual-engine-v104.js` subclasses v0.10.3;
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

## Rollback

If v0.10.4 is aesthetically wrong:

1. remove `js/visual-engine-v104.js` from `index.html`;
2. `visual-engine-v103.js` becomes active again;
3. restore the old cut-speed UI semantics if desired.

No inherited engine implementation was deleted.

## Next test

First keep BASE FPS at `30` and compare:

```text
S1 -> S2 -> S3 -> S4
```

The whole base visual progression should now clearly speed up, not only source-image selection.

Then keep S2 fixed and compare:

```text
15 -> 24 -> 30 -> 60
```

The perceived timeline speed should stay similar while temporal stepping/sampling changes.
