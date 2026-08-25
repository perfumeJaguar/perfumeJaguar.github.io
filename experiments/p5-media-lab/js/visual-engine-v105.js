/**
 * DODREI — VISUAL ENGINE v0.10.5
 * PRE / POST COMMON FX layer on top of v0.10.4.
 *
 * COMPOSITION: MODE + PRE COMMON FX (pre hook currently empty)
 * POST COMMON FX: CRUSH -> HIGH CONTRAST -> BINARY B/W -> DARKEN -> STRONG VIGNETTE
 * INTERACTION / FINAL: touch rupture -> preset feedback -> swipe feedback -> vignette -> waveform
 */
class DodreiVisualEngineV105 extends DodreiVisualEngineV104 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this.postCommonBuffer = null;
    this.postCommonScratch = null;
    this._postCommonDirty = true;
  }

  rebuild(w, h) {
    super.rebuild(w, h);
    this.postCommonBuffer = createGraphics(this.buffer.width, this.buffer.height);
    this.postCommonScratch = createGraphics(this.buffer.width, this.buffer.height);
    this.postCommonBuffer.pixelDensity(1);
    this.postCommonScratch.pixelDensity(1);
    this._postCommonDirty = true;
  }

  _speedPreset() {
    const t = this._timingConfig();
    const level = String(t.visualSpeedLevel || t.cutSpeedLevel || "S1").toUpperCase();
    const defaults = { S1: 0.25, S2: 0.50, S3: 0.70, S4: 1.00, S5: 1.50 };
    const multiplier = Math.max(0.05, Number(t.visualSpeedMultiplier) || defaults[level] || defaults.S1);
    return { level, multiplier };
  }

  postCommonFxConfig() {
    if (!this.config.postCommonFx || typeof this.config.postCommonFx !== "object") this.config.postCommonFx = {};
    return this.config.postCommonFx;
  }

  hasPostCommonFx() {
    const f = this.postCommonFxConfig();
    return !!(f.bw || f.crush || f.highContrast || f.darken || f.strongVignette);
  }

  setPostCommonFx(key, enabled) {
    const allowed = new Set(["bw", "crush", "highContrast", "darken", "strongVignette"]);
    if (!allowed.has(key)) return false;
    const f = this.postCommonFxConfig();
    f[key] = !!enabled;
    this._postCommonDirty = true;
    if (this.telemetry?.event) {
      const label = { bw: "BW", crush: "CRUSH", highContrast: "HIGH CONTRAST", darken: "DARKEN", strongVignette: "STRONG VIGNETTE" }[key];
      this.telemetry.event(`POST FX ${label} ${f[key] ? "ON" : "OFF"}`);
    }
    return f[key];
  }

  applyPreCommonFx(stage) {
    return stage;
  }

  _copyPost(src) {
    const out = this.postCommonBuffer;
    out.clear();
    out.image(src, 0, 0, out.width, out.height);
    return out;
  }

  _highContrast(out, amount, saturation) {
    const s = this.postCommonScratch;
    s.clear();
    s.push();
    const ctx = s.drawingContext;
    ctx.save();
    ctx.filter = `contrast(${amount}) saturate(${saturation})`;
    s.image(out, 0, 0, s.width, s.height);
    ctx.restore();
    s.pop();
    out.clear();
    out.image(s, 0, 0, out.width, out.height);
  }

  _binaryBw(out, threshold) {
    try {
      out.filter(THRESHOLD, threshold);
      return;
    } catch (_) {}
    const s = this.postCommonScratch;
    s.clear();
    s.push();
    const ctx = s.drawingContext;
    ctx.save();
    ctx.filter = "grayscale(1) contrast(20)";
    s.image(out, 0, 0, s.width, s.height);
    ctx.restore();
    s.pop();
    out.clear();
    out.image(s, 0, 0, out.width, out.height);
  }

  _darken(out, alpha) {
    out.push();
    out.noStroke();
    out.fill(0, P5LabUtils.clamp(alpha, 0, 1) * 255);
    out.rect(0, 0, out.width, out.height);
    out.pop();
  }

  _strongVignette(out, strength, inner, outer) {
    const ctx = out.drawingContext, w = out.width, h = out.height;
    const edge = P5LabUtils.clamp(strength, 0, 1);
    const innerR = Math.max(1, h * P5LabUtils.clamp(inner, 0.02, 0.7));
    const outerR = Math.max(innerR + 1, h * P5LabUtils.clamp(outer, 0.3, 1.3));
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(Math.max(0.05, w / Math.max(1, h)), 1);
    const g = ctx.createRadialGradient(0, 0, innerR, 0, 0, outerR);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.45, `rgba(0,0,0,${(edge * 0.12).toFixed(3)})`);
    g.addColorStop(0.72, `rgba(0,0,0,${(edge * 0.48).toFixed(3)})`);
    g.addColorStop(1, `rgba(0,0,0,${edge.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(-h * 2, -h * 2, h * 4, h * 4);
    ctx.restore();
  }

  applyPostCommonFx(src, pool, interaction, audio, state) {
    const f = this.postCommonFxConfig();
    let stage = src;
    if (f.crush) stage = this.applyCommonCrush(stage, pool, interaction, audio, state.frameIndex);
    const out = this._copyPost(stage);
    if (f.highContrast) this._highContrast(out, Math.max(1, Number(f.highContrastAmount) || 3.2), Math.max(0, Number(f.highContrastSaturation) || 1.08));
    if (f.bw) this._binaryBw(out, P5LabUtils.clamp(Number(f.bwThreshold) || 0.5, 0, 1));
    if (f.darken) this._darken(out, Number(f.darkenAlpha) || 0.46);
    if (f.strongVignette) this._strongVignette(out, Number(f.strongVignetteStrength) || 0.96, Number(f.strongVignetteInner) || 0.16, Number(f.strongVignetteOuter) || 0.72);
    this._postCommonDirty = false;
    return out;
  }

  render(_source, currentImage, imagePool, analysis, audio, interaction) {
    if (this.config.enabled === false) {
      background(P5LAB_CONFIG.render.background);
      return;
    }

    this.updateMode();
    const p = this.currentPreset(), g = this.buffer;
    const pool = imagePool && imagePool.length ? imagePool : (currentImage ? [currentImage] : []);
    const state = this._baseClockState(interaction);
    const refresh = this.pipelineEnabled("preset-composition") && this._shouldRefreshComposition(p);

    if (refresh) {
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
      this.applyPreCommonFx(g, pool, analysis, audio, interaction, state);
      this._postCommonDirty = true;
    }

    let stage = g;
    if (this.hasPostCommonFx()) stage = this._postCommonDirty ? this.applyPostCommonFx(g, pool, interaction, audio, state) : this.postCommonBuffer;

    const fxTick = this.tick(this.config.photoCutMs, interaction);
    if (this.pipelineEnabled("touch-rupture") && (interaction.pressure || 0) > 0.035) stage = this.applyTouchRupture(stage, interaction, audio, fxTick);
    if (this.pipelineEnabled("preset-feedback") && p.feedback) {
      this.applyPhotoFeedback(stage, audio, interaction);
      stage = this.feedback;
    }

    const swipe = interaction.swipeSpeed || 0, threshold = Number(this.config.swipeFeedbackThreshold) || 0;
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
    const s = super.snapshot(), f = this.postCommonFxConfig();
    s.engineVersion = "0.10.5";
    s.postCommonFx = { bw: !!f.bw, crush: !!f.crush, highContrast: !!f.highContrast, darken: !!f.darken, strongVignette: !!f.strongVignette };
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV105;
window.P5LAB_VISUAL_ENGINE_VERSION = "0.10.5";
