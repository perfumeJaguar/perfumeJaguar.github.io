# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.10.3`  
Current visual engine version: `0.10.3`  
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
- FPS number -> cycle BASE VISUAL CLOCK `15 / 24 / 30 / 60`;
- `S1...S4` -> cycle independent CUT SPEED.

Runtime controls:

```text
[ › ]  mode step
[30 ]  base visual fps
[S2 ]  cut speed
```

## v0.10.3 — independent cut speed

The v0.10.2 base-clock experiment worked visually, but image changes felt too fast and partly coupled to BASE FPS.

Cause: v0.10.2 computed `cutTick` from `sampleMs`, the quantized base-frame timestamp. The cut interval itself was still nominally time-based, but the cut state was sampled from the BASE FPS clock.

v0.10.3 separates these clocks explicitly.

```text
WALL CLOCK
   │
   ├── CUT CLOCK
   │     image choice / cut tempo
   │     uses millis() directly
   │     S1 320ms  slowest
   │     S2 240ms  default
   │     S3 170ms
   │     S4 110ms  fastest
   │
   ├── BASE VISUAL CLOCK
   │     15 / 24 / 30 / 60 fps
   │     crop / layout / blend / LUMA state
   │     sample-and-hold
   │
   └── POST FX CLOCK
         every available outer render frame
         touch rupture / feedback / swipe / vignette / waveform
```

Config:

```js
timing: {
  compositionFps: 30,
  cutSpeedLevel: "S2",
  cutIntervalMs: 240,
  timeReferenceFps: 60,
  maxDeltaMs: 100,
}
```

`visual.photoCutMs = 90` remains for inherited glitch/rupture/FX timing and compatibility. It no longer controls the active visible image-choice tempo in v0.10.3.

Implementation file:

`js/visual-engine-v103.js`

It subclasses `DodreiVisualEngineV102`. v0.10.2 and earlier engines remain intact for rollback.

### Runtime cut-speed control

The third small upper-left button displays the current level and cycles:

```text
S1 -> S2 -> S3 -> S4 -> S1
```

Changing speed calls `setCutSpeed()` and forces the next base sample immediately.

Button pointer/click propagation is stopped so the control should not trigger canvas touch/rupture behavior.

### Diagnostics

Telemetry now exposes:

```text
FPS         actual outer p5 render rate
BASE_FPS    target / measured base refresh rate
CUT_SPEED   level / milliseconds
```

## v0.10.2 — base visual clock

`compositionFps` remains the compatibility key for BASE VISUAL FPS.

Affected base state includes:

- PHOTO_FULL crop state;
- PHOTO_FEEDBACK_CROP crop/blend state;
- PHOTO_RAPID_CROP crop/blend state;
- PHOTO_RGB_TEAR crop/layout state;
- PHOTO_SHARD_SWAP shard visibility/crop layout;
- PHOTO_DOUBLE_BLEND crop/blend state;
- PHOTO_BLEND_CYCLE crop/blend state;
- LUMA crop/jitter/pulse state.

The sampled base frame is held between updates. Post FX stay on the outer render clock.

## v0.10.0 feedback timing baseline

Recursive feedback remains deltaTime-normalized for scale, retention, fade and swipe drift. Source injection and random/glitch texture remain intentionally frame-sensitive.

## Other current baseline values

```text
outer target fps         60
base visual fps default  30
cut speed default        S2 / 240ms
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
common crush             OFF
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
active image pool        20
staging                   up to 5
```

Current visual presets remain the 12-mode PHOTO/LUMA playlist.

## Clock ownership rule

Keep these concepts separate in future work:

```text
CUT SPEED
  what image/cut state is selected over wall-clock time

BASE VISUAL FPS
  temporal resolution of crop/layout/blend/LUMA state

POST FX / DISPLAY FPS
  actual available render callbacks
```

Do not make cut speed a multiple of frame count. Do not globally lower p5 `frameRate()` when only the base visual cadence should be stepped.

## Rollback

If v0.10.3 is aesthetically wrong:

1. remove `js/visual-engine-v103.js` from `index.html`;
2. `visual-engine-v102.js` becomes active again;
3. remove or ignore the S1-S4 button separately.

No v0.10.2 or v0.10.0 engine implementation was deleted.

## Next test

Compare especially `PHOTO_FULL`, `PHOTO_RAPID_CROP`, `PHOTO_SHARD_SWAP` and `PHOTO_BLEND_CYCLE` while holding BASE FPS constant and cycling:

```text
S1 320ms
S2 240ms
S3 170ms
S4 110ms
```

Then hold cut speed constant and compare `15 / 24 / 30 / 60`. The two controls should now change different perceptual dimensions.
