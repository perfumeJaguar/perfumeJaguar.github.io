/** P5 MEDIA LAB 01 — USER-FACING CONFIGURATION */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.3.0",
    targetFps: 60,
    requestFullscreenOnStart: false,
    preventContextMenu: true,
    modeDurationSec: 11,
    sourceSwitchSec: 9,

    // The still archive is intentionally treated as a high-speed time source.
    // 0.10 sec = 10 source changes per second. Individual visual modes may run
    // even faster while the pointer is held down.
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
    imageCacheLimit: 10,
    preloadAllImages: true,
    preferVideo: true,
    useBlobVideoLoader: true,
    videoFetchTimeoutMs: 30000,
  },

  interaction: {
    smoothing: 0.14,
    pointerRadiusNorm: 0.08,
    pressBoost: 1.35,
  },

  audio: {
    enabled: true,
    masterVolume: 0.82,

    // Audible output remains the proven v0.1.5 direct <audio> path. Analysis is
    // computed separately from a decoded PCM copy of the same MP3, so attaching
    // analysers/effects can no longer silence the physical device output.
    directNativeOutput: true,
    pcmWindowSize: 512,
    waveformPoints: 128,

    minFilterHz: 140,
    maxFilterHz: 12000,
    minRate: 0.76,
    maxRate: 1.18,
    maxDelayTime: 0.72,
    maxDelayFeedback: 0.64,
    maxDistortion: 0.38,
  },

  visual: {
    enabled: true,

    // Feedback is now reserved for high-speed still-image modes rather than the
    // earlier video feedback preset.
    feedbackScale: 0.988,
    feedbackAlpha: 86,

    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    scanlineSpacing: 5,

    // High-speed still-image timing. Touch/hold accelerates these values further.
    photoCutMs: 100,
    photoBurstMs: 42,
    photoGridBase: 4,
    photoGridMax: 9,

    // Video presets now concentrate on the luminance-block family that tested well.
    // PICKUP, RGB_FEEDBACK, SLICE_SCAN and OVERLOAD were intentionally removed.
    presets: [
      { name: "PHOTO_FULL", photoFull: true },
      { name: "PHOTO_DOUBLE_BLEND", photoDoubleBlend: true },
      { name: "PHOTO_RAPID_CROP", photoRapidCrop: true },
      { name: "PHOTO_MULTI_SWAP", photoMultiSwap: true },
      { name: "PHOTO_FEEDBACK", photoFeedback: true, feedback: true },
      { name: "PHOTO_BLEND_CYCLE", photoBlendCycle: true },
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
