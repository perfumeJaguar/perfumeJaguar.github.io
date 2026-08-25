# PROJECT_STATE — p5 Media Lab 01

Last updated: 2026-08-25
Current version: `0.6.7`
Repository: `perfumeJaguar/perfumeJaguar.github.io`
Path: `experiments/p5-media-lab/`
Live page: `https://perfumeJaguar.github.io/experiments/p5-media-lab/`

## Project boundary

This is an independent browser-based media-art experiment, not part of the portfolio site's design system. It is hosted inside the portfolio repository only for convenient GitHub Pages deployment. It may later move to `perfumeJaguar/mediaArt`; do not migrate it until explicitly requested.

## Current artistic baseline

The current experiment is PHOTO ONLY. Video files may remain in the repository but are not fetched or rendered.

Primary source material:
- automatically discovered images from `assets/images/`;
- one original MP3 audio track;
- mouse / one-finger touch interaction.

The page is mobile-portrait first, requests fullscreen on the first user gesture, and keeps a dense terminal-like telemetry layer as part of the artwork.

## Current image system

Images are discovered through the public GitHub Contents API. `assets.js` remains a fallback manifest. All discovered images currently preload before `TOUCH TO START` is enabled.

Each visual source draw receives its own independent random crop. Cropping is not a final global zoom. Different layers, shards, double exposures, and feedback sources can therefore use different crop scale and position values even when they reference the same source image.

Current source crop range is approximately `1.0x ... 2.65x`, with an additional touch boost.

### Active visual presets

Current playlist:
- `PHOTO_FEEDBACK_CROP`
- `PHOTO_RAPID_CROP`
- `PHOTO_RGB_TEAR`
- `PHOTO_SHARD_SWAP`
- `PHOTO_DOUBLE_BLEND`
- `PHOTO_BLEND_CYCLE`
- `PHOTO_FULL`
- `LUMA_BLOCKS`
- `LUMA_VOID`
- `LUMA_MONO`
- `LUMA_DITHER`
- `LUMA_PULSE`

`PHOTO_HALATION` / bloom-style blur was removed from the active experiment in v0.6.7 because blur was comparatively expensive on mobile and was not essential to the current study.

`PHOTO_CRUSH` is not a separate preset. It is a common pass applied to every preset.

## Touch behavior

Touch is intended to corrupt the image rather than simply speed it up.

Current touch rupture pipeline:

`preset composition -> PHOTO_CRUSH -> preset feedback -> grayscale/high contrast -> rupture bands -> final four-band palette`

Current four-band touch palette:
- black;
- dark gray;
- light gray;
- vivid red.

The vivid red replaces the former WHITE / brightest luminance band. Both intermediate gray bands are neutral again.

Fast swipe adds a second recursive feedback layer only when normalized swipe speed exceeds `0.30`. A stationary press does not activate swipe feedback.

## v0.6.6 engine-registration root fix

Versions 0.6.3–0.6.5 attempted to replace a top-level JavaScript class through a same-named `window` property. Because top-level `class` declarations use a lexical binding, the old v0.6.1 constructor kept being instantiated even while newer version labels were visible.

From v0.6.6 onward the active visual engine is registered explicitly through:

`window.P5LAB_VISUAL_ENGINE_CLASS`

and the application orchestrator instantiates that registry. Telemetry exposes `ENGINE Vx.x.x` so the visible app version and actual engine revision can be verified independently.

## v0.6.7 performance revision

After v0.6.6 finally activated the intended rupture path, real mobile performance dropped from approximately 60 fps normally to about 15 fps while pressed. The main cause was a full-resolution `loadPixels()/updatePixels()` loop plus touch compositing every rendered frame.

v0.6.7 changes the expensive touch path:
- mobile rupture buffer scale: `0.45` of the main processing buffer;
- desktop rupture buffer scale: `0.70`;
- mobile rupture calculation: every second rendered frame;
- desktop rupture calculation: every frame;
- skipped mobile frames reuse the previous rupture result;
- a fresh press forces an immediate new rupture frame;
- redundant p5 `POSTERIZE` processing was removed because the final palette remap already performs four-band quantization;
- swipe feedback threshold increased from `0.20` to `0.30`;
- halation preset removed;
- legacy glow buffer reduced to a compatibility-sized 2x2 buffer.

These changes are intended to preserve the harsh low-resolution aesthetic while materially reducing CPU/pixel-transfer cost on mobile.

## Audio baseline

Audio output uses a native HTML audio element as the stable audible path. PCM analysis / Web Audio processing is layered separately so visual analysis and interactive wet effects do not endanger the basic audible playback path.

Current interactive audio concepts include:
- subtle playback-rate change only;
- low-pass filter control;
- distortion;
- delay and feedback;
- wet-layer increase under touch;
- RMS / bass / mid / treble / waveform analysis returning into the visual system.

The waveform is displayed continuously as visual material.

## Telemetry

Telemetry is both instrumentation and artwork. It displays real internal values but disguises readable preset names with pseudo-system labels and occasional cosmetic character corruption.

Current telemetry includes:
- app version;
- `AUTHOR Hoyeon Choi`;
- actual visual `ENGINE` revision;
- mode / FX aliases;
- image-pool load count;
- audio state / PCM / FX state;
- FPS / viewport / processing-buffer size;
- pointer, pressure, swipe speed;
- luminance and motion;
- RMS / frequency bands / filter / delay / distortion / wet / playback rate.

## Primary edit points

Start with `config.js`. Most artistic and performance tuning belongs there.

Important source files in the current version chain:
- `config.js` — user-facing tuning and preset playlist;
- `js/media-manager.js` — image discovery / preload / image pool;
- `js/visual-engine-v061.js` — main photo effect implementation baseline;
- `js/visual-engine-v064.js` / `v065.js` — touch palette / render-order history;
- `js/visual-engine-v066.js` — explicit engine registry root fix;
- `js/visual-engine-v067.js` — current touch-performance optimization and palette;
- `js/audio-engine-v050.js` + `js/audio-touch-v060.js` — current audio path;
- `js/interaction.js` — mouse/touch state and swipe speed;
- `js/telemetry.js` — terminal-style UI;
- `sketch-v066.js` — current orchestrator using the registered visual engine.

## Current configuration values worth tuning

In `config.js`:
- `app.modeDurationSec` — automatic preset duration;
- `visual.sourceCropMinZoom` / `sourceCropMaxZoom` — crop range;
- `visual.photoCutMs` — image-cut timing;
- `visual.feedbackScale` / `feedbackAlpha` — ordinary recursive feedback;
- `visual.touchRuptureResolutionScaleMobile` — largest touch-performance knob;
- `visual.touchRuptureFrameSkipMobile` — touch calculation cadence;
- `visual.swipeFeedbackThreshold` — gesture speed needed for swipe feedback;
- `visual.vignetteStrength` — vignette;
- audio wet/filter/delay/distortion ranges under `audio`.

## Known limits

- GitHub Pages cannot enumerate folders natively, so automatic image discovery depends on GitHub's public Contents API. `assets.js` remains a fallback.
- Preloading many decoded images can consume substantial mobile RAM even if compressed files are small. If the archive grows far beyond the current test set, a rolling resident-image cache may be preferable.
- Canvas2D/p5 pixel loops become expensive quickly. Heavy multi-pass feedback, blur, displacement, or shader-like operations may eventually justify WebGL/Three.js shaders.
- Fullscreen is requested but remains browser-dependent.
- GitHub Pages deployment and browser cache can lag behind repository commits; visible app version plus `ENGINE` telemetry are the authoritative runtime check.

## Continuity rule

For future work, read this file first and verify actual source in GitHub. Treat GitHub as the implementation source of truth. Do not reconstruct the current implementation from conversation memory when the repository can be checked.
