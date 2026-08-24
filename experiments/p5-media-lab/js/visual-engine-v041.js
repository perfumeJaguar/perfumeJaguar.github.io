/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.4.1
 *
 * Changes in this build:
 * - fixes the deterministic image selector that accidentally reduced a 10-image
 *   pool to two repeating indices;
 * - puts the photo-feedback study first and makes its crop/retention stronger;
 * - keeps the audio waveform visible in every preset;
 * - adds a cheap Canvas2D vignette as a common final image treatment.
 *
 * No particles and no framed/grid photo layouts.
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
    this.glowBuffer = createGraphics(Math.max(64, Math.round(size.width * 0.28)), Math.max(96, Math.round(size.height * 0.28)));

    [this.buffer, this.feedback, this.feedbackScratch, this.mosaicSample, this.glowBuffer]
      .forEach((g) => g.pixelDensity(1));
    this.feedback.background(0);
    this.feedbackScratch.background(0);
    this.telemetry.event(`VISUAL BUFFER ${size.width}X${size.height}`);
    this.telemetry.event(`FEEDBACK BUFFER ${fw}X${fh}`);
  }

  currentPreset() { return this.config.presets[this.modeIndex % this.config.presets.length]; }

  updateMode() {
    if (millis() - this.modeStartedMs > P5LAB_CONFIG.app.modeDurationSec * 1000) {
      this.modeIndex = (this.modeIndex + 1) % this.config.presets.length;
      this.modeStartedMs = millis();
      this.feedback.clear();
      this.feedbackScratch.clear();
      this.announcePreset();
    }
  }

  announcePreset() { this.telemetry.event(`MODE ${this.currentPreset().name}`); }

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
      if (preset.posterize) {
        try { g.filter(POSTERIZE, Math.floor(P5LabUtils.map01(interaction.x, 3, 9))); } catch (_) {}
      }
      this.drawScanlines(g, analysis, audio);
    }
    g.pop();

    if (preset.feedback) this.applyPhotoFeedback(g, audio, interaction);

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null, preset.feedback ? this.feedback : g, 255);

    // Common final treatments. Vignette remains behind the always-on waveform so
    // the audio trace stays legible even in very dark images.
    this.drawVignette(interaction, audio, preset);
    this.drawWaveformOverlay(audio, interaction);
  }

  tick(intervalMs, interaction) {
    const accelerated = Math.max(24, intervalMs * (1 - (interaction.pressure || 0) * 0.58));
    return Math.floor(millis() / accelerated);
  }

  /**
   * Integer hash instead of the old LCG expression.
   * The old multiplier ended in 5; modulo 10 therefore selected only two final
   * digits for sequential seeds. This avalanche hash distributes sequential
   * ticks across the complete pool and remains deterministic.
   */
  imageAt(pool, seed) {
    if (!pool.length) return null;
    let x = (Math.floor(seed) | 0) ^ 0x9e3779b9;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return pool[(x >>> 0) % pool.length];
  }

  blendModeAt(seed) {
    const modes = [SCREEN, MULTIPLY, DIFFERENCE, ADD, LIGHTEST, DARKEST];
    return modes[Math.abs(Math.floor(seed)) % modes.length];
  }

  drawPhotoFull(g, pool, interaction, audio) {
    const tick = this.tick(this.config.photoCutMs, interaction);
    const img = this.imageAt(pool, tick);
    if (!img) return;
    const zoom = 1 + interaction.pressure * 0.12 + audio.rms * 0.06;
    P5LabUtils.drawCover(g, img, 255, zoom,
      (interaction.x - 0.5) * g.width * 0.07,
      (interaction.y - 0.5) * g.height * 0.07);
  }

  drawPhotoDoubleBlend(g, pool, interaction, audio) {
    const tick = this.tick(105, interaction);
    const a = this.imageAt(pool, tick * 3 + 1);
    const b = this.imageAt(pool, tick * 7 + 5);
    if (!a) return;
    P5LabUtils.drawCover(g, a, 235, 1.03 + audio.bass * 0.06);
    if (!b) return;
    g.push();
    g.blendMode(this.blendModeAt(tick + Math.floor(interaction.x * 6)));
    P5LabUtils.drawCover(g, b, 90 + audio.rms * 120 + interaction.pressure * 55,
      1.10 + interaction.y * 0.35,
      (0.5 - interaction.x) * 58,
      (interaction.y - 0.5) * 48);
    g.blendMode(BLEND);
    g.pop();
  }

  drawPhotoRapidCrop(g, pool, interaction, audio) {
    const interval = interaction.pressure > 0.12 ? this.config.photoBurstMs : this.config.photoCutMs;
    const tick = this.tick(interval, interaction);
    const img = this.imageAt(pool, tick * 11 + 3);
    if (!img) return;

    const n1 = noise(tick * 1.731), n2 = noise(tick * 3.117 + 20), n3 = noise(tick * 5.331 + 40);
    const zoom = 1.25 + n3 * (2.3 + interaction.y * 1.7 + audio.treble * 0.7);
    const ox = (n1 - 0.5) * g.width * 1.25;
    const oy = (n2 - 0.5) * g.height * 1.25;
    P5LabUtils.drawCover(g, img, 255, zoom, ox, oy);

    if (interaction.pressure > 0.06) {
      const img2 = this.imageAt(pool, tick * 17 + 9);
      if (img2) {
        g.push();
        g.blendMode(tick % 2 ? DIFFERENCE : SCREEN);
        P5LabUtils.drawCover(g, img2, 80 + interaction.pressure * 120,
          1.6 + audio.rms * 0.55, -ox * 0.35, oy * 0.30);
        g.blendMode(BLEND);
        g.pop();
      }
    }
  }

  drawPhotoShardSwap(g, pool, interaction, audio) {
    const tick = this.tick(68, interaction);
    const base = this.imageAt(pool, tick * 5 + 1);
    if (!base) return;
    P5LabUtils.drawCover(g, base, 255, 1.06 + audio.rms * 0.08);

    const bands = 9 + Math.floor(interaction.y * 11) + Math.floor(audio.treble * 6);
    const bandH = g.height / bands;
    for (let i = 0; i < bands; i += 1) {
      if ((i + tick) % 3 === 0 && interaction.pressure < 0.15) continue;
      const img = this.imageAt(pool, tick * 31 + i * 13 + 7);
      if (!img) continue;
      const y = i * bandH;
      const offset = (noise(tick * 0.33, i * 0.61) - 0.5) * g.width * (0.18 + interaction.x * 0.45);
      g.push();
      const ctx = g.drawingContext;
      ctx.save(); ctx.beginPath(); ctx.rect(0, y, g.width, bandH + 1); ctx.clip();
      P5LabUtils.drawCover(g, img, 215, 1.18 + audio.bass * 0.22, offset, 0);
      ctx.restore();
      g.pop();
    }
  }

  drawPhotoBlendCycle(g, pool, interaction, audio) {
    const tick = this.tick(95, interaction);
    const imgs = [this.imageAt(pool, tick * 5 + 1), this.imageAt(pool, tick * 11 + 3), this.imageAt(pool, tick * 17 + 7)].filter(Boolean);
    if (!imgs.length) return;
    P5LabUtils.drawCover(g, imgs[0], 230, 1.05 + audio.rms * 0.06);
    for (let i = 1; i < imgs.length; i += 1) {
      g.push();
      g.blendMode(this.blendModeAt(tick + i + Math.floor(interaction.x * 6)));
      P5LabUtils.drawCover(g, imgs[i], 60 + i * 35 + audio.rms * 95 + interaction.pressure * 55,
        1.12 + i * 0.10 + interaction.y * 0.20,
        (interaction.x - 0.5) * g.width * 0.07 * i,
        (0.5 - interaction.y) * g.height * 0.06 * i);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoRgbTear(g, pool, interaction, audio) {
    const tick = this.tick(78, interaction);
    const img = this.imageAt(pool, tick * 7 + 3);
    if (!img) return;
    const amount = this.config.rgbTearMaxPx * (0.35 + interaction.pressure * 1.25 + audio.treble);
    P5LabUtils.drawCover(g, img, 145, 1.06);
    g.push(); g.blendMode(ADD);
    P5LabUtils.drawCover(g, img, 112, 1.06, -amount, 0, [255, 35, 35]);
    P5LabUtils.drawCover(g, img, 96, 1.04, amount * 0.28, amount * 0.14, [35, 255, 95]);
    P5LabUtils.drawCover(g, img, 112, 1.07, amount, -amount * 0.15, [45, 90, 255]);
    g.blendMode(BLEND); g.pop();

    if (interaction.pressure > 0.10 || audio.bass > 0.22) {
      const intruder = this.imageAt(pool, tick * 19 + 11);
      if (intruder) {
        g.push(); g.blendMode(DIFFERENCE);
        P5LabUtils.drawCover(g, intruder, 50 + interaction.pressure * 105 + audio.bass * 75, 1.3 + interaction.y * 0.45);
        g.blendMode(BLEND); g.pop();
      }
    }
  }

  drawPhotoCrush(g, pool, interaction, audio) {
    const tick = this.tick(105, interaction);
    const img = this.imageAt(pool, tick * 13 + 5);
    if (!img) return;
    P5LabUtils.drawCover(g, img, 255, 1.08 + interaction.pressure * 0.15);
    try { g.filter(POSTERIZE, Math.max(2, Math.min(7, 2 + Math.floor(interaction.x * 4 + audio.rms * 2)))); } catch (_) {}
    const other = this.imageAt(pool, tick * 29 + 9);
    if (other) {
      g.push(); g.blendMode(interaction.y > 0.5 ? DIFFERENCE : MULTIPLY);
      P5LabUtils.drawCover(g, other, 50 + interaction.pressure * 125 + audio.treble * 75,
        1.35 + audio.bass * 0.35,
        (interaction.x - 0.5) * g.width * 0.22,
        (interaction.y - 0.5) * g.height * 0.18);
      g.blendMode(BLEND); g.pop();
    }
  }

  drawPhotoHalation(g, pool, interaction, audio) {
    const tick = this.tick(160, interaction);
    const img = this.imageAt(pool, tick * 7 + 2);
    if (!img) return;
    P5LabUtils.drawCover(g, img, 235, 1.04 + interaction.pressure * 0.07);
    const glow = this.glowBuffer;
    glow.clear();
    P5LabUtils.drawCover(glow, img, 170 + audio.rms * 70, 1.06 + interaction.y * 0.07, 0, 0, [255, 115, 90]);
    try { glow.filter(BLUR, this.config.halationBlur + Math.floor(interaction.pressure * 4)); } catch (_) {}
    g.push(); g.blendMode(SCREEN); g.tint(255, 85 + audio.rms * 110 + interaction.pressure * 55);
    g.image(glow, -g.width * 0.035, -g.height * 0.025, g.width * 1.07, g.height * 1.05);
    g.noTint(); g.blendMode(BLEND); g.pop();
  }

  drawPhotoFeedbackSource(g, pool, interaction, audio) {
    const tick = this.tick(interaction.pressure > 0.1 ? 38 : 64, interaction);
    const img = this.imageAt(pool, tick * 19 + 2);
    if (!img) return;

    // Aggressive crop is now part of the feedback source itself. The archive is
    // cut rapidly before recursive accumulation, so the trail contains changing
    // fragments rather than repeated whole-frame images.
    const n1 = noise(tick * 0.77), n2 = noise(tick * 1.47 + 9), n3 = noise(tick * 2.19 + 17);
    const zoom = 1.45 + n3 * (2.8 + interaction.y * 1.5 + audio.treble * 0.6);
    const ox = (n1 - 0.5) * g.width * 1.2 + (interaction.x - 0.5) * g.width * 0.35;
    const oy = (n2 - 0.5) * g.height * 1.2 + (interaction.y - 0.5) * g.height * 0.25;
    P5LabUtils.drawCover(g, img, 235, zoom, ox, oy);

    if (tick % 2 === 0) {
      const second = this.imageAt(pool, tick * 37 + 13);
      if (second) {
        g.push(); g.blendMode(tick % 4 === 0 ? DIFFERENCE : SCREEN);
        P5LabUtils.drawCover(g, second, 45 + audio.rms * 80 + interaction.pressure * 65,
          1.4 + audio.bass * 0.45, -ox * 0.18, -oy * 0.14);
        g.blendMode(BLEND); g.pop();
      }
    }
  }

  applyPhotoFeedback(current, audio, interaction) {
    const prev = this.feedback;
    const next = this.feedbackScratch;
    const scale = this.config.feedbackScale - audio.rms * 0.002;
    const w = next.width * scale;
    const h = next.height * scale;
    const x = (next.width - w) * (0.5 + (interaction.x - 0.5) * 0.32);
    const y = (next.height - h) * (0.5 + (interaction.y - 0.5) * 0.32);

    next.push();
    next.clear();
    next.background(0, 4 + audio.bass * 8);
    next.tint(255, this.config.feedbackAlpha);
    next.image(prev, x, y, w, h);
    next.noTint();
    next.blendMode(interaction.pressure > 0.18 ? DIFFERENCE : SCREEN);
    next.tint(255, 115 + audio.rms * 75);
    next.image(current, 0, 0, next.width, next.height);
    next.noTint(); next.blendMode(BLEND); next.pop();

    this.feedback = next;
    this.feedbackScratch = prev;
  }

  drawBase(g, source, analysis, audio, interaction) {
    const zoom = 1 + interaction.pressure * 0.05 + audio.bass * 0.025;
    const shift = 10 * analysis.motionSmooth + audio.treble * 4;
    P5LabUtils.drawCover(g, source, 255, zoom, (interaction.x - 0.5) * shift, (interaction.y - 0.5) * shift);
  }

  drawMosaic(g, source, analysis, audio, interaction, variant) {
    const cols = P5LabUtils.isMobileLayout() ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    const cell = g.width / cols;
    const rows = Math.ceil(g.height / cell);
    const sample = this.mosaicSample;
    sample.clear(); P5LabUtils.drawCover(sample, source, 255); sample.loadPixels();

    g.background(variant === "mono" || variant === "dither" ? 238 : 0);
    g.noStroke();
    const pulse = 0.72 + audio.rms * 0.7 + 0.18 * Math.sin(millis() * 0.006 + audio.bass * 8);
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const idx = 4 * (y * sample.width + x);
        const r = sample.pixels[idx] || 0, gg = sample.pixels[idx + 1] || 0, b = sample.pixels[idx + 2] || 0;
        const luma = (r + gg + b) / (255 * 3);
        let scale;
        if (variant === "inverse") scale = 0.12 + (1 - luma) * 1.05;
        else if (variant === "dither") scale = luma > (((x + y * 3) % 5) / 5) ? 0.94 : 0.12;
        else if (variant === "pulse") scale = (0.14 + luma * 0.92) * pulse;
        else scale = 0.14 + luma * 1.02;
        scale = P5LabUtils.clamp(scale + interaction.pressure * 0.16, 0.05, 1.35);
        const size = cell * scale;
        const jitter = (noise(x * 0.14, y * 0.14, frameCount * 0.008) - 0.5) * cell * (analysis.motionSmooth + audio.treble * 0.4);
        if (variant === "mono" || variant === "dither") g.fill(luma > 0.48 ? 12 : 28, 235);
        else g.fill(r, gg, b, 235);
        g.rect(x * cell + (cell - size) / 2 + jitter, y * cell + (cell - size) / 2, size, size);
      }
    }
  }

  drawScanlines(g, analysis, audio) {
    g.push(); g.stroke(255, 8 + 20 * audio.treble + 18 * analysis.motionSmooth); g.strokeWeight(1);
    for (let y = 0; y < g.height; y += this.config.scanlineSpacing) g.line(0, y, g.width, y);
    g.pop();
  }

  drawVignette(interaction, audio, preset) {
    const ctx = drawingContext;
    const cx = width * (0.5 + (interaction.x - 0.5) * 0.10);
    const cy = height * (0.48 + (interaction.y - 0.5) * 0.07);
    const inner = Math.min(width, height) * (0.16 + audio.rms * 0.04);
    const outer = Math.max(width, height) * 0.70;
    const strength = P5LabUtils.clamp(
      this.config.vignetteStrength + interaction.pressure * 0.10 + (preset.feedback ? 0.06 : 0),
      0, 0.72,
    );
    const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.62, `rgba(0,0,0,${strength * 0.18})`);
    grad.addColorStop(1, `rgba(0,0,0,${strength})`);
    ctx.save(); ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height); ctx.restore();
  }

  drawWaveformOverlay(audio, interaction) {
    const wave = audio.waveform;
    if (!wave || wave.length < 2) return;
    push();
    noFill();
    stroke(255, 75 + audio.rms * 150);
    strokeWeight(0.8 + interaction.pressure * 1.2);
    beginShape();
    const center = height * (0.80 - interaction.y * 0.15);
    const amp = height * (0.022 + audio.rms * 0.12);
    for (let i = 0; i < wave.length; i += 1) vertex((i / (wave.length - 1)) * width, center + wave[i] * amp);
    endShape();
    pop();
  }

  snapshot() {
    const p = this.currentPreset();
    const fx = [
      p.photoFull && "PHOTO", p.photoDoubleBlend && "DOUBLE", p.photoRapidCrop && "CROP",
      p.photoShardSwap && "SHARD", p.photoBlendCycle && "BLEND", p.photoRgbTear && "RGB_TEAR",
      p.photoCrush && "CRUSH", p.photoHalation && "HALATION", p.photoFeedback && "PHOTO_FDBK+CROP",
      p.mosaic && `MOSAIC_${String(p.mosaic).toUpperCase()}`, "WAVE", "VIGNETTE",
    ].filter(Boolean).join("+") || "BASE";
    return { modeName: p.name, modeIndex: this.modeIndex, particleCount: 0, activeFx: fx };
  }
}

window.P5LabVisualEngine = P5LabVisualEngine;
