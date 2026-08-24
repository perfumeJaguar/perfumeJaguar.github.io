/** P5 MEDIA LAB 01 — USER-FACING CONFIGURATION */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.4.0",
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

    // Still archive loading is explicit and bounded rather than firing every
    // loadImage() at once. 10 current assets all stay resident. The same loader
    // can grow toward ~50 assets; if memory becomes a problem later, this is the
    // single place where a rolling working-set policy should be introduced.
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

    // Audible mapping: Y moves rate from slow(top) to fast(bottom), sampled
    // luminance multiplies that rate (bright=faster, dark=slower), and press adds
    // a final +10% push. preservesPitch=false requests actual pitch movement.
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

    // Recursive feedback remains as one study, but its buffer is deliberately
    // lower resolution because it was one of the clear mobile bottlenecks.
    feedbackScale: 0.987,
    feedbackAlpha: 82,
    feedbackResolutionScaleMobile: 0.52,
    feedbackResolutionScaleDesktop: 0.72,

    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    scanlineSpacing: 5,
    photoCutMs: 100,
    photoBurstMs: 42,
    rgbTearMaxPx: 34,
    halationBlur: 5,

    // Media-centric studies only. No particles, old PICKUP, video slice or
    // framed/grid photo layout.
    presets: [
      { name: "PHOTO_FULL", photoFull: true },
      { name: "PHOTO_DOUBLE_BLEND", photoDoubleBlend: true },
      { name: "PHOTO_RAPID_CROP", photoRapidCrop: true },
      { name: "PHOTO_SHARD_SWAP", photoShardSwap: true },
      { name: "PHOTO_BLEND_CYCLE", photoBlendCycle: true },
      { name: "PHOTO_RGB_TEAR", photoRgbTear: true },
      { name: "PHOTO_CRUSH", photoCrush: true },
      { name: "PHOTO_HALATION", photoHalation: true },
      { name: "PHOTO_FEEDBACK", photoFeedback: true, feedback: true },
      { name: "LUMA_BLOCKS", mosaic: "normal" },
      { name: "LUMA_VOID", mosaic: "inverse" },
      { name: "LUMA_MONO", mosaic: "mono" },
      { name: "LUMA_DITHER", mosaic: "dither" },
      { name: "LUMA_PULSE", mosaic: "pulse" },
      { name: "POSTER_AUDIO", base: true, posterize: true, waveform: true },
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
