/**
 * DODREI — VISUAL ENGINE v0.10.2
 * =============================================================================
 * Experimental base-visual-clock layer on top of v0.10.0.
 *
 * The previous composition limiter was technically working, but most visible
 * photo state was already driven by photoCutMs (~90 ms), so 15/24/30/60 looked
 * nearly identical. This layer separates two clocks:
 *
 * - cut clock: keeps image selection/cut timing near the existing photoCutMs;
 * - base visual clock: drives crop/layout/blend/luma state at compositionFps.
 *
 * The sampled base frame is held between updates. Recursive feedback, touch
 * rupture, swipe feedback, vignette and waveform still run every available
 * outer render frame.
 */
class DodreiVisualEngineV102 extends DodreiVisualEngineV100 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this._baseRefreshLastMs = 0;
    this._baseActualFps = 0;
  }

  rebuild(w, h) {
    super.rebuild(w, h);
    this._baseRefreshLastMs = 0;
    this._baseActualFps = 0;
  }

  _baseClockState(interaction) {
    const timing = this._timingConfig();
    const fps = Math.max(1, Number(timing.compositionFps) || 30);
    const intervalMs = 1000 / fps;
    const now = millis();
    const frameIndex = Math.floor(now / intervalMs);
    const sampleMs = frameIndex * intervalMs;

    const press = interaction.pressure || 0;
    const slowdown = Math.max(0, Number(this.config.touchTransitionSlowdown) || 0);
    const cutIntervalMs = Math.max(
      30,
      (Number(this.config.photoCutMs) || 90) * (1 + press * slowdown)
    );
    const cutTick = Math.floor(sampleMs / cutIntervalMs);

    return { fps, intervalMs, frameIndex, sampleMs, cutTick };
  }

  _visualSeed(state, salt = 0) {
    return state.frameIndex * 4099 + state.cutTick * 131 + salt;
  }

  setBaseVisualFps(value) {
    const fps = Math.max(1, Number(value) || 30);
    const timing = this._timingConfig();
    timing.compositionFps = fps;
    this._compositionLastMs = -Infinity;
    this._baseRefreshLastMs = 0;
    this._baseActualFps = 0;
    if (this.telemetry && typeof this.telemetry.event === "function") {
      this.telemetry.event(`BASE VISUAL FPS ${fps}`);
    }
    return fps;
  }

  _recordBaseRefresh(now) {
    if (this._baseRefreshLastMs > 0) {
      const elapsed = Math.max(1, now - this._baseRefreshLastMs);
      const instant = 1000 / elapsed;
      this._baseActualFps = this._baseActualFps > 0
        ? this._baseActualFps * 0.82 + instant * 0.18
        : instant;
    }
    this._baseRefreshLastMs = now;
  }

  drawPhotoFullBase(g, pool, i, a, state) {
    const img = this.imageAt(pool, state.cutTick);
    this.drawSource(g, img, 255, this._visualSeed(state, 41), i, a, 1);
  }

  drawPhotoDoubleBlendBase(g, pool, i, a, state) {
    const x = this.imageAt(pool, state.cutTick * 3 + 1);
    const y = this.imageAt(pool, state.cutTick * 7 + 5);
    if (!x) return;

    this.drawSource(g, x, 235, this._visualSeed(state, 101), i, a, 1);
    if (y) {
      g.push();
      g.blendMode(this.blendModeAt(state.frameIndex + Math.floor(i.x * 7)));
      this.drawSource(
        g,
        y,
        70 + a.rms * 115 + i.pressure * 100,
        this._visualSeed(state, 103),
        i,
        a,
        1.08
      );
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoRapidCropBase(g, pool, i, a, state) {
    const x = this.imageAt(pool, state.cutTick * 11 + 3);
    const y = this.imageAt(pool, state.cutTick * 17 + 9);
    this.drawSource(g, x, 255, this._visualSeed(state, 107), i, a, 1.38);

    if (y) {
      g.push();
      g.blendMode(state.frameIndex % 2 ? DIFFERENCE : SCREEN);
      this.drawSource(
        g,
        y,
        42 + i.pressure * 145 + a.rms * 65,
        this._visualSeed(state, 109),
        i,
        a,
        1.48
      );
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoRgbTearBase(g, pool, i, a, state) {
    const img = this.imageAt(pool, state.cutTick * 7 + 3);
    if (!img) return;

    const c = this.adaptiveCropFor(g, img, this._visualSeed(state, 139), i, a, 1.08);
    const d = this.config.rgbTearMaxPx * (0.3 + i.pressure * 1.9 + a.treble);
    P5LabUtils.drawCover(g, img, 145, c.zoom, c.ox, c.oy);

    g.push();
    g.blendMode(ADD);
    P5LabUtils.drawCover(g, img, 115, c.zoom, c.ox - d, c.oy, [255, 35, 35]);
    P5LabUtils.drawCover(g, img, 95, c.zoom, c.ox + d * 0.25, c.oy + d * 0.12, [35, 255, 95]);
    P5LabUtils.drawCover(g, img, 115, c.zoom, c.ox + d, c.oy - d * 0.14, [45, 90, 255]);
    g.blendMode(BLEND);
    g.pop();
  }

  drawPhotoShardSwapBase(g, pool, i, a, state) {
    const base = this.imageAt(pool, state.cutTick * 5 + 1);
    if (!base) return;

    this.drawSource(g, base, 255, this._visualSeed(state, 113), i, a, 1);
    const bands = 9 + Math.floor(i.y * 10) + Math.floor(a.treble * 5);
    const bh = g.height / bands;

    for (let n = 0; n < bands; n++) {
      if ((n + state.frameIndex) % 3 === 0 && i.pressure < 0.1) continue;
      const img = this.imageAt(pool, state.cutTick * 31 + n * 13 + 7);
      if (!img) continue;

      g.push();
      const ctx = g.drawingContext;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, n * bh, g.width, bh + 1);
      ctx.clip();
      this.drawSource(g, img, 210, this._visualSeed(state, 127 + n * 17), i, a, 1.22);
      ctx.restore();
      g.pop();
    }
  }

  drawPhotoBlendCycleBase(g, pool, i, a, state) {
    const imgs = [
      this.imageAt(pool, state.cutTick * 5 + 1),
      this.imageAt(pool, state.cutTick * 11 + 3),
      this.imageAt(pool, state.cutTick * 17 + 7),
    ].filter(Boolean);
    if (!imgs.length) return;

    this.drawSource(g, imgs[0], 225, this._visualSeed(state, 131), i, a, 1);
    for (let n = 1; n < imgs.length; n++) {
      g.push();
      g.blendMode(this.blendModeAt(state.frameIndex + n + Math.floor(i.x * 7)));
      this.drawSource(
        g,
        imgs[n],
        48 + n * 34 + a.rms * 90 + i.pressure * 100,
        this._visualSeed(state, 137 + n * 19),
        i,
        a,
        1.12 + n * 0.08
      );
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoFeedbackSourceBase(g, pool, i, a, state) {
    const first = this.imageAt(pool, state.cutTick * 19 + 2);
    this.drawSource(g, first, 235, this._visualSeed(state, 167), i, a, 1.35);

    const second = this.imageAt(pool, state.cutTick * 37 + 13);
    if (second && state.cutTick % 2 === 0) {
      g.push();
      g.blendMode(state.frameIndex % 4 === 0 ? DIFFERENCE : SCREEN);
      this.drawSource(
        g,
        second,
        38 + a.rms * 70 + i.pressure * 110,
        this._visualSeed(state, 173),
        i,
        a,
        1.28
      );
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawMosaicBase(g, pool, analysis, audio, i, variant, state) {
    const img = this.imageAt(pool, state.cutTick * 11 + 5);
    if (!img) return;

    const cols = P5LabUtils.isMobileLayout()
      ? this.config.mosaicColsMobile
      : this.config.mosaicColsDesktop;
    const cell = g.width / cols;
    const rows = Math.ceil(g.height / cell);
    const s = this.mosaicSample;

    s.clear();
    this.drawSource(s, img, 255, this._visualSeed(state, 179), i, audio, 1.18);
    s.loadPixels();
    g.background(variant === "mono" || variant === "dither" ? 238 : 0);
    g.noStroke();

    const pulse = 0.72 + audio.rms * 0.72 +
      0.18 * Math.sin(state.sampleMs * 0.006 + audio.bass * 8);
    const noiseTime = state.sampleMs * 0.00048;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = 4 * (y * s.width + x);
        const r = s.pixels[idx] || 0;
        const gg = s.pixels[idx + 1] || 0;
        const b = s.pixels[idx + 2] || 0;
        const l = (r + gg + b) / (255 * 3);
        let sc;

        if (variant === "inverse") sc = 0.12 + (1 - l) * 1.05;
        else if (variant === "dither") sc = l > ((x + y * 3) % 5) / 5 ? 0.94 : 0.12;
        else if (variant === "pulse") sc = (0.14 + l * 0.92) * pulse;
        else sc = 0.14 + l * 1.02;

        sc = P5LabUtils.clamp(sc + i.pressure * 0.18, 0.05, 1.35);
        const z = cell * sc;
        const j = (noise(x * 0.14, y * 0.14, noiseTime) - 0.5) *
          cell * (analysis.motionSmooth + audio.treble * 0.4);

        if (variant === "mono" || variant === "dither") g.fill(l > 0.48 ? 12 : 28, 235);
        else g.fill(r, gg, b, 235);
        g.rect(x * cell + (cell - z) / 2 + j, y * cell + (cell - z) / 2, z, z);
      }
    }
  }

  render(_source, currentImage, imagePool, analysis, audio, interaction) {
    if (this.config.enabled === false) {
      background(P5LAB_CONFIG.render.background);
      return;
    }

    this.updateMode();
    const p = this.currentPreset();
    const g = this.buffer;
    const pool = imagePool && imagePool.length ? imagePool : (currentImage ? [currentImage] : []);
    const state = this._baseClockState(interaction);

    if (this.pipelineEnabled("preset-composition") && this._shouldRefreshComposition(p)) {
      this._recordBaseRefresh(millis());
      g.push();
      g.background(0);

      if (p.photoFeedback) this.drawPhotoFeedbackSourceBase(g, pool, interaction, audio, state);
      else if (p.photoRapidCrop) this.drawPhotoRapidCropBase(g, pool, interaction, audio, state);
      else if (p.photoRgbTear) this.drawPhotoRgbTearBase(g, pool, interaction, audio, state);
      else if (p.photoHalation) this.drawPhotoHalation(g, pool, interaction, audio, state.cutTick);
      else if (p.photoShardSwap) this.drawPhotoShardSwapBase(g, pool, interaction, audio, state);
      else if (p.photoDoubleBlend) this.drawPhotoDoubleBlendBase(g, pool, interaction, audio, state);
      else if (p.photoBlendCycle) this.drawPhotoBlendCycleBase(g, pool, interaction, audio, state);
      else if (p.photoFull) this.drawPhotoFullBase(g, pool, interaction, audio, state);
      else if (p.mosaic) this.drawMosaicBase(g, pool, analysis, audio, interaction, p.mosaic, state);

      g.pop();
    }

    // Post-FX stay on the outer render clock. Their random/glitch texture remains
    // intentionally tied to real rendered frames, while recursive timing remains
    // deltaTime-normalized by v0.10.0.
    const fxTick = this.tick(this.config.photoCutMs, interaction);
    let stage = g;
    if (this.pipelineEnabled("common-crush")) {
      stage = this.applyCommonCrush(stage, pool, interaction, audio, fxTick);
    }

    if (this.pipelineEnabled("touch-rupture") && (interaction.pressure || 0) > 0.035) {
      stage = this.applyTouchRupture(stage, interaction, audio, fxTick);
    }

    if (this.pipelineEnabled("preset-feedback") && p.feedback) {
      this.applyPhotoFeedback(stage, audio, interaction);
      stage = this.feedback;
    }

    const swipe = interaction.swipeSpeed || 0;
    const threshold = Number(this.config.swipeFeedbackThreshold) || 0;
    if (this.pipelineEnabled("swipe-feedback") && interaction.pressed && swipe > threshold) {
      this.applySwipeFeedback(stage, interaction, audio);
      stage = this.swipeFeedback;
    } else {
      this.swipeFeedback.clear();
      this.swipeScratch.clear();
    }

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null, stage, 255);
    if (this.pipelineEnabled("vignette")) this.drawVignette(interaction, audio, p);
    if (this.pipelineEnabled("waveform")) this.drawWaveformOverlay(audio, interaction);
  }

  snapshot() {
    const s = super.snapshot();
    const timing = this._timingConfig();
    s.engineVersion = "0.10.2";
    s.baseFpsTarget = Number(timing.compositionFps) || 30;
    s.baseFpsActual = this._baseActualFps || 0;
    s.baseClock = "VISUAL_STATE";
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV102;
window.P5LAB_VISUAL_ENGINE_VERSION = "0.10.2";