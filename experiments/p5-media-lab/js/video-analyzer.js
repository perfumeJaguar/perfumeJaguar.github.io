/**
 * Downsampled pixel analyzer.
 * This is deliberately simple rather than computer vision: brightness, RGB,
 * local pointer sample and frame-to-frame luminance difference are enough to
 * create useful control signals while staying mobile-friendly.
 */
class P5LabVideoAnalyzer {
  constructor(config, telemetry) {
    this.config = config;
    this.telemetry = telemetry;
    this.buffer = null;
    this.prevLuma = null;
    this.snapshotData = this.emptySnapshot();
  }

  emptySnapshot() {
    return {
      globalLuma: 0,
      globalR: 0,
      globalG: 0,
      globalB: 0,
      localLuma: 0,
      localR: 0,
      localG: 0,
      localB: 0,
      motion: 0,
      motionSmooth: 0,
    };
  }

  setup(viewportW, viewportH) {
    this.rebuild(viewportW, viewportH);
  }

  rebuild(viewportW, viewportH) {
    try { this.buffer?.remove?.(); } catch (_) {}
    this.buffer = null;
    const mobile = P5LabUtils.isMobileLayout();
    const aw = mobile ? this.config.analysisWidthMobile : this.config.analysisWidthDesktop;
    const ah = Math.max(1, Math.round(aw * viewportH / viewportW));
    this.buffer = createGraphics(aw, ah);
    this.buffer.pixelDensity(1);
    this.prevLuma = new Float32Array(aw * ah);
    this.telemetry.event(`ANALYSIS BUFFER ${aw}X${ah}`);
  }

  update(source, interaction) {
    if (!source || !this.buffer) return this.snapshotData;
    if (frameCount % this.config.analysisEveryNFrames !== 0) return this.snapshotData;

    const g = this.buffer;
    g.clear();
    P5LabUtils.drawCover(g, source, 255);
    g.loadPixels();

    const pixels = g.pixels;
    const step = Math.max(1, this.config.analysisPixelStep);
    let sumL = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let diff = 0;
    let count = 0;

    for (let y = 0; y < g.height; y += step) {
      for (let x = 0; x < g.width; x += step) {
        const pIndex = 4 * (y * g.width + x);
        const r = pixels[pIndex] || 0;
        const gg = pixels[pIndex + 1] || 0;
        const b = pixels[pIndex + 2] || 0;
        const luma = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
        const lIndex = y * g.width + x;

        sumL += luma;
        sumR += r;
        sumG += gg;
        sumB += b;
        diff += Math.abs(luma - this.prevLuma[lIndex]);
        this.prevLuma[lIndex] = luma;
        count += 1;
      }
    }

    const px = P5LabUtils.clamp(Math.floor(interaction.x * (g.width - 1)), 0, g.width - 1);
    const py = P5LabUtils.clamp(Math.floor(interaction.y * (g.height - 1)), 0, g.height - 1);
    const localIndex = 4 * (py * g.width + px);
    const localR = pixels[localIndex] || 0;
    const localG = pixels[localIndex + 1] || 0;
    const localB = pixels[localIndex + 2] || 0;
    const localLuma = (0.2126 * localR + 0.7152 * localG + 0.0722 * localB) / 255;

    const motion = count ? P5LabUtils.clamp((diff / count) * 4.5, 0, 1) : 0;
    const previousSmooth = this.snapshotData.motionSmooth || 0;

    this.snapshotData = {
      globalLuma: count ? sumL / count : 0,
      globalR: count ? sumR / count : 0,
      globalG: count ? sumG / count : 0,
      globalB: count ? sumB / count : 0,
      localLuma,
      localR,
      localG,
      localB,
      motion,
      motionSmooth: P5LabUtils.lerp(previousSmooth, motion, 0.12),
    };

    return this.snapshotData;
  }

  snapshot() {
    return this.snapshotData;
  }
}

window.P5LabVideoAnalyzer = P5LabVideoAnalyzer;
