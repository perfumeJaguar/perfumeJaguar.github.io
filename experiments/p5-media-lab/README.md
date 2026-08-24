# p5 Media Lab 01

A mobile-first browser media-art laboratory built with **p5.js / JavaScript** and hosted on GitHub Pages.

This is an independent experiment, not part of the portfolio site's design system. It currently lives under `perfumeJaguar.github.io/experiments/` for deployment convenience and may later move into a media-art repository.

## Current baseline

Current study: **photo-only**. Video code/assets may remain in the repository, but the active build discovers still images from `assets/images/`, preloads them, and uses them as the source archive.

The current interaction vocabulary is deliberately small:

- no touch: autonomous image composition;
- hold: four-tone black / muted-red / white rupture plus stronger audio processing;
- fast swipe while holding: additional recursive feedback proportional to swipe speed.

Audio is the user's original MP3. A native `<audio>` path provides reliable dry playback on mobile, while a parallel Web Audio layer provides interactive filtering, delay, feedback, and distortion.

## Where to edit first

### 1. `config.js` — start here

This is intentionally the main tuning panel written as code. It now contains detailed comments beside the important parameters.

Useful examples:

```js
// How long each visual study remains active.
modeDurationSec: 11,

// Random source crops can range from almost untouched to severe enlargement.
sourceCropMinZoom: 1.0,
sourceCropMaxZoom: 2.65,

// Global common destruction applied to every visual study.
crushContrast: 1.32,
crushPosterizeLevels: 6,

// Swipe must exceed this normalized speed before movement-feedback appears.
swipeFeedbackThreshold: 0.20,

// Strength range of the interactive audio layer.
fxWetMin: 0.025,
fxWetMax: 0.72,
```

Change only a few values at once. This makes it much easier to hear/see what a parameter actually does.

### 2. `visual-engine-v061.js` — effect implementation

This is where the actual visual building blocks live: source cropping, double exposure, RGB separation, halation, shard/slice composition, luminance mosaics, common crush, touch rupture, feedback, vignette, and waveform drawing.

The important architectural distinction is:

```text
IMAGE POOL
  ↓
independent random crop PER SOURCE DRAW
  ↓
preset composition
  ↓
COMMON PHOTO_CRUSH
  ↓
TOUCH RUPTURE (only while pressed)
  ↓
mode feedback / swipe feedback when applicable
  ↓
vignette + waveform + telemetry
```

This means crop is not a global camera zoom. Each ingredient entering an effect can have a different crop, scale, and position.

### 3. `visual-engine-v063.js` — current touch-color patch

The current muted-red rupture palette is isolated here so it can be changed without rewriting the whole visual engine.

The current four levels are approximately:

```text
black
muted dark red
muted red
near-white
```

Edit the RGB values in this file if you want the red to become browner, darker, more saturated, etc.

### 4. `audio-engine-v050.js` / `audio-touch-v060.js`

The audio architecture is split deliberately:

- native `<audio>` = stable audible dry source;
- decoded PCM = analysis values and waveform;
- Web Audio wet layer = filter / delay / feedback / distortion;
- touch patch = stronger dry/wet reaction during press.

This separation was kept because direct Web Audio playback previously proved less reliable on the target Android Chrome device.

### 5. `telemetry.js`

Controls the terminal-like information layer. Internal data stays readable in code, while the visible MODE / FX names can be replaced with pseudo-system names and corrupted characters for presentation.

## Adding photographs

Normally you do **not** need to edit a file list anymore.

Put supported files into:

```text
experiments/p5-media-lab/assets/images/
```

Supported extensions are configured in `config.js` and currently include JPG, JPEG, PNG, WebP, GIF, and AVIF.

On page load, the browser queries GitHub's public Contents API, discovers the files in that folder, and then preloads them before `TOUCH TO START` becomes available. `assets.js` remains only as a fallback if directory discovery fails.

The present implementation intentionally preloads the whole archive. This is convenient for rapid random switching but can become memory-heavy with many large images. If the archive grows far beyond the current scale, the intended next architectural change is a rolling resident cache rather than changing the visual effects themselves.

## Preset composition

The active playlist is at the bottom of `config.js`:

```js
presets: [
  { name: "PHOTO_FEEDBACK_CROP", photoFeedback: true, feedback: true },
  { name: "PHOTO_RAPID_CROP", photoRapidCrop: true },
  { name: "PHOTO_RGB_TEAR", photoRgbTear: true },
  ...
]
```

The array order is playback order. Remove an entry to skip it. Move it to reorder it. Duplicate it if you want a study to appear more frequently during testing.

The internal names are deliberately plain and descriptive even though the telemetry display disguises them. Do not make the code labels cryptic just because the artwork's visible labels are cryptic.

## Extensibility principles

The project is written so the following parts can grow independently:

- **media discovery/loading** does not need to know how a photo will be rendered;
- **visual source selection/cropping** is reusable across multiple effects;
- **presets** choose combinations of effects rather than owning asset loading;
- **interaction** exposes normalized position, pressure, and swipe speed rather than hard-coding one artwork behavior;
- **audio analysis/output** is separate from visual rendering;
- **telemetry presentation** is separate from the honest internal names/data;
- **configuration** holds the most common artistic parameters so experiments do not require engine rewrites.

A new effect should normally be added as a new visual function plus one config/preset switch, not by modifying the media loader. A new interaction dimension should normally be added to the interaction snapshot first, then consumed by whichever visual/audio modules need it.

## Current limitations

GitHub Pages is static, so directory discovery currently relies on GitHub's public API rather than a server-side filesystem scan. Large image archives can also hit mobile decoded-image memory before network bandwidth becomes the main problem. Finally, several p5/Canvas2D operations—especially blur, pixel operations, and recursive feedback—are CPU/GPU heavier than an equivalent shader implementation.

If this study evolves into much denser feedback, bloom, displacement, or dozens of simultaneous layers, a later Three.js/WebGL shader version may be a better technical endpoint. The present p5 structure is still useful because the media, interaction, preset, and parameter concepts can migrate without preserving the exact renderer.

For current decisions and debugging history, read `PROJECT_STATE.md` before making major structural changes.
