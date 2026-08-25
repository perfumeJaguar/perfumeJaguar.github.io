# PROJECT_STATE — DODREI

Last updated: 2026-08-25  
Current artwork/runtime version: `0.10.6`  
Current visual engine version: `0.10.5`  
Current config schema: `1`  
Repository: `perfumeJaguar/perfumeJaguar.github.io`  
Path: `experiments/p5-media-lab/`

## Current baseline

PHOTO ONLY. Automatic mode advance is OFF.

Upper-right runtime controls:

```text
[ › ]  next mode
[30 ]  BASE VISUAL FPS: 15 / 24 / 30 / 60
[S1 ]  VISUAL SPEED: 0.25 / 0.50 / 0.70 / 1.00 / 1.50x

[BW ]  binary black/white POST FX
[CR ]  Common Crush POST FX
[HC ]  strong color-preserving high contrast POST FX
[DK ]  darken overlay POST FX
[VG ]  very strong vignette POST FX
```

All five POST COMMON FX toggles start OFF.

## v0.10.6 — PRE / POST COMMON FX

```text
COMPOSITION LAYER
├─ MODE
└─ PRE COMMON FX
   └─ same sampled level as MODE; hook exists, no active PRE effect yet
        ↓
POST COMMON FX
├─ CRUSH
├─ HIGH CONTRAST
├─ BINARY B/W
├─ DARKEN
└─ STRONG VIGNETTE
        ↓
INTERACTION / FINAL FX
├─ touch rupture
├─ preset feedback
├─ swipe feedback
├─ existing mild vignette
└─ waveform
```

POST COMMON FX runs before touch/gesture processing. This makes the global look the material that interaction subsequently damages/processes.

`DARKEN` currently lives with the other POST COMMON FX. A future text layer may move it to immediately before text if that gives better readability control.

### POST FX behavior

- `BW`: true two-level black/white threshold, not the current four-tone touch palette.
- `CR`: reuses the previously disabled Common Crush implementation.
- `HC`: aggressive color-preserving contrast; baseline `3.2x` contrast.
- `DK`: black overlay; baseline alpha `0.46`.
- `VG`: intentionally strong vignette; edge opacity baseline `0.96`.

Fixed combination order:

```text
CRUSH -> HIGH CONTRAST -> B/W -> DARKEN -> STRONG VIGNETTE
```

B/W is after color processing so combined toggles still end in true two-tone output.

The POST COMMON result is cached from the held base composition and is recomputed only when the base composition refreshes or a toggle changes. This avoids paying full post-processing cost on every outer render frame.

Implementation: `js/visual-engine-v105.js` subclasses `DodreiVisualEngineV104`.

## Mode order

`PHOTO_FULL` is now the first preset and is the clean reference mode.

```text
01 PHOTO_FULL
02 PHOTO_FEEDBACK_CROP
03 PHOTO_RAPID_CROP
04 PHOTO_RGB_TEAR
05 PHOTO_SHARD_SWAP
06 PHOTO_DOUBLE_BLEND
07 PHOTO_BLEND_CYCLE
08 LUMA_BLOCKS
09 LUMA_VOID
10 LUMA_MONO
11 LUMA_DITHER
12 LUMA_PULSE
```

## Temporal model

The v0.10.4 cumulative virtual-time model remains active:

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

Startup defaults:

```text
BASE_FPS   30
VIS_SPEED  S1 / 0.25x
```

## Performance baseline

```text
outer target fps         60
mobile main buffer       720 long edge
desktop main buffer      1280 long edge
mobile rupture scale     0.50
mobile rupture skip      every second rendered frame
active image pool        20
staging                   up to 5
common crush             OFF at startup; runtime POST FX toggle
halation / bloom          removed
```

Still images use GitHub archive discovery with `assets.js` fallback. Selection uses shuffle-bag with active/staging exclusion and bounded decoded residency.

## Rollback

If the new PRE/POST COMMON architecture is undesirable:

1. remove `js/visual-engine-v105.js` from `index.html`;
2. `visual-engine-v104.js` becomes active again;
3. remove/ignore the five POST FX buttons and `visual.postCommonFx` config block.

No inherited engine implementation was deleted.

## Deferred

- Mild GPU softness / analog texture remains under consideration and is not active.
- PRE COMMON FX has architecture only; no effect is implemented there yet.
- A future text layer may motivate moving `DARKEN` immediately before text.

## Session-end checkpoint — 2026-08-25 23:17 KST

Verified `main` before closing the session at commit `61fbc7a71aa4d3cdc5fc2d138519ff38c6223022` (`docs: update DODREI README for v0.10.6`).

Confirmed working direction from this session:

- v0.10.4 virtual-time separation is accepted: VISUAL SPEED controls timeline progression, BASE FPS controls sample-and-hold cadence.
- Runtime speed presets are `0.25 / 0.50 / 0.70 / 1.00 / 1.50x`, startup at `S1 / 0.25x`.
- Runtime controls live on the upper-right to avoid telemetry overlap.
- `PHOTO_FULL` is the first/reference mode.
- PRE COMMON FX is a composition-level extension point and currently empty.
- POST COMMON FX is implemented as five independent runtime toggles: `BW / CR / HC / DK / VG`, all OFF at startup.
- POST COMMON FX sits before touch/gesture processing and its held result is cached for performance.

Next-session first checks:

1. Visually test `BW / CR / HC / DK / VG` independently and in combinations on mobile.
2. Tune `HC`, `DK`, and `VG` strength from real-device viewing if needed.
3. Check sustained mobile FPS/heat with POST FX enabled, especially BW and Crush.
4. Decide later whether `DARKEN` should remain POST COMMON or move immediately before a future text layer.
5. Mild GPU softness / analog texture remains the next optional visual experiment after POST FX tuning.
