/**
 * VisualEngine is intentionally a sampler of p5 techniques rather than one
 * perfectly restrained artwork. Presets expose different operations so the
 * owner can later remove, combine or develop them into a final piece.
 */
class P5LabVisualEngine {
  constructor(config, telemetry) {
    this.config = config;
    this.telemetry = telemetry;
    this.buffer = null;
    this.feedback = null;
    this.feedbackScratch = null;
    this.mosaicSample = null;
    this.modeIndex = 0;
    this.modeStartedMs = 0;
    this.particles = [];
    this.lastPresetName = "";
  }

  setup(viewportW, viewportH) {
    this.rebuild(viewportW, viewportH);
    this.modeStartedMs = millis();
    this.announcePreset();
  }

  rebuild(viewportW, viewportH) {
    const mobile = P5LabUtils.isMobileLayout();
    const longEdge = mobile ? P5LAB_CONFIG.render.maxBufferLongEdgeMobile : P5LAB_CONFIG.render.maxBufferLongEdgeDesktop;
    const size = P5LabUtils.fitInside(viewportW, viewportH, longEdge);

    this.buffer = createGraphics(size.width, size.height);
    this.feedback = createGraphics(size.width, size.height);
    this.feedbackScratch = createGraphics(size.width, size.height);

    const mosaicCols = mobile ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    const mosaicRows = Math.max(2, Math.ceil(mosaicCols * size.height / size.width));
    this.mosaicSample = createGraphics(mosaicCols, mosaicRows);

    this.buffer.pixelDensity(1);
    this.feedback.pixelDensity(1);
    this.feedbackScratch.pixelDensity(1);
    this.mosaicSample.pixelDensity(1);
    this.feedback.background(0);
    this.feedbackScratch.background(0);
    this.telemetry.event(`VISUAL BUFFER ${size.width}X${size.height}`);
  }

  currentPreset() {
    return this.config.presets[this.modeIndex % this.config.presets.length];
  }

  updateMode() {
    if (millis() - this.modeStartedMs > P5LAB_CONFIG.app.modeDurationSec * 1000) {
      this.modeIndex = (this.modeIndex + 1) % this.config.presets.length;
      this.modeStartedMs = millis();
      this.announcePreset();
    }
  }

  announcePreset() {
    const preset = this.currentPreset();
    this.lastPresetName = preset.name;
    this.telemetry.event(`MODE ${preset.name}`);
  }

  render(source, collageImage, analysis, audio, interaction) {
    this.updateMode();
    const preset = this.currentPreset();
    const g = this.buffer;

    g.push();
    g.background(0);

    if (preset.base) this.drawBase(g, source, analysis, audio, interaction);
    if (preset.rgbSplit) this.drawRgbSplit(g, source, analysis, interaction);
    if (preset.slices) this.drawSlices(g, source, analysis, interaction);
    if (preset.mosaic) this.drawMosaic(g, source, analysis, audio, interaction);
    if (preset.particles) this.drawParticles(g, analysis, audio, interaction);

    if (collageImage && (preset.name === "OVERLOAD" || preset.name === "SLICE_SCAN")) {
      this.drawCollage(g, collageImage, analysis, interaction);
    }

    if (preset.waveform) this.drawWaveform(g, audio, interaction);
    this.drawScanlines(g, analysis, audio);

    if (preset.posterize) {
      try {
        const levels = Math.floor(P5LabUtils.map01(interaction.x, 3, 8));
        g.filter(POSTERIZE, levels);
      } catch (_) {}
    }

    g.pop();

    if (preset.feedback) {
      this.applyFeedback(g, analysis, audio, interaction);
    } else {
      this.feedback.clear();
      this.feedback.image(g, 0, 0);
    }

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null, preset.feedback ? this.feedback : g, 255);
  }

  drawBase(g, source, analysis, audio, interaction) {
    const zoom = 1 + interaction.pressure * 0.035 + audio.bass * 0.012;
    const maxShift = 14 * analysis.motionSmooth;
    const ox = (interaction.x - 0.5) * maxShift;
    const oy = (interaction.y - 0.5) * maxShift;
    P5LabUtils.drawCover(g, source, 255, zoom, ox, oy);
  }

  drawRgbSplit(g, source, analysis, interaction) {
    // Each channel pass supplies its tint directly to drawCover. Keeping the tint
    // inside the helper prevents nested push()/tint() state from cancelling it.
    const amount = this.config.rgbSplitMaxPx * (0.2 + analysis.motionSmooth * 0.8 + interaction.pressure * 0.4);

    g.push();
    g.blendMode(ADD);
    P5LabUtils.drawCover(g, source, 120, 1.005, -amount, 0, [255, 55, 55]);
    P5LabUtils.drawCover(g, source, 105, 1.0, amount * 0.25, amount * 0.1, [55, 255, 120]);
    P5LabUtils.drawCover(g, source, 115, 1.008, amount, -amount * 0.1, [70, 110, 255]);
    g.blendMode(BLEND);
    g.pop();
  }

  drawSlices(g, source, analysis, interaction) {
    // Slices are relatively expensive because the source is redrawn once per band.
    // The mobile baseline therefore uses fewer bands than a wide desktop layout.
    const mobile = P5LabUtils.isMobileLayout();
    const count = mobile ? this.config.sliceCountMobile : this.config.sliceCountDesktop;
    const sliceH = g.height / count;
    const t = millis() * 0.001;

    for (let i = 0; i < count; i += 1) {
      const y = i * sliceH;
      const n = noise(i * 0.23, t * 0.6) - 0.5;
      const offset = n * g.width * (0.04 + analysis.motionSmooth * 0.18) * (0.7 + interaction.pressure);

      g.push();
      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y, g.width, sliceH + 1);
      ctx.clip();
      P5LabUtils.drawCover(g, source, 180, 1.0 + Math.abs(n) * 0.018, offset, 0);
      ctx.restore();
      g.pop();
    }
  }

  drawMosaic(g, source, analysis, audio, interaction) {
    const mobile = P5LabUtils.isMobileLayout();
    const cols = mobile ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    const cell = g.width / cols;
    const rows = Math.ceil(g.height / cell);

    const sample = this.mosaicSample;
    sample.clear();
    P5LabUtils.drawCover(sample, source, 255);
    sample.loadPixels();

    g.background(0);
    g.noStroke();
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const idx = 4 * (y * sample.width + x);
        const r = sample.pixels[idx] || 0;
        const gg = sample.pixels[idx + 1] || 0;
        const b = sample.pixels[idx + 2] || 0;
        const l = (r + gg + b) / (255 * 3);
        const scale = 0.32 + l * 0.72 + audio.rms * 0.35;
        const jitter = (noise(x * 0.14, y * 0.14, frameCount * 0.008) - 0.5) * cell * analysis.motionSmooth * 2;
        g.fill(r, gg, b, 225);
        g.rect(x * cell + jitter, y * cell, cell * scale, cell * scale);
      }
    }
  }

  drawParticles(g, analysis, audio, interaction) {
    const mobile = P5LabUtils.isMobileLayout();
    const maxCount = mobile ? this.config.maxParticlesMobile : this.config.maxParticlesDesktop;
    const spawn = Math.ceil(1 + audio.bass * 5 + analysis.motionSmooth * 6);

    for (let i = 0; i < spawn && this.particles.length < maxCount; i += 1) {
      this.particles.push({
        x: interaction.x * g.width + randomGaussian() * g.width * 0.05,
        y: interaction.y * g.height + randomGaussian() * g.height * 0.05,
        vx: random(-0.8, 0.8),
        vy: random(-1.2, 0.3),
        age: 0,
        life: random(45, 170),
        seed: random(1000),
        size: random(2, 9),
      });
    }

    g.push();
    g.blendMode(ADD);
    g.noStroke();
    for (const p of this.particles) {
      const n = noise(p.seed, frameCount * 0.01) - 0.5;
      p.vx += n * 0.11;
      p.vy -= 0.003 + audio.treble * 0.015;
      p.x += p.vx * (0.7 + analysis.motionSmooth * 3);
      p.y += p.vy * (0.7 + audio.rms * 4);
      p.age += 1;

      const life = 1 - p.age / p.life;
      const r = analysis.localR || 220;
      const gg = analysis.localG || 220;
      const b = analysis.localB || 220;
      g.fill(r, gg, b, 170 * life);
      g.circle(p.x, p.y, p.size * (0.6 + audio.rms * 2.2));
    }
    g.blendMode(BLEND);
    g.pop();

    this.particles = this.particles.filter((p) => p.age < p.life && p.x > -40 && p.x < g.width + 40 && p.y > -60 && p.y < g.height + 60);
  }

  drawCollage(g, img, analysis, interaction) {
    const t = millis() * 0.001;
    const alpha = 35 + 70 * analysis.motionSmooth;
    const scale = 0.25 + interaction.x * 0.2;
    const w = g.width * scale;
    const h = w * (img.height / img.width);

    g.push();
    g.blendMode(SCREEN);
    g.tint(255, alpha);
    const x = (0.5 + 0.34 * sin(t * 0.37)) * g.width - w * 0.5;
    const y = (0.5 + 0.34 * cos(t * 0.29)) * g.height - h * 0.5;
    g.image(img, x, y, w, h);
    g.noTint();
    g.blendMode(BLEND);
    g.pop();
  }

  drawWaveform(g, audio, interaction) {
    const wave = audio.waveform;
    if (!wave || wave.length < 2) return;

    g.push();
    g.noFill();
    g.stroke(255, 95 + audio.rms * 120);
    g.strokeWeight(1 + interaction.pressure * 1.2);
    g.beginShape();
    const yCenter = g.height * (0.78 - interaction.y * 0.18);
    const amp = g.height * (0.035 + audio.rms * 0.13);
    for (let i = 0; i < wave.length; i += 2) {
      const x = (i / (wave.length - 1)) * g.width;
      const y = yCenter + wave[i] * amp;
      g.vertex(x, y);
    }
    g.endShape();
    g.pop();
  }

  drawScanlines(g, analysis, audio) {
    const spacing = this.config.scanlineSpacing;
    g.push();
    g.stroke(255, 10 + 18 * audio.treble + 20 * analysis.motionSmooth);
    g.strokeWeight(1);
    for (let y = 0; y < g.height; y += spacing) {
      g.line(0, y, g.width, y);
    }
    g.pop();
  }

  applyFeedback(current, analysis, audio, interaction) {
    const previous = this.feedback;
    const next = this.feedbackScratch;
    const scale = this.config.feedbackScale - analysis.motionSmooth * 0.004;
    const w = next.width * scale;
    const h = next.height * scale;
    const x = (next.width - w) * (0.5 + (interaction.x - 0.5) * 0.2);
    const y = (next.height - h) * (0.5 + (interaction.y - 0.5) * 0.2);

    next.push();
    next.clear();
    next.background(0, 16 + audio.bass * 20);
    next.tint(255, this.config.feedbackAlpha);
    next.image(previous, x, y, w, h);
    next.noTint();
    next.blendMode(SCREEN);
    next.tint(255, 155 + audio.rms * 80);
    next.image(current, 0, 0);
    next.noTint();
    next.blendMode(BLEND);
    next.pop();

    this.feedback = next;
    this.feedbackScratch = previous;
  }

  snapshot() {
    const preset = this.currentPreset();
    const activeFx = [
      preset.rgbSplit && "RGB",
      preset.slices && "SLICE",
      preset.mosaic && "MOSAIC",
      preset.feedback && "FDBK",
      preset.particles && "PART",
      preset.waveform && "WAVE",
      preset.posterize && "POST",
    ].filter(Boolean).join("+") || "BASE";

    return {
      modeName: preset.name,
      modeIndex: this.modeIndex,
      particleCount: this.particles.length,
      activeFx,
    };
  }
}

window.P5LabVisualEngine = P5LabVisualEngine;
