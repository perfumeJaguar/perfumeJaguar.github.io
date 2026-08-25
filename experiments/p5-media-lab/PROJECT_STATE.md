# PROJECT_STATE — p5 Media Lab 01

Last updated: 2026-08-25
Current version: `0.6.8`
Repository: `perfumeJaguar/perfumeJaguar.github.io`
Path: `experiments/p5-media-lab/`
Live page: `https://perfumeJaguar.github.io/experiments/p5-media-lab/`

## Project boundary

This is an independent browser-based media-art experiment, not part of the portfolio site's design system. It is hosted inside the portfolio repository only for convenient GitHub Pages deployment. It may later move to `perfumeJaguar/mediaArt`; do not migrate it until explicitly requested.

## Current artistic baseline

The experiment is currently PHOTO ONLY. Video files may remain in the repository but are not fetched or rendered. Primary material is automatically discovered still images, one original MP3, and mouse / one-finger touch interaction.

Mobile portrait is the primary target. The first gesture requests fullscreen. A dense terminal-like telemetry layer is part of the artwork rather than merely debugging UI.

## Image system

Images are discovered through the public GitHub Contents API. `assets.js` remains a fallback manifest. All discovered images currently preload before `TOUCH TO START` is enabled.

Each visual source draw receives an independent random crop. Cropping is source-level, not a final global zoom. Current source crop range is approximately `1.0x ... 2.65x`, with an additional touch boost.

Active presets:
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

`PHOTO_HALATION` / bloom-style blur is removed from the active experiment because it is comparatively expensive on mobile and not essential to the current photo-destruction study. `PHOTO_CRUSH` is a common pass applied to every preset rather than a separate preset.

## Touch behavior — v0.6.8 baseline

Touch corrupts the image rather than merely accelerating it.

Pipeline:
`preset composition -> PHOTO_CRUSH -> preset feedback -> grayscale/high contrast -> rupture bands -> final four-band palette`

Current four-band palette:
- black;
- dark gray;
- muted / reduced-saturation red;
- near-white.

The red replaces the upper-middle gray band. The brightest band is white again. Current red is approximately `RGB(238, 94, 90)`, intentionally less saturated than the earlier vivid red experiment.

Fast swipe adds a second recursive feedback layer only when normalized swipe speed exceeds `0.30`. A stationary press does not activate swipe feedback.

## Engine-registration fix

Versions 0.6.3–0.6.5 attempted to replace a top-level JavaScript class through a same-named `window` property. Because top-level `class` declarations use a lexical binding, the old v0.6.1 constructor kept being instantiated even while newer version labels were visible.

From v0.6.6 onward the active visual engine is registered explicitly through `window.P5LAB_VISUAL_ENGINE_CLASS`, and the orchestrator instantiates that registry. Telemetry exposes `ENGINE Vx.x.x` so the visible app version and actual engine revision can be verified independently.

## Mobile performance baseline

Once v0.6.6 activated the real rupture path, mobile performance was observed to drop from about 60 fps normally to about 15 fps while pressed. The main cause was full-resolution `loadPixels()/updatePixels()` plus touch compositing every rendered frame.

Current optimization state in v0.6.8:
- mobile rupture buffer scale: `0.50` of the main processing buffer;
- desktop rupture buffer scale: `0.70`;
- mobile rupture calculation: every second rendered frame;
- desktop rupture calculation: every frame;
- skipped mobile frames reuse the previous rupture result;
- fresh press forces immediate calculation;
- redundant p5 `POSTERIZE` pass removed; final palette loop performs quantization;
- swipe feedback threshold: `0.30`;
- halation/bloom preset removed;
- legacy glow buffer reduced to compatibility-sized `2x2`.

The mobile scale was raised from `0.45` in v0.6.7 to `0.50` in v0.6.8 for slightly better rupture detail. Real-device FPS after this change remains an important next-session measurement.

## Audio baseline

Audio output uses a native HTML audio element as the stable audible path. PCM analysis / Web Audio processing is layered separately so visual analysis and interactive wet effects do not endanger basic playback.

Current concepts include subtle playback-rate change, low-pass filtering, distortion, delay/feedback, touch-controlled wet layer, and RMS / frequency-band / waveform analysis feeding visuals. Waveform is displayed continuously.

## Telemetry

Telemetry displays real internal values but disguises readable preset names with pseudo-system labels and occasional cosmetic character corruption. It includes app version, `AUTHOR Hoyeon Choi`, actual visual `ENGINE` revision, mode/FX aliases, image-pool state, audio/PCM/FX state, FPS, viewport/buffer size, pointer/pressure/swipe speed, luminance/motion, RMS/frequency bands, filter/delay/distortion/wet/playback rate.

Pointer/touch position markers on the image itself are disabled.

## Primary edit points

Start with `config.js` for artistic/performance tuning.

Important files:
- `config.js` — user-facing tuning and preset playlist;
- `js/media-manager.js` — image discovery / preload / image pool;
- `js/visual-engine-v061.js` — main photo effect baseline;
- `js/visual-engine-v066.js` — explicit engine-registry root fix;
- `js/visual-engine-v067.js` — touch-performance optimization implementation;
- `js/visual-engine-v068.js` — current v0.6.8 palette/scale revision;
- `js/audio-engine-v050.js` + `js/audio-touch-v060.js` — current audio path;
- `js/interaction.js` — mouse/touch state and swipe speed;
- `js/telemetry.js` — terminal-style UI;
- `sketch-v066.js` — current orchestrator using registered visual engine.

Useful config controls include `app.modeDurationSec`, source crop min/max, `photoCutMs`, feedback scale/alpha, `touchRuptureResolutionScaleMobile`, `touchRuptureFrameSkipMobile`, `swipeFeedbackThreshold`, vignette strength, and audio wet/filter/delay/distortion ranges.

## Known limits / next session

- First priority: measure real mobile FPS in v0.6.8 during stationary touch and fast swipe. If touch is still too expensive, adjust rupture scale/cadence before adding more visual passes.
- GitHub Pages cannot enumerate folders natively, so automatic discovery depends on GitHub's public Contents API; `assets.js` is fallback.
- Large decoded image pools can consume substantial mobile RAM; a rolling cache may eventually be preferable.
- Canvas2D/p5 pixel loops become expensive quickly. Heavy multi-pass feedback/displacement may eventually justify WebGL/Three.js shaders.
- Fullscreen remains browser-dependent.
- GitHub Pages deployment/cache may lag; visible app version plus `ENGINE` telemetry are the runtime authority.
- Keep visible revisions strictly version-numbered. Do not use ad-hoc labels such as `tune`, `red2`, etc. for implementation state.

## Continuity rule

For future work, read this file first and verify actual source in GitHub. GitHub is the implementation source of truth. Do not reconstruct current implementation from conversation memory when the repository can be checked.
