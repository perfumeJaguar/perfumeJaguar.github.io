# PROJECT_STATE — p5 Media Lab 01

Last updated: 2026-08-25
Current version: `0.7.0`
Repository: `perfumeJaguar/perfumeJaguar.github.io`
Path: `experiments/p5-media-lab/`
Live page: `https://perfumeJaguar.github.io/experiments/p5-media-lab/`

## Project boundary

This is an independent browser-based media-art experiment, not part of the portfolio site's design system. It is hosted inside the portfolio repository only for convenient GitHub Pages deployment. It may later move to `perfumeJaguar/mediaArt`; do not migrate it until explicitly requested.

## Current artistic baseline

The experiment is currently PHOTO ONLY. Video files may remain in the repository but are not fetched or rendered. Primary material is automatically discovered still images, one original MP3, and mouse / one-finger touch interaction.

Mobile portrait is the primary target, but v0.7.0 explicitly improves behavior when source-image aspect ratios and browser aspect ratios differ strongly. The first gesture requests fullscreen. A dense terminal-like telemetry layer is part of the artwork rather than merely debugging UI.

## Image system — v0.7.0

The complete archive is discovered through GitHub's public Contents API. `assets.js` remains a fallback manifest.

The previous preload-all architecture has been replaced by a rolling decoded-image working set:

- complete archive: lightweight path + `setId` metadata only;
- active decoded pool: `20` images;
- staging pool: up to `5` images;
- runtime rotation interval: `5` seconds after the previous swap completes;
- runtime staging/decode concurrency: `1`;
- initial loading concurrency: `3` for startup speed;
- swap occurs only after staged images have loaded successfully;
- evicted entries are removed from active/cache/current-source references so their decoded `p5.Image` objects can become garbage-collection candidates.

The browser controls actual garbage-collection timing, so OS-visible process memory may not drop immediately after eviction. Compressed source files may also remain in normal browser HTTP cache; this is separate from decoded bitmap memory.

### Rotation / selection policy

Current candidate selection is a shuffle-bag policy rather than filename-order FIFO playback.

- archive entries are shuffled per page session;
- current active/staging entries are excluded from replacement candidates;
- the remaining shuffled bag is consumed before a new bag is generated where possible;
- after a cycle, candidate order is shuffled again;
- renderer-level source selection remains independent from cache rotation.

This is intentionally isolated in the media manager as a policy boundary. Future strategies such as weighted folders, per-set quotas, strict unseen-first traversal, person-A/person-B alternation, or other set mixing should modify candidate selection rather than effect code.

### Future image sets

Archive entries already carry `setId`. Current config uses:

`imageSets: [{ id: "default", subdir: "" }]`

The discovery layer can also accept configured subfolders such as `personA/` and `personB/`. At present configured sets enter the same shuffle-bag selection pool. More specific inter-set mixing behavior is deliberately not hard-coded yet.

## Crop system — v0.7.0

Each visual source draw still receives an independent random crop. Cropping remains source-level, not a final global zoom.

Current artistic zoom range is fixed to `1.0x ... 2.5x`. Touch no longer raises the maximum beyond `2.5x`.

The important v0.7.0 change is overflow-aware crop positioning:

1. calculate the normal cover-fit scale from actual source dimensions and current render-buffer dimensions;
2. apply the random crop zoom;
3. calculate the total horizontal and vertical overflow produced by cover-fit plus extra zoom;
4. choose random X/Y offsets across the complete legal overflow range;
5. clamp touch bias inside that legal range so no empty/letterboxed canvas edge is exposed.

Therefore, when a tall portrait image is displayed on a wide browser window, the top and bottom regions that a centered cover would normally discard can appear in later crops. Wide images on portrait displays receive the equivalent horizontal traversal.

The relevant aspect ratio is the current browser/canvas viewport, not the physical monitor resolution.

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

`PHOTO_HALATION` / bloom-style blur remains removed from the active experiment because it is comparatively expensive on mobile and not essential to the current photo-destruction study. `PHOTO_CRUSH` is a common pass applied to every preset rather than a separate preset.

## Touch behavior

Touch corrupts the image rather than merely accelerating it.

Pipeline:
`preset composition -> PHOTO_CRUSH -> preset feedback -> grayscale/high contrast -> rupture bands -> final four-band palette`

Current four-band palette:
- black;
- dark gray;
- muted / reduced-saturation red;
- near-white.

The red replaces the upper-middle gray band. Current red is approximately `RGB(238, 94, 90)`.

Fast swipe adds a second recursive feedback layer only when normalized swipe speed exceeds `0.30`. A stationary press does not activate swipe feedback.

## Engine registration

From v0.6.6 onward the active visual engine is registered explicitly through `window.P5LAB_VISUAL_ENGINE_CLASS`, and the orchestrator instantiates that registry. Telemetry exposes `ENGINE Vx.x.x` so the visible app version and actual engine revision can be verified independently.

The current chain ends in `js/visual-engine-v070.js`, which extends v0.6.8 and overrides source crop placement while preserving prior touch-performance and palette behavior.

## Mobile performance baseline

Touch-performance optimizations from v0.6.8 remain active:

- mobile rupture buffer scale: `0.50` of the main processing buffer;
- desktop rupture buffer scale: `0.70`;
- mobile rupture calculation: every second rendered frame;
- desktop rupture calculation: every frame;
- skipped mobile frames reuse the previous rupture result;
- fresh press forces immediate calculation;
- final palette loop performs quantization;
- swipe feedback threshold: `0.30`;
- halation/bloom preset removed;
- legacy glow buffer remains compatibility-sized.

v0.7.0 adds memory-oriented optimization by bounding the decoded image pool. Real-device testing should now watch both touch FPS and browser memory while the 5-second rolling pool runs for several minutes.

## Audio baseline

Audio output uses a native HTML audio element as the stable audible path. PCM analysis / Web Audio processing is layered separately so visual analysis and interactive wet effects do not endanger basic playback.

Current concepts include subtle playback-rate change, low-pass filtering, distortion, delay/feedback, touch-controlled wet layer, and RMS / frequency-band / waveform analysis feeding visuals. Waveform is displayed continuously.

## Telemetry

Telemetry displays real internal values but disguises readable preset names with pseudo-system labels and occasional cosmetic character corruption. Media snapshots now also expose resident pool size, total archive size, staging size, image-set count, rotation state, and rotation-cycle count for debugging.

Pointer/touch position markers on the image itself remain disabled.

## Primary edit points

Start with `config.js` for artistic/performance tuning.

Important files:
- `config.js` — user-facing tuning, rolling-pool values, crop range, preset playlist;
- `js/media-manager.js` — archive discovery, set metadata, shuffle-bag selection, active/staging pool and eviction;
- `js/visual-engine-v061.js` — main photo-effect baseline;
- `js/visual-engine-v066.js` — explicit engine-registry root fix;
- `js/visual-engine-v067.js` — touch-performance optimization implementation;
- `js/visual-engine-v068.js` — current rupture palette/scale baseline;
- `js/visual-engine-v070.js` — overflow-aware crop positioning and fixed 1.0–2.5x clamp;
- `js/audio-engine-v050.js` + `js/audio-touch-v060.js` — current audio path;
- `js/interaction.js` — mouse/touch state and swipe speed;
- `js/telemetry.js` — terminal-style UI;
- `sketch-v066.js` — current orchestrator using registered visual engine.

Useful config controls now include `activeImageLimit`, `rotationBatchSize`, `rotationIntervalSec`, `imageSets`, source crop min/max, `sourceCropOverflowPan`, `photoCutMs`, feedback scale/alpha, `touchRuptureResolutionScaleMobile`, `touchRuptureFrameSkipMobile`, `swipeFeedbackThreshold`, vignette strength, and audio wet/filter/delay/distortion ranges.

## Known limits / next session

- Verify that `ENGINE 0.7.0` is visible at runtime after GitHub Pages/cache propagation.
- Test portrait images on a wide desktop viewport and confirm crops actually traverse formerly hidden top/bottom cover overflow.
- Test wide images on portrait mobile and confirm equivalent left/right traversal.
- Let the page run for several minutes and observe memory behavior across repeated `20 active + up to 5 staging -> 20 active` rotations.
- JavaScript reference removal makes old decoded images GC-eligible but cannot force immediate browser memory reclamation.
- The current multi-set layer supports explicitly configured subfolders but does not recursively discover arbitrary folder trees.
- Current set mixing is intentionally generic shuffle-bag pooling; per-set weighting/alternation remains future work.
- GitHub Pages cannot enumerate folders natively, so automatic discovery depends on GitHub's public Contents API.
- Canvas2D/p5 pixel loops remain expensive; heavy future multi-pass feedback/displacement may justify WebGL/Three.js shaders.
- Fullscreen remains browser-dependent.
- GitHub Pages deployment/cache may lag; visible app version plus `ENGINE` telemetry are the runtime authority.
- Keep visible revisions strictly version-numbered. Do not use ad-hoc labels such as `tune`, `red2`, etc. for implementation state.

## Continuity rule

For future work, read this file first and verify actual source in GitHub. GitHub is the implementation source of truth. Do not reconstruct current implementation from conversation memory when the repository can be checked.
