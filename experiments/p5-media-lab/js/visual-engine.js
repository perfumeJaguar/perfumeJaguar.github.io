/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.3.0
 *
 * The visual vocabulary is now intentionally media-centric: photographs and
 * moving images remain the source material. Particle synthesis, the old PICKUP
 * preset, video feedback and slice presets were removed.
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
  }

  setup(w, h) {
    this.rebuild(w, h);
    this.modeStartedMs = millis();
    this.announcePreset();
  }

  rebuild(w, h) {
    const mobile = P5LabUtils.isMobileLayout();
    const edge = mobile ? P5LAB_CONFIG.render.maxBufferLongEdgeMobile : P5LAB_CONFIG.render.maxBufferLongEdgeDesktop;
    const s = P5LabUtils.fitInside(w, h, edge);
    this.buffer = createGraphics(s.width, s.height);
    this.feedback = createGraphics(s.width, s.height);
    this.feedbackScratch = createGraphics(s.width, s.height);
    const cols = mobile ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    this.mosaicSample = createGraphics(cols, Math.max(2, Math.ceil(cols * s.height / s.width)));
    [this.buffer, this.feedback, this.feedbackScratch, this.mosaicSample].forEach((g) => g.pixelDensity(1));
    this.feedback.background(0);
    this.feedbackScratch.background(0);
    this.telemetry.event(`VISUAL BUFFER ${s.width}X${s.height}`);
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
    const p = this.currentPreset();
    const g = this.buffer;
    const pool = imagePool && imagePool.length ? imagePool : (currentImage ? [currentImage] : []);

    g.push();
    g.background(0);

    if (p.photoFull) this.drawPhotoFull(g, pool, interaction, audio);
    else if (p.photoDoubleBlend) this.drawPhotoDoubleBlend(g, pool, interaction, audio);
    else if (p.photoRapidCrop) this.drawPhotoRapidCrop(g, pool, interaction, audio);
    else if (p.photoMultiSwap) this.drawPhotoMultiSwap(g, pool, interaction, audio);
    else if (p.photoFeedback) this.drawPhotoFeedbackSource(g, pool, interaction, audio);
    else if (p.photoBlendCycle) this.drawPhotoBlendCycle(g, pool, interaction, audio);
    else {
      if (p.base) this.drawBase(g, source, analysis, audio, interaction);
      if (p.mosaic) this.drawMosaic(g, source, analysis, audio, interaction, p.mosaic);
      if (p.waveform) this.drawWaveform(g, audio, interaction);
      if (p.posterize) {
        try {
          const levels = Math.floor(P5LabUtils.map01(interaction.x, 3, 9));
          g.filter(POSTERIZE, levels);
        } catch (_) {}
      }
      this.drawScanlines(g, analysis, audio);
    }

    g.pop();

    if (p.feedback) this.applyPhotoFeedback(g, audio, interaction);
    else {
      this.feedback.clear();
      this.feedback.image(g, 0, 0);
    }

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null, p.feedback ? this.feedback : g, 255);
  }

  tick(intervalMs, interaction, multiplier = 1) {
    const press = interaction.pressure || 0;
    const accelerated = Math.max(24, intervalMs * (1 - press * 0.58) * multiplier);
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
    const tick = this.tick(100, interaction);
    const img = this.imageAt(pool, tick);
    if (!img) return;
    const zoom = 1 + interaction.pressure * 0.08 + audio.rms * 0.04;
    const ox = (interaction.x - 0.5) * g.width * 0.045;
    const oy = (interaction.y - 0.5) * g.height * 0.045;
    P5LabUtils.drawCover(g, img, 255, zoom, ox, oy);
  }

  drawPhotoDoubleBlend(g, pool, interaction, audio) {
    const tick = this.tick(125, interaction);
    const a = this.imageAt(pool, tick * 3 + 1);
    const b = this.imageAt(pool, tick * 7 + 5);
    if (!a) return;

    P5LabUtils.drawCover(g, a, 235, 1.02 + audio.bass * 0.04,
      (interaction.x - 0.5) * 20, (interaction.y - 0.5) * 14);

    if (b) {
      g.push();
      g.blendMode(this.blendModeAt(tick + Math.floor(interaction.x * 6)));
      const alpha = 80 + audio.rms * 105 + interaction.pressure * 55;
      P5LabUtils.drawCover(g, b, alpha, 1.08 + interaction.y * 0.28,
        (0.5 - interaction.x) * 48, (interaction.y - 0.5) * 34);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoRapidCrop(g, pool, interaction, audio) {
    const interval = interaction.pressure > 0.12 ? this.config.photoBurstMs : this.config.photoCutMs;
    const tick = this.tick(interval, interaction);
    const img = this.imageAt(pool, tick * 11 + 3);
    if (!img) return;

    const n1 = noise(tick * 1.731);
    const n2 = noise(tick * 3.117 + 20);
    const n3 = noise(tick * 5.331 + 40);
    const zoom = 1.08 + n3 * (1.35 + interaction.y * 1.15 + audio.treble * 0.35);
    const ox = (n1 - 0.5) * g.width * 0.88;
    const oy = (n2 - 0.5) * g.height * 0.88;
    P5LabUtils.drawCover(g, img, 255, zoom, ox, oy);

    // Touch adds a second exposure rather than spawning non-media graphics.
    if (interaction.pressure > 0.08) {
      const img2 = this.imageAt(pool, tick * 17 + 9);
      if (img2) {
        g.push();
        g.blendMode(tick % 2 ? DIFFERENCE : SCREEN);
        P5LabUtils.drawCover(g, img2, 70 + interaction.pressure * 100, 1.35 + audio.rms * 0.3, -ox * 0.22, oy * 0.18);
        g.blendMode(BLEND);
        g.pop();
      }
    }
  }

  drawPhotoMultiSwap(g, pool, interaction, audio) {
    if (!pool.length) return;
    const tick = this.tick(92, interaction);
    const gridTarget = Math.round(P5LabUtils.map01(interaction.y, this.config.photoGridBase, this.config.photoGridMax));
    const cols = interaction.pressure > 0.12 ? Math.min(3, gridTarget) : 2;
    const rows = Math.max(2, Math.ceil(gridTarget / cols));
    const cw = g.width / cols;
    const ch = g.height / rows;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cellSeed = tick * 31 + row * 13 + col * 71;
        const img = this.imageAt(pool, cellSeed);
        if (!img) continue;
        const phase = Math.floor((millis() + (row * cols + col) * 37) / (70 + ((row + col) % 3) * 31));
        this.drawRandomCropIntoRect(g, img, col * cw, row * ch, cw, ch, cellSeed + phase, audio.rms);
      }
    }

    if (interaction.pressure > 0.2) {
      g.push();
      g.blendMode(DIFFERENCE);
      const overlay = this.imageAt(pool, tick * 43 + 17);
      if (overlay) P5LabUtils.drawCover(g, overlay, 55 + audio.rms * 75, 1.1 + interaction.x * 0.3);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawRandomCropIntoRect(g, img, dx, dy, dw, dh, seed, audioRms) {
    if (!img || !img.width || !img.height) return;
    const n1 = noise(seed * 0.017, 4.1);
    const n2 = noise(seed * 0.031, 8.7);
    const n3 = noise(seed * 0.047, 14.2);
    const targetAspect = dw / dh;
    let sw = img.width * (0.42 + n3 * 0.5);
    let sh = sw / targetAspect;
    if (sh > img.height) { sh = img.height * (0.42 + n3 * 0.5); sw = sh * targetAspect; }
    const sx = (img.width - sw) * n1;
    const sy = (img.height - sh) * n2;
    g.tint(255, 225 + audioRms * 30);
    g.image(img, dx, dy, dw + 1, dh + 1, sx, sy, sw, sh);
    g.noTint();
  }

  drawPhotoFeedbackSource(g, pool, interaction, audio) {
    const tick = this.tick(interaction.pressure > 0.1 ? 45 : 85, interaction);
    const img = this.imageAt(pool, tick * 19 + 2);
    if (!img) return;
    const zoom = 1.02 + audio.bass * 0.12 + interaction.pressure * 0.09;
    const ox = (noise(tick * 0.73) - 0.5) * g.width * 0.18;
    const oy = (noise(tick * 1.31 + 4) - 0.5) * g.height * 0.18;
    P5LabUtils.drawCover(g, img, 235, zoom, ox, oy);

    if (tick % 3 === 0) {
      const second = this.imageAt(pool, tick * 29 + 11);
      if (second) {
        g.push();
        g.blendMode(this.blendModeAt(tick));
        P5LabUtils.drawCover(g, second, 65 + audio.treble * 90, 1.12 + interaction.x * 0.18);
        g.blendMode(BLEND);
        g.pop();
      }
    }
  }

  drawPhotoBlendCycle(g, pool, interaction, audio) {
    const tick = this.tick(115, interaction);
    const imgs = [
      this.imageAt(pool, tick * 5 + 1),
      this.imageAt(pool, tick * 11 + 3),
      this.imageAt(pool, tick * 17 + 7),
    ].filter(Boolean);
    if (!imgs.length) return;

    P5LabUtils.drawCover(g, imgs[0], 225, 1.03 + audio.rms * 0.04);
    for (let i = 1; i < imgs.length; i += 1) {
      g.push();
      g.blendMode(this.blendModeAt(tick + i + Math.floor(interaction.x * 5)));
      const alpha = 45 + i * 28 + audio.rms * 85 + interaction.pressure * 45;
      P5LabUtils.drawCover(g, imgs[i], alpha, 1.06 + i * 0.07 + interaction.y * 0.12,
        (interaction.x - 0.5) * g.width * 0.04 * i,
        (0.5 - interaction.y) * g.height * 0.03 * i);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawBase(g, source, analysis, audio, interaction) {
    const zoom = 1 + interaction.pressure * 0.05 + audio.bass * 0.025;
    const shift = 10 * analysis.motionSmooth + audio.treble * 4;
    P5LabUtils.drawCover(g, source, 255, zoom,
      (interaction.x - 0.5) * shift, (interaction.y - 0.5) * shift);
  }

  drawMosaic(g, source, analysis, audio, interaction, variant) {
    const cols = P5LabUtils.isMobileLayout() ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    const cell = g.width / cols;
    const rows = Math.ceil(g.height / cell);
    const s = this.mosaicSample;
    s.clear();
    P5LabUtils.drawCover(s, source, 255);
    s.loadPixels();

    g.background(variant === "mono" || variant === "dither" ? 238 : 0);
    g.noStroke();
    const pulse = 0.72 + audio.rms * 0.7 + 0.18 * Math.sin(millis() * 0.006 + audio.bass * 8);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const idx = 4 * (y * s.width + x);
        const r = s.pixels[idx] || 0;
        const gg = s.pixels[idx + 1] || 0;
        const b = s.pixels[idx + 2] || 0;
        const l = (r + gg + b) / (255 * 3);
        let scale;

        if (variant === "inverse") scale = 0.12 + (1 - l) * 1.05;
        else if (variant === "dither") {
          const threshold = ((x + y * 3) % 5) / 5;
          scale = l > threshold ? 0.94 : 0.12;
        } else if (variant === "pulse") scale = (0.14 + l * 0.92) * pulse;
        else scale = 0.14 + l * 1.02;

        scale += interaction.pressure * 0.16;
        scale = P5LabUtils.clamp(scale, 0.05, 1.35);
        const size = cell * scale;
        const jitter = (noise(x * 0.14, y * 0.14, frameCount * 0.008) - 0.5) * cell * (analysis.motionSmooth + audio.treble * 0.4);

        if (variant === "mono" || variant === "dither") g.fill(l > 0.48 ? 12 : 28, 235);
        else g.fill(r, gg, b, 235);
        g.rect(x * cell + (cell - size) / 2 + jitter, y * cell + (cell - size) / 2, size, size);
      }
    }
  }

  drawWaveform(g, audio, interaction) {
    const w = audio.waveform;
    if (!w || w.length < 2) return;
    g.push();
    g.noFill();
    g.stroke(255, 85 + audio.rms * 160);
    g.strokeWeight(1 + interaction.pressure * 1.5);
    g.beginShape();
    const yc = g.height * (0.76 - interaction.y * 0.14);
    const amp = g.height * (0.025 + audio.rms * 0.18);
    for (let i = 0; i < w.length; i += 1) g.vertex(i / (w.length - 1) * g.width, yc + w[i] * amp);
    g.endShape();
    g.pop();
  }

  drawScanlines(g, analysis, audio) {
    g.push();
    g.stroke(255, 7 + 28 * audio.treble + 12 * analysis.motionSmooth);
    for (let y = 0; y < g.height; y += this.config.scanlineSpacing) g.line(0, y, g.width, y);
    g.pop();
  }

  applyPhotoFeedback(current, audio, interaction) {
    const prev = this.feedback;
    const next = this.feedbackScratch;
    const tick = Math.floor(millis() / 160);
    const scale = this.config.feedbackScale - audio.bass * 0.006 - interaction.pressure * 0.004;
    const w = next.width * scale;
    const h = next.height * scale;
    const x = (next.width - w) * (0.5 + (interaction.x - 0.5) * 0.8);
    const y = (next.height - h) * (0.5 + (interaction.y - 0.5) * 0.8);

    next.push();
    next.clear();
    next.background(0, 10 + audio.rms * 25);
    next.tint(255, this.config.feedbackAlpha + audio.rms * 45);
    next.image(prev, x, y, w, h);
    next.noTint();
    next.blendMode(this.blendModeAt(tick + Math.floor(interaction.x * 6)));
    next.tint(255, 135 + audio.treble * 100 + interaction.pressure * 40);
    next.image(current, 0, 0);
    next.noTint();
    next.blendMode(BLEND);
    next.pop();

    this.feedback = next;
    this.feedbackScratch = prev;
  }

  snapshot() {
    const p = this.currentPreset();
    const fx = [
      p.photoFull && "PHOTO",
      p.photoDoubleBlend && "DOUBLE_BLEND",
      p.photoRapidCrop && "RAPID_CROP",
      p.photoMultiSwap && "MULTI_SWAP",
      p.photoFeedback && "PHOTO_FDBK",
      p.photoBlendCycle && "BLEND_CYCLE",
      p.mosaic && `MOSAIC_${String(p.mosaic).toUpperCase()}`,
      p.feedback && "FDBK",
      p.waveform && "WAVE",
      p.posterize && "POST",
    ].filter(Boolean).join("+") || "BASE";
    return { modeName: p.name, modeIndex: this.modeIndex, particleCount: 0, activeFx: fx };
  }
}

window.P5LabVisualEngine = P5LabVisualEngine;
