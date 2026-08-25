# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.10.2`  
Current visual engine version: `0.10.2`  
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
- FPS number -> cycle base visual clock `15 / 24 / 30 / 60`.

## v0.10.2 — experimental base visual clock

The v0.10.1 FPS button changed `timing.compositionFps`, and the v0.10.0 engine did honor that redraw interval. However, the visible difference was weak because most photo/crop state was already driven by:

```text
visual.photoCutMs = 90ms  (~11.1Hz)
app.imageSwitchSec = 0.10 (~10Hz current-source pointer)
```

Therefore a 15/24/30/60 redraw cap often redrew essentially the same visual state.

v0.10.2 keeps `compositionFps` as the compatibility config key, but redefines its artistic meaning as the **BASE VISUAL CLOCK**.

```text
CUT CLOCK
  ~90ms
  image choice / cut tempo

BASE VISUAL CLOCK
  15 / 24 / 30 / 60
  crop/layout/blend/LUMA state
  sampled and held between base frames

POST FX CLOCK
  every available outer render frame
  touch rupture / feedback / swipe / vignette / waveform
```

Implementation file:

`js/visual-engine-v102.js`

It subclasses `DodreiVisualEngineV100`; v0.10.0 remains intact for rollback.

### Base-clock affected state

- PHOTO_FULL crop state;
- PHOTO_FEEDBACK_CROP crop/blend state;
- PHOTO_RAPID_CROP crop/blend state;
- PHOTO_RGB_TEAR crop/layout state;
- PHOTO_SHARD_SWAP shard visibility/crop layout;
- PHOTO_DOUBLE_BLEND crop/blend state;
- PHOTO_BLEND_CYCLE crop/blend state;
- LUMA modes' crop, jitter and sampled pulse state.

Image selection remains based on the existing ~90ms cut clock so 60fps does not mean source-image replacement 60 times per second.

### Post FX

The following remain on the outer render clock:

- touch rupture;
- preset recursive feedback;
- swipe feedback;
- vignette;
- waveform.

Feedback decay/scale timing remains deltaTime-normalized from v0.10.0. Random/glitch texture remains intentionally frame-sensitive.

### Runtime control / diagnostics

FPS button cycles:

```text
15 -> 24 -> 30 -> 60 -> 15
```

Changing FPS forces the next base frame to refresh immediately.

Telemetry now exposes:

```text
FPS       actual outer p5 render rate
BASE_FPS  target / measured base refresh rate
```

This makes it possible to distinguish a configuration/UI change from an actual engine cadence change.

## Other current baseline values

```text
outer target fps         60
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
common crush             OFF
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
active image pool        20
staging                   up to 5
```

Current visual presets remain the 12-mode PHOTO/LUMA playlist from v0.8-v0.10.

## Rollback

If the base-clock experiment is aesthetically wrong or unstable:

1. remove `js/visual-engine-v102.js` load from `index.html`;
2. v0.10.0 `visual-engine-v100.js` becomes the active engine again;
3. keep or remove the FPS button separately as desired.

No inherited v0.10.0 engine code was deleted.

## Next test

Test especially `PHOTO_FULL`, `PHOTO_RGB_TEAR`, `PHOTO_SHARD_SWAP`, and a LUMA mode at:

```text
15 / 24 / 30 / 60
```

Watch telemetry `BASE_FPS target / actual`. If the visual difference is still not useful, discard v0.10.2 rather than layering more complexity onto it.