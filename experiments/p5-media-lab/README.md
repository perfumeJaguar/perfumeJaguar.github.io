# DODREI

DODREI is a mobile-first browser media-art experiment built with p5.js / JavaScript and hosted on GitHub Pages.

Current artwork/runtime: **v1.0.9**  
Current visual engine: **v1.0.7**  
Config schema: **1**

## Current defaults

```text
BASE FPS     24
VIS SPEED    S2 / 0.50x
CROP RANGE   1.0x .. 9.0x
START MODE   PHOTO_DOUBLE_BLEND
POST MASTER  ON
POST CHAIN   HC -> LS -> BL
TOUCH SPEED  0.50x visual playback while held
FULLSCREEN   OFF
UI CONTROLS  HIDDEN by default
```

Canonical visual defaults:

```text
?fps=24&speed=S2&post=1&fx=HC,LS,BL&mode=photo-double-blend&crop=10-90
```

## v1.0.9 staged startup

After the user presses START:

```text
0.0s  soundtrack starts immediately
1.0s  telemetry / information interface appears
4.0s  visual composition begins rendering
```

The right-side test/control UI starts hidden. The faint `UI` button remains visible at the lower-right and can reveal the controls at any time.

## v1.0.8 presentation / utility behavior

- soundtrack: `assets/audio/20220302 - sarabande.mp3`;
- `PAU` pauses both visual playback and audible music output;
- telemetry opacity is half of the prior values (`0.26 / 0.14 / 0.07`);
- `UI` hides/shows the right-side runtime controls without hiding telemetry.

## v1.0.7 mobile sharpness pass

Mobile ordinary image rendering uses `2.0x` internal oversampling. A CSS viewport around `360 x 642` renders the main composition at roughly `720 x 1284`. Feedback, swipe, touch rupture, and analyzer buffers keep their lower mobile resolutions. Desktop rendering is unchanged.

## Runtime controls

```text
[ ›   ] next mode
[24   ] base visual FPS
[S2   ] visual speed
[POST ] POST COMMON FX master bypass
[BW   ] binary black/white
[GS   ] grayscale
[LS   ] low saturation
[BL   ] subtle blur
[CR   ] Common Crush
[HC   ] high contrast
[DK   ] darken
[VG   ] strong vignette

[PAU  ] pause/resume visuals + music output
[MUT  ] mute/unmute audio
[SHR  ] copy current settings as a share URL
[UI   ] hide/show runtime controls
```

## Scene / crop behavior

Scene selection remains independent per-slot random selection with replacement. Immediate repeats are allowed; there is no recent-image ban or scene duplicate suppression.

```text
crop=10-90   -> 1.0x .. 9.0x
crop=12-35   -> 1.2x .. 3.5x
```

## Important files

- `assets.js` — current soundtrack path;
- `js/runtime-presentation-v108.js` — runtime version, telemetry opacity, startup delays;
- `sketch-v066.js` — staged startup orchestration;
- `js/runtime-utility-controls-v105.js` — PAU / MUT / UI controls;
- `js/visual-engine-v1007.js` — mobile 2x ordinary composition/POST rendering;
- `js/visual-engine-v1004.js` — 50% visual playback while touch is held;
- `js/visual-engine-v1003.js` — independent scene image slots + crop randomization;
- `js/url-preset.js` — URL presets/share links;
- `PROJECT_STATE.md` — implementation checkpoint.
