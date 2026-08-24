/**
 * P5 MEDIA LAB 01 — USER-FACING CONFIGURATION
 *
 * This file is intentionally plain JavaScript rather than JSON so it can
 * contain comments. Most experiments should be tunable from here without
 * editing the rendering or audio classes.
 */
window.P5LAB_CONFIG = {
  app: {
    title: "P5 MEDIA LAB / 01",
    version: "0.1.4",
    targetFps: 60,

    // Temporarily disabled in the stability baseline. Once continuous video and
    // audio playback are confirmed, fullscreen can be reintroduced separately.
    requestFullscreenOnStart: false,

    preventContextMenu: true,
    modeDurationSec: 14,
    sourceSwitchSec: 9,
    imageSwitchSec: 7,
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
    imageCacheLimit: 6,
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
    syntheticFallback: true,
    masterVolume: 0.72,

    // v0.1.4: audible playback uses native HTMLAudioElement + Web Audio API.
    // This deliberately bypasses p5.SoundFile output after mobile tests showed
    // PLAYING/RUNNING states while the physical speaker output remained silent.
    safeDryOutput: true,

    minFilterHz: 140,
    maxFilterHz: 12000,
    minRate: 0.76,
    maxRate: 1.18,
    maxDelayTime: 0.72,
    maxDelayFeedback: 0.64,
    maxDistortion: 0.38,
    reverbDecay: 2.8,
    fallbackOscAmp: 0.045,
  },

  visual: {
    enabled: true,
    feedbackScale: 0.985,
    feedbackAlpha: 72,
    sliceCountMobile: 12,
    sliceCountDesktop: 18,
    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    maxParticlesMobile: 160,
    maxParticlesDesktop: 320,
    scanlineSpacing: 5,
    rgbSplitMaxPx: 20,
    presets: [
      { name: "PICKUP", base: true, rgbSplit: false, slices: false, mosaic: false, feedback: false, particles: false, waveform: true, posterize: false },
      { name: "RGB_FEEDBACK", base: true, rgbSplit: true, slices: false, mosaic: false, feedback: true, particles: false, waveform: false, posterize: false },
      { name: "SLICE_SCAN", base: true, rgbSplit: false, slices: true, mosaic: false, feedback: true, particles: false, waveform: false, posterize: false },
      { name: "PIXEL_FIELD", base: false, rgbSplit: false, slices: false, mosaic: true, feedback: false, particles: true, waveform: false, posterize: false },
      { name: "POSTER_WAVE", base: true, rgbSplit: false, slices: false, mosaic: false, feedback: false, particles: false, waveform: true, posterize: true },
      { name: "OVERLOAD", base: true, rgbSplit: true, slices: true, mosaic: false, feedback: true, particles: true, waveform: true, posterize: false },
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
