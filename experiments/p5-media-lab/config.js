/**
 * P5 MEDIA LAB 01 — USER-FACING CONFIGURATION
 * ------------------------------------------------------------
 * This is the FIRST file to edit when experimenting.
 * Most artistic tuning should happen here before touching engine code.
 *
 * Mental model:
 *   app         = timing / fullscreen / global runtime
 *   render      = performance / internal resolution
 *   media       = where images come from and how they preload
 *   interaction = smoothing of mouse/touch input
 *   audio       = transport + interactive wet-FX range
 *   visual      = crop / feedback / rupture / preset composition
 *   telemetry   = terminal-like text layer
 *
 * Safe workflow:
 *   1. change ONE or TWO values;
 *   2. commit / reload GitHub Pages;
 *   3. test on the phone;
 *   4. keep or revert.
 *
 * Values are intentionally grouped by concept so the engine can keep growing
 * without turning every experiment into a rewrite.
 */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.6.3",

    // Target only. Mobile browsers may deliver less under heavy feedback/filtering.
    targetFps: 60,

    // First TOUCH TO START requests fullscreen. If the browser refuses, the work
    // continues in ordinary viewport mode instead of failing.
    requestFullscreenOnStart: true,
    preventContextMenu: true,

    // Seconds before the visual preset automatically advances.
    modeDurationSec: 11,

    // Base interval for the media-manager's current-image pointer. Most visual
    // presets also choose directly from the whole image pool, so this is not the
    // only image-change timing in the work.
    imageSwitchSec: 0.10,
  },

  render: {
    pixelDensity: 1,
    background: 0,

    // IMPORTANT PERFORMANCE KNOBS.
    // The visible canvas stays screen-sized, while visual processing happens in
    // a smaller internal buffer. Lower these first if a phone becomes hot/slow.
    maxBufferLongEdgeMobile: 900,
    maxBufferLongEdgeDesktop: 1280,

    // Pixel-analysis buffer. This is deliberately tiny; analysis does not need
    // photographic resolution.
    analysisWidthMobile: 128,
    analysisWidthDesktop: 180,
    analysisEveryNFrames: 2,
    analysisPixelStep: 2,
  },

  media: {
    // Current experiment is intentionally PHOTO ONLY. Video files may remain in
    // the repository, but this build does not fetch/decode/render them.
    videosEnabled: false,

    // GitHub Pages cannot enumerate a directory by itself, so the browser asks
    // GitHub's public Contents API for this folder. Add/remove image files there
    // and they are discovered automatically; assets.js remains a fallback.
    autoDiscoverImages: true,
    githubOwner: "perfumeJaguar",
    githubRepo: "perfumeJaguar.github.io",
    githubBranch: "main",
    githubImageDir: "experiments/p5-media-lab/assets/images",
    imageExtensions: ["jpg", "jpeg", "png", "webp", "gif", "avif"],

    // All discovered images currently load before TOUCH TO START is enabled.
    // If the archive becomes too large for mobile RAM, this is where a future
    // rolling-cache policy should replace full preload.
    preloadAllImages: true,
    imagePreloadConcurrency: 3,
    imageCacheLimit: 96,
  },

  interaction: {
    // Higher = pointer catches up faster; lower = more syrupy / delayed movement.
    smoothing: 0.14,

    // General artistic intensity multiplier available to interaction-aware code.
    pressBoost: 1.35,
  },

  audio: {
    enabled: true,
    masterVolume: 0.82,
    directNativeOutput: true,

    // PCM analysis resolution. waveformPoints controls the line drawn on screen.
    pcmWindowSize: 512,
    waveformPoints: 128,

    // TRANSPORT: intentionally subtle. The sound should not become a DJ-style
    // varispeed toy; most drama comes from the wet FX layer below.
    minRate: 0.985,
    maxRate: 1.015,
    lumaRateMin: 0.99,
    lumaRateMax: 1.01,
    pressRateBoost: 0.006,

    // INTERACTIVE WET LAYER.
    // Dry native audio remains underneath as a mobile-safe baseline.
    fxEnabled: true,
    fxWetMin: 0.025,
    fxWetMax: 0.72,
    minFilterHz: 120,
    maxFilterHz: 12500,
    maxDelayTime: 0.68,
    maxDelayFeedback: 0.82,
    maxDistortion: 0.88,
  },

  visual: {
    enabled: true,

    // ----------------------------------------------------------
    // SOURCE-LEVEL RANDOM CROP
    // ----------------------------------------------------------
    // Every individual source draw gets its OWN random crop. This is not a final
    // global zoom. A double exposure therefore gets crop A + crop B; each shard
    // can get a different crop; a 10-image archive can look far larger.
    //
    // 1.0 = essentially no extra crop. Values near 2–3 are severe enlargements.
    sourceCropMinZoom: 1.0,
    sourceCropMaxZoom: 2.65,
    sourceCropTouchBoost: 0.45,
    sourceCropPanFactor: 0.42,

    // While pressing, image turnover becomes slightly SLOWER. Touch is supposed
    // to corrupt the material, not simply speed it up.
    touchTransitionSlowdown: 0.28,

    // ----------------------------------------------------------
    // RECURSIVE FEEDBACK
    // ----------------------------------------------------------
    // feedbackScale near 1.0 = long stable trails. Move farther from 1.0 for
    // stronger zoom-in / zoom-out recursion. Alpha controls persistence.
    feedbackScale: 0.994,
    feedbackAlpha: 154,

    // Feedback is one of the heavier effects, so it runs at reduced resolution.
    feedbackResolutionScaleMobile: 0.52,
    feedbackResolutionScaleDesktop: 0.72,

    // ----------------------------------------------------------
    // BASIC VISUAL EFFECT STRENGTHS
    // ----------------------------------------------------------
    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    photoCutMs: 90,
    rgbTearMaxPx: 48,
    halationBlur: 5,
    vignetteStrength: 0.34,

    // ----------------------------------------------------------
    // COMMON PHOTO_CRUSH — APPLIED TO EVERY PRESET
    // ----------------------------------------------------------
    // This happens after each preset composition and before touch rupture.
    // Increase contrast carefully; posterize levels lower = harsher/graphic.
    crushContrast: 1.32,
    crushPosterizeLevels: 6,
    crushIntruderAlpha: 28,

    // ----------------------------------------------------------
    // TOUCH RUPTURE
    // ----------------------------------------------------------
    // Pressing converts the scene to a brutal four-tone family:
    // black / muted dark red / muted red / near-white.
    // The exact muted-red RGB values currently live in visual-engine-v063.js.
    touchRuptureContrast: 3.2,
    touchRupturePosterizeLevels: 4,
    touchRuptureBands: 13,

    // ----------------------------------------------------------
    // SWIPE-SPEED FEEDBACK
    // ----------------------------------------------------------
    // Holding still = no extra swipe feedback. Once normalized swipe speed rises
    // above 0.20, feedback fades in progressively. A fast swipe approaches 1.0.
    swipeFeedbackThreshold: 0.20,
    swipeFeedbackScaleMin: 0.985,
    swipeFeedbackScaleMax: 1.012,
    swipeFeedbackAlphaMin: 42,
    swipeFeedbackAlphaMax: 178,

    // ----------------------------------------------------------
    // PRESET PLAYLIST
    // ----------------------------------------------------------
    // Order = playback order. Remove a line to skip a study. Duplicate a line if
    // you deliberately want that study to appear more often.
    //
    // These names are INTERNAL and intentionally readable for maintenance.
    // Telemetry disguises them with corrupted pseudo-system labels on screen.
    presets: [
      { name: "PHOTO_FEEDBACK_CROP", photoFeedback: true, feedback: true },
      { name: "PHOTO_RAPID_CROP", photoRapidCrop: true },
      { name: "PHOTO_RGB_TEAR", photoRgbTear: true },
      { name: "PHOTO_HALATION", photoHalation: true },
      { name: "PHOTO_SHARD_SWAP", photoShardSwap: true },
      { name: "PHOTO_DOUBLE_BLEND", photoDoubleBlend: true },
      { name: "PHOTO_BLEND_CYCLE", photoBlendCycle: true },
      { name: "PHOTO_FULL", photoFull: true },
      { name: "LUMA_BLOCKS", mosaic: "normal" },
      { name: "LUMA_VOID", mosaic: "inverse" },
      { name: "LUMA_MONO", mosaic: "mono" },
      { name: "LUMA_DITHER", mosaic: "dither" },
      { name: "LUMA_PULSE", mosaic: "pulse" },
    ],
  },

  telemetry: {
    enabled: true,
    author: "Hoyeon Choi",

    // Terminal layer density / brightness.
    maxEvents: 18,
    opacity: 0.72,
    secondaryOpacity: 0.36,
    faintOpacity: 0.18,
    fontSizeMobile: 9,
    fontSizeDesktop: 10,
    lineHeight: 1.28,
    marginMobile: 12,
    marginDesktop: 18,

    // Cosmetic only. Values remain real; labels are allowed to look corrupted.
    glitchOnMotion: true,
    glitchLabels: true,
  },
};
