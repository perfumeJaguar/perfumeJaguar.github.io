/** P5 MEDIA LAB 01 — USER-FACING CONFIGURATION */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.4.1",
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
    masterVolume: 0.82,
    directNativeOutput: true,
    pcmWindowSize: 512,
    waveformPoints: 128,
    minRate: 0.76,
    maxRate: 1.18,
    lumaRateMin: 0.88,
    lumaRateMax: 1.12,
    pressRateBoost: 0.10,
    minFilterHz: 140,
    maxFilterHz: 12000,
    maxDelayTime: 0.72,
    maxDelayFeedback: 0.64,
    maxDistortion: 0.38,
  },

  visual: {
    enabled: true,

    // Long, low-resolution recursive trail for the preferred photo-feedback study.
    feedbackScale: 0.994,
    feedbackAlpha: 154,
    feedbackResolutionScaleMobile: 0.52,
    feedbackResolutionScaleDesktop: 0.72,

    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    scanlineSpacing: 5,
    photoCutMs: 90,
    photoBurstMs: 34,
    rgbTearMaxPx: 42,
    halationBlur: 5,
    vignetteStrength: 0.34,

    // PHOTO_FEEDBACK is intentionally first while this study is being tuned.
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
