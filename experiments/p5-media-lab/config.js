/**
 * P5 MEDIA LAB 01 — USER-FACING CONFIGURATION
 * ------------------------------------------------------------
 * This is the FIRST file to edit when experimenting.
 * Most artistic tuning should happen here before touching engine code.
 *
 * Mental model:
 *   app         = timing / fullscreen / global runtime
 *   render      = performance / internal resolution
 *   media       = image archive / resident working set / rotation policy
 *   interaction = smoothing of mouse/touch input
 *   audio       = transport + interactive wet-FX range
 *   visual      = crop / feedback / rupture / preset composition
 *   telemetry   = terminal-like text layer
 */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.7.0",
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

    // Optional set boundary. Current behavior uses one set; later, folders such
    // as personA/ and personB/ can be added here without changing the renderer.
    // Example: [{ id: "personA", subdir: "personA" }, { id: "personB", subdir: "personB" }]
    imageSets: [{ id: "default", subdir: "" }],

    // Decoded-image working set. The complete archive remains lightweight path
    // metadata; only these resident/staging images stay strongly referenced.
    activeImageLimit: 20,
    initialLoadConcurrency: 3,
    rotationBatchSize: 5,
    rotationIntervalSec: 5,
    rotationLoadConcurrency: 1,
    rotationPolicy: "shuffle-bag",
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
    // v0.7.0 keeps the artistic zoom range fixed, while crop position can roam
    // across 100% of the overflow created by BOTH cover-fit and extra zoom.
    sourceCropMinZoom: 1.0,
    sourceCropMaxZoom: 2.5,
    sourceCropTouchBoost: 0.0,
    sourceCropPanFactor: 0.42,
    sourceCropOverflowPan: 1.0,
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

    // HALATION / BLOOM remains removed from the active experiment.

    // Common PHOTO_CRUSH applied to every preset before touch rupture.
    crushContrast: 1.32,
    crushPosterizeLevels: 6,
    crushIntruderAlpha: 28,

    // TOUCH RUPTURE ----------------------------------------------------------
    touchRuptureContrast: 3.2,
    touchRuptureBands: 13,
    touchRuptureResolutionScaleMobile: 0.50,
    touchRuptureResolutionScaleDesktop: 0.70,
    touchRuptureFrameSkipMobile: 2,
    touchRuptureFrameSkipDesktop: 1,

    // SWIPE FEEDBACK ---------------------------------------------------------
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
