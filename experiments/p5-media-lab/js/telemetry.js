/**
 * Text is both instrumentation and visual material here.
 * The layer intentionally exposes real internal state instead of decorative
 * fake terminal noise. Event history accumulates from actual state changes.
 */
class P5LabTelemetry {
  constructor(config) {
    this.config = config;
    this.events = [];
    this.metrics = {};
    this.frameJitter = 0;
  }

  event(message) {
    const stamp = performance.now() / 1000;
    this.events.unshift({ time: stamp, message: String(message).toUpperCase() });
    this.events.length = Math.min(this.events.length, this.config.maxEvents);
  }

  set(name, value) { this.metrics[name] = value; }

  render(snapshot) {
    if (!this.config.enabled) return;

    const mobile = P5LabUtils.isMobileLayout();
    const margin = mobile ? this.config.marginMobile : this.config.marginDesktop;
    const size = mobile ? this.config.fontSizeMobile : this.config.fontSizeDesktop;
    const rowStep = size * this.config.lineHeight;
    const motion = snapshot.analysis.motionSmooth || 0;
    const glitch = this.config.glitchOnMotion && motion > 0.28;

    if (glitch && frameCount % 3 === 0) this.frameJitter = random(-2.5, 2.5) * motion;
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

    const leftLines = [
      `${P5LAB_CONFIG.app.title}   V${P5LAB_CONFIG.app.version}`,
      `MODE          ${snapshot.visual.modeName}`,
      `FX            ${snapshot.visual.activeFx}`,
      `SOURCE        ${snapshot.media.sourceLabel}`,
      `SOURCE_TYPE   ${snapshot.media.sourceType}`,
      `IMAGE_POOL    ${loaded}/${total}`,
      `IMAGE_FAIL    ${failed}`,
      `VIDEO_STATE   ${snapshot.media.videoState || "IDLE"}`,
      `VIDEO_READY   ${snapshot.media.videoReadyState || 0}`,
      `AUDIO_STATE   ${snapshot.audio.state || "IDLE"}`,
      `AUDIO_MODE    ${snapshot.audio.contextState || "UNKNOWN"}`,
      `AUDIO_PCM     ${snapshot.audio.analysisReady ? "READY" : "LOADING"}`,
      `FRAME         ${String(frameCount).padStart(7, "0")}`,
      `TIME          ${P5LabUtils.formatTime(millis() / 1000)}`,
      `FPS           ${snapshot.system.fps.toFixed(1)}`,
      `VIEWPORT      ${width} x ${height}`,
      `BUFFER        ${snapshot.system.bufferW} x ${snapshot.system.bufferH}`,
    ];
    fill(bright);
    this.drawLines(leftLines, margin, margin, rowStep);

    const parameterLines = [
      `POINTER_X     ${snapshot.interaction.x.toFixed(3)}`,
      `POINTER_Y     ${snapshot.interaction.y.toFixed(3)}`,
      `PRESSURE      ${snapshot.interaction.pressure.toFixed(3)}`,
      `LOCAL_RGB     ${snapshot.analysis.localR.toFixed(0)} ${snapshot.analysis.localG.toFixed(0)} ${snapshot.analysis.localB.toFixed(0)}`,
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
      `RATE          ${snapshot.audio.rate.toFixed(3)}`,
      `PAN           ${snapshot.audio.pan.toFixed(3)}`,
    ];

    fill(secondary);
    if (width > 820) {
      this.drawLines(parameterLines, width - margin - 180, margin, rowStep);
    } else {
      const mobileParameterLines = [
        parameterLines[0], parameterLines[1], parameterLines[2], parameterLines[4],
        parameterLines[6], parameterLines[7], parameterLines[8], parameterLines[9],
        parameterLines[10], parameterLines[11], parameterLines[16], parameterLines[17],
      ];
      this.drawLines(mobileParameterLines, margin, margin + leftLines.length * rowStep + rowStep, rowStep);
    }

    const eventCount = mobile ? Math.min(9, this.events.length) : this.events.length;
    const startY = height - margin - eventCount * rowStep;
    for (let i = eventCount - 1; i >= 0; i -= 1) {
      const evt = this.events[i];
      const ageFade = 1 - i / Math.max(1, eventCount);
      fill(faint + (secondary - faint) * ageFade);
      text(`> ${evt.message}`, margin, startY + (eventCount - 1 - i) * rowStep);
    }

    stroke(255, faint);
    strokeWeight(1);
    const px = snapshot.interaction.x * width;
    const py = snapshot.interaction.y * height;
    line(px - 8, py, px + 8, py);
    line(px, py - 8, px, py + 8);
    noFill();
    circle(px, py, Math.max(12, min(width, height) * P5LAB_CONFIG.interaction.pointerRadiusNorm * 2));
    pop();
  }

  drawLines(lines, x, y, lineHeight) {
    for (let i = 0; i < lines.length; i += 1) text(lines[i], x, y + i * lineHeight);
  }
}

window.P5LabTelemetry = P5LabTelemetry;
