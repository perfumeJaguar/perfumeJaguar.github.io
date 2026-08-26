/** DODREI — VISUAL ENGINE v1.0.27
 * Memory recall remains a fixed one-image PRE composition, but the recall overlay
 * now lives inside the p5 pipeline instead of above it in DOM. The fixed memory
 * image receives touch rupture/swipe processing; then thumbnail + memory text are
 * composited into a dark readability panel; finally the current ordered POST FX
 * chain is applied to the whole result, including thumbnail and text.
 *
 * Touch rupture timing also gets a simple burst envelope: short periods of rapid
 * pattern refresh are separated by longer held/lull intervals. This creates a
 * less metronomic "buzz / silence / buzz" rhythm without increasing activity
 * uniformly across the entire gesture.
 */
class DodreiVisualEngineV1027 extends DodreiVisualEngineV1026 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this.memoryComposite = null;
    this._touchBurstState = "LULL";
    this._touchBurstUntil = 0;
    this._touchBurstSerial = 0;
  }

  rebuild(w, h) {
    try { this.memoryComposite?.remove?.(); } catch (_) {}
    this.memoryComposite = null;
    super.rebuild(w, h);
    if (this.buffer) {
      this.memoryComposite = createGraphics(this.buffer.width, this.buffer.height);
      this.memoryComposite.pixelDensity(1);
      this.memoryComposite.clear();
    }
    this._touchBurstState = "LULL";
    this._touchBurstUntil = 0;
  }

  _touchBurstRand(seedOffset = 0) {
    return this.rand01((++this._touchBurstSerial) * 149 + seedOffset + Math.floor(millis() / 137));
  }

  applyTouchRupture(src, i, a, t) {
    const now = millis();
    const pressed = !!i?.pressed;

    // Keep the inherited short release fracture unchanged.
    if (!pressed) {
      this._touchBurstState = "LULL";
      this._touchBurstUntil = 0;
      return super.applyTouchRupture(src, i, a, t);
    }

    const energy = P5LabUtils.clamp(
      (Number(i?.pressure) || 0) * 0.45 + (Number(i?.swipeSpeed) || 0) * 0.55,
      0,
      1
    );

    if (!(this._touchBurstUntil > now)) {
      if (this._touchBurstState === "BURST") {
        this._touchBurstState = "LULL";
        // Long quiet gaps dominate. Faster movement shortens them slightly, but
        // never collapses the effect into a constant high-rate flicker.
        const lull = 220 + this._touchBurstRand(17) * 560;
        this._touchBurstUntil = now + lull * (1 - energy * 0.26);
      } else {
        this._touchBurstState = "BURST";
        const burst = 105 + this._touchBurstRand(31) * 155 + energy * 55;
        this._touchBurstUntil = now + burst;
      }
    }

    if (this._touchBurstState === "BURST") {
      // The inherited mobile frame-skip still limits actual heavy pixel passes.
      // For every pass that is allowed through, force a fresh rupture pattern.
      this._rupturePatternAt = -1e9;
    } else if (this._rupturePattern) {
      // During the lull, hold the previous fracture in place instead of rolling
      // another random pattern every ~70-150 ms.
      this._rupturePatternAt = now;
    }

    return super.applyTouchRupture(src, i, a, t);
  }

  _memoryOverlayMetrics(out, recall) {
    const cssW = Math.max(1, Number(width) || out.width);
    const cssH = Math.max(1, Number(height) || out.height);
    const sx = out.width / cssW;
    const sy = out.height / cssH;
    const u = Math.min(sx, sy);
    const source = P5LabUtils.sourceSize(recall.img);

    const maxThumbW = Math.min(cssW * 0.46, 286) * sx;
    const maxThumbH = Math.min(cssH * 0.29, 272) * sy;
    const thumbScale = source.width && source.height
      ? Math.min(maxThumbW / source.width, maxThumbH / source.height)
      : 1;
    const thumbW = Math.max(1, source.width * thumbScale);
    const thumbH = Math.max(1, source.height * thumbScale);

    const panelW = Math.min(out.width * 0.78, 520 * sx);
    const padX = Math.max(16 * u, panelW * 0.055);
    const padY = 18 * u;
    const gapThumbId = 13 * u;
    const gapIdText = 8 * u;
    const idPx = Math.max(8 * u, Math.min(11 * u, cssW * 0.022 * u));
    const textPx = Math.max(15 * u, Math.min(23 * u, cssW * 0.042 * u));
    const textLine = textPx * 1.38;
    const maxTextW = panelW - padX * 2;

    return {
      cssW, cssH, sx, sy, u, thumbW, thumbH,
      panelW, padX, padY, gapThumbId, gapIdText,
      idPx, textPx, textLine, maxTextW,
    };
  }

  _wrapMemoryText(ctx, text, maxWidth) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [""];
    const lines = [];
    let line = words.shift();
    for (const word of words) {
      const test = `${line} ${word}`;
      if (ctx.measureText(test).width <= maxWidth) line = test;
      else { lines.push(line); line = word; }
    }
    lines.push(line);
    return lines.slice(0, 4);
  }

  _drawMemoryOverlay(out, recall) {
    if (!out || !recall?.img) return;
    const m = this._memoryOverlayMetrics(out, recall);
    const ctx = out.drawingContext;

    ctx.save();
    ctx.font = `400 ${m.textPx}px "Cormorant Garamond", Georgia, serif`;
    const lines = this._wrapMemoryText(ctx, recall.text, m.maxTextW);
    ctx.restore();

    const textH = Math.max(m.textLine, lines.length * m.textLine);
    const panelH = m.padY * 2 + m.thumbH + m.gapThumbId + m.idPx * 1.35 + m.gapIdText + textH;
    const panelX = (out.width - m.panelW) * 0.5;
    const panelY = P5LabUtils.clamp(
      out.height * 0.52 - panelH * 0.5,
      18 * m.u,
      Math.max(18 * m.u, out.height - panelH - 18 * m.u)
    );
    const radius = 10 * m.u;

    // Local dark field only: enough contrast for text without returning to the
    // v1.0.25 full-screen black recall plate.
    out.push();
    out.noStroke();
    out.fill(0, 126);
    out.rect(panelX, panelY, m.panelW, panelH, radius);
    out.pop();

    const thumbX = out.width * 0.5 - m.thumbW * 0.5;
    const thumbY = panelY + m.padY;
    out.push();
    out.tint(255, 250); // ~98% opacity: visibly less transparent than v1.0.26 DOM thumbnail.
    out.image(recall.img, thumbX, thumbY, m.thumbW, m.thumbH);
    out.noTint();
    out.pop();

    const idY = thumbY + m.thumbH + m.gapThumbId;
    const textY = idY + m.idPx * 1.35 + m.gapIdText;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,.96)";
    ctx.shadowBlur = 7 * m.u;
    ctx.shadowOffsetY = 1 * m.u;

    ctx.font = `400 ${m.idPx}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.fillStyle = "rgba(222,220,214,.78)";
    ctx.fillText(`MEMORY ${recall.id || "---"}`, out.width * 0.5, idY);

    ctx.font = `400 ${m.textPx}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = "rgba(242,239,232,.96)";
    for (let n = 0; n < lines.length; n += 1) {
      ctx.fillText(lines[n], out.width * 0.5, textY + n * m.textLine);
    }
    ctx.restore();
  }

  _memoryCompositeStage(stage, recall) {
    const out = this.memoryComposite;
    if (!out || !stage) return stage;
    out.clear();
    out.image(stage, 0, 0, out.width, out.height);
    this._drawMemoryOverlay(out, recall);
    return out;
  }

  _renderMemoryRecall(recall, analysis, audio, interaction) {
    if (this.config.enabled === false) {
      background(P5LAB_CONFIG.render.background);
      return;
    }

    if (!this._prepareMemoryBase(recall)) return;

    const p = this.currentPreset();
    let stage = this.buffer;

    // Fixed source -> touch-side processing. PRE composition/randomness remains frozen.
    const fxTick = this.tick(this.config.photoCutMs, interaction);
    if (this._touchFxActive(interaction)) {
      stage = this.applyTouchRupture(stage, interaction, audio, fxTick);
    }

    const swipe = interaction?.swipeSpeed || 0;
    const threshold = Number(this.config.swipeFeedbackThreshold) || 0;
    if (this.pipelineEnabled("swipe-feedback") && interaction?.pressed && swipe > threshold) {
      this.applySwipeFeedback(stage, interaction, audio);
      stage = this.swipeFeedback;
    } else {
      try { this.swipeFeedback?.clear?.(); this.swipeScratch?.clear?.(); } catch (_) {}
    }

    // Thumbnail + memory copy are now part of the canvas, not a DOM overlay.
    // Therefore they can enter exactly the same current ordered POST chain.
    stage = this._memoryCompositeStage(stage, recall);

    const postState = {
      frameIndex: Math.floor(millis() / Math.max(16, Number(this.config.photoCutMs) || 90)),
      cutTick: 0,
    };
    if (this.isPostMasterEnabled() && this.hasPostCommonFx()) {
      stage = this.applyPostCommonFx(stage, [recall.img], interaction, audio, postState);
    }

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null, stage, 255);
    if (this.pipelineEnabled("vignette")) this.drawVignette(interaction, audio, p);
    if (this.pipelineEnabled("waveform")) this.drawWaveformOverlay(audio, interaction);
  }

  snapshot() {
    const s = super.snapshot();
    s.engineVersion = "1.0.27";
    s.memoryRecall = {
      ...(s.memoryRecall || {}),
      overlayInCanvas: true,
      overlayReceivesPostFx: true,
      touchRuptureBurstEnvelope: true,
      ruptureResolutionScale: P5LabUtils.isMobileLayout()
        ? Number(this.config.touchRuptureResolutionScaleMobile) || 0.62
        : Number(this.config.touchRuptureResolutionScaleDesktop) || 0.80,
    };
    return s;
  }
}
window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV1027;
window.P5LAB_VISUAL_ENGINE_VERSION = "1.0.27";
