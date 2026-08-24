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
    version: "0.1.3",
    targetFps: 60,

    // Temporarily disabled in the stability baseline. The previous mobile test
    // consistently stalled immediately after fullscreen/viewport rebuilding.
    // Once continuous playback is confirmed, fullscreen can be reintroduced
    // without changing the audiovisual engine itself.
    requestFullscreenOnStart: false,

    preventContextMenu: true,
    modeDurationSec: 14,
    sourceSwitchSec: 9,
    imageSwitchSec: 7,
  },

  render: {
    // Force density 1 for predictable pixel-analysis cost on Retina/mobile.
    pixelDensity: 1,
    background: 0,

    // Internal visual buffers are intentionally capped. The final canvas still
    // covers the full viewport; only the expensive processing resolution drops.
    maxBufferLongEdgeMobile: 900,
    maxBufferLongEdgeDesktop: 1280,

    // CPU analysis happens at a much smaller resolution than display.
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

    // GitHub Pages / mobile MP4 progressive loading can remain at readyState 0
    // for large files (especially when MP4 metadata is not at the front). In the
    // test build we fetch one whole clip to a Blob first, then decode locally.
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

    // Safe baseline: keep the music connected directly to the master output and
    // run FFT/amplitude analysis from the SoundFile itself. This avoids letting
    // one experimental effect node silence the complete graph. The effect target
    // parameters are still calculated and shown in telemetry; the wet chain can
    // be re-enabled after basic mobile playback is proven stable.
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

    // Slice rendering redraws the source once per slice. Keep the portrait/mobile
    // count deliberately lower; desktop has more GPU/CPU headroom and screen area.
    sliceCountMobile: 12,
    sliceCountDesktop: 18,

    mosaicColsMobile: 18,
    mosaicColsDesktop: 32,
    maxParticlesMobile: 160,
    maxParticlesDesktop: 320,
    scanlineSpacing: 5,
    rgbSplitMaxPx: 20,

    // Each preset deliberately emphasizes a different p5 capability.
    // Presets cycle automatically; no extra buttons are required.
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
