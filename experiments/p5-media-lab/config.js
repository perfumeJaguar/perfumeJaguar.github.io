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
 */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.6.7",
    targetFps: 60,
    requestFullscreenOnStart: true,
    preventContextMenu: true,
    modeDurationSec: 11,
    imageSwitchSec: 0.10,
  },

  render: {
    pixelDensity: 1,
    background: 0,
    maxBufferLongEdgeMobile: 900,
    maxBufferLongEdgeDesktop: 1280,
    analysisWidthMobile: 128,
    analysisWidthDesktop: 180,
    analysisEveryNFrames: 2,
    analysisPixelStep: 2,
  },

  media: {
    videosEnabled: false,
    autoDiscoverImages: true,
    githubOwner: "perfumeJaguar",
    githubRepo: "perfumeJaguar.github.io",
    githubBranch: "main",
    githubImageDir: "experiments/p5-media-lab/assets/images",
    imageExtensions: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
    preloadAllImages: true,
    imagePreloadConcurrency: 3,
    imageCacheLimit: 96,
  },

  interaction: {
    smoothing: 0.14,
    pressBoost: 1.35,
  },

  audio: {
    enabled: true,
    masterVolume: 0.82,
    directNativeOutput: true,
    pcmWindowSize: 512,
    waveformPoints: 128,
    minRate: 0.985,
    maxRate: 1.015,
    lumaRateMin: 0.99,
    lumaRateMax: 1.01,
    pressRateBoost: 0.006,
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

    // Every individual source draw receives an independent random crop.
    sourceCropMinZoom: 1.0,
    sourceCropMaxZoom: 2.65,
    sourceCropTouchBoost: 0.45,
    sourceCropPanFactor: 0.42,
    touchTransitionSlowdown: 0.28,

    // General recursive feedback.
    feedbackScale: 0.994,
    feedbackAlpha: 154,
    feedbackResolutionScaleMobile: 0.52,
    feedbackResolutionScaleDesktop: 0.72,

    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    photoCutMs: 90,
    rgbTearMaxPx: 48,
    vignetteStrength: 0.34,

    // HALATION / BLOOM is intentionally removed from the active experiment in
    // v0.6.7. Blur was comparatively expensive on mobile and is not needed for
    // the current photo-destruction study.

    // Common PHOTO_CRUSH applied to every preset before touch rupture.
    crushContrast: 1.32,
    crushPosterizeLevels: 6,
    crushIntruderAlpha: 28,

    // TOUCH RUPTURE ----------------------------------------------------------
    // v0.6.7 performance policy:
    // - process the rupture at lower internal resolution;
    // - mobile recalculates it every 2nd rendered frame;
    // - skipped frames reuse the previous rupture image;
    // - former WHITE band is now vivid red.
    touchRuptureContrast: 3.2,
    touchRuptureBands: 13,
    touchRuptureResolutionScaleMobile: 0.45,
    touchRuptureResolutionScaleDesktop: 0.70,
    touchRuptureFrameSkipMobile: 2,
    touchRuptureFrameSkipDesktop: 1,

    // SWIPE FEEDBACK ---------------------------------------------------------
    // 0.0 = stationary, 1.0 = very fast swipe. Feedback stays completely off
    // until speed passes 0.30, then fades in progressively.
    swipeFeedbackThreshold: 0.30,
    swipeFeedbackScaleMin: 0.985,
    swipeFeedbackScaleMax: 1.012,
    swipeFeedbackAlphaMin: 42,
    swipeFeedbackAlphaMax: 178,

    // Active playlist. HALATION has been removed.
    presets: [
      { name: "PHOTO_FEEDBACK_CROP", photoFeedback: true, feedback: true },
      { name: "PHOTO_RAPID_CROP", photoRapidCrop: true },
      { name: "PHOTO_RGB_TEAR", photoRgbTear: true },
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
    maxEvents: 18,
    opacity: 0.72,
    secondaryOpacity: 0.36,
    faintOpacity: 0.18,
    fontSizeMobile: 9,
    fontSizeDesktop: 10,
    lineHeight: 1.28,
    marginMobile: 12,
    marginDesktop: 18,
    glitchOnMotion: true,
    glitchLabels: true,
  },
};
