/**
 * DODREI — VISUAL ENGINE v0.9.0
 * =============================================================================
 * Performance + manual-mode revision on top of v0.8.0.
 *
 * Changes:
 * - automatic mode advancement can be disabled through modeControl.autoAdvance;
 * - public manualAdvanceMode() advances with the existing sequence/shuffle policy;
 * - four-band touch palette is applied by a p5 filter shader when available;
 * - the previous CPU pixel loop remains as a compatibility fallback.
 */
class DodreiVisualEngineV090 extends DodreiVisualEngineV080 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this._rupturePaletteShader = null;
    this._ruptureShaderFailed = false;
  }

  setup(w, h) {
    super.setup(w, h);
    window.DODREI_VISUAL_ENGINE = this;
  }

  rebuild(w, h) {
    super.rebuild(w, h);
    this._buildRupturePaletteShader();
  }

  _buildRupturePaletteShader() {
    this._rupturePaletteShader = null;
    this._ruptureShaderFailed = false;

    const frag = `
      precision highp float;
      varying vec2 vTexCoord;
      uniform sampler2D tex0;
      uniform float threshold0;
      uniform float threshold1;
      uniform float threshold2;
      uniform vec3 color0;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;

      void main() {
        vec4 src = texture2D(tex0, vTexCoord);
        float luma = dot(src.rgb, vec3(0.299, 0.587, 0.114));
        vec3 mapped;

        if (luma < threshold0) mapped = color0;
        else if (luma < threshold1) mapped = color1;
        else if (luma < threshold2) mapped = color2;
        else mapped = color3;

        gl_FragColor = vec4(mapped, src.a);
      }
    `;

    try {
      if (!this.ruptureBuffer || typeof this.ruptureBuffer.createFilterShader !== "function") {
        throw new Error("createFilterShader unavailable");
      }
      this._rupturePaletteShader = this.ruptureBuffer.createFilterShader(frag);
      this.telemetry.event("RUPTURE PALETTE GPU READY");
    } catch (error) {
      this._ruptureShaderFailed = true;
      this.telemetry.event("RUPTURE PALETTE CPU FALLBACK");
      console.warn("DODREI palette shader unavailable; using CPU fallback.", error);
    }
  }

  updateMode() {
    const ctl = this.config.modeControl || {};
    if (ctl.autoAdvance === false) return;
    super.updateMode();
  }

  manualAdvanceMode() {
    this.advanceMode();
    this.modeStartedMs = millis();
    this._resetModeFeedback();
    this.announcePreset();
    this.telemetry.event("MODE STEP / MANUAL");
  }

  _resetModeFeedback() {
    const buffers = [
      this.feedback,
      this.feedbackScratch,
      this.swipeFeedback,
      this.swipeScratch,
    ];
    for (const buffer of buffers) {
      try { if (buffer) buffer.clear(); } catch (_) {}
    }
  }

  _paletteData() {
    const pal = this.config.touchPalette || {};
    const thresholds = Array.isArray(pal.thresholds) && pal.thresholds.length >= 3
      ? pal.thresholds
      : [64, 128, 192];
    const colors = Array.isArray(pal.colors) && pal.colors.length >= 4
      ? pal.colors
      : [[0, 0, 0], [72, 72, 72], [238, 94, 90], [246, 246, 244]];

    const threshold = (i) => P5LabUtils.clamp(Number(thresholds[i]) || 0, 0, 255);
    const color = (i) => {
      const c = colors[i] || [0, 0, 0];
      return [
        P5LabUtils.clamp(Number(c[0]) || 0, 0, 255),
        P5LabUtils.clamp(Number(c[1]) || 0, 0, 255),
        P5LabUtils.clamp(Number(c[2]) || 0, 0, 255),
      ];
    };

    return {
      thresholds: [threshold(0), threshold(1), threshold(2)],
      colors: [color(0), color(1), color(2), color(3)],
    };
  }

  _applyPaletteShader(out, palette) {
    if (!this._rupturePaletteShader || this._ruptureShaderFailed) return false;

    try {
      const shader = this._rupturePaletteShader;
      shader.setUniform("threshold0", palette.thresholds[0] / 255);
      shader.setUniform("threshold1", palette.thresholds[1] / 255);
      shader.setUniform("threshold2", palette.thresholds[2] / 255);
      shader.setUniform("color0", palette.colors[0].map(v => v / 255));
      shader.setUniform("color1", palette.colors[1].map(v => v / 255));
      shader.setUniform("color2", palette.colors[2].map(v => v / 255));
      shader.setUniform("color3", palette.colors[3].map(v => v / 255));
      out.filter(shader);
      return true;
    } catch (error) {
      this._ruptureShaderFailed = true;
      this.telemetry.event("RUPTURE SHADER FAILED / CPU");
      console.warn("DODREI palette shader failed; switching to CPU fallback.", error);
      return false;
    }
  }

  _applyPaletteCpu(out, palette) {
    const th = palette.thresholds;
    const colors = palette.colors;
    out.loadPixels();
    const px = out.pixels;

    for (let p = 0; p < px.length; p += 4) {
      const l = 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
      const idx = l < th[0] ? 0 : l < th[1] ? 1 : l < th[2] ? 2 : 3;
      const c = colors[idx];
      px[p] = c[0];
      px[p + 1] = c[1];
      px[p + 2] = c[2];
    }

    out.updatePixels();
  }

  applyTouchRupture(src, i, a, t) {
    const out = this.ruptureBuffer;
    const scratch = this.ruptureScratch;
    const mobile = P5LabUtils.isMobileLayout();
    const skip = Math.max(1, mobile
      ? (this.config.touchRuptureFrameSkipMobile || 2)
      : (this.config.touchRuptureFrameSkipDesktop || 1));

    const now = millis();
    const freshGesture = (now - this._lastRuptureCallMs) > 80;
    this._lastRuptureCallMs = now;
    this._ruptureFrameCounter++;
    if (!freshGesture && skip > 1 && (this._ruptureFrameCounter % skip) !== 1) return out;

    out.clear();
    scratch.clear();

    scratch.push();
    const ctx = scratch.drawingContext;
    ctx.save();
    ctx.filter = `grayscale(1) contrast(${this.config.touchRuptureContrast})`;
    scratch.image(src, 0, 0, scratch.width, scratch.height);
    ctx.restore();
    scratch.pop();

    out.image(scratch, 0, 0, out.width, out.height);
    const bands = Math.max(1, Math.floor(this.config.touchRuptureBands || 13));
    const bh = out.height / bands;

    for (let n = 0; n < bands; n++) {
      if ((n + t) % 3 !== 0) continue;
      const shift = (this.rand01(t * 307 + n * 17) - 0.5) * out.width * (0.05 + i.pressure * 0.18);
      out.image(scratch, shift, n * bh, out.width, bh + 1, 0, n * bh, scratch.width, bh + 1);
    }

    out.push();
    out.stroke(255, 18 + i.pressure * 38);
    out.strokeWeight(1);
    for (let n = 0; n < 7; n++) {
      const y = this.rand01(t * 331 + n * 23) * out.height;
      out.line(0, y, out.width, y);
    }
    out.pop();

    const palette = this._paletteData();
    if (!this._applyPaletteShader(out, palette)) this._applyPaletteCpu(out, palette);
    return out;
  }

  snapshot() {
    const s = super.snapshot();
    const ctl = this.config.modeControl || {};
    s.engineVersion = "0.9.0";
    s.modeAdvance = ctl.autoAdvance === false ? "MANUAL" : "AUTO";
    s.rupturePalette = this._ruptureShaderFailed ? "CPU" : "GPU";
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV090;
window.P5LAB_VISUAL_ENGINE_VERSION = "0.9.0";
