/**
 * DODREI — RUNTIME CONFIGURATION
 * =============================================================================
 * Canonical, human-editable configuration for the current browser artwork.
 *
 * Rules:
 * - Edit values, not key names, unless engine/schema code changes with them.
 * - `meta.schemaVersion` describes the config SHAPE, not the artwork version.
 * - The Control page can import older/newer files and merge compatible paths.
 * - Arrays of objects use stable `id` values so order may change safely.
 * - `window.P5LAB_CONFIG` remains as a compatibility alias for existing modules.
 *
 * Control page:
 *   ./control/
 */

window.DODREI_CONFIG = {
  meta: {
    project: "DODREI",
    schemaVersion: 1,
    configRevision: 3,
    generatedBy: "hand-or-control",
  },

  app: {
    title: "DODREI",
    version: "0.9.1",
    targetFps: 60,
    requestFullscreenOnStart: true,
    preventContextMenu: true,

    // Retained for later automatic mode playback. Ignored while
    // visual.modeControl.autoAdvance is false.
    modeDurationSec: 11,
    imageSwitchSec: 0.10,
  },

  render: {
    pixelDensity: 1,
    background: 0,

    // v0.9: mobile main processing buffer reduced from 900 -> 720.
    maxBufferLongEdgeMobile: 720,
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

    imageSets: [
      { id: "default", subdir: "" },
    ],

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

    sourceCropMinZoom: 1.0,
    sourceCropMaxZoom: 2.5,
    sourceCropTouchBoost: 0.0,
    sourceCropPanFactor: 0.42,
    sourceCropOverflowPan: 1.0,
    touchTransitionSlowdown: 0.28,

    feedbackScale: 0.994,
    feedbackAlpha: 154,
    feedbackResolutionScaleMobile: 0.52,
    feedbackResolutionScaleDesktop: 0.72,

    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    photoCutMs: 90,
    rgbTearMaxPx: 48,
    vignetteStrength: 0.34,

    // PHOTO_CRUSH parameters are retained for later use, but the common stage
    // is disabled by default in v0.9.1.
    crushContrast: 1.32,
    crushPosterizeLevels: 6,
    crushIntruderAlpha: 28,

    touchRuptureContrast: 3.2,
    touchRuptureBands: 13,
    touchRuptureResolutionScaleMobile: 0.50,
    touchRuptureResolutionScaleDesktop: 0.70,
    touchRuptureFrameSkipMobile: 2,
    touchRuptureFrameSkipDesktop: 1,

    // v0.9 applies this palette with a GPU filter shader when supported.
    // The engine falls back to the former CPU pixel loop if shader setup fails.
    touchPalette: {
      thresholds: [64, 128, 192],
      colors: [
        [0, 0, 0],
        [72, 72, 72],
        [238, 94, 90],
        [246, 246, 244],
      ],
    },

    swipeFeedbackThreshold: 0.30,
    swipeFeedbackScaleMin: 0.985,
    swipeFeedbackScaleMax: 1.012,
    swipeFeedbackAlphaMin: 42,
    swipeFeedbackAlphaMax: 178,

    // Mode order still lives in `presets`. v0.9 disables timed advancement;
    // the small upper-left button advances using this same policy.
    modeControl: {
      strategy: "sequence", // sequence | shuffle
      startIndex: 0,
      loop: true,
      autoAdvance: false,
      manualButtonEnabled: true,
    },

    presets: [
      { id: "photo-feedback-crop", name: "PHOTO_FEEDBACK_CROP", enabled: true, photoFeedback: true, feedback: true },
      { id: "photo-rapid-crop", name: "PHOTO_RAPID_CROP", enabled: true, photoRapidCrop: true },
      { id: "photo-rgb-tear", name: "PHOTO_RGB_TEAR", enabled: true, photoRgbTear: true },
      { id: "photo-shard-swap", name: "PHOTO_SHARD_SWAP", enabled: true, photoShardSwap: true },
      { id: "photo-double-blend", name: "PHOTO_DOUBLE_BLEND", enabled: true, photoDoubleBlend: true },
      { id: "photo-blend-cycle", name: "PHOTO_BLEND_CYCLE", enabled: true, photoBlendCycle: true },
      { id: "photo-full", name: "PHOTO_FULL", enabled: true, photoFull: true },
      { id: "luma-blocks", name: "LUMA_BLOCKS", enabled: true, mosaic: "normal" },
      { id: "luma-void", name: "LUMA_VOID", enabled: true, mosaic: "inverse" },
      { id: "luma-mono", name: "LUMA_MONO", enabled: true, mosaic: "mono" },
      { id: "luma-dither", name: "LUMA_DITHER", enabled: true, mosaic: "dither" },
      { id: "luma-pulse", name: "LUMA_PULSE", enabled: true, mosaic: "pulse" },
    ],

    pipeline: [
      { id: "preset-composition", enabled: true, locked: true },
      { id: "common-crush", enabled: false, locked: true },
      { id: "touch-rupture", enabled: true, locked: true },
      { id: "preset-feedback", enabled: true, locked: true },
      { id: "swipe-feedback", enabled: true, locked: true },
      { id: "vignette", enabled: true, locked: true },
      { id: "waveform", enabled: true, locked: true },
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

  control: {
    localDraftKey: "dodrei-control-draft-schema-1",
    importPolicy: "compatible-merge",
  },
};

window.P5LAB_CONFIG = window.DODREI_CONFIG;
