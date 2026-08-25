# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.9`  
Current visual engine version: `1.0.7`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

```text
BASE_FPS        24
VIS_SPEED       S2 / 0.50x
START_MODE      PHOTO_DOUBLE_BLEND
CROP_MIN        1.0x
CROP_MAX        9.0x
POST            ON
POST_CHAIN      HC -> LS -> BL
TOUCH_PLAYBACK  0.50x while held
FULLSCREEN      OFF
UI_DEFAULT      HIDDEN
AUDIO           20220302 - sarabande.mp3
```

Canonical visual defaults:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL&mode=photo-double-blend&crop=10-90
```

## v1.0.9 — staged startup + hidden UI default

START gesture timeline:

```text
0 ms     audioEngine.start() and mediaManager.start()
1000 ms  telemetry/information rendering begins
4000 ms  visualEngine.render() begins
```

Before the visual delay elapses the canvas stays black. Media/audio analysis may initialize in the background, but no composition is drawn before 4 seconds.

The document body now starts with `dodrei-ui-hidden`, so all right-side controls are hidden by default except the deliberately faint `UI` toggle. Telemetry is not part of this hide group.

Implementation:

- `js/runtime-presentation-v108.js` sets `interfaceDelayMs: 1000`, `visualDelayMs: 4000`, runtime version `1.0.9`;
- `sketch-v066.js` tracks `appStartedMs` and gates telemetry/visual rendering by elapsed time;
- `index.html` starts with `class="dodrei-ui-hidden"` and cache key `20260826-71`.

## v1.0.8 — soundtrack / pause / telemetry / UI toggle

```text
soundtrack              assets/audio/20220302 - sarabande.mp3
PAU                     pauses visuals + audible music output
telemetry opacity       0.26 / 0.14 / 0.07
UI button               hides/shows runtime controls only
```

The faint `UI` button remains visible while controls are hidden.

## v1.0.7 — mobile main-render oversampling

Mobile ordinary composition and POST buffers render at `2.0x` CSS resolution. Example:

```text
CSS viewport       360 x 642
main composition   ~720 x 1284
```

Feedback, swipe, touch rupture, and analyzer buffers keep their performance-oriented mobile sizes. Desktop behavior is unchanged.

## Scene image selection

Visible scene selection remains independent per-slot random selection with replacement.

```text
recent-image ban        NONE
scene shuffle-bag       NONE
duplicate suppression   NONE
immediate repeat        ALLOWED
long non-repeat run     ALLOWED
```

## Crop range semantics

```text
crop=10-90  -> 1.0x .. 9.0x
crop=12-35  -> 1.2x .. 3.5x
```

## Existing POST / touch semantics

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

Swipe feedback:

```text
threshold 0.25
strength  2.00
```

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND   <- default start mode
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

## Performance baseline

```text
outer target fps             60
startup base fps             24
startup visual speed         S2 / 0.50x
touch visual speed           0.50x
mobile main oversample       2.0x
mobile main max long edge    1440 effective cap
desktop main max long edge   1280
active image pool            20
rotation batch               5
mobile rupture scale         0.50
mobile rupture skip          every second rendered frame
mobile analyzer width        128
```

## Important files

- `assets.js` — current soundtrack;
- `js/runtime-presentation-v108.js` — v1.0.9 presentation/startup timing overrides;
- `sketch-v066.js` — application orchestration + staged startup;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI controls;
- `js/audio-mute-v105.js` — mute/pause-safe dry/wet audio handling;
- `js/visual-engine-v1007.js` — mobile 2x ordinary composition/POST rendering;
- `js/visual-engine-v1004.js` — touch playback slowdown;
- `js/visual-engine-v1003.js` — independent scene selection + crop randomization;
- `js/url-preset.js` — URL preset/share contract;
- `index.html` — current test/control page.

## Checkpoint — v1.0.9

1. Runtime UI starts hidden; faint `UI` button remains available.
2. START begins music immediately.
3. Telemetry/information appears after 1 second.
4. Visual composition begins after 4 seconds.
5. Existing v1.0.8 soundtrack/pause/UI behavior and v1.0.7 mobile sharpness behavior remain intact.
