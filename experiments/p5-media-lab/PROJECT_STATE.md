# PROJECT_STATE — DODREI

Last updated: 2026-08-26  
Current artwork/runtime version: `1.0.0`  
Current visual engine version: `1.0.0`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

Upper-right runtime controls:

```text
[ ›   ] next mode
[60   ] BASE VISUAL FPS: 15 / 24 / 30 / 60
[S5   ] VISUAL SPEED: 0.25 / 0.50 / 0.70 / 1.00 / 1.50x

[POST ] POST COMMON FX master bypass
[BW   ] binary black/white POST FX
[GS   ] grayscale POST FX
[LS   ] low saturation POST FX
[BL   ] subtle blur POST FX
[CR   ] Common Crush POST FX
[HC   ] strong color-preserving high contrast POST FX
[DK   ] darken overlay POST FX
[VG   ] very strong vignette POST FX
```

Startup POST FX state/order:

```text
POST ON
HC ON -> CR ON -> LS ON -> DK ON
BW OFF
GS OFF
BL OFF
VG OFF
```

Startup timing:

```text
BASE_FPS   60
VIS_SPEED  S5 / 1.50x
```

## v1.0.0 milestone

The project is promoted from the v0.x development series to the first v1 runtime baseline.

Main additions:

1. subtle blur POST FX (`BL`);
2. non-destructive POST master bypass;
3. automatic POST bypass during touch rupture;
4. stronger/lower-threshold swipe feedback.

Implementation: `js/visual-engine-v1000.js` subclasses `DodreiVisualEngineV108`.

## Ordered POST COMMON FX architecture

```text
COMPOSITION LAYER
├─ MODE
└─ PRE COMMON FX
   └─ same sampled level as MODE; hook exists, no active PRE effect yet
        ↓
POST COMMON FX
├─ MASTER ENABLE / BYPASS
└─ dynamic ordered chain
   ├─ BW
   ├─ GS
   ├─ LS
   ├─ BL
   ├─ CR
   ├─ HC
   ├─ DK
   └─ VG
        ↓
TOUCH / GESTURE
├─ touch rupture
│  └─ transiently bypasses POST COMMON FX while active
├─ preset feedback
└─ swipe feedback
        ↓
FINAL
├─ existing mild vignette
└─ waveform
```

POST COMMON FX still operates on the held base composition and remains cached when active.

### POST order semantics

- turning an effect ON appends it to the active chain;
- turning an effect OFF removes it from the chain;
- turning it ON again moves it to the end;
- startup order comes from `visual.postCommonFx.order`;
- current startup order is `highContrast -> crush -> lowSaturation -> darken`.

### POST master semantics

`visual.postCommonFx.masterEnabled` is independent from every individual effect state.

- POST OFF bypasses the entire chain;
- individual POST FX buttons become disabled while POST is OFF;
- no effect boolean is changed;
- `order` is not changed;
- POST ON restores the exact previous chain.

This is a bypass, not a reset.

### Touch / POST interaction

Touch rupture does **not** write to `masterEnabled` and does not modify the POST effect list.

Effective POST state is conceptually:

```text
POST_EFFECTIVE = POST_MASTER_ENABLED && !TOUCH_RUPTURE_ACTIVE
```

Therefore:

- manual POST ON + no touch -> POST active;
- manual POST ON + touch rupture -> POST temporarily bypassed;
- touch ends -> POST resumes;
- manual POST OFF + touch -> POST remains bypassed;
- touch ends while manual POST is OFF -> POST stays OFF.

This avoids state conflicts between manual and automatic bypass.

### POST FX behavior

- `BW`: two-level black/white threshold.
- `GS`: normal grayscale conversion.
- `LS`: low saturation, baseline `0.50` saturation multiplier.
- `BL`: subtle blur, baseline `1.20px` canvas blur.
- `CR`: Common Crush.
- `HC`: aggressive color-preserving contrast; baseline `3.2x` contrast.
- `DK`: black overlay; baseline alpha `0.46`.
- `VG`: intentionally strong vignette; edge opacity baseline `0.96`.

Blur starts OFF and can participate anywhere in the activation-ordered chain.

## Touch / swipe feedback

The swipe-recursive feedback threshold is lowered:

```text
old threshold  0.30
new threshold  0.25
```

A new `swipeFeedbackStrength` parameter is set to `2.00`.

The v1 implementation doubles feedback character by applying the strength multiplier to:

- transform deviation from unity scale;
- pointer-driven recursive drift;
- retained previous-frame opacity, clamped to the valid alpha range.

The current-frame source injection is intentionally not doubled, so the change emphasizes recursion rather than simply making the current source brighter.

## Active mode order

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

`PHOTO_FULL` remains deliberately last as the clean/no-effect source view.

### Removed/deferred modes

`PHOTO_RGB_TEAR` remains removed from the active sequence because it was too slow. Its telemetry alias was `CHR_MA::W0UND`.

All LUMA/mosaic modes remain deferred to TODO:

```text
LUMA_BLOCKS
LUMA_VOID
LUMA_MONO
LUMA_DITHER
LUMA_PULSE
```

Their implementation code remains in the repository for later redesign/reuse.

## Touch audio tuning

The touch-audio rupture remains based on the native dry track plus the parallel Web Audio FX path. The quieter v0.10.7 tuning remains unchanged.

## Telemetry text corruption

The broader pseudo-random telemetry corruption introduced in v0.10.7 remains unchanged. It can affect status rows, mode/FX labels, parameter names/rows, and event log messages without changing underlying values.

## Temporal model

```text
VISUAL SPEED = how fast the artwork timeline progresses
BASE FPS     = how often that timeline is sampled
POST FX FPS  = actual available render callbacks
```

Speed presets:

```text
S1 0.25x -> state ≈ 5.6 Hz  / cut ≈ 960 ms
S2 0.50x -> state ≈ 11.1 Hz / cut ≈ 480 ms
S3 0.70x -> state ≈ 15.6 Hz / cut ≈ 343 ms
S4 1.00x -> state ≈ 22.2 Hz / cut ≈ 240 ms
S5 1.50x -> state ≈ 33.3 Hz / cut ≈ 160 ms
```

Current startup defaults are `BASE_FPS 60` and `S5 / 1.50x`.

## Performance baseline

```text
outer target fps         60
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
active image pool        20
staging                   up to 5
halation / bloom          removed
RGB tear mode             removed from active sequence
LUMA/mosaic modes         deferred
```

POST processing remains cached and is skipped entirely while manually bypassed or while touch rupture is active. This partially offsets the cost of adding BL. Blur itself is expected to cost more than LS/DK because it requires neighboring-pixel sampling; the baseline is deliberately only `1.20px` and OFF at startup.

## Important files

- `config.js` — v1 runtime defaults, POST master/BL fields, swipe threshold/strength;
- `js/visual-engine-v104.js` — cumulative virtual visual time;
- `js/visual-engine-v105.js` — PRE/POST COMMON FX architecture and cached global effects;
- `js/visual-engine-v107.js` — activation-order POST FX and grayscale;
- `js/visual-engine-v108.js` — low-saturation POST FX;
- `js/visual-engine-v1000.js` — v1 POST master/touch bypass, blur, stronger swipe feedback;
- `js/audio-touch-v060.js` — quieter touch-audio rupture;
- `js/telemetry-v107.js` — distributed pseudo-random text corruption;
- `js/mode-control-ui.js` — mode/FPS/speed/POST master/effect buttons.

## Rollback

For the v1 visual layer:

1. remove `js/visual-engine-v1000.js` from `index.html`;
2. `visual-engine-v108.js` becomes the active visual engine again;
3. remove/ignore `masterEnabled`, `blur`, `blurAmountPx`, and `swipeFeedbackStrength` additions;
4. restore `swipeFeedbackThreshold` to `0.30` if the old gesture threshold is desired;
5. remove the `POST` and `BL` buttons from the runtime UI.

Older engine implementations remain intact.

## Deferred / TODO

- Revisit LUMA/mosaic modes later as a separate redesign.
- Mild GPU softness / analog texture remains under consideration and is not active.
- PRE COMMON FX has architecture only; no effect is implemented there yet.
- A future text layer may motivate moving `DARKEN` immediately before text.

## Checkpoint — 2026-08-26 00:15 KST

Requested v1 changes implemented:

1. `BL` subtle blur POST FX added;
2. POST master bypass added; individual POST FX controls lock while bypassed and restore unchanged afterward;
3. swipe feedback threshold changed `0.30 -> 0.25` and recursive feedback strength set to `2.00`;
4. POST COMMON FX automatically bypasses while touch rupture is active and resumes without altering manual POST state;
5. artwork/runtime and visual engine promoted to `v1.0.0`.
