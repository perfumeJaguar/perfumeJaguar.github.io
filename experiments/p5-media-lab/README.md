# DODREI

DODREI is a mobile-first browser media-art work built with p5.js / JavaScript and hosted on GitHub Pages. The current visual language is based on fragmented photographic memory: rapidly changing crops, temporal feedback, grayscale rupture, sparse signal glitches, film-like luminance instability, touch interaction, and a long-press memory-recall system.

Current artwork/runtime: **v1.0.28**  
Current visual engine: **v1.0.28**  
Config schema: **1**  
Current image archive: **96 images**  
Resident decoded working set: **20 images**

## Current defaults

```text
BASE FPS        30
VIS SPEED       S2 / 0.50x
CROP RANGE      1.0x .. 8.0x
START MODE      PHOTO_DOUBLE_BLEND / TWIN_EXPOSURE//NULL
POST MASTER     ON
POST CHAIN      HC -> GS -> FB -> ST -> GL
POST FB         ON
POST ST         ON
POST GL         ON
TOUCH SPEED     0.50x before recall activation
SWIPE THRESHOLD 0.15
TOUCH RUPTURE   mobile 0.62x / desktop 0.80x
SWIPE/FEEDBACK  mobile 0.60x / desktop 0.78x
FULLSCREEN      manual FS inside runtime UI
UI CONTROLS     HIDDEN by default
AUDIO           20220302 - sarabande.mp3
MEMORY HOLD     1000 ms
```

Canonical visual defaults:

```text
?fps=30&speed=S2&post=1&fx=HC,GS,FB,ST,GL&mode=photo-double-blend&crop=10-80
```

## Active mode order

```text
01 PHOTO_DOUBLE_BLEND   <- default / TWIN_EXPOSURE//NULL
02 PHOTO_FEEDBACK_CROP
03 PHOTO_RAPID_CROP
04 PHOTO_SHARD_SWAP
05 PHOTO_BLEND_CYCLE
06 PHOTO_FULL
```

Automatic mode advance is OFF. Visible scene selection is independent random selection with replacement, while the MediaManager separately rotates the bounded resident pool through a shuffle bag.

## Touch behavior

Touch combines several behaviors:

- visual playback slows to `0.50x` before memory recall activates;
- touch rupture uses grayscale palette quantization and irregular horizontal bands;
- rupture release has a short velocity-aware decay;
- swipe feedback begins at normalized speed `0.15`;
- rupture timing uses a stochastic burst/lull envelope: short rapid fracture-refresh windows separated by longer held intervals;
- gesture energy can shorten lulls modestly but does not turn the effect into constant high-rate flicker;
- mobile heavy rupture calculation still runs every second render frame to protect performance.

Current touch-path raster scales:

```text
rupture mobile     0.62
rupture desktop    0.80
swipe/FB mobile    0.60
swipe/FB desktop   0.78
mobile rupture skip = 2
```

## Memory recall — v1.0.28

Holding the artwork for **1 second** activates recall.

The underlying lock remains the v1.0.26 design:

```text
hold-start           capture MediaManager archive entry + resident p5.Image
1 second             activate memory state
PRE-FX source        lock to one archive image
main image framing   fixed centered 1x cover crop
preset image mixing  stopped
random crop/layout   stopped
composition clock    stopped
PRE common FX        bypassed
preset feedback      bypassed
old temporal history cleared on entry
TOUCH FX             rupture + swipe continue on the fixed still
release              normal scene is refreshed cleanly
```

v1.0.28 removes the v1.0.27 thumbnail completely. Recall presentation is now deliberately open-ended and text-only:

```text
fixed memory still
  -> touch rupture / optional swipe feedback
  -> full-frame translucent black readability field
  -> MEMORY NNN + memory text
  -> current ordered POST COMMON FX
  -> vignette / waveform
```

The full-frame dark field fades in quickly (~260 ms) to improve readability without replacing the recalled image with a black plate. The identifier and body copy fade in more gently (~520 ms). Both are canvas content and remain **before POST**, so the current default `HC -> GS -> FB -> ST -> GL` continues to affect the text. Glitching, feedback trails and instability in the typography are intentional.

There is no visible thumbnail in the canvas or DOM. The DOM recall node is retained only as an aria-live text mirror.

### Memory fragment pool

The deterministic fragment pool was expanded from 24 uniformly literary placeholders to **64 mixed fragments**. It now includes:

- memory/emotional fragments;
- mundane private notes;
- times, percentages and number strings;
- incomplete records and interrupted sentences;
- documentation-range or private-network `IP:port` strings;
- practical notes that may only make sense to the person who wrote them.

The goal is not to imply a solvable cipher or overt mystery. The fragments should feel like unrelated scraps from a personal archive whose context has mostly disappeared.

All 96 archive entries are still deterministically mapped by archive key/index through the stable hash function. The recall target remains the MediaManager current archive entry captured at hold-start; exact under-finger layer resolution in multi-image presets is still unresolved.

## Mobile visibility behavior

On mobile only, `visibilitychange` pauses visual looping and audio when the page becomes hidden and resumes automatically only if that module caused the pause. User PAU state remains authoritative.

## Startup sequence

```text
0.0s   soundtrack begins immediately
2.0s   title/start screen disappears
2.0-3.0s black screen + music only
3.0s   telemetry stage 1
3.2s   telemetry stage 2
3.4s   telemetry stage 3
6.4s   main visual at 20% brightness
7.4s   main visual at 100% brightness
```

## Performance

The main mobile composition stays at 2x CSS resolution with an effective long-edge cap around 1440. Performance-sensitive auxiliary paths remain reduced resolution: touch rupture, swipe feedback, global feedback, glitch scratch and analysis. If touch performance regresses, first lower the touch-resolution scales rather than removing the burst/lull timing.

## Runtime controls

```text
[ ›    ] next mode
[30    ] composition FPS
[S2    ] visual speed
[POST  ] POST COMMON FX master

right column: BW / GS / LS / BL / FB / GL / ST
left column:  CR / HC / DK / VG

[PAU   ] pause/resume visuals + music output
[MUT   ] mute/unmute audio
[SHR   ] copy current settings as a share URL
[FS    ] fullscreen
[UI    ] hide/show runtime controls
```

## Important files

- `config.js` — canonical defaults and runtime version;
- `index.html` — active script chain, cache key and visible runtime version;
- `js/visual-engine-v1028.js` — active text-only recall presentation; full-frame readability field + text fade while preserving recall POST;
- `js/visual-engine-v1027.js` — touch burst/lull timing and memory composite/POST base;
- `js/visual-engine-v1026.js` — memory PRE-FX composition lock base;
- `js/visual-engine-v1022.js` — ST dimming and resize resource disposal;
- `js/visual-engine-v1021.js` — sparse GL;
- `js/visual-engine-v1020.js` — irregular touch rupture/release behavior;
- `js/visual-engine-v1015.js` — performance-diet layer;
- `js/visual-engine-v1012.js` — ordered global FB;
- `js/visual-engine-v1000.js` — swipe feedback and ordinary touch POST bypass;
- `js/interaction-v1020.js` — velocity-aware release tail;
- `js/memory-recall-v1028.js` — 1-second archive capture, activation timestamp and 64-fragment pool;
- `js/mobile-visibility-v1024.js` — mobile background pause/resume;
- `sketch-v066.js` — application orchestration;
- `PROJECT_STATE.md` — current implementation checkpoint.

## Source of truth

For continuation work, read `PROJECT_STATE.md` first, then verify `config.js`, `index.html`, and active versioned modules. Do not reconstruct current behavior from memory when the repository can be checked directly.
