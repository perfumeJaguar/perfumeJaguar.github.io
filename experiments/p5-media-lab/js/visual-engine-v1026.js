/** DODREI — VISUAL ENGINE v1.0.26
 * Memory recall now locks the PRE-FX composition to one archive still.
 * While recall is active, the ordinary preset composition clock, random image
 * selection, random crop/layout evolution, and PRE common FX do not advance.
 * The existing touch rupture / preset feedback / swipe feedback path continues
 * downstream from that fixed still image until the gesture ends.
 */
class DodreiVisualEngineV1026 extends DodreiVisualEngineV1022 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this._memoryRecallKey = null;
    this._memoryRecallWasActive = false;
  }

  rebuild(w, h) {
    super.rebuild(w, h);
    this._memoryRecallKey = null;
  }

  _memoryRecallState() {
    try {
      return window.DODREI_MEMORY_RECALL?.getState?.() || null;
    } catch (_) {
      return null;
    }
  }

  _clearMemoryTemporalBuffers() {
    const keys = [
      "feedback", "feedbackScratch",
      "swipeFeedback", "swipeScratch",
      "globalFeedback", "globalFeedbackScratch"
    ];
    const seen = new Set();
    for (const key of keys) {
      const g = this[key];
      if (!g || seen.has(g)) continue;
      seen.add(g);
      try { g.clear?.(); } catch (_) {}
    }
  }

  _prepareMemoryBase(recall) {
    if (!recall?.active || !recall.img || !this.buffer) return false;
    const key = String(recall.key || recall.path || recall.id || "memory");
    if (this._memoryRecallKey === key) return true;

    this._clearMemoryTemporalBuffers();
    const g = this.buffer;
    g.push();
    g.background(0);
    // Memory source is intentionally stable: one centered 1x cover crop.
    // No preset blending, random source selection, crop reseeding, or touch pan.
    P5LabUtils.drawCover(g, recall.img, 255, 1, 0, 0);
    g.pop();

    this._memoryRecallKey = key;
    this._postCommonDirty = true;
    return true;
  }

  _leaveMemoryRecall() {
    this._memoryRecallKey = null;
    this._clearMemoryTemporalBuffers();

    // Resume ordinary composition from the exact point where recall intercepted it,
    // but force a fresh legal scene on the first frame after release.
    this._compositionLastMs = -Infinity;
    this._compositionPresetId = null;
    try { this._sceneImageSlots?.clear?.(); } catch (_) {}
    try { this._virtualLastWallMs = millis(); } catch (_) {}
    this._postCommonDirty = true;
  }

  _renderMemoryRecall(recall, analysis, audio, interaction) {
    if (this.config.enabled === false) {
      background(P5LAB_CONFIG.render.background);
      return;
    }

    if (!this._prepareMemoryBase(recall)) return;

    const p = this.currentPreset();
    const g = this.buffer;
    const pool = [recall.img];
    let stage = g;

    // MEMORY LOCK replaces the ordinary preset-composition/PRE-FX stage.
    // From here down, preserve the established touch-side processing chain.
    const fxTick = this.tick(this.config.photoCutMs, interaction);
    if (this._touchFxActive(interaction)) {
      stage = this.applyTouchRupture(stage, interaction, audio, fxTick);
    }

    if (this.pipelineEnabled("preset-feedback") && p?.feedback) {
      this.applyPhotoFeedback(stage, audio, interaction);
      stage = this.feedback;
    }

    const swipe = interaction?.swipeSpeed || 0;
    const threshold = Number(this.config.swipeFeedbackThreshold) || 0;
    if (this.pipelineEnabled("swipe-feedback") && interaction?.pressed && swipe > threshold) {
      this.applySwipeFeedback(stage, interaction, audio);
      stage = this.swipeFeedback;
    } else {
      try { this.swipeFeedback?.clear?.(); this.swipeScratch?.clear?.(); } catch (_) {}
    }

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null, stage, 255);
    if (this.pipelineEnabled("vignette")) this.drawVignette(interaction, audio, p);
    if (this.pipelineEnabled("waveform")) this.drawWaveformOverlay(audio, interaction);
  }

  render(source, currentImage, imagePool, analysis, audio, interaction) {
    const recall = this._memoryRecallState();
    if (recall?.active && recall.img) {
      this._memoryRecallWasActive = true;
      this._renderMemoryRecall(recall, analysis, audio, interaction);
      return;
    }

    if (this._memoryRecallWasActive) {
      this._memoryRecallWasActive = false;
      this._leaveMemoryRecall();
    }

    super.render(source, currentImage, imagePool, analysis, audio, interaction);
  }

  snapshot() {
    const s = super.snapshot();
    const recall = this._memoryRecallState();
    s.engineVersion = "1.0.26";
    s.memoryRecall = {
      active: !!recall?.active,
      compositionLocked: !!recall?.active,
      key: recall?.key || null,
    };
    return s;
  }
}
window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV1026;
window.P5LAB_VISUAL_ENGINE_VERSION = "1.0.26";
