/**
 * DODREI — VISUAL ENGINE v1.0.3
 * =============================================================================
 * Scene-randomness revision on top of v1.0.0.
 *
 * - image slots choose independently with replacement;
 * - repeats remain fully legal, but different layers no longer share correlated
 *   arithmetic seed sequences for image choice;
 * - a selected image is held for the current cut tick while crop/layout keeps
 *   refreshing on the faster visual-state clock;
 * - crop zoom is sampled inside the configured min/max range without multiplying
 *   past max and piling up on the clamp boundary.
 */
class DodreiVisualEngineV1003 extends DodreiVisualEngineV1000 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this._sceneImageSlots = new Map();
  }

  rebuild(w, h) {
    super.rebuild(w, h);
    this._sceneImageSlots.clear();
  }

  _sceneSlotImage(pool, slotKey, cutTick) {
    if (!Array.isArray(pool) || !pool.length) return null;

    const key = String(slotKey || "scene");
    const tick = Number.isFinite(Number(cutTick)) ? Math.floor(Number(cutTick)) : 0;
    const held = this._sceneImageSlots.get(key);

    // Hold the selected image through the whole cut. If the rolling resident pool
    // evicts it mid-cut, simply draw a new legal choice for the remainder.
    if (held && held.cutTick === tick && pool.includes(held.image)) return held.image;

    // Intentionally WITH replacement: immediate repeats and long non-repeating runs
    // are both valid outcomes. The important change is independence between slots.
    const index = Math.floor(Math.random() * pool.length);
    const image = pool[index] || pool[0] || null;
    this._sceneImageSlots.set(key, { cutTick: tick, image });
    return image;
  }

  adaptiveCropFor(g, img, seed, interaction, audio, intensity = 1) {
    const minZoom = Math.max(1, Number(this.config.sourceCropMinZoom) || 1);
    const maxZoom = Math.max(minZoom, Number(this.config.sourceCropMaxZoom) || minZoom);

    // Keep each mode's old crop "intensity" as a distribution bias rather than a
    // multiplier. This preserves tighter/looser mode character without producing
    // repeated maxZoom values through clamp saturation.
    const cropIntensity = Math.max(0.35, Number(intensity) || 1);
    const rms = P5LabUtils.clamp(Number(audio?.rms) || 0, 0, 1);
    const exponent = P5LabUtils.clamp(1.45 / (cropIntensity * (1 + rms * 0.08)), 0.55, 2.2);
    const u = this.rand01(seed * 17 + 3);
    const zoom = minZoom + Math.pow(u, exponent) * (maxZoom - minZoom);

    const size = P5LabUtils.sourceSize(img);
    if (!size.width || !size.height || !g || !g.width || !g.height) return { zoom, ox: 0, oy: 0 };

    const coverScale = Math.max(g.width / size.width, g.height / size.height);
    const dw = size.width * coverScale * zoom;
    const dh = size.height * coverScale * zoom;
    const overflowX = Math.max(0, dw - g.width);
    const overflowY = Math.max(0, dh - g.height);
    const panFraction = P5LabUtils.clamp(Number(this.config.sourceCropOverflowPan) || 1, 0, 1);

    const rx = (this.rand01(seed * 43 + 17) - 0.5) * overflowX * panFraction;
    const ry = (this.rand01(seed * 47 + 29) - 0.5) * overflowY * panFraction;

    const press = interaction?.pressure || 0;
    const touchX = ((interaction?.x ?? 0.5) - 0.5) * overflowX * press * 0.28;
    const touchY = ((interaction?.y ?? 0.5) - 0.5) * overflowY * press * 0.28;
    const maxX = overflowX * 0.5;
    const maxY = overflowY * 0.5;

    return {
      zoom,
      ox: P5LabUtils.clamp(rx + touchX, -maxX, maxX),
      oy: P5LabUtils.clamp(ry + touchY, -maxY, maxY),
    };
  }

  drawPhotoFullBase(g, pool, i, a, state) {
    const img = this._sceneSlotImage(pool, "photo-full:primary", state.cutTick);
    this.drawSource(g, img, 255, this._visualSeed(state, 41), i, a, 1);
  }

  drawPhotoDoubleBlendBase(g, pool, i, a, state) {
    const x = this._sceneSlotImage(pool, "photo-double-blend:primary", state.cutTick);
    const y = this._sceneSlotImage(pool, "photo-double-blend:secondary", state.cutTick);
    if (!x) return;

    this.drawSource(g, x, 235, this._visualSeed(state, 101), i, a, 1);
    if (y) {
      g.push();
      g.blendMode(this.blendModeAt(state.frameIndex + Math.floor(i.x * 7)));
      this.drawSource(g, y, 70 + a.rms * 115 + i.pressure * 100, this._visualSeed(state, 103), i, a, 1.08);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoRapidCropBase(g, pool, i, a, state) {
    const x = this._sceneSlotImage(pool, "photo-rapid-crop:primary", state.cutTick);
    const y = this._sceneSlotImage(pool, "photo-rapid-crop:secondary", state.cutTick);
    this.drawSource(g, x, 255, this._visualSeed(state, 107), i, a, 1.38);

    if (y) {
      g.push();
      g.blendMode(state.frameIndex % 2 ? DIFFERENCE : SCREEN);
      this.drawSource(g, y, 42 + i.pressure * 145 + a.rms * 65, this._visualSeed(state, 109), i, a, 1.48);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoRgbTearBase(g, pool, i, a, state) {
    const img = this._sceneSlotImage(pool, "photo-rgb-tear:primary", state.cutTick);
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
    const base = this._sceneSlotImage(pool, "photo-shard-swap:base", state.cutTick);
    if (!base) return;

    this.drawSource(g, base, 255, this._visualSeed(state, 113), i, a, 1);
    const bands = 9 + Math.floor(i.y * 10) + Math.floor(a.treble * 5);
    const bh = g.height / bands;

    for (let n = 0; n < bands; n++) {
      if ((n + state.frameIndex) % 3 === 0 && i.pressure < 0.1) continue;
      const img = this._sceneSlotImage(pool, `photo-shard-swap:band:${n}`, state.cutTick);
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
      this._sceneSlotImage(pool, "photo-blend-cycle:0", state.cutTick),
      this._sceneSlotImage(pool, "photo-blend-cycle:1", state.cutTick),
      this._sceneSlotImage(pool, "photo-blend-cycle:2", state.cutTick),
    ].filter(Boolean);
    if (!imgs.length) return;

    this.drawSource(g, imgs[0], 225, this._visualSeed(state, 131), i, a, 1);
    for (let n = 1; n < imgs.length; n++) {
      g.push();
      g.blendMode(this.blendModeAt(state.frameIndex + n + Math.floor(i.x * 7)));
      this.drawSource(g, imgs[n], 48 + n * 34 + a.rms * 90 + i.pressure * 100, this._visualSeed(state, 137 + n * 19), i, a, 1.12 + n * 0.08);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  drawPhotoFeedbackSourceBase(g, pool, i, a, state) {
    const first = this._sceneSlotImage(pool, "photo-feedback-crop:primary", state.cutTick);
    this.drawSource(g, first, 235, this._visualSeed(state, 167), i, a, 1.35);

    const second = this._sceneSlotImage(pool, "photo-feedback-crop:secondary", state.cutTick);
    if (second && state.cutTick % 2 === 0) {
      g.push();
      g.blendMode(state.frameIndex % 4 === 0 ? DIFFERENCE : SCREEN);
      this.drawSource(g, second, 38 + a.rms * 70 + i.pressure * 110, this._visualSeed(state, 173), i, a, 1.28);
      g.blendMode(BLEND);
      g.pop();
    }
  }

  snapshot() {
    const s = super.snapshot();
    s.engineVersion = "1.0.3";
    s.sceneImageSelection = "INDEPENDENT_WITH_REPLACEMENT";
    s.sourceCropMinZoom = Math.max(1, Number(this.config.sourceCropMinZoom) || 1);
    s.sourceCropMaxZoom = Math.max(s.sourceCropMinZoom, Number(this.config.sourceCropMaxZoom) || s.sourceCropMinZoom);
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV1003;
window.P5LAB_VISUAL_ENGINE_VERSION = "1.0.3";
