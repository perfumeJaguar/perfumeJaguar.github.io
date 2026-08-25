/**
 * DODREI — RUNTIME CONFIGURATION
 * =============================================================================
 * Canonical, human-editable configuration for the current browser artwork.
 */
window.DODREI_CONFIG = {
  meta: { project: "DODREI", schemaVersion: 1, configRevision: 27, generatedBy: "hand-or-control" },
  app: { title: "DODREI", version: "1.0.16", targetFps: 60, requestFullscreenOnStart: false, preventContextMenu: true, modeDurationSec: 11, imageSwitchSec: 0.10, startScreenHoldMs: 2000, telemetryStartDelayMs: 3000, telemetryStaggerMs: 200, visualDimDelayAfterTelemetryMs: 3000, visualFullDelayAfterDimMs: 1000 },
  timing: { compositionFps: 24, visualSpeedLevel: "S2", visualSpeedMultiplier: 0.50, visualStateIntervalMs: 45, cutSpeedLevel: "S2", cutIntervalMs: 240, timeReferenceFps: 60, maxDeltaMs: 100 },
  render: { pixelDensity: 1, background: 0, maxBufferLongEdgeMobile: 720, maxBufferLongEdgeDesktop: 1280, mobileMainOversample: 2.0, analysisWidthMobile: 128, analysisWidthDesktop: 180, analysisEveryNFrames: 2, analysisPixelStep: 2 },
  media: { videosEnabled: false, autoDiscoverImages: true, githubOwner: "perfumeJaguar", githubRepo: "perfumeJaguar.github.io", githubBranch: "main", githubImageDir: "experiments/p5-media-lab/assets/images", imageExtensions: ["jpg","jpeg","png","webp","gif","avif"], imageSets: [{ id: "default", subdir: "" }], activeImageLimit: 20, initialLoadConcurrency: 3, rotationBatchSize: 5, rotationIntervalSec: 5, rotationLoadConcurrency: 1, rotationPolicy: "shuffle-bag" },
  interaction: { smoothing: 0.14, pressBoost: 1.35 },
  audio: { enabled: true, masterVolume: 0.82, directNativeOutput: true, pcmWindowSize: 512, waveformPoints: 128, minRate: 0.985, maxRate: 1.015, lumaRateMin: 0.99, lumaRateMax: 1.01, pressRateBoost: 0.006, fxEnabled: true, fxWetMin: 0.020, fxWetMax: 0.62, minFilterHz: 120, maxFilterHz: 12500, maxDelayTime: 0.68, maxDelayFeedback: 0.82, maxDistortion: 0.88, touchFxDryDuck: 0.24, touchFxWetScale: 0.38, touchFxDirectGainBase: 0.30, touchFxDirectGainPress: 0.10, touchFxDelayGainScale: 0.62, touchFxDistortionScale: 0.56, touchFxFeedbackScale: 0.58, touchFxResonanceMaxQ: 6.0 },
  visual: {
    enabled: true,
    sceneImageSelectionPolicy: "independent-with-replacement",
    sourceCropMinZoom: 1.0, sourceCropMaxZoom: 8.0, sourceCropTouchBoost: 0.0, sourceCropPanFactor: 0.42, sourceCropOverflowPan: 1.0,
    touchTransitionSlowdown: 0.0,
    touchPlaybackSpeedMultiplier: 0.50,
    feedbackScale: 0.994, feedbackAlpha: 154, feedbackResolutionScaleMobile: 0.52, feedbackResolutionScaleDesktop: 0.72,
    mosaicColsMobile: 18, mosaicColsDesktop: 32, photoCutMs: 90, rgbTearMaxPx: 48, vignetteStrength: 0.34,
    crushContrast: 1.32, crushPosterizeLevels: 6, crushIntruderAlpha: 28,
    preCommonFx: {},
    postCommonFx: { masterEnabled: true, bw: false, grayscale: false, lowSaturation: true, blur: true, feedback: false, crush: false, highContrast: true, darken: false, strongVignette: false, order: ["highContrast","lowSaturation","blur"], bwThreshold: 0.50, lowSaturationAmount: 0.50, blurAmountPx: 1.20, feedbackRetainAlpha: 58, feedbackScale: 0.996, feedbackCurrentAlpha: 218, feedbackBufferScale: 0.60, blurRenderScaleMobile: 0.65, blurRenderScaleDesktop: 1.0, highContrastAmount: 3.20, highContrastSaturation: 1.08, darkenAlpha: 0.46, strongVignetteStrength: 0.96, strongVignetteInner: 0.16, strongVignetteOuter: 0.72 },
    touchRuptureContrast: 3.2, touchRuptureBands: 13, touchRuptureResolutionScaleMobile: 0.50, touchRuptureResolutionScaleDesktop: 0.70, touchRuptureFrameSkipMobile: 2, touchRuptureFrameSkipDesktop: 1,
    touchPalette: { thresholds: [64,128,192], colors: [[0,0,0],[72,72,72],[238,94,90],[246,246,244]] },
    swipeFeedbackThreshold: 0.25, swipeFeedbackStrength: 2.00, swipeFeedbackScaleMin: 0.985, swipeFeedbackScaleMax: 1.012, swipeFeedbackAlphaMin: 42, swipeFeedbackAlphaMax: 178,
    modeControl: { strategy: "sequence", startIndex: 0, loop: true, autoAdvance: false, manualButtonEnabled: true },
    presets: [
      { id: "photo-double-blend", name: "PHOTO_DOUBLE_BLEND", enabled: true, photoDoubleBlend: true },
      { id: "photo-feedback-crop", name: "PHOTO_FEEDBACK_CROP", enabled: true, photoFeedback: true, feedback: true },
      { id: "photo-rapid-crop", name: "PHOTO_RAPID_CROP", enabled: true, photoRapidCrop: true },
      { id: "photo-shard-swap", name: "PHOTO_SHARD_SWAP", enabled: true, photoShardSwap: true },
      { id: "photo-blend-cycle", name: "PHOTO_BLEND_CYCLE", enabled: true, photoBlendCycle: true },
      { id: "photo-full", name: "PHOTO_FULL", enabled: true, photoFull: true }
    ],
    pipeline: [
      { id: "preset-composition", enabled: true, locked: true }, { id: "common-crush", enabled: false, locked: true }, { id: "touch-rupture", enabled: true, locked: true }, { id: "preset-feedback", enabled: true, locked: true }, { id: "swipe-feedback", enabled: true, locked: true }, { id: "vignette", enabled: true, locked: true }, { id: "waveform", enabled: true, locked: true }
    ]
  },
  telemetry: { enabled: true, author: "Hoyeon Choi", maxEvents: 18, opacity: 0.52, secondaryOpacity: 0.28, faintOpacity: 0.14, fontFamily: "IBM Plex Mono", textColor: [214,214,210], fontSizeMobile: 9, fontSizeDesktop: 10, lineHeight: 1.28, marginMobile: 12, marginDesktop: 18, glitchOnMotion: true, glitchLabels: true, glitchIntervalMs: 260, glitchChance: 0.42, glitchLineChance: 0.24, lineJitterChance: 0.10, lineJitterPx: 1.6, driftPx: 1, driftIntervalMs: 7000 },
  control: { localDraftKey: "dodrei-control-draft-schema-1", importPolicy: "compatible-merge" }
};
window.P5LAB_CONFIG = window.DODREI_CONFIG;
