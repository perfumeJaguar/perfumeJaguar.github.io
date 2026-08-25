/**
 * DODREI — VISUAL ENGINE v1.0.0
 * =============================================================================
 * Milestone layer on top of v0.10.8.
 *
 * - adds a subtle ordered BLUR POST COMMON FX;
 * - adds a POST master bypass without mutating the saved FX chain;
 * - automatically bypasses POST COMMON FX while touch rupture is active;
 * - doubles swipe-feedback strength and lowers its activation threshold via config.
 *
 * Manual POST bypass and touch bypass are intentionally independent:
 * effective POST = masterEnabled && !touchRuptureActive.
 */
class DodreiVisualEngineV1000 extends DodreiVisualEngineV108 {
  _postFxKeys() {
    return ["bw", "grayscale", "lowSaturation", "blur", "crush", "highContrast", "darken", "strongVignette"];
  }

  isPostMasterEnabled() {
    const f = this.postCommonFxConfig();
    return f.masterEnabled !== false;
  }

  setPostMasterEnabled(enabled) {
    const f = this.postCommonFxConfig();
    f.masterEnabled = !!enabled;
    this._postCommonDirty = true;
    if (this.telemetry?.event) this.telemetry.event(`POST FX MASTER ${f.masterEnabled ? "ON" : "BYPASS"}`);
    return f.masterEnabled;
  }

  _touchFxActive(interaction) {
    return this.pipelineEnabled("touch-rupture") && (interaction?.pressure || 0) > 0.035;
  }

  setPostCommonFx(key, enabled) {
    const allowed = new Set(this._postFxKeys());
    if (!allowed.has(key)) return false;

    const f = this.postCommonFxConfig();
    const next = !!enabled;
    f[key] = next;

    const order = this.postCommonFxOrder().filter((item) => item !== key);
    if (next) order.push(key);
    f.order = order;
    this._postCommonDirty = true;

    if (this.telemetry?.event) {
      const label = {
        bw: "BW",
        grayscale: "GRAYSCALE",
        lowSaturation: "LOW SATURATION",
        blur: "BLUR",
        crush: "CRUSH",
        highContrast: "HIGH CONTRAST",
        darken: "DARKEN",
        strongVignette: "STRONG VIGNETTE",
      }[key];
      const short = {
        bw: "BW",
        grayscale: "GS",
        lowSaturation: "LS",
        blur: "BL",
        crush: "CR",
        highContrast: "HC",
        darken: "DK",
        strongVignette: "VG",
      };
      const chain = f.order.map((item) => short[item] || item).join(">");
      this.telemetry.event(`POST FX ${label} ${next ? "ON" : "OFF"}${chain ? ` ${chain}` : ""}`);
    }
    return next;
  }

  _blur(out, amountPx) {
    const amount = P5LabUtils.clamp(Number(amountPx) || 0, 0, 8);
    if (amount <= 0.01) return;
    const s = this.postCommonScratch;
    s.clear();
    s.push();
    const ctx = s.drawingContext;
    ctx.save();
    ctx.filter = `blur(${amount}px)`;
    s.image(out, 0, 0, s.width, s.height);
    ctx.restore();
    s.pop();
    out.clear();
    out.image(s, 0, 0, out.width, out.height);
  }

  applyPostCommonFx(src, pool, interaction, audio, state) {
    const f = this.postCommonFxConfig();
    const order = this.postCommonFxOrder();
    let stage = src;

    for (const key of order) {
      if (key === "crush") {
        stage = this.applyCommonCrush(stage, pool, interaction, audio, state.frameIndex);
        continue;
      }

      if (stage === src) stage = this._copyPost(src);

      if (key === "highContrast") {
        this._highContrast(stage, Math.max(1, Number(f.highContrastAmount) || 3.2), Math.max(0, Number(f.highContrastSaturation) || 1.08));
      } else if (key === "bw") {
        this._binaryBw(stage, P5LabUtils.clamp(Number(f.bwThreshold) || 0.5, 0, 1));
      } else if (key === "grayscale") {
        this._grayscale(stage);
      } else if (key === "lowSaturation") {
        this._lowSaturation(stage, Number.isFinite(Number(f.lowSaturationAmount)) ? Number(f.lowSaturationAmount) : 0.5);
      } else if (key === "blur") {
        this._blur(stage, Number.isFinite(Number(f.blurAmountPx)) ? Number(f.blurAmountPx) : 1.2);
      } else if (key === "darken") {
        this._darken(stage, Number(f.darkenAlpha) || 0.46);
      } else if (key === "strongVignette") {
        this._strongVignette(stage, Number(f.strongVignetteStrength) || 0.96, Number(f.strongVignetteInner) || 0.16, Number(f.strongVignetteOuter) || 0.72);
      }
    }

    if (stage !== this.postCommonBuffer) stage = this._copyPost(stage);
    this._postCommonDirty = false;
    return stage;
  }

  applySwipeFeedback(current, i, a) {
    const ratio = this._frameRatio();
    const threshold = Number(this.config.swipeFeedbackThreshold) || 0;
    const strength = Math.max(0.1, Number(this.config.swipeFeedbackStrength) || 1);
    const speed = P5LabUtils.clamp((i.swipeSpeed - threshold) / Math.max(0.001, 1 - threshold), 0, 1);
    const prev = this.swipeFeedback;
    const next = this.swipeScratch;

    const rawBaseScale = P5LabUtils.map01(speed, this.config.swipeFeedbackScaleMin, this.config.swipeFeedbackScaleMax);
    const strongBaseScale = 1 + (rawBaseScale - 1) * strength;
    const scale = this._timeScale(strongBaseScale, ratio);
    const w = next.width * scale;
    const h = next.height * scale;
    const drift = (0.01 + 0.035 * speed) * ratio * strength;
    const x = (next.width - w) * 0.5 + (i.x - 0.5) * next.width * drift;
    const y = (next.height - h) * 0.5 + (i.y - 0.5) * next.height * drift;

    const rawRetain = P5LabUtils.map01(speed, this.config.swipeFeedbackAlphaMin, this.config.swipeFeedbackAlphaMax);
    const strongRetain = P5LabUtils.clamp(rawRetain * strength, 0, 255);
    const retain = this._timeRetainAlpha(strongRetain, ratio);
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

    const touchFxActive = this._touchFxActive(interaction);
    const postEffective = this.isPostMasterEnabled() && !touchFxActive;

    let stage = g;
    if (postEffective && this.hasPostCommonFx()) {
      stage = this._postCommonDirty ? this.applyPostCommonFx(g, pool, interaction, audio, state) : this.postCommonBuffer;
    }

    const fxTick = this.tick(this.config.photoCutMs, interaction);
    if (touchFxActive) stage = this.applyTouchRupture(stage, interaction, audio, fxTick);

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
    const f = this.postCommonFxConfig();
    s.engineVersion = "1.0.0";
    s.postCommonFx.blur = !!f.blur;
    s.postCommonFx.masterEnabled = this.isPostMasterEnabled();
    s.postCommonFx.order = this.postCommonFxOrder().slice();
    s.swipeFeedbackThreshold = Number(this.config.swipeFeedbackThreshold) || 0;
    s.swipeFeedbackStrength = Number(this.config.swipeFeedbackStrength) || 1;
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV1000;
window.P5LAB_VISUAL_ENGINE_VERSION = "1.0.0";
