# p5 Media Lab 01 — Asset Guide

## Test package to prepare

### Video

Prepare about **10 clips**.

Recommended first-pass format:

- container: MP4
- codec: H.264 / AVC
- resolution: 1280 × 720
- frame rate: 24, 25, or 30 fps
- duration: about 4–8 seconds
- audio track: unnecessary; muted in this project
- target file size: roughly 2–8 MB each if practical

The source may be landscape or portrait. The artwork intentionally crops using cover behavior.

Avoid 4K originals for this web test. The goal is responsive decoding and manipulation on phones, not archival playback quality.

### Images

Prepare about **20 images**.

Recommended:

- JPEG or WebP
- long edge: roughly 1200–1800 px
- approximate size: 200 KB–1.5 MB each
- mixed portrait / landscape / square is welcome

### Audio

One original composition is preferable to generated placeholder audio because it tests real musical density, dynamics, spectral balance and duration.

Recommended:

- MP3
- 44.1 kHz or 48 kHz
- 192–320 kbps
- one complete track, roughly 3–8 minutes is convenient but not required

## File naming

Simple sequential names make later replacement easy:

```text
assets/
├── video/
│   ├── video01.mp4
│   ├── video02.mp4
│   └── ...
├── images/
│   ├── photo01.jpg
│   ├── photo02.jpg
│   └── ...
└── audio/
    └── music.mp3
```

Then list those files in `assets.js`.

## Why video is only 720p

The displayed image can still fill a high-resolution phone screen because the browser scales it. The expensive parts of this laboratory are decoding, compositing, feedback and repeated analysis—not static pixel count alone.

If a final artwork later proves visually dependent on higher source detail, test 1080p after the logic has stabilized.

## Suggested content diversity

For a useful test, do not choose ten clips that behave identically.

Include a mixture of dark and bright scenes, static and highly moving scenes, hard cuts and slow movement, close texture and wider spatial images, and dominant-color versus nearly monochrome material.

This makes motion, luminance, RGB and feedback mappings easier to evaluate.
