# p5 Media Lab 01 — Architecture

## 1. Design objective

This project has two simultaneous goals:

1. operate as a coherent browser-based audiovisual experiment;
2. function as a readable survey of p5.js capabilities for later study and modification.

The code therefore favors **explicit modules, documented mappings, and conservative mobile performance** over minimum file count.

## 2. Runtime graph

```text
Mouse / Touch
     │
     ▼
Interaction
     │
     ├──────────────────────────────┐
     │                              │
     ▼                              ▼
MediaManager ── current source ──> VideoAnalyzer
     │                              │
     │                              ├─ local RGB / luminance
     │                              ├─ global luminance
     │                              └─ frame-difference motion
     │                                      │
     │                                      ▼
     │                                 AudioEngine
     │                                      │
     │                    ┌─────────────────┴─────────────────┐
     │                    │                                   │
     │                    ▼                                   ▼
     │                Audio FX                             FFT / RMS
     │                    │                                   │
     └────────────────────┴──────────────> VisualEngine <─────┘
                                              │
                                              ▼
                                          Canvas
                                              │
                                              ▼
                                          Telemetry
```

## 3. Frame sequence

`sketch.js` deliberately executes the systems in this order:

1. `Interaction.update()` smooths pointer state.
2. `MediaManager.update()` advances procedural/video/image state.
3. `VideoAnalyzer.update()` draws the source to a small buffer and extracts control data.
4. `AudioEngine.update()` maps image + pointer data to audio parameters, then reads RMS/FFT.
5. `VisualEngine.render()` uses both image analysis and audio analysis.
6. `Telemetry.render()` draws last at native viewport resolution.

Telemetry is last so it remains legible even when the visual layer is heavily processed.

## 4. MediaManager

File: `js/media-manager.js`

Responsibilities:

- maintain one active video decoder;
- lazy-load images;
- keep a small image cache;
- switch source clips periodically;
- generate a procedural moving image when no user assets exist;
- provide a stable `getSource()` API to downstream modules.

Loading ten short clips as ten simultaneous `<video>` elements is simple on desktop but wasteful on mobile. This implementation removes the previous DOM video before activating the next.

The procedural fallback also demonstrates `createGraphics()`, Perlin `noise()`, drawing primitives, blend modes, and trigonometric motion.

## 5. VideoAnalyzer

File: `js/video-analyzer.js`

Outputs:

```text
globalLuma
globalR / globalG / globalB
localLuma
localR / localG / localB
motion
motionSmooth
```

Motion is the average absolute luminance difference between the current and previous analysis frame:

```text
motion ≈ mean(abs(Luma[n] - Luma[n-1]))
```

This is computationally cheap and useful as a control signal, but it is not optical flow. It cannot tell direction or distinguish camera motion from subject motion.

The analyzer uses a tiny offscreen canvas (default 128px wide on mobile). Control signals do not require full display resolution.

## 6. AudioEngine

File: `js/audio-engine.js`

User-audio path:

```text
SoundFile
   ↓
Low-pass Filter
   ↓
Delay
   ↓
Reverb
   ↓
Distortion (when available)
   ↓
Master output
```

The fallback path uses two low-level oscillators routed through a simpler filter/delay/reverb chain.

### Image / interaction → audio

```text
local luminance       -> filter cutoff
motion                -> delay feedback
pointer X             -> delay time + pan
pointer Y             -> SoundFile rate + distortion
press state           -> local intensity boost
```

### Audio → visuals

```text
RMS                    -> particle/waveform energy
bass                   -> zoom, feedback response, spawn count
mid                    -> reserved / visible in telemetry
treble                 -> scanline / particle vertical energy
waveform               -> p5 vertices
```

`SoundFile.rate()` changes speed and pitch together. It is not high-quality time stretching. This is useful as expressive degradation, but not when independent tempo/pitch control is required.

## 7. VisualEngine

File: `js/visual-engine.js`

The engine cycles through presets rather than exposing user-facing buttons.

Current techniques:

- **Base cover** — `object-fit: cover` equivalent with no letterboxing.
- **RGB split** — repeated tinted source draws using additive blend.
- **Slice scan** — Canvas 2D clipping bands displaced by noise/motion.
- **Mosaic** — downsampled pixel reading and reconstruction with rectangles.
- **Particles** — pointer-spawned particles driven by noise, FFT and motion.
- **Feedback** — two ping-pong graphics buffers accumulate prior frames without full-frame pixel reads.
- **Built-in filter** — `POSTERIZE` demonstrates p5 image filtering.
- **Audio waveform** — FFT waveform values become p5 vertices.
- **Scanlines** — low-cost line texture reacts to signal intensity.
- **Collage layer** — lazily loaded still image can float over video in selected modes.

## 8. Telemetry

File: `js/telemetry.js`

Telemetry is a **foreground visual subsystem**, not only a debug panel.

Rules:

- display real values whenever possible;
- use real state transitions for event logs;
- keep current values brighter than old events;
- let older events decay into the image;
- allow small aesthetic corruption without making data unreadable;
- render after media effects so the text remains mostly stable.

Desktop uses a second parameter column. Portrait mobile stacks selected parameters at upper-left and preserves event history near the bottom.

## 9. Interaction

File: `js/interaction.js`

Only three audience concepts exist: position X, position Y, and press/release.

Mouse and single-finger touch are normalized into the same state. Input is smoothed to prevent pointer jitter from becoming unwanted zipper noise in audio/visual parameters.

## 10. Mobile strategy

Portrait/mobile is the baseline.

Performance controls:

- global `pixelDensity(1)`;
- one live video decoder;
- capped internal render buffer;
- tiny analysis buffer;
- configurable analysis frame interval;
- bounded particle count;
- image cache limit;
- ping-pong feedback buffers instead of repeated full-frame `get()` copies;
- native telemetry rendered separately after processed visuals are upscaled.

The outer canvas follows `visualViewport` when available, otherwise `innerWidth/innerHeight`. Resize rebuilds analysis and visual buffers.

The first user gesture requests fullscreen. Failure is non-fatal; viewport-cover rendering remains the base behavior.

## 11. Editing map

| Goal | File |
|---|---|
| replace media | `assets.js` |
| change timing/performance/effect amounts | `config.js` |
| change image analysis | `js/video-analyzer.js` |
| change sound mapping/signal chain | `js/audio-engine.js` |
| add/remove visual processing | `js/visual-engine.js` |
| change terminal layout/data density | `js/telemetry.js` |
| change input behavior | `js/interaction.js` |
| change start/fullscreen/resize/frame order | `sketch.js` |

## 12. Suggested sequence after real assets arrive

1. Add only two videos, two photos, and one MP3 first.
2. Confirm mobile decoding/audio startup.
3. Confirm local-pixel mapping is perceptible.
4. Add remaining clips/photos.
5. Test each visual preset separately.
6. Record approximate FPS and heat/battery behavior on the target phone.
7. Remove visually weak systems rather than optimizing everything indiscriminately.
8. Only after the vocabulary is narrowed, redesign the piece as a final artwork.

## 13. Deliberate boundaries of v0.1

Not included yet:

- object detection / pose tracking;
- optical flow;
- webcam or microphone input;
- multi-touch gestures;
- custom GLSL shader files;
- WebGPU;
- server communication;
- recording/export;
- PWA installation.

These are possible extensions, but adding them now would make the first laboratory harder to read and diagnose.
