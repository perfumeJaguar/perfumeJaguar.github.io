# PROJECT_STATE — Hoyeon Choi Portfolio

Last updated: 2026-08-25
Repository: `perfumeJaguar/perfumeJaguar.github.io`
Live site: `https://perfumeJaguar.github.io/`
Branch: `main`

## Purpose

Personal portfolio website for Hoyeon Choi, built as a static GitHub Pages site. The site is intended for media art, moving image, sound/performance, photography, and related portfolio material.

The current phase is visual/prototyping work rather than final content production. GitHub is the source of truth for the implementation.

## Design direction

- Strongly minimal, editorial, artist-portfolio aesthetic.
- Cargo sites are the main visual reference, especially the supplied `8886588.cargo.site` reference and `352785-a.cargo.site` gallery reference.
- Mobile-first vertical scrolling is important.
- Large typography, sparse information hierarchy, long vertical rhythm, restrained rules/borders, and simple media presentation.
- Industrial / neutral typography is preferred over decorative styling.
- Korean typography matters significantly; default Korean system fonts are not considered suitable for the desired design.
- Layout should remain plain enough that images, video, text, and project documentation carry the visual weight.

## Current baseline files

### `index.html` + `style.css`
Main Cargo-inspired portfolio prototype.

Current structure:
- Sticky/simple top navigation: Hoyeon Choi / Information.
- Oversized multi-line hero title.
- Numbered project sections.
- Large main-media placeholders.
- Three-column thumbnail rows.
- Project statement blocks.
- Information section with Profile / Skills / Exhibitions / Awards / Press-style rows.

This is still a structural placeholder rather than final portfolio content.

### `gallery.html` + `gallery.css`
Alternative gallery/archive prototype inspired by the second Cargo reference.

Current structure:
- Continuous vertical archive.
- Project index + title + metadata.
- Large media blocks followed by small captions.
- Mixed wide / portrait / square media rhythm.
- Intended as a useful visual grammar for future image/video-heavy pages.

### `Font_test.html`
Typeface specimen/archive for comparing Korean-friendly free web fonts in an actual portfolio-like layout.

Currently compares 13 typefaces:
1. IBM Plex Sans KR
2. Wanted Sans
3. Pretendard
4. SUIT
5. Gothic A1
6. LINE Seed Sans KR
7. NanumSquare Neo
8. Gmarket Sans
9. MaruBuri
10. Black Han Sans
11. Do Hyeon
12. Jua
13. Gowun Batang

Tests include:
- Very large Regular / Bold / Italic headings.
- Korean sentence followed by equivalent English sentence.
- Multi-line large typography specifically to inspect tight leading and glyph collisions.
- Medium and subheading sizes.
- Body Regular / Bold / Italic.
- 12px / 11px / 10px two-line small-text tests.
- 9px extreme-small reference.
- Numerals, dates, technical metadata, and symbols.
- Large Korean leading currently intentionally tight (`.82`) for stress testing.
- Some Korean fonts have no true italic face, so browser synthetic italic may appear; this is a test characteristic, not a final design decision.

### `Font_test-1.html`, `Font_test-2.html`, `Font_test-3.html`
Theme entry pages that redirect to the same `Font_test.html` specimen with query parameters, so typography/content stays synchronized rather than being duplicated.

- `Font_test-1.html` → white theme (`?theme=white`)
- `Font_test-2.html` → neutral gray theme (`?theme=gray`)
- `Font_test-3.html` → warm paper theme (`?theme=warm`)

The warm paper palette is an experimental recommendation, not a final background choice. Final background should be judged with real portfolio imagery because image color/grain can change the result substantially.

### `Embed_test_1.html`
First real-media embedding/layout experiment, derived from the gallery/archive direction.

Current characteristics:
- Mobile-first vertical editorial layout.
- Wanted Sans chosen provisionally for the test.
- Warm off-white background.
- Still-image presentation mixed with YouTube embeds and captions.
- Supplied YouTube video: `POEwTjr0eWY`.
- YouTube embeds intentionally minimize visible player chrome using embed parameters such as `controls=0`, `rel=0`, `playsinline=1`, `fs=0`, with a small original-video link below.
- The same video may be repeated in the prototype to test rhythm/scale.
- One supplied photograph is currently embedded directly in the HTML as Base64 for the prototype.

Important limitation: embedding image data directly in HTML is acceptable only for this quick experiment. Final portfolio media should be stored as separate optimized image assets (preferably an organized assets/images structure, using JPEG/WebP as appropriate) rather than Base64 inside HTML.

### `experiments/p5-media-lab/`
Mobile-first interactive audiovisual laboratory built with static HTML/CSS/JS, p5.js 2.3.1, and p5.sound 0.4.1. It is intentionally isolated from the main portfolio so it can evolve as a browser-based artwork without destabilizing the production pages.

Current v0.1 capabilities:
- Full-viewport `cover` rendering for moving image / still image; cropping is preferred over letterboxing.
- Portrait/mobile as baseline, with adaptive wider desktop layout.
- First-gesture audio start and fullscreen request; viewport-cover fallback if fullscreen is unavailable.
- Single mouse / one-finger touch interaction only.
- Downsampled video analysis: global RGB/luminance, pointer-local RGB/luminance, simple frame-difference motion.
- Image/gesture to audio mapping: local luminance → filter cutoff, motion → delay feedback, pointer X → delay/pan, pointer Y → rate/distortion.
- Audio analysis back to visuals using RMS, bass/mid/treble FFT bands, and waveform.
- Visual presets demonstrating p5 capabilities: base cover, RGB split, clipped slice displacement, mosaic reconstruction, particles, ping-pong feedback, posterize filter, waveform geometry, scanlines, still-image collage.
- Real telemetry rendered as an aesthetic terminal layer: mode, FX, source, frame/time/FPS, viewport/buffer, pointer and pixel data, motion, audio analysis, effect parameters, and actual event history.
- Procedural moving-image + synthesized audio fallback so the project is runnable before personal media assets are added.
- Mobile-conscious limits: pixel density 1, one active video decoder, 128px analysis width, 900px mobile processing long edge, bounded particles, 12 mobile slice passes, and ping-pong feedback buffers.

Primary editing/documentation files:
- `experiments/p5-media-lab/README.md` — operation, capabilities, mapping and customization guide.
- `experiments/p5-media-lab/ARCHITECTURE.md` — runtime graph, frame order, module responsibilities, signal routing, performance strategy, and edit map.
- `experiments/p5-media-lab/ASSET_GUIDE.md` — recommended real-media preparation specs.
- `experiments/p5-media-lab/assets.js` — media manifest.
- `experiments/p5-media-lab/config.js` — main user-facing parameters and visual preset switches.

Planned first real-media batch:
- about 10 short videos: H.264 MP4, 1280×720, 24/25/30fps, around 4–8 seconds each;
- about 20 JPEG/WebP photographs, long edge roughly 1200–1800px;
- one original-composition MP3, 44.1/48kHz, 192–320kbps.

The project should be tested on a real mobile Chrome device after those assets are added. The current performance settings are deliberately conservative and can be raised after measuring actual FPS/thermal behavior.

## Media supplied during prior checkpoint

The user supplied three photographs for the embed/gallery experiment: portraits/documentation photographs at night around utility/electrical cabinets, with a recorder used as a visual/performance element. Three images were provided, but the current `Embed_test_1.html` prototype only directly incorporates one image. The remaining images should be considered available design references from that session, but are not yet persistent repository assets.

The supplied YouTube test URL was `https://youtu.be/POEwTjr0eWY`.

## Typography direction / conclusions so far

The purpose of the font work is not simply to find a fashionable Korean font. The desired font needs to work directly as web text, especially for a minimal/industrial artist portfolio, and preferably be freely distributable/useable as a webfont.

The specimen intentionally includes both familiar long-running Korean web/design choices and newer alternatives. No single final font has been selected yet. Wanted Sans is currently used in `Embed_test_1.html` only as a provisional design choice.

Typeface evaluation should prioritize:
- Large headline character.
- Korean/Latin compatibility.
- Tight multi-line leading.
- Small metadata/caption legibility.
- Numerals and punctuation.
- Weight behavior.
- Whether synthetic italic looks acceptable when a native italic is unavailable.

## Architecture / implementation principles

- Static HTML/CSS/JS hosted with GitHub Pages.
- Keep the implementation simple; no framework is currently needed.
- Mobile-first behavior is a primary requirement, not an afterthought.
- Test pages may remain separate while visual decisions are being made.
- Avoid prematurely consolidating experimental layouts into the production index.
- Reuse shared content/logic where sensible. The font theme pages already demonstrate this by redirecting to one canonical specimen rather than duplicating a large HTML document.
- For final media, use repository assets rather than Base64 HTML payloads.
- Browser-based media-art experiments should remain isolated under `experiments/` until their interaction/performance vocabulary is stable enough to be promoted into the portfolio proper.

## Reference sites

- Cargo reference 1: `https://8886588.cargo.site/`
  - Main reference for oversized typography, project numbering, long vertical composition, sparse metadata, and two-column information/CV sections.
- Cargo reference 2: `https://352785-a.cargo.site/`
  - Reference for the alternative gallery/archive-style continuous vertical media layout.

These are references for visual grammar and layout, not targets for literal copying.

## Current open decisions

- Final primary typeface has not been chosen.
- Final background palette has not been chosen: black/dark, white, neutral gray, and warm paper are still being compared.
- Need to test the three supplied photographs as proper external assets rather than embedding one as Base64.
- Need to decide whether the final site primarily follows the numbered editorial `index.html` structure, the continuous `gallery.html` structure, or a hybrid.
- Need to replace placeholder project/CV content with actual portfolio material.
- Need to decide final media optimization strategy and asset directory conventions before importing many images/videos.
- YouTube's embed UI cannot be made completely custom/blank using ordinary embed parameters; the current prototype only minimizes available chrome. A different presentation strategy may be needed if stricter visual control becomes important.
- p5 Media Lab requires real-device validation after user media is imported; fullscreen behavior, browser decoding, audio graph behavior, FPS, battery use, and thermal load can differ across mobile browsers/devices.
- p5 CPU/canvas effects should not be forced beyond their useful range. If future work becomes shader-heavy or spatial/3D, Three.js/WebGL should be evaluated rather than endlessly optimizing p5 CPU paths.

## Next useful step

For the p5 experiment, add the prepared video/photo/audio batch to `experiments/p5-media-lab/assets/`, register it in `assets.js`, then evaluate each visual preset on a real vertical mobile Chrome device and remove/adjust weak effects. For the general portfolio, continue visual evaluation using `Embed_test_1.html` and the font/background specimens.

## Continuity rule

For future sessions, read this file before reconstructing the project from conversation memory. Verify actual implementation details against the repository files. At meaningful checkpoints, update this document with confirmed decisions, current baseline files, experiments, limitations, unresolved items, and the next step.
