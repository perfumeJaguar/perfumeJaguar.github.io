/**
 * DODREI — RUNTIME CONFIGURATION
 * =============================================================================
 * Canonical, human-editable configuration for the current browser artwork.
 */
window.DODREI_CONFIG = {
  meta: {
    project: "DODREI",
    schemaVersion: 1,
    configRevision: 11,
    generatedBy: "hand-or-control",
  },

  app: {
    title: "DODREI",
    version: "0.10.7",
    targetFps: 60,
    requestFullscreenOnStart: true,
    preventContextMenu: true,
    modeDurationSec: 11,
    imageSwitchSec: 0.10,
  },

  timing: {
    compositionFps: 30,
    visualSpeedLevel: "S1",
    visualSpeedMultiplier: 0.25,
    visualStateIntervalMs: 45,
    cutSpeedLevel: "S1",
    cutIntervalMs: 240,
    timeReferenceFps: 60,
    maxDeltaMs: 100,
  },

  render: {
    pixelDensity: 1,
    background: 0,
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
    imageSets: [{ id: "default", subdir: "" }],
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

    // Touch rupture is intentionally quieter than the original v0.6 patch.
    touchFxDryDuck: 0.28,
    touchFxWetScale: 0.45,
    touchFxDirectGainBase: 0.34,
    touchFxDirectGainPress: 0.12,
    touchFxDelayGainScale: 0.72,
    touchFxDistortionScale: 0.65,
    touchFxFeedbackScale: 0.68,
    touchFxResonanceMaxQ: 6.8,
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

    crushContrast: 1.32,
    crushPosterizeLevels: 6,
    crushIntruderAlpha: 28,

    // PRE COMMON FX belongs to the same sampled composition level as MODE.
    // Architecture exists, but there is no active PRE effect yet.
    preCommonFx: {},

    // POST COMMON FX runs after MODE/PRE and before touch/gesture FX.
    // Active effects are applied in this order; turning an effect on appends it.
    postCommonFx: {
      bw: false,
      grayscale: false,
      crush: false,
      highContrast: true,
      darken: true,
      strongVignette: false,
      order: ["highContrast", "darken"],
      bwThreshold: 0.50,
      highContrastAmount: 3.20,
      highContrastSaturation: 1.08,
      darkenAlpha: 0.46,
      strongVignetteStrength: 0.96,
      strongVignetteInner: 0.16,
      strongVignetteOuter: 0.72,
    },

    touchRuptureContrast: 3.2,
    touchRuptureBands: 13,
    touchRuptureResolutionScaleMobile: 0.50,
    touchRuptureResolutionScaleDesktop: 0.70,
    touchRuptureFrameSkipMobile: 2,
    touchRuptureFrameSkipDesktop: 1,

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

    modeControl: {
      strategy: "sequence",
      startIndex: 0,
      loop: true,
      autoAdvance: false,
      manualButtonEnabled: true,
    },

    // Active sequence only. PHOTO_RGB_TEAR (telemetry alias CHR_MA::W0UND)
    // is removed for performance. LUMA/mosaic modes are deferred to TODO.
    // Their engine implementations are intentionally retained for future reuse.
    // PHOTO_FULL is the clean source and deliberately comes last.
    presets: [
      { id: "photo-feedback-crop", name: "PHOTO_FEEDBACK_CROP", enabled: true, photoFeedback: true, feedback: true },
      { id: "photo-rapid-crop", name: "PHOTO_RAPID_CROP", enabled: true, photoRapidCrop: true },
      { id: "photo-shard-swap", name: "PHOTO_SHARD_SWAP", enabled: true, photoShardSwap: true },
      { id: "photo-double-blend", name: "PHOTO_DOUBLE_BLEND", enabled: true, photoDoubleBlend: true },
      { id: "photo-blend-cycle", name: "PHOTO_BLEND_CYCLE", enabled: true, photoBlendCycle: true },
      { id: "photo-full", name: "PHOTO_FULL", enabled: true, photoFull: true },
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
    glitchIntervalMs: 260,
    glitchChance: 0.42,
    glitchLineChance: 0.24,
  },

  control: {
    localDraftKey: "dodrei-control-draft-schema-1",
    importPolicy: "compatible-merge",
  },
};
window.P5LAB_CONFIG = window.DODREI_CONFIG;
