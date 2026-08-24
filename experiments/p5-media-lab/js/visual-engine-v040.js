/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.4.0
 *
 * Media-centric sampler. No particles and no framed/grid photo layouts.
 * Still-image studies now favor full-frame cuts, destructive channel shifts,
 * crop shards, posterization and low-resolution halation/feedback.
 */
class P5LabVisualEngine {
  constructor(config, telemetry) {
    this.config = config;
    this.telemetry = telemetry;
    this.buffer = null;
    this.feedback = null;
    this.feedbackScratch = null;
    this.mosaicSample = null;
    this.glowBuffer = null;
    this.modeIndex = 0;
    this.modeStartedMs = 0;
  }

  setup(w, h) {
    this.rebuild(w, h);
    this.modeStartedMs = millis();
    this.announcePreset();
  }

  rebuild(w, h) {
    const mobile = P5LabUtils.isMobileLayout();
    const edge = mobile ? P5LAB_CONFIG.render.maxBufferLongEdgeMobile : P5LAB_CONFIG.render.maxBufferLongEdgeDesktop;
    const size = P5LabUtils.fitInside(w, h, edge);
    this.buffer = createGraphics(size.width, size.height);

    const feedbackScale = mobile ? this.config.feedbackResolutionScaleMobile : this.config.feedbackResolutionScaleDesktop;
    const fw = Math.max(96, Math.round(size.width * feedbackScale));
    const fh = Math.max(96, Math.round(size.height * feedbackScale));
    this.feedback = createGraphics(fw, fh);
    this.feedbackScratch = createGraphics(fw, fh);

    const cols = mobile ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    this.mosaicSample = createGraphics(cols, Math.max(2, Math.ceil(cols * size.height / size.width)));
    this.glowBuffer = createGraphics(
      Math.max(64, Math.round(size.width * 0.28)),
      Math.max(96, Math.round(size.height * 0.28)),
    );

    [this.buffer, this.feedback, this.feedbackScratch, this.mosaicSample, this.glowBuffer]
      .forEach((g) => g.pixelDensity(1));
    this.feedback.background(0);
    this.feedbackScratch.background(0);
    this.telemetry.event(`VISUAL BUFFER ${size.width}X${size.height}`);
    this.telemetry.event(`FEEDBACK BUFFER ${fw}X${fh}`);
  }

  currentPreset() {
    return this.config.presets[this.modeIndex % this.config.presets.length];
  }

  updateMode() {
    if (millis() - this.modeStartedMs > P5LAB_CONFIG.app.modeDurationSec * 1000) {
      this.modeIndex = (this.modeIndex + 1) % this.config.presets.length;
      this.modeStartedMs = millis();
      this.feedback.clear();
      this.feedbackScratch.clear();
      this.announcePreset();
    }
  }

  announcePreset() {
    this.telemetry.event(`MODE ${this.currentPreset().name}`);
  }

  render(source, currentImage, imagePool, analysis, audio, interaction) {
    this.updateMode();
    const preset = this.currentPreset();
    const g = this.buffer;
    const pool = imagePool && imagePool.length ? imagePool : (currentImage ? [currentImage] : []);

    g.push();
    g.background(0);

    if (preset.photoFull) this.drawPhotoFull(g, pool, interaction, audio);
    else if (preset.photoDoubleBlend) this.drawPhotoDoubleBlend(g, pool, interaction, audio);
    else if (preset.photoRapidCrop) this.drawPhotoRapidCrop(g, pool, interaction, audio);
    else if (preset.photoShardSwap) this.drawPhotoShardSwap(g, pool, interaction, audio);
    else if (preset.photoBlendCycle) this.drawPhotoBlendCycle(g, pool, interaction, audio);
    else if (preset.photoRgbTear) this.drawPhotoRgbTear(g, pool, interaction, audio);
    else if (preset.photoCrush) this.drawPhotoCrush(g, pool, interaction, audio);
    else if (preset.photoHalation) this.drawPhotoHalation(g, pool, interaction, audio);
    else if (preset.photoFeedback) this.drawPhotoFeedbackSource(g, pool, interaction, audio);
    else {
      if (preset.base) this.drawBase(g, source, analysis, audio, interaction);
      if (preset.mosaic) this.drawMosaic(g, source, analysis, audio, interaction, preset.mosaic);
      if (preset.waveform) this.drawWaveform(g, audio, interaction);
      if (preset.posterize) {
        try {
          const levels = Math.floor(P5LabUtils.map01(interaction.x, 3, 9));
          g.filter(POSTERIZE, levels);
        } catch (_) {}
      }
      this.drawScanlines(g, analysis, audio);
    }

    g.pop();

    if (preset.feedback) this.applyPhotoFeedback(g, audio, interaction);

    background(P5LAB_CONFIG.render.background);
    if (preset.feedback) P5LabUtils.drawCover(null, this.feedback, 255);
    else P5LabUtils.drawCover(null, g, 255);
  }

  tick(intervalMs, interaction) {
    const press = interaction.pressure || 0;
    const accelerated = Math.max(24, intervalMs * (1 - press * 0.58));
    return Math.floor(millis() / accelerated);
  }

  imageAt(pool, seed) {
    if (!pool.length) return null;
    const n = Math.abs(Math.floor(seed * 1103515245 + 12345));
    return pool[n % pool.length];
  }

  blendModeAt(seed) {
    const modes = [SCREEN, MULTIPLY, DIFFERENCE, ADD, LIGHTEST, DARKEST];
    return modes[Math.abs(seed) % modes.length];
  }

  drawPhotoFull(g, pool, interaction, audio) {
    const tick = this.tick(this.config.photoCutMs, interaction);
    const img = this.imageAt(pool, tick);
    if (!img) return;
    const zoom = 1 + interaction.pressure * 0.10 + audio.rms * 0.05;
    P5LabUtils.drawCover(g, img, 255, zoom,
      (interaction.x - 0.5) * g.width * 0.05,
      (interaction.y - 0.5) * g.height * 0.05);
  }

  drawPhotoDoubleBlend(g, pool, interaction, audio) {
    const tick = this.tick(110, interaction);
    const a = this.imageAt(pool, tick * 3 + 1);
    const b = this.imageAt(pool, tick * 7 + 5);
    if (!a) return;
    P5LabUtils.drawCover(g, a, 235, 1.02 + audio.bass * 0.05);
    if (!b) return;

    g.push();
    g.blendMode(this.blendModeAt(tick + Math.floor(interaction.x * 6)));
    P5LabUtils.drawCover(g, b, 85 + audio.rms * 120 + interaction.pressure * 50,
      1.08 + interaction.y * 0.28,
      (0.5 - interaction.x) * 48,
      (interaction.y - 0.5) * 34);
    g.blendMode(BLEND);
    g.pop();
  }

  drawPhotoRapidCrop(g, pool, interaction, audio) {
    const interval = interaction.pressure > 0.12 ? this.config.photoBurstMs : this.config.photoCutMs;
    const tick = this.tick(interval, interaction);
    const img = this.imageAt(pool, tick * 11 + 3);
    if (!img) return;

    const n1 = noise(tick * 1.731);
    const n2 = noise(tick * 3.117 + 20);
    const n3 = noise(tick * 5.331 + 40);
    const zoom = 1.10 + n3 * (1.55 + interaction.y * 1.25 + audio.treble * 0.5);
    const ox = (n1 - 0.5) * g.width * 0.95;
    const oy = (n2 - 0.5) * g.height * 0.95;
    P5LabUtils.drawCover(g, img, 255, zoom, ox, oy);

    if (interaction.pressure > 0.08) {
      const img2 = this.imageAt(pool, tick * 17 + 9);
      if (img2) {
        g.push();
        g.blendMode(tick % 2 ? DIFFERENCE : SCREEN);
        P5LabUtils.drawCover(g, img2, 75 + interaction.pressure * 115,
          1.45 + audio.rms * 0.45, -ox * 0.28, oy * 0.22);
        g.blendMode(BLEND);
        g.pop();
      }
    }
  }

  drawPhotoShardSwap(g, pool, interaction, audio) {
    const tick = this.tick(72, interaction);
    const base = this.imageAt(pool, tick * 5 + 1);
    if (!base) return;
    P5LabUtils.drawCover(g, base, 255, 1.03 + audio.rms * 0.06);

    const bands = 7 + Math.floor(interaction.y * 9) + Math.floor(audio.treble * 5);
    const bandH = g.height / bands;
    for (let i = 0; i < bands; i += 1) {
      if ((i + tick) % 3 === 0 && interaction.pressure < 0.15) continue;
      const img = this.imageAt(pool, tick * 31 + i * 13 + 7);
      if (!img) continue;
      const y = i * bandH;
      const offset = (noise(tick * 0.33, i * 0.61) - 0.5) * g.width * (0.10 + interaction.x * 0.35);
      g.push();
      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y, g.width, bandH + 1);
      ctx.clip();
      P5LabUtils.drawCover(g, img, 210, 1.06 + audio.bass * 0.14, offset, 0);
      ctx.restore();
      g.pop();
    }
  }

  drawPhotoBlendCycle(g, pool, interaction, audio) {
    const tick = this.tick(100, interaction);
    const imgs = [
      this.imageAt(pool, tick * 5 + 1),
      this.imageAt(pool, tick * 11 + 3),
      this.imageAt(pool, tick * 17 + 7),
    ].filter(Boolean);
    if (!imgs.length) return;

    P5LabUtils.drawCover(g, imgs[0], 230, 1.03 + audio.rms * 0.05);
    for (let i = 1; i < imgs.length; i += 1) {
      g.push();
      g.blendMode(this.blendModeAt(tick + i + Math.floor(interaction.x * 6)));
      P5LabUtils.drawCover(g, imgs[i], 55 + i * 35 + audio.rms * 90 + interaction.pressure * 50,
        1.08 + i * 0.08 + interaction.y * 0.16,
        (interaction.x - 0.5) * g.width * 0.05 * i,
        (0.5 - interaction.y) * g.height * 0.04 * i);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoRgbTear(g, pool, interaction, audio) {
    const tick = this.tick(82, interaction);
    const img = this.imageAt(pool, tick * 7 + 3);
    if (!img) return;

    const amount = this.config.rgbTearMaxPx * (0.25 + interaction.pressure + audio.treble * 0.8);
    P5LabUtils.drawCover(g, img, 150, 1.02);
    g.push();
    g.blendMode(ADD);
    P5LabUtils.drawCover(g, img, 105, 1.02, -amount, 0, [255, 35, 35]);
    P5LabUtils.drawCover(g, img, 92, 1.015, amount * 0.25, amount * 0.12, [35, 255, 95]);
    P5LabUtils.drawCover(g, img, 105, 1.025, amount, -amount * 0.12, [45, 90, 255]);
    g.blendMode(BLEND);
    g.pop();

    if (interaction.pressure > 0.12 || audio.bass > 0.25) {
      const intruder = this.imageAt(pool, tick * 19 + 11);
      if (intruder) {
        g.push();
        g.blendMode(DIFFERENCE);
        P5LabUtils.drawCover(g, intruder, 45 + interaction.pressure * 100 + audio.bass * 70,
          1.2 + interaction.y * 0.3);
        g.blendMode(BLEND);
        g.pop();
      }
    }
  }

  drawPhotoCrush(g, pool, interaction, audio) {
    const tick = this.tick(115, interaction);
    const img = this.imageAt(pool, tick * 13 + 5);
    if (!img) return;
    P5LabUtils.drawCover(g, img, 255, 1.05 + interaction.pressure * 0.12);

    try {
      const levels = Math.max(2, Math.min(7, 2 + Math.floor(interaction.x * 4 + audio.rms * 2)));
      g.filter(POSTERIZE, levels);
    } catch (_) {}

    const other = this.imageAt(pool, tick * 29 + 9);
    if (other) {
      g.push();
      g.blendMode(interaction.y > 0.5 ? DIFFERENCE : MULTIPLY);
      P5LabUtils.drawCover(g, other, 45 + interaction.pressure * 120 + audio.treble * 70,
        1.25 + audio.bass * 0.25,
        (interaction.x - 0.5) * g.width * 0.16,
        (interaction.y - 0.5) * g.height * 0.12);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoHalation(g, pool, interaction, audio) {
    const tick = this.tick(180, interaction);
    const img = this.imageAt(pool, tick * 7 + 2);
    if (!img) return;

    P5LabUtils.drawCover(g, img, 235, 1.02 + interaction.pressure * 0.05);

    const glow = this.glowBuffer;
    glow.clear();
    P5LabUtils.drawCover(glow, img, 165 + audio.rms * 70, 1.04 + interaction.y * 0.05, 0, 0, [255, 120, 95]);
    try {
      glow.filter(BLUR, this.config.halationBlur + Math.floor(interaction.pressure * 4));
    } catch (_) {}

    g.push();
    g.blendMode(SCREEN);
    g.tint(255, 80 + audio.rms * 105 + interaction.pressure * 50);
    g.image(glow, -g.width * 0.025, -g.height * 0.018, g.width * 1.05, g.height * 1.036);
    g.noTint();
    g.blendMode(BLEND);
    g.pop();

    const second = this.imageAt(pool, tick * 17 + 9);
    if (second && (interaction.pressure > 0.08 || audio.treble > 0.18)) {
      g.push();
      g.blendMode(SCREEN);
      P5LabUtils.drawCover(g, second, 28 + interaction.pressure * 75 + audio.treble * 55,
        1.18 + interaction.x * 0.1);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoFeedbackSource(g, pool, interaction, audio) {
    const tick = this.tick(interaction.pressure > 0.1 ? 48 : 88, interaction);
    const img = this.imageAt(pool, tick * 19 + 2);
    if (!img) return;
    P5LabUtils.drawCover(g, img, 240,
      1.02 + audio.bass * 0.10 + interaction.pressure * 0.08,
      (noise(tick * 0.73) - 0.5) * g.width * 0.16,
      (noise(tick * 1.31 + 4) - 0.5) * g.height * 0.16);
  }

  applyPhotoFeedback(current, audio, interaction) {
    const prev = this.feedback;
    const next = this.feedbackScratch;
    const scale = this.config.feedbackScale - audio.rms * 0.004;
    const w = next.width * scale;
    const h = next.height * scale;
    const x = (next.width - w) * (0.5 + (interaction.x - 0.5) * 0.24);
    const y = (next.height - h) * (0.5 + (interaction.y - 0.5) * 0.24);

    next.push();
    next.clear();
    next.background(0, 12 + audio.bass * 22);
    next.tint(255, this.config.feedbackAlpha);
    next.image(prev, x, y, w, h);
    next.noTint();
    next.blendMode(interaction.pressure > 0.18 ? DIFFERENCE : SCREEN);
    next.tint(255, 150 + audio.rms * 90);
    next.image(current, 0, 0, next.width, next.height);
    next.noTint();
    next.blendMode(BLEND);
    next.pop();

    this.feedback = next;
    this.feedbackScratch = prev;
  }

  drawBase(g, source, analysis, audio, interaction) {
    const zoom = 1 + interaction.pressure * 0.05 + audio.bass * 0.025;
    const shift = 10 * analysis.motionSmooth + audio.treble * 4;
    P5LabUtils.drawCover(g, source, 255, zoom,
      (interaction.x - 0.5) * shift,
      (interaction.y - 0.5) * shift);
  }

  drawMosaic(g, source, analysis, audio, interaction, variant) {
    const cols = P5LabUtils.isMobileLayout() ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    const cell = g.width / cols;
    const rows = Math.ceil(g.height / cell);
    const sample = this.mosaicSample;
    sample.clear();
    P5LabUtils.drawCover(sample, source, 255);
    sample.loadPixels();

    g.background(variant === "mono" || variant === "dither" ? 238 : 0);
    g.noStroke();
    const pulse = 0.72 + audio.rms * 0.7 + 0.18 * Math.sin(millis() * 0.006 + audio.bass * 8);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const idx = 4 * (y * sample.width + x);
        const r = sample.pixels[idx] || 0;
        const gg = sample.pixels[idx + 1] || 0;
        const b = sample.pixels[idx + 2] || 0;
        const luma = (r + gg + b) / (255 * 3);
        let scale;

        if (variant === "inverse") scale = 0.12 + (1 - luma) * 1.05;
        else if (variant === "dither") {
          const threshold = ((x + y * 3) % 5) / 5;
          scale = luma > threshold ? 0.94 : 0.12;
        } else if (variant === "pulse") scale = (0.14 + luma * 0.92) * pulse;
        else scale = 0.14 + luma * 1.02;

        scale += interaction.pressure * 0.16;
        scale = P5LabUtils.clamp(scale, 0.05, 1.35);
        const size = cell * scale;
        const jitter = (noise(x * 0.14, y * 0.14, frameCount * 0.008) - 0.5)
          * cell * (analysis.motionSmooth + audio.treble * 0.4);

        if (variant === "mono" || variant === "dither") g.fill(luma > 0.48 ? 12 : 28, 235);
        else g.fill(r, gg, b, 235);
        g.rect(x * cell + (cell - size) / 2 + jitter, y * cell + (cell - size) / 2, size, size);
      }
    }
  }

  drawWaveform(g, audio, interaction) {
    const wave = audio.waveform;
    if (!wave || wave.length < 2) return;
    g.push();
    g.noFill();
    g.stroke(255, 90 + audio.rms * 145);
    g.strokeWeight(1 + interaction.pressure * 1.3);
    g.beginShape();
    const center = g.height * (0.78 - interaction.y * 0.18);
    const amp = g.height * (0.035 + audio.rms * 0.15);
    for (let i = 0; i < wave.length; i += 1) {
      g.vertex((i / (wave.length - 1)) * g.width, center + wave[i] * amp);
    }
    g.endShape();
    g.pop();
  }

  drawScanlines(g, analysis, audio) {
    g.push();
    g.stroke(255, 8 + 20 * audio.treble + 18 * analysis.motionSmooth);
    g.strokeWeight(1);
    for (let y = 0; y < g.height; y += this.config.scanlineSpacing) g.line(0, y, g.width, y);
    g.pop();
  }

  snapshot() {
    const p = this.currentPreset();
    const fx = [
      p.photoFull && "PHOTO",
      p.photoDoubleBlend && "DOUBLE",
      p.photoRapidCrop && "CROP",
      p.photoShardSwap && "SHARD",
      p.photoBlendCycle && "BLEND",
      p.photoRgbTear && "RGB_TEAR",
      p.photoCrush && "CRUSH",
      p.photoHalation && "HALATION",
      p.photoFeedback && "PHOTO_FDBK",
      p.mosaic && `MOSAIC_${String(p.mosaic).toUpperCase()}`,
      p.posterize && "POST",
      p.waveform && "WAVE",
    ].filter(Boolean).join("+") || "BASE";

    return {
      modeName: p.name,
      modeIndex: this.modeIndex,
      particleCount: 0,
      activeFx: fx,
    };
  }
}

window.P5LabVisualEngine = P5LabVisualEngine;
