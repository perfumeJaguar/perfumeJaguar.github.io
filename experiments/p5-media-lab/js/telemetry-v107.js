/**
 * DODREI telemetry text-corruption patch v0.10.7.
 * Keeps telemetry values real, but spreads transient character damage across
 * labels, parameter rows, status rows, and event messages.
 */
(() => {
  const Telemetry = window.P5LabTelemetry;
  if (!Telemetry) return;

  const hash32 = (seed) => {
    let x = (Math.floor(seed) | 0) ^ 0x9e3779b9;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return x >>> 0;
  };

  const mutate = (textValue, seed, chance, biasLabel = false) => {
    const s = String(textValue ?? "");
    if (!s || s.length < 2) return s;
    const slot = Math.floor(millis() / Math.max(80, Number(P5LAB_CONFIG.telemetry?.glitchIntervalMs) || 260));
    const h = hash32(slot * 4099 + seed * 131 + s.length * 17);
    if ((h / 4294967295) >= chance) return s;

    const chars = ["/", "_", "?", "0", "X", ":", "#", "-", "."];
    const candidates = [];
    const labelLimit = biasLabel ? Math.min(s.length, 14) : s.length;
    for (let i = 0; i < labelLimit; i += 1) if (!/\s/.test(s[i])) candidates.push(i);
    if (!candidates.length) return s;

    const index = candidates[hash32(h + 19) % candidates.length];
    const replacement = chars[hash32(h + 37) % chars.length];
    return s.slice(0, index) + replacement + s.slice(index + 1);
  };

  Telemetry.prototype.glitchLabel = function glitchLabel(textValue, seed = 0) {
    if (!this.config.glitchLabels) return String(textValue ?? "");
    const chance = P5LabUtils.clamp(Number(this.config.glitchChance) || 0.42, 0, 1);
    return mutate(textValue, seed, chance, false);
  };

  Telemetry.prototype.drawLines = function drawLines(lines, x, y, lineHeight) {
    const chance = this.config.glitchLabels
      ? P5LabUtils.clamp(Number(this.config.glitchLineChance) || 0.24, 0, 1)
      : 0;
    for (let i = 0; i < lines.length; i += 1) {
      const line = chance > 0 ? mutate(lines[i], 200 + i * 29 + Math.floor(y), chance, true) : lines[i];
      text(line, x, y + i * lineHeight);
    }
  };

  const baseRender = Telemetry.prototype.render;
  Telemetry.prototype.render = function patchedRender(snapshot) {
    if (!this.config.enabled) return;

    const mobile = P5LabUtils.isMobileLayout();
    const margin = mobile ? this.config.marginMobile : this.config.marginDesktop;
    const size = mobile ? this.config.fontSizeMobile : this.config.fontSizeDesktop;
    const rowStep = size * this.config.lineHeight;
    const motion = snapshot.analysis.motionSmooth || 0;
    const motionGlitch = this.config.glitchOnMotion && motion > 0.28;

    if (motionGlitch && frameCount % 3 === 0) this.frameJitter = random(-2.5, 2.5) * motion;
    else this.frameJitter *= 0.72;

    push();
    translate(this.frameJitter, 0);
    textFont("monospace");
    textSize(size);
    textLeading(rowStep);
    noStroke();

    const bright = 255 * this.config.opacity;
    const secondary = 255 * this.config.secondaryOpacity;
    const faint = 255 * this.config.faintOpacity;
    const loaded = snapshot.media.imagePoolSize || 0;
    const total = snapshot.media.imagePoolTotal || 0;
    const failed = snapshot.media.imageFailedCount || 0;
    const mode = this.glitchLabel(this.aliasMode(snapshot.visual.modeName), 3);
    const fx = this.glitchLabel(this.aliasFx(snapshot.visual.activeFx), 9);
    const engine = snapshot.visual.engineVersion || window.P5LAB_VISUAL_ENGINE_VERSION || "BASE";
    const baseTarget = Number(snapshot.visual.baseFpsTarget || snapshot.visual.compositionFps || 0);
    const baseActual = Number(snapshot.visual.baseFpsActual || 0);
    const speedLevel = String(snapshot.visual.visualSpeedLevel || P5LAB_CONFIG.timing?.visualSpeedLevel || "S2");
    const speedMultiplier = Number(snapshot.visual.visualSpeedMultiplier || P5LAB_CONFIG.timing?.visualSpeedMultiplier || 0.75);
    const cutEstimate = Number(snapshot.visual.effectiveCutIntervalMs || 0);
    const stateHz = Number(snapshot.visual.effectiveVisualStateHz || 0);

    const leftLines = [
      `${P5LAB_CONFIG.app.title}   V${P5LAB_CONFIG.app.version}`,
      `AUTHOR        ${this.config.author || "Hoyeon Choi"}`,
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
    fill(bright);
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
    fill(secondary);
    if (width > 820) this.drawLines(parameterLines, width - margin - 180, margin, rowStep);
    else this.drawLines(parameterLines.slice(0, 18), margin, margin + leftLines.length * rowStep + rowStep, rowStep);

    const eventCount = mobile ? Math.min(9, this.events.length) : this.events.length;
    const startY = height - margin - eventCount * rowStep;
    const eventChance = this.config.glitchLabels
      ? P5LabUtils.clamp((Number(this.config.glitchLineChance) || 0.24) * 0.85, 0, 1)
      : 0;
    for (let i = eventCount - 1; i >= 0; i -= 1) {
      const evt = this.events[i];
      const ageFade = 1 - i / Math.max(1, eventCount);
      fill(faint + (secondary - faint) * ageFade);
      const message = eventChance > 0 ? mutate(evt.message, 700 + i * 41, eventChance, false) : evt.message;
      text(`> ${message}`, margin, startY + (eventCount - 1 - i) * rowStep);
    }
    pop();
  };

  Telemetry.prototype.render._dodreiV107 = true;
  Telemetry.prototype.render._baseRender = baseRender;
})();
