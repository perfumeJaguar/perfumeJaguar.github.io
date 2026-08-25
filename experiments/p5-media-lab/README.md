# DODREI

DODREI is a mobile-first browser media-art experiment built with **p5.js / JavaScript** and hosted on GitHub Pages.

Current baseline: **v0.10.8**  
Current visual engine: **0.10.8**  
Current config schema: **1**

## Runtime controls

Upper-right:

```text
[ › ]  next visual mode
[60 ]  BASE VISUAL FPS: 15 -> 24 -> 30 -> 60
[S5 ]  VISUAL SPEED: S1 -> S2 -> S3 -> S4 -> S5

[BW ]  binary black/white
[GS ]  grayscale
[LS ]  low saturation (~50%)
[CR ]  Common Crush
[HC ]  high contrast color
[DK ]  darken overlay
[VG ]  strong vignette
```

Speed presets:

```text
S1 0.25x
S2 0.50x
S3 0.70x
S4 1.00x
S5 1.50x
```

Startup default is **S5 / 1.50x** at BASE FPS **60**.

Startup POST FX chain is:

```text
HC -> CR -> LS -> DK
```

BW / GS / VG start OFF. LS uses `saturate(0.50)`.

## Visual architecture

```text
COMPOSITION
├─ MODE
└─ PRE COMMON FX      [same level as MODE; currently empty]
        ↓
POST COMMON FX        [runtime toggles, ordered by activation]
├─ BW
├─ GS
├─ LS
├─ CR
├─ HC
├─ DK
└─ VG
        ↓
INTERACTION / FINAL FX
├─ touch rupture
├─ preset feedback
├─ swipe feedback
├─ mild vignette
└─ waveform
```

POST COMMON FX is deliberately before touch/gesture processing. Its output is cached from the held base composition and recomputed only when composition changes or a toggle/order changes.

POST FX order is not fixed. Turning an effect ON appends it to the active chain; turning it OFF removes it. Turning it back ON therefore moves it to the end. Startup order is `HC -> CR -> LS -> DK`.

`DARKEN` may later move immediately before a future text layer if that gives better readability control.

## Active mode order

The heavy `PHOTO_RGB_TEAR` mode (telemetry alias `CHR_MA::W0UND`) is removed from the active sequence. All LUMA/mosaic modes are also removed from the active sequence and deferred to TODO. Their implementation code is retained for possible later reuse.

The clean source mode is deliberately last.

```text
01 PHOTO_FEEDBACK_CROP
02 PHOTO_RAPID_CROP
03 PHOTO_SHARD_SWAP
04 PHOTO_DOUBLE_BLEND
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

## Touch audio

Touch audio rupture still uses the native dry track plus the parallel Web Audio FX path, but v0.10.7 reduced dry ducking, wet gain, delay feedback, resonance, and distortion. The aim is to keep the effect character without the large loudness jump against untouched playback.

## Telemetry text corruption

The pseudo-system text glitch is more frequent and distributed across status labels, parameter rows, mode/FX text, and event messages. Corruption is transient and pseudo-random per short time slot; underlying telemetry values are unchanged.

## Temporal model

```text
VISUAL SPEED = timeline progression speed
BASE FPS     = sampling cadence of that timeline
POST FX FPS  = actual available render callbacks
```

The cumulative virtual-time model lives in `js/visual-engine-v104.js`; PRE/POST COMMON FX baseline lives in `js/visual-engine-v105.js`; activation-order POST FX + grayscale lives in `js/visual-engine-v107.js`; low-saturation support lives in `js/visual-engine-v108.js`.

## Performance baseline

- `pixelDensity(1)`;
- mobile main processing buffer long edge: `720`;
- desktop main buffer long edge: `1280`;
- mobile rupture buffer scale: `0.50`;
- mobile rupture recalculation every second rendered frame;
- GPU four-band touch palette with CPU fallback;
- reduced-resolution feedback buffers;
- decoded active image pool: `20`;
- staging: up to `5`;
- halation/bloom removed;
- RGB tear removed from active modes;
- LUMA/mosaic modes deferred;
- Common Crush is POST COMMON FX and starts ON in the current default chain;
- Low Saturation is a lightweight canvas saturation pass.

## Important files

- `config.js` — runtime values, startup mode list, POST FX order/defaults, audio/glitch tuning;
- `js/visual-engine-v104.js` — cumulative virtual visual time;
- `js/visual-engine-v105.js` — PRE/POST COMMON FX architecture and cached global effects;
- `js/visual-engine-v107.js` — activation-order POST FX chain and grayscale;
- `js/visual-engine-v108.js` — low-saturation POST FX;
- `js/audio-touch-v060.js` — touch-audio rupture with quieter tuning;
- `js/telemetry-v107.js` — distributed pseudo-random text corruption;
- `js/mode-control-ui.js` — mode/FPS/speed/POST-FX buttons;
- `PROJECT_STATE.md` — implementation checkpoint.

## Deferred

- Revisit/rebuild LUMA/mosaic modes later rather than keeping them in the current runtime rotation.
- Mild GPU softness / analog texture remains under consideration.
- PRE COMMON FX has a hook but no active effect yet.
