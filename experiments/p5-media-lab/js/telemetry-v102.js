/**
 * DODREI — TELEMETRY PRESENTATION v1.0.2
 * =============================================================================
 * Replaces the presentation wrapper used in v1.0.1 with an explicit canvas
 * renderer so the p5 telemetry itself (not only DOM controls) uses IBM Plex Mono.
 * Keeps the existing corruption logic and adds only negligible coordinate jitter.
 */
(() => {
  const Telemetry = window.P5LabTelemetry;
  if (!Telemetry) return;

  const baseDrawLines = Telemetry.prototype.drawLines;

  const hash32 = (seed) => {
    let x = (Math.floor(seed) | 0) ^ 0x85ebca6b;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return x >>> 0;
  };

  const requestFont = () => {
    const cfg = window.P5LAB_CONFIG?.telemetry || {};
    const family = String(cfg.fontFamily || "IBM Plex Mono");
    if (!document.fonts || typeof document.fonts.load !== "function") return;
    document.fonts.load(`400 12px "${family}"`).then(() => {
      window.DODREI_TELEMETRY_FONT_READY = true;
    }).catch(() => {});
  };
  requestFont();

  Telemetry.prototype.drawLines = function styledDrawLines(lines, x, y, lineHeight) {
    const cfg = window.P5LAB_CONFIG?.telemetry || this.config || {};
    const chance = Math.max(0, Math.min(1, Number(cfg.lineJitterChance) || 0));
    const amount = Math.max(0, Number(cfg.lineJitterPx) || 0);
    const slotMs = Math.max(120, Number(cfg.glitchIntervalMs) || 260);
    const slot = Math.floor(millis() / slotMs);

    for (let i = 0; i < lines.length; i += 1) {
      let dx = 0;
      if (chance > 0 && amount > 0) {
        const h = hash32(slot * 4099 + Math.floor(y + i * lineHeight) * 31 + i * 137);
        if ((h / 4294967295) < chance) {
          const sign = (hash32(h + 17) & 1) ? 1 : -1;
          const scale = 0.45 + (hash32(h + 29) / 4294967295) * 0.55;
          dx = sign * amount * scale;
        }
      }
      // baseDrawLines is the v0.10.7 corruption-aware implementation.
      baseDrawLines.call(this, [lines[i]], x + dx, y + i * lineHeight, lineHeight);
    }
  };

  Telemetry.prototype.render = function telemetryV102Render(snapshot) {
    if (!this.config.enabled) return;

    const cfg = window.P5LAB_CONFIG?.telemetry || this.config || {};
    const mobile = P5LabUtils.isMobileLayout();
    const margin = mobile ? cfg.marginMobile : cfg.marginDesktop;
    const size = mobile ? cfg.fontSizeMobile : cfg.fontSizeDesktop;
    const rowStep = size * cfg.lineHeight;
    const motion = snapshot.analysis.motionSmooth || 0;
    const motionGlitch = cfg.glitchOnMotion && motion > 0.28;

    if (motionGlitch && frameCount % 3 === 0) this.frameJitter = random(-2.5, 2.5) * motion;
    else this.frameJitter *= 0.72;

    const font = String(cfg.fontFamily || "IBM Plex Mono");
    const rgb = Array.isArray(cfg.textColor) && cfg.textColor.length >= 3
      ? cfg.textColor.slice(0, 3).map((v) => Math.max(0, Math.min(255, Number(v) || 0)))
      : [214, 214, 210];
    const driftPx = Math.max(0, Number(cfg.driftPx) || 0);
    const driftIntervalMs = Math.max(1000, Number(cfg.driftIntervalMs) || 7000);
    const driftSlot = Math.floor(millis() / driftIntervalMs);
    const driftX = driftPx > 0 ? ((hash32(driftSlot * 101 + 7) % 3) - 1) * driftPx : 0;
    const driftY = driftPx > 0 ? ((hash32(driftSlot * 131 + 11) % 3) - 1) * driftPx : 0;

    push();
    translate(this.frameJitter + driftX, driftY);
    textFont(font);
    textStyle(NORMAL);
    textSize(size);
    textLeading(rowStep);
    noStroke();

    // Explicitly set the canvas family after the CSS webfont is loaded. This
    // makes the p5 canvas telemetry follow IBM Plex Mono instead of retaining
    // the generic monospace fallback chosen during the first frames.
    try {
      if (window.DODREI_TELEMETRY_FONT_READY && drawingContext) {
        drawingContext.font = `400 ${size}px "${font}", monospace`;
      }
    } catch (_) {}

    const alphaBright = 255 * cfg.opacity;
    const alphaSecondary = 255 * cfg.secondaryOpacity;
    const alphaFaint = 255 * cfg.faintOpacity;
    const setInk = (alpha) => fill(rgb[0], rgb[1], rgb[2], Math.max(0, Math.min(255, alpha)));

    const loaded = snapshot.media.imagePoolSize || 0;
    const total = snapshot.media.imagePoolTotal || 0;
    const failed = snapshot.media.imageFailedCount || 0;
    const mode = this.glitchLabel(this.aliasMode(snapshot.visual.modeName), 3);
    const fx = this.glitchLabel(this.aliasFx(snapshot.visual.activeFx), 9);
    const engine = snapshot.visual.engineVersion || window.P5LAB_VISUAL_ENGINE_VERSION || "BASE";
    const baseTarget = Number(snapshot.visual.baseFpsTarget || snapshot.visual.compositionFps || 0);
    const baseActual = Number(snapshot.visual.baseFpsActual || 0);
    const speedLevel = String(snapshot.visual.visualSpeedLevel || P5LAB_CONFIG.timing?.visualSpeedLevel || "S2");
    const speedMultiplier = Number(snapshot.visual.visualSpeedMultiplier || P5LAB_CONFIG.timing?.visualSpeedMultiplier || 0.50);
    const cutEstimate = Number(snapshot.visual.effectiveCutIntervalMs || 0);
    const stateHz = Number(snapshot.visual.effectiveVisualStateHz || 0);

    const leftLines = [
      `${P5LAB_CONFIG.app.title}   V${P5LAB_CONFIG.app.version}`,
      `AUTHOR        ${cfg.author || "Hoyeon Choi"}`,
      `ENGINE        V${engine}`,
      `MODE          ${mode}`,
      `FX            ${fx}`,
      `SOURCE        ${snapshot.media.sourceLabel}`,
      `SOURCE_TYPE   ${snapshot.media.sourceType}`,
      `IMAGE_POOL    ${loaded}/${total}`,
      `IMAGE_FAIL    ${failed}`,
      `VIDEO_STATE   ${snapshot.media.videoState || "DISABLED"}`,
      `AUDIO_STATE   ${snapshot.audio.state || "IDLE"}`,
      `AUDIO_MODE    ${snapshot.audio.contextState || "UNKNOWN"}`,
      `AUDIO_PCM     ${snapshot.audio.analysisReady ? "READY" : "LOADING"}`,
      `AUDIO_FX      ${this.glitchLabel(snapshot.audio.fxState || "OFF", 14)}`,
      `FRAME         ${String(frameCount).padStart(7, "0")}`,
      `TIME          ${P5LabUtils.formatTime(millis() / 1000)}`,
      `FPS           ${snapshot.system.fps.toFixed(1)}`,
      `BASE_FPS      ${baseTarget ? `${baseTarget.toFixed(0)} / ${baseActual.toFixed(1)}` : "N/A"}`,
      `VIS_SPEED     ${speedLevel} / ${speedMultiplier.toFixed(2)}X`,
      `STATE_HZ      ${stateHz ? stateHz.toFixed(1) : "N/A"}`,
      `CUT_EST       ${cutEstimate ? `${cutEstimate.toFixed(0)}MS` : "N/A"}`,
      `VIEWPORT      ${width} x ${height}`,
      `BUFFER        ${snapshot.system.bufferW} x ${snapshot.system.bufferH}`,
    ];
    setInk(alphaBright);
    this.drawLines(leftLines, margin, margin, rowStep);

    const parameterLines = [
      `POINTER_X     ${snapshot.interaction.x.toFixed(3)}`,
      `POINTER_Y     ${snapshot.interaction.y.toFixed(3)}`,
      `PRESSURE      ${snapshot.interaction.pressure.toFixed(3)}`,
      `SWIPE_SPEED   ${(snapshot.interaction.swipeSpeed || 0).toFixed(3)}`,
      `LOCAL_LUMA    ${snapshot.analysis.localLuma.toFixed(3)}`,
      `GLOBAL_LUMA   ${snapshot.analysis.globalLuma.toFixed(3)}`,
      `MOTION        ${snapshot.analysis.motion.toFixed(3)}`,
      `MOTION_S      ${snapshot.analysis.motionSmooth.toFixed(3)}`,
      `AUDIO_RMS     ${snapshot.audio.rms.toFixed(3)}`,
      `BASS          ${snapshot.audio.bass.toFixed(3)}`,
      `MID           ${snapshot.audio.mid.toFixed(3)}`,
      `TREBLE        ${snapshot.audio.treble.toFixed(3)}`,
      `FILTER_HZ     ${snapshot.audio.filterHz.toFixed(0)}`,
      `DELAY_TIME    ${snapshot.audio.delayTime.toFixed(3)}`,
      `DELAY_FB      ${snapshot.audio.delayFeedback.toFixed(3)}`,
      `DISTORT       ${snapshot.audio.distortion.toFixed(3)}`,
      `WET           ${(snapshot.audio.wet || 0).toFixed(3)}`,
      `RATE          ${snapshot.audio.rate.toFixed(3)}`,
    ];
    setInk(alphaSecondary);
    if (width > 820) this.drawLines(parameterLines, width - margin - 180, margin, rowStep);
    else this.drawLines(parameterLines.slice(0, 18), margin, margin + leftLines.length * rowStep + rowStep, rowStep);

    const eventCount = mobile ? Math.min(9, this.events.length) : this.events.length;
    const startY = height - margin - eventCount * rowStep;
    for (let i = eventCount - 1; i >= 0; i -= 1) {
      const evt = this.events[i];
      const ageFade = 1 - i / Math.max(1, eventCount);
      setInk(alphaFaint + (alphaSecondary - alphaFaint) * ageFade);
      text(`> ${this.glitchLabel(evt.message, 700 + i * 41)}`, margin, startY + (eventCount - 1 - i) * rowStep);
    }
    pop();
  };

  Telemetry.prototype.render._dodreiV102 = true;
})();
