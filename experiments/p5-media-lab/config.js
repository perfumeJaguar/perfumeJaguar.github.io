/** P5 MEDIA LAB 01 — USER-FACING CONFIGURATION */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.5.0",
    targetFps: 60,
    requestFullscreenOnStart: false,
    preventContextMenu: true,
    modeDurationSec: 11,
    sourceSwitchSec: 9,
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
    videosMuted: true,
    autoplayAfterStart: true,
    preferVideo: true,
    useBlobVideoLoader: true,
    videoFetchTimeoutMs: 30000,
    preloadAllImages: true,
    imagePreloadConcurrency: 3,
    imageCacheLimit: 64,
  },

  interaction: {
    smoothing: 0.14,
    pointerRadiusNorm: 0.08,
    pressBoost: 1.35,
  },

  audio: {
    enabled: true,
    masterVolume: 0.78,
    directNativeOutput: true,
    pcmWindowSize: 512,
    waveformPoints: 128,

    // Rate is intentionally subtle now. Touch is primarily assigned to FX depth,
    // not transport speed. Bright regions still move slightly faster than dark.
    minRate: 0.965,
    maxRate: 1.035,
    lumaRateMin: 0.985,
    lumaRateMax: 1.015,
    pressRateBoost: 0.012,

    // Parallel wet layer. The native <audio> remains audible and untouched;
    // decoded PCM is replayed through this separate effect graph.
    fxEnabled: true,
    fxWetMin: 0.035,
    fxWetMax: 0.42,
    minFilterHz: 260,
    maxFilterHz: 14500,
    maxDelayTime: 0.48,
    maxDelayFeedback: 0.68,
    maxDistortion: 0.62,
  },

  visual: {
    enabled: true,

    // Longer recursive trail. Pressure now increases trail persistence rather
    // than merely speeding up image changes.
    feedbackScale: 0.996,
    feedbackAlpha: 174,
    feedbackResolutionScaleMobile: 0.52,
    feedbackResolutionScaleDesktop: 0.72,

    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    scanlineSpacing: 5,
    photoCutMs: 92,
    photoBurstMs: 38,
    rgbTearMaxPx: 52,
    halationBlur: 5,
    vignetteStrength: 0.34,

    // Global crop envelope applied to every still-image mode.
    cropMinZoom: 1.18,
    cropMaxZoom: 3.9,
    cropPressBoost: 1.15,
    cropOffsetScale: 0.95,

    // PHOTO_FEEDBACK stays first during tuning.
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
      { name: "POSTER_AUDIO", base: true, posterize: true },
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
