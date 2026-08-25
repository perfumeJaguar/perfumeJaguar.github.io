# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.12`  
Current visual engine version: `1.0.12`  
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
POST_FB         OFF
TOUCH_PLAYBACK  0.50x while held
FULLSCREEN      manual FS button
UI_DEFAULT      HIDDEN
AUDIO           20220302 - sarabande.mp3
```

Canonical visual defaults:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL&mode=photo-double-blend&crop=10-90
```

## v1.0.12 — global FB POST FX

The temporary PHOTO_DOUBLE_BLEND-only feedback introduced in v1.0.11 is no longer loaded. `PHOTO_DOUBLE_BLEND` again has no special feedback behavior of its own.

A new ordered global POST effect is available:

```text
button/token       FB
config key         feedback
default            OFF
share URL          fx=...,FB,... supported
order              activation order, same contract as HC/LS/BL/etc.
```

Feedback strength is slightly above the discarded v1.0.11 double-blend experiment:

```text
history retain alpha   58   (was 46)
feedback scale         0.996
current history alpha  218
```

The feedback history uses dedicated low-resolution buffers derived from the existing feedback resolution rather than the 2x mobile main raster. This keeps temporal memory isolated from preset feedback and limits mobile cost. The output itself remains on the normal POST surface.

## v1.0.11 — persistent fullscreen control

Lower-right persistent controls:

```text
[UI]
[FS]
```

Both remain visible and operable while `dodrei-ui-hidden` is active. `FS` toggles the browser Fullscreen API and tracks fullscreen state.

## v1.0.10 — staged startup

START gesture timeline:

```text
0.0s   soundtrack begins immediately
3.0s   start screen releases; telemetry stage 1
3.2s   telemetry stage 2
3.4s   telemetry stage 3
6.4s   main visual appears at 20% brightness
7.4s   main visual switches to 100% brightness
```

Runtime UI remains hidden by default. Telemetry is not hidden with the controls.

## v1.0.8 / v1.0.9 retained behavior

```text
soundtrack              assets/audio/20220302 - sarabande.mp3
PAU                     pauses visuals + audible music output
telemetry opacity       0.26 / 0.14 / 0.07
UI button               hides/shows runtime controls only
```

## Mobile sharpness

Mobile ordinary composition and POST buffers render at `2.0x` CSS resolution. Example:

```text
CSS viewport       360 x 642
main composition   ~720 x 1284
```

Feedback, swipe, touch rupture, and analyzer buffers keep performance-oriented mobile sizes. Desktop behavior is unchanged.

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

## POST / touch semantics

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

Current ordered POST keys include:

```text
BW GS LS BL FB CR HC DK VG
```

Startup default remains:

```text
HC -> LS -> BL
```

Swipe feedback remains separate from global `FB`:

```text
threshold 0.25
strength  2.00
```

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND   <- default start mode / telemetry alias TWIN_EXPOSURE//NULL
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

## Important files

- `config.js` — current defaults + FB parameters;
- `assets.js` — current soundtrack;
- `js/startup-sequence-v1010.js` — staged telemetry reveal;
- `sketch-v066.js` — staged startup + brightness timeline;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI / FS controls;
- `js/post-feedback-ui-v1012.js` — FB control;
- `js/visual-engine-v1012.js` — ordered global FB POST implementation;
- `js/visual-engine-v1007.js` — mobile 2x ordinary composition/POST rendering;
- `js/visual-engine-v1004.js` — touch playback slowdown;
- `js/visual-engine-v1003.js` — independent scene selection + crop randomization;
- `js/url-preset.js` — URL preset/share contract including FB;
- `index.html` — current test/control page.

## Checkpoint — v1.0.12

1. Removed activation of the v1.0.11 PHOTO_DOUBLE_BLEND-only feedback engine.
2. Added global ordered POST `FB`, default OFF.
3. FB is slightly stronger than the discarded mode-specific experiment.
4. `FB` is supported in share URLs and preserves activation order.
5. Persistent `UI` and `FS` controls remain available while the rest of the UI is hidden.
6. Existing staged startup, soundtrack, mobile sharpness, and touch behavior remain unchanged.
