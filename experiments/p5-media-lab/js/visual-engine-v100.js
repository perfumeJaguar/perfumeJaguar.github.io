/**
 * DODREI — VISUAL ENGINE v0.10.0
 * =============================================================================
 * Temporal-cadence layer on top of v0.9.0.
 *
 * - preset composition is sample-and-held at timing.compositionFps;
 * - post FX still run on every available render frame;
 * - recursive feedback transform/retention/fade are normalized to wall-clock
 *   time using deltaTime, with a capped stall interval;
 * - source injection and glitch/random corruption intentionally remain
 *   frame-dependent so degraded performance can still alter texture.
 */
class DodreiVisualEngineV100 extends DodreiVisualEngineV090 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this._compositionLastMs = -Infinity;
    this._compositionPresetId = null;
  }

  rebuild(w, h) {
    super.rebuild(w, h);
    this._compositionLastMs = -Infinity;
    this._compositionPresetId = null;
  }

  _timingConfig() {
    return P5LAB_CONFIG.timing || {};
  }

  _compositionIntervalMs() {
    const fps = Math.max(1, Number(this._timingConfig().compositionFps) || 30);
    return 1000 / fps;
  }

  _shouldRefreshComposition(preset) {
    const now = millis();
    const id = preset && (preset.id || preset.name) || "UNKNOWN";
    if (id !== this._compositionPresetId) {
      this._compositionPresetId = id;
      this._compositionLastMs = now;
      return true;
    }

    const interval = this._compositionIntervalMs();
    if (!Number.isFinite(this._compositionLastMs) || now - this._compositionLastMs >= interval) {
      const elapsed = Math.max(interval, now - this._compositionLastMs);
      const steps = Math.max(1, Math.floor(elapsed / interval));
      this._compositionLastMs += steps * interval;
      if (!Number.isFinite(this._compositionLastMs)) this._compositionLastMs = now;
      return true;
    }
    return false;
  }

  _frameRatio() {
    const timing = this._timingConfig();
    const referenceFps = Math.max(1, Number(timing.timeReferenceFps) || 60);
    const referenceMs = 1000 / referenceFps;
    const maxDelta = Math.max(referenceMs, Number(timing.maxDeltaMs) || 100);
    const raw = Number(deltaTime);
    const dt = P5LabUtils.clamp(Number.isFinite(raw) && raw > 0 ? raw : referenceMs, 1, maxDelta);
    return dt / referenceMs;
  }

  _timeScale(base, ratio) {
    return Math.pow(Math.max(0.000001, Number(base) || 0.000001), ratio);
  }

  _timeRetainAlpha(alpha, ratio) {
    const retain = P5LabUtils.clamp((Number(alpha) || 0) / 255, 0, 1);
    return 255 * Math.pow(retain, ratio);
  }

  _timeFadeAlpha(alpha, ratio) {
    const fade = P5LabUtils.clamp((Number(alpha) || 0) / 255, 0, 1);
    return 255 * (1 - Math.pow(1 - fade, ratio));
  }

  manualAdvanceMode() {
    super.manualAdvanceMode();
    this._compositionLastMs = -Infinity;
    this._compositionPresetId = null;
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
    const t = this.tick(this.config.photoCutMs, interaction);

    if (this.pipelineEnabled("preset-composition") && this._shouldRefreshComposition(p)) {
      g.push();
      g.background(0);
      if (p.photoFeedback) this.drawPhotoFeedbackSource(g, pool, interaction, audio, t);
      else if (p.photoRapidCrop) this.drawPhotoRapidCrop(g, pool, interaction, audio, t);
      else if (p.photoRgbTear) this.drawPhotoRgbTear(g, pool, interaction, audio, t);
      else if (p.photoHalation) this.drawPhotoHalation(g, pool, interaction, audio, t);
      else if (p.photoShardSwap) this.drawPhotoShardSwap(g, pool, interaction, audio, t);
      else if (p.photoDoubleBlend) this.drawPhotoDoubleBlend(g, pool, interaction, audio, t);
      else if (p.photoBlendCycle) this.drawPhotoBlendCycle(g, pool, interaction, audio, t);
      else if (p.photoFull) this.drawPhotoFull(g, pool, interaction, audio, t);
      else if (p.mosaic) this.drawMosaic(g, pool, analysis, audio, interaction, p.mosaic, t);
      g.pop();
    }

    let stage = g;
    if (this.pipelineEnabled("common-crush")) stage = this.applyCommonCrush(stage, pool, interaction, audio, t);

    if (this.pipelineEnabled("touch-rupture") && (interaction.pressure || 0) > 0.035) {
      stage = this.applyTouchRupture(stage, interaction, audio, t);
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

  applyPhotoFeedback(current, a, i) {
    const ratio = this._frameRatio();
    const prev = this.feedback;
    const next = this.feedbackScratch;
    const press = i.pressure || 0;
    const baseScale = this.config.feedbackScale + press * 0.002 - a.rms * 0.0015;
    const scale = this._timeScale(baseScale, ratio);
    const w = next.width * scale;
    const h = next.height * scale;
    const x = (next.width - w) * (0.5 + (i.x - 0.5) * (0.28 + press * 0.25));
    const y = (next.height - h) * (0.5 + (i.y - 0.5) * (0.28 + press * 0.25));
    const fade = this._timeFadeAlpha(Math.max(1, 4 + a.bass * 6 - press * 2), ratio);
    const retain = this._timeRetainAlpha(Math.min(225, this.config.feedbackAlpha + press * 48), ratio);

    next.push();
    next.clear();
    next.background(0, fade);
    next.tint(255, retain);
    next.image(prev, x, y, w, h);
    next.noTint();
    next.blendMode(press > 0.08 ? DIFFERENCE : SCREEN);
    // Deliberately frame-dependent: this preserves the unstable texture when
    // the actual device render rate collapses under load.
    next.tint(255, 92 + a.rms * 65 + press * 62);
    next.image(current, 0, 0, next.width, next.height);
    next.noTint();
    next.blendMode(BLEND);
    next.pop();

    this.feedback = next;
    this.feedbackScratch = prev;
  }

  applySwipeFeedback(current, i, a) {
    const ratio = this._frameRatio();
    const speed = P5LabUtils.clamp(
      (i.swipeSpeed - this.config.swipeFeedbackThreshold) / (1 - this.config.swipeFeedbackThreshold),
      0,
      1
    );
    const prev = this.swipeFeedback;
    const next = this.swipeScratch;
    const baseScale = P5LabUtils.map01(speed, this.config.swipeFeedbackScaleMin, this.config.swipeFeedbackScaleMax);
    const scale = this._timeScale(baseScale, ratio);
    const w = next.width * scale;
    const h = next.height * scale;
    const drift = (0.01 + 0.035 * speed) * ratio;
    const x = (next.width - w) * 0.5 + (i.x - 0.5) * next.width * drift;
    const y = (next.height - h) * 0.5 + (i.y - 0.5) * next.height * drift;
    const baseRetain = P5LabUtils.map01(speed, this.config.swipeFeedbackAlphaMin, this.config.swipeFeedbackAlphaMax);
    const retain = this._timeRetainAlpha(baseRetain, ratio);
    const fade = this._timeFadeAlpha(5, ratio);

    next.push();
    next.clear();
    next.background(0, fade);
    next.tint(255, retain);
    next.image(prev, x, y, w, h);
    next.noTint();
    next.blendMode(speed > 0.58 ? DIFFERENCE : SCREEN);
    next.tint(255, 150 + speed * 85);
    next.image(current, 0, 0, next.width, next.height);
    next.noTint();
    next.blendMode(BLEND);
    next.pop();

    this.swipeFeedback = next;
    this.swipeScratch = prev;
  }

  snapshot() {
    const s = super.snapshot();
    const timing = this._timingConfig();
    s.engineVersion = "0.10.0";
    s.compositionFps = Number(timing.compositionFps) || 30;
    s.timeReferenceFps = Number(timing.timeReferenceFps) || 60;
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV100;
window.P5LAB_VISUAL_ENGINE_VERSION = "0.10.0";
