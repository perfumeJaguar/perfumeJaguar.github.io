/** P5 MEDIA LAB 01 — USER-FACING CONFIGURATION */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.6.0",
    targetFps: 60,
    requestFullscreenOnStart: false,
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
    // Photo-only study for now. Existing video files stay in the repository but
    // are not fetched, decoded or rendered by this build.
    videosEnabled: false,

    // GitHub Pages cannot list a directory by itself. On this public repository
    // the browser asks GitHub's Contents API for assets/images, filters supported
    // image extensions, then preloads that discovered archive before START is enabled.
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
    pointerRadiusNorm: 0.08,
    pressBoost: 1.35,
  },

  audio: {
    enabled: true,
    masterVolume: 0.82,
    directNativeOutput: true,
    pcmWindowSize: 512,
    waveformPoints: 128,

    // Transport barely moves; touch energy is spent on the wet FX layer instead.
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

    // Every individual image draw gets its own crop state. 1x therefore still
    // occurs naturally, while occasional frames can become heavily magnified.
    sourceCropMinZoom: 1.0,
    sourceCropMaxZoom: 2.65,
    sourceCropTouchBoost: 0.45,
    sourceCropPanFactor: 0.42,

    // Touch slows image turnover only slightly; it mostly changes destruction.
    touchTransitionSlowdown: 0.16,

    feedbackScale: 0.994,
    feedbackAlpha: 154,
    feedbackResolutionScaleMobile: 0.52,
    feedbackResolutionScaleDesktop: 0.72,

    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    scanlineSpacing: 5,
    photoCutMs: 90,
    rgbTearMaxPx: 48,
    halationBlur: 5,
    vignetteStrength: 0.34,

    // Touch-only rupture: monochrome, brutal threshold/contrast, tearing and grain.
    touchRuptureThresholdMin: 0.34,
    touchRuptureThresholdMax: 0.66,
    touchRuptureBands: 13,

    // Feedback stays first while it is being tuned.
    presets: [
      { name: "PHOTO_FEEDBACK_CROP", photoFeedback: true, feedback: true },
      { name: "PHOTO_RAPID_CROP", photoRapidCrop: true },
      { name: "PHOTO_RGB_TEAR", photoRgbTear: true },
      { name: "PHOTO_HALATION", photoHalation: true },
      { name: "PHOTO_SHARD_SWAP", photoShardSwap: true },
      { name: "PHOTO_DOUBLE_BLEND", photoDoubleBlend: true },
      { name: "PHOTO_BLEND_CYCLE", photoBlendCycle: true },
      { name: "PHOTO_CRUSH", photoCrush: true },
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
  },
};
