# PROJECT_STATE — p5 Media Lab 01

Last updated: 2026-08-25
Current repository: `perfumeJaguar/perfumeJaguar.github.io`
Current path: `experiments/p5-media-lab/`
Live page: `https://perfumeJaguar.github.io/experiments/p5-media-lab/`
Status: independent experimental media-art project; currently hosted inside the portfolio repository for convenience
Possible future home: `perfumeJaguar/mediaArt` or another media-art repository

## Project identity

`p5 Media Lab 01` is **not part of the portfolio site design itself**. It is an independent browser-based audiovisual media-art / technology experiment that happens to be hosted under the portfolio GitHub Pages repository at the moment.

Treat this folder as its own project with its own architecture, source state, experiments, constraints, and documentation. Do not merge its design decisions into the portfolio site unless explicitly requested.

If the project later moves to the `mediaArt` repository, preserve this file and the project-local documentation as the continuity source of truth.

## Purpose

The immediate goal is to explore the practical expressive range of **p5.js + p5.sound** in a static GitHub Pages environment, using the user's own moving images, still photographs, and original music.

The first version is intentionally closer to a broad experimental laboratory than a finished artwork. It should expose many different image, video, interaction, analysis, synthesis, and sound-processing techniques so they can be judged individually and later removed, isolated, recombined, or developed into separate works.

Longer-term uses may include:
- browser-native media artwork;
- online exhibition work;
- audiovisual sketch/prototype environment;
- research material for later Three.js/WebGL work;
- a bridge between web interaction and future TouchDesigner / installation systems.

## Core artistic / interaction constraints

These are current confirmed requirements.

### Display
- **Mobile portrait is the primary design target.**
- Desktop/wide screens should adapt reasonably without becoming a separate design.
- Moving images and still images should always visually fill the viewport.
- Preserve source aspect ratio and use an `object-fit: cover` equivalent; cropping is preferable to letterboxing.
- Canvas follows the currently visible viewport, including mobile browser chrome changes when possible.
- First user gesture requests fullscreen. If fullscreen is unavailable or denied, the work must continue in viewport-cover mode.
- This experimental artwork may suppress pinch zoom / ordinary page gestures; this policy should not automatically propagate to the main portfolio.

### Audience input
- Keep interaction deliberately simple: **mouse or one-finger touch only**.
- Do not add complex button panels, keyboard performance controls, or multi-touch interfaces unless explicitly requested later.
- Pointer position is both a direct controller and a virtual pickup that samples the underlying image/video.

### Telemetry as visual material
- A separate terminal-like telemetry layer is a **core artistic component**, not merely a debug overlay.
- It should expose real internal values whenever possible rather than random fake terminal text.
- Dense text, changing numbers, event history, and slight signal-driven jitter are aesthetically desirable.
- Readability may be imperfect if the information density contributes to the visual character, but the underlying values should remain meaningful.

## Technology baseline

No build system or framework is currently used.

- Static HTML5 / CSS / JavaScript
- p5.js `2.3.1`
- p5.sound `0.4.1`
- GitHub Pages hosting
- No Node.js runtime on the deployed site
- No npm/Vite dependency for this version
- No backend required

The library versions are pinned in `index.html` for reproducibility.

## Current source structure

```text
experiments/p5-media-lab/
├── index.html
├── style.css
├── assets.js
├── config.js
├── sketch.js
│
├── js/
│   ├── utils.js
│   ├── telemetry.js
│   ├── media-manager.js
│   ├── video-analyzer.js
│   ├── audio-engine.js
│   ├── interaction.js
│   └── visual-engine.js
│
├── assets/
│   ├── video/
│   ├── images/
│   └── audio/
│
├── README.md
├── ARCHITECTURE.md
├── ASSET_GUIDE.md
└── PROJECT_STATE.md
```

### Primary edit points
- `config.js`: first place to change timing, performance limits, telemetry, effect strengths, and visual preset composition.
- `assets.js`: canonical media manifest.
- `visual-engine.js`: visual effect implementations and preset rendering.
- `audio-engine.js`: audio graph, analysis, and image/gesture-to-audio mappings.
- `video-analyzer.js`: pixel/luminance/motion extraction.
- `telemetry.js`: terminal-style instrumentation layer.
- `sketch.js`: global runtime order and startup.

## Current media manifest

The first real-media batch has been reduced from the original larger proposal to this exact naming convention:

### Video — 6 files
Expected under `assets/video/`:
- `video_720p_1.mp4`
- `video_720p_2.mp4`
- `video_720p_3.mp4`
- `video_720p_4.mp4`
- `video_720p_5.mp4`
- `video_720p_6.mp4`

Videos are short source clips, roughly 5–6 seconds each. The web versions are intended to be 720p H.264 MP4 proxies rather than archival/master files.

### Images — 10 files
Expected under `assets/images/`:
- `image_low_1.jpg`
- `image_low_2.jpg`
- `image_low_3.jpg`
- `image_low_4.jpg`
- `image_low_5.jpg`
- `image_low_6.jpg`
- `image_low_7.jpg`
- `image_low_8.jpg`
- `image_low_9.jpg`
- `image_low_10.jpg`

The photographs have an end-of-century / apocalyptic / decayed atmosphere and are intended as visual source material rather than pristine gallery-image presentation.

### Audio — 1 file
Expected under `assets/audio/`:
- `audio_low1.mp3`

The audio is the user's own original music. It is used both as audible material and as an analysis source for visual behavior.

`assets.js` already references these exact filenames. Asset upload/verification is a separate step from manifest registration; verify repository presence before assuming a particular asset is live.

## Current audiovisual signal model

The project intentionally demonstrates signal flow in both directions.

### Image / gesture → audio
- Pointer-local luminance → low-pass filter cutoff.
- Global frame-difference motion → delay feedback.
- Pointer X → stereo pan + delay time.
- Pointer Y → playback rate / distortion relationship.
- Press/hold → temporary intensity contribution in selected mappings.

### Audio → visual
- RMS → particle/waveform strength and other visual intensity.
- Bass → zoom / spawning / feedback response.
- Mid → available to presets and future mappings.
- Treble → particle lift / scanline intensity.
- Waveform → direct geometry drawing.

### Video analysis
Current analysis is deliberately lightweight for mobile use:
- global average RGB / luminance;
- pointer-local RGB / luminance;
- simple frame-to-frame difference as motion value;
- smoothed motion control signal.

This is not optical flow, object detection, or semantic computer vision.

## Current visual capability sampler

The initial visual engine contains multiple deliberately different techniques:
- full-cover source rendering;
- RGB additive split / chromatic displacement;
- clipped horizontal slice displacement;
- mosaic reconstruction from downsampled source pixels;
- particle system driven by interaction / analysis / audio;
- ping-pong temporal feedback buffers;
- posterize filter;
- scanlines;
- waveform geometry;
- still-image collage overlay;
- procedural/noise behavior;
- combination / stress-test mode.

Current preset names:
- `PICKUP`
- `RGB_FEEDBACK`
- `SLICE_SCAN`
- `PIXEL_FIELD`
- `POSTER_WAVE`
- `OVERLOAD`

Modes currently change automatically rather than through explicit UI controls.

## Mobile performance strategy

The project is mobile-first and intentionally conservative at v0.1.

Current principles:
- main display canvas follows viewport;
- p5 pixel density is constrained to avoid unnecessary Retina-scale processing;
- visual processing happens in a capped lower-resolution graphics buffer, then scales to the display;
- video analysis uses a much smaller buffer;
- only one active video decoder should be kept alive;
- feedback uses ping-pong buffers rather than expensive full-resolution history storage;
- particle count is bounded;
- slice passes are fewer on mobile than desktop;
- actual real-device FPS / thermal behavior should determine whether limits are raised.

The existing conservative mobile values include approximately:
- analysis width around 128 px;
- visual processing long edge around 900 px;
- 12 mobile slice passes.

Do not increase these merely because desktop performance is good.

## Fullscreen / browser behavior

The first `TOUCH TO START` gesture is used to satisfy mobile browser audio policy and request fullscreen.

Expected behavior:
1. user taps/clicks;
2. AudioContext is allowed to start;
3. fullscreen is requested where supported;
4. media/audio engines start;
5. if fullscreen fails, viewport-sized rendering continues.

Fullscreen cannot be treated as guaranteed, especially across mobile browsers. The work must never depend on fullscreen success to remain functional.

## Important debugging history

### p5.sound FFT constructor breakage — resolved

Initial runtime failed with:

`IndexSizeError: Failed to set the 'fftSize' property on 'AnalyserNode': The FFT size provided (1) is outside the range [32, 32768].`

Cause:
- legacy p5.sound examples used `new p5.FFT(smoothing, bins)`;
- p5.sound 0.4.x uses a changed constructor shape;
- `new p5.FFT(0.82, 128)` caused `0.82` to be interpreted as FFT size and eventually become `1`.

Fix:
```js
this.fft = new p5.FFT(128);
this.fft.smooth(0.82);
```

### Stale browser / Pages script cache — resolved defensively

After the FFT source was fixed in GitHub, the browser still displayed the old stack trace. Repository inspection confirmed `main` already contained the corrected constructor.

To force clients to fetch the new local scripts, `index.html` was updated to use versioned query strings on local CSS/JS references (cache busting).

The page was subsequently confirmed by the user to run successfully.

Keep this in mind during rapid GitHub Pages iteration: a repeated old stack trace may represent stale assets rather than current repository code.

## Current confirmed runtime state

As of 2026-08-25:
- GitHub Pages page opens;
- startup proceeds past the previous FFT fatal error;
- user has confirmed that the experiment **runs**;
- cache-busting is active for the current local frontend assets;
- real media filenames are registered in the manifest;
- exact presence/completeness of all 17 uploaded media files should still be verified separately after upload is declared complete.

## Documentation policy

This folder should remain self-documenting because it is intended to be modified experimentally.

- `PROJECT_STATE.md` — current authoritative project state, decisions, failures, resolved issues, current baseline, migration status, and next steps.
- `README.md` — practical user-facing operation/customization guide.
- `ARCHITECTURE.md` — internal data flow, runtime ordering, module roles, signal graph, performance strategy.
- `ASSET_GUIDE.md` — source media preparation guidance.
- Source files should contain explanatory comments, especially where code exists for browser policy, compatibility, performance, or non-obvious artistic reasons.

At meaningful checkpoints, update this file before relying on conversational memory.

## Relationship to the portfolio project

The current physical location inside `perfumeJaguar.github.io` is a hosting choice only.

Do **not** assume:
- its typography should match the portfolio;
- its telemetry aesthetic should be used on the portfolio;
- its fullscreen / zoom suppression rules should apply to ordinary portfolio pages;
- its p5 dependencies belong in the main site runtime;
- its future structure should remain coupled to the portfolio repository.

The root portfolio `PROJECT_STATE.md` should only keep a short pointer explaining that this independent experiment is hosted under `experiments/`. Detailed p5 decisions belong here.

## Possible future migration

The project may later move into `perfumeJaguar/mediaArt`.

If migrated:
1. move the complete `p5-media-lab/` folder including this state file;
2. preserve Git history if practical, but source/document continuity is more important than preserving the current URL;
3. decide separately how the resulting artwork should be deployed publicly;
4. leave a redirect or portfolio link only if useful;
5. do not merge it into TouchDesigner source merely because both are media-art projects; they can share a repository while remaining independent subprojects.

No migration should be performed until explicitly requested.

## Current open questions / next work

1. Finish uploading the registered six videos, ten images, and one MP3.
2. Verify all 17 files exist at the expected repository paths and are served by GitHub Pages.
3. Test with the actual media on a real vertical mobile Chrome device.
4. Observe FPS, thermal behavior, loading delay, video decoder behavior, and audio graph stability.
5. Evaluate each visual preset individually rather than judging the overloaded combined system as a final artwork.
6. Remove weak effects, tune useful ones, and identify which behaviors deserve separate studies.
7. Decide whether still images should preload, lazy-load, or cycle through a smaller memory window after actual memory behavior is observed.
8. Decide whether the next phase remains p5-based or whether selected ideas should be reimplemented in Three.js/WebGL for shader/GPU experimentation.
9. Consider moving the project to `mediaArt` only after its immediate p5 test phase is stable.

## Continuity rule

For any future work on `p5 Media Lab 01`, read this file first, then inspect the actual source files as needed. Treat GitHub as the implementation source of truth. Do not reconstruct the current implementation from memory when the repository can be checked.
