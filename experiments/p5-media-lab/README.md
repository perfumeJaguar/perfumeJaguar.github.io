# p5 Media Lab 01

A mobile-first audiovisual test work for exploring the practical range of **p5.js + p5.sound** inside a static GitHub Pages site.

This is intentionally a **media-art laboratory rather than a finished artwork**. It exposes many techniques at once so individual behaviors can later be removed, isolated, recombined, or developed into separate works.

## Project boundary

This is an **independent media-art project**, not part of the portfolio site's visual/design system. It is currently hosted under `perfumeJaguar.github.io/experiments/` only for convenient GitHub Pages deployment.

It may later move to the `perfumeJaguar/mediaArt` repository. Until that is explicitly requested, keep it in the current location and treat this folder as a self-contained project.

For the authoritative current implementation state, decisions, debugging history, migration status, and next steps, read `PROJECT_STATE.md` first.

## Core idea

The project treats moving image as both an image and a control signal.

- Video / image pixels become visual material.
- The pixel under the mouse or fingertip becomes a virtual pickup.
- Local brightness controls audio filtering.
- Frame-to-frame motion controls delay feedback.
- Pointer position changes pan, playback rate, delay time, and distortion.
- Audio amplitude / FFT bands return in the opposite direction and alter visual behavior.
- A telemetry layer displays real internal parameters as an aesthetic terminal-like surface.

The only audience input is **mouse or one-finger touch**.

## Current status

Version: `0.1.0`

The project runs even before personal assets are added. When `assets.js` is empty it uses:

- a procedural moving-image fallback generated in p5.js;
- two quiet p5 oscillators as a diagnostic audio source.

This fallback is deliberate: code structure, interaction, telemetry, visual presets, pixel analysis, FFT, effects, fullscreen behavior, and mobile layout can be tested immediately.

As of 2026-08-25 the GitHub Pages build has been confirmed by the user to start and run after resolving a p5.sound 0.4.1 FFT-constructor incompatibility and adding local-script cache busting. See `PROJECT_STATE.md` for the exact debugging record.

## Start / run

The page is designed to be served over HTTP(S), including directly through GitHub Pages.

Open:

`/experiments/p5-media-lab/`

The first `TOUCH TO START` gesture is used to:

1. satisfy browser audio-autoplay restrictions;
2. request fullscreen where supported;
3. start the media/audio engines.

If fullscreen is unavailable or rejected, the piece continues in viewport-cover mode.

## Add personal media

Create these folders (already represented in Git by `.gitkeep` files):

```text
assets/
├── video/
├── images/
└── audio/
```

The first registered real-media batch currently uses these exact names:

```text
assets/video/video_720p_1.mp4 ... video_720p_6.mp4
assets/images/image_low_1.jpg ... image_low_10.jpg
assets/audio/audio_low1.mp3
```

The canonical list is `assets.js`. See `ASSET_GUIDE.md` for preparation guidance and `PROJECT_STATE.md` for the current batch/status.

## Visual modes

Modes cycle automatically; there are no mode-selection buttons in the artwork.

- `PICKUP` — clean moving image + audio waveform; best for inspecting image-to-audio mapping.
- `RGB_FEEDBACK` — additive RGB separation and temporal accumulation.
- `SLICE_SCAN` — horizontal clipped slices displaced by noise and motion, plus feedback.
- `PIXEL_FIELD` — pixel mosaic plus a noise-driven particle field.
- `POSTER_WAVE` — p5 built-in posterize filter plus waveform.
- `OVERLOAD` — intentionally excessive combination of several systems for stress testing.

Change the list or enabled features in `config.js`.

## Audio mapping

Current mapping is intentionally obvious enough to diagnose by ear:

| Input | Audio parameter |
|---|---|
| local pixel brightness | low-pass cutoff |
| global frame motion | delay feedback |
| pointer X | stereo pan + delay time |
| pointer Y | playback rate + distortion relationship |
| press / hold | temporary intensity boost in several mappings |

Audio also returns values to the visual system:

| Audio analysis | Visual use |
|---|---|
| RMS | particle size / opacity / waveform strength |
| Bass | zoom / particle spawning / feedback response |
| Mid | available for future presets |
| Treble | particle lift / scanline energy |
| Waveform | drawn directly as geometry |

## Screen policy

The moving image always uses an **object-fit: cover equivalent**. Aspect ratio is preserved, empty edges are not permitted, and cropping is expected.

The outer canvas follows the visible browser viewport. The code listens to browser resize, orientation change, fullscreen change, and `visualViewport` resize when available.

Portrait/mobile is the design baseline. Desktop uses the same system with a wider telemetry arrangement and a somewhat larger internal processing buffer.

## Telemetry layer

Telemetry is a real instrumentation layer, not random terminal decoration.

It can expose viewport and buffer size, FPS, source filename/type, pointer values, local RGB/luminance, global luminance/motion, audio RMS/FFT bands, effect parameters, current preset, and real state-change event history.

A small motion-dependent text jitter is aesthetic, but the values themselves remain actual data.

## Fast customization

Start in `config.js`.

Typical edits:

- slower mode changes: `app.modeDurationSec`
- slower clip changes: `app.sourceSwitchSec`
- disable fullscreen request: `app.requestFullscreenOnStart`
- reduce mobile load: lower `render.maxBufferLongEdgeMobile`
- reduce analysis load: lower `render.analysisWidthMobile`
- disable an effect inside a preset: set its property to `false`
- change terminal density/opacity: edit `telemetry` values

## Why the processing buffers are smaller than the screen

A phone may display over two million physical pixels per frame. Reading those pixels into JavaScript every frame is wasteful.

This project separates:

- **display canvas** — always viewport-sized;
- **visual processing buffer** — capped long edge, then scaled to cover;
- **analysis buffer** — only about 128–180 pixels wide.

This resembles using lower-resolution TOPs for analysis/control paths in TouchDesigner while keeping final presentation at display resolution.

## Known limitations

- Fullscreen behavior differs by mobile browser and can be exited by the user/system.
- p5 pixel operations are not a substitute for a GPU shader pipeline at high resolutions.
- `createVideo()` decoding behavior depends on browser codec support.
- Aggressive audio rate changes also change pitch.
- The simple motion detector is frame difference, not optical flow or object tracking.
- Multiple high-resolution video decoders are deliberately avoided; only one active video is kept alive.
- The `OVERLOAD` preset is expected to be heavier than the others, especially on old phones.

For deeper architecture and edit points, read `ARCHITECTURE.md`. For continuity and current project state, read `PROJECT_STATE.md`.
