/** DODREI — VISUAL ENGINE v1.0.20
 * Irregular held rupture pattern + brief release fracture.
 * Keeps the same low-resolution rupture buffers and palette shader path.
 */
class DodreiVisualEngineV1020 extends DodreiVisualEngineV1015 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this._rupturePattern = null;
    this._rupturePatternAt = -1e9;
    this._rupturePatternSerial = 0;
  }

  _newRupturePattern(out, intensity, releaseEnergy) {
    const seed = (++this._rupturePatternSerial) * 997 + Math.floor(millis() / 37);
    const pieces = [];
    let y = 0, n = 0;
    while (y < out.height && n < 26) {
      const r = this.rand01(seed + n * 31);
      // Mostly narrow slices, with rare broad fractures.
      const frac = r > 0.88
        ? 0.15 + this.rand01(seed + n * 47) * 0.15
        : 0.022 + Math.pow(this.rand01(seed + n * 53), 1.8) * 0.065;
      const h = Math.max(2, Math.min(out.height - y, out.height * frac));
      const active = this.rand01(seed + n * 61) < (0.34 + intensity * 0.13 + releaseEnergy * 0.12);
      const extreme = active && this.rand01(seed + n * 71) < (0.08 + intensity * 0.08 + releaseEnergy * 0.16);
      const dir = this.rand01(seed + n * 79) < 0.5 ? -1 : 1;
      const small = 0.025 + this.rand01(seed + n * 83) * (0.055 + intensity * 0.055);
      const large = 0.18 + this.rand01(seed + n * 89) * 0.22;
      pieces.push({ y, h, active, shift: dir * out.width * (extreme ? large : small) });
      y += h;
      n++;
    }
    return pieces;
  }

  applyTouchRupture(src, i, a, t) {
    const out = this.ruptureBuffer;
    const scratch = this.ruptureScratch;
    const mobile = P5LabUtils.isMobileLayout();
    const skip = Math.max(1, mobile ? (this.config.touchRuptureFrameSkipMobile || 2) : (this.config.touchRuptureFrameSkipDesktop || 1));
    const now = millis();
    const freshGesture = (now - this._lastRuptureCallMs) > 80;
    this._lastRuptureCallMs = now;
    this._ruptureFrameCounter++;
    if (!freshGesture && skip > 1 && (this._ruptureFrameCounter % skip) !== 1) return out;

    out.clear(); scratch.clear();
    scratch.push();
    const ctx = scratch.drawingContext; ctx.save();
    ctx.filter = `grayscale(1) contrast(${this.config.touchRuptureContrast})`;
    scratch.image(src, 0, 0, scratch.width, scratch.height);
    ctx.restore(); scratch.pop();
    out.image(scratch, 0, 0, out.width, out.height);

    const releaseEnergy = P5LabUtils.clamp(Number(i.releaseEnergy) || 0, 0, 1);
    const releaseAge = Number(i.releaseAgeMs);
    const releaseBurst = !i.pressed && Number.isFinite(releaseAge) && releaseAge >= 0 && releaseAge < 210
      ? releaseEnergy * (1 - releaseAge / 210)
      : 0;
    const intensity = P5LabUtils.clamp((Number(i.pressure) || 0) * 0.72 + (Number(i.swipeSpeed) || 0) * 0.55 + releaseBurst * 0.85, 0, 1.35);
    const holdMs = 70 + this.rand01(this._rupturePatternSerial * 101 + 17) * 80;
    if (!this._rupturePattern || now - this._rupturePatternAt > holdMs || releaseBurst > 0.45) {
      this._rupturePattern = this._newRupturePattern(out, intensity, releaseBurst);
      this._rupturePatternAt = now;
    }

    for (const band of this._rupturePattern) {
      if (!band.active) continue;
      const amp = 0.52 + intensity * 0.72;
      const shift = band.shift * amp;
      out.image(scratch, shift, band.y, out.width, band.h + 1, 0, band.y, scratch.width, band.h + 1);
    }

    out.push();
    out.stroke(255, 12 + intensity * 42);
    out.strokeWeight(1);
    const lineCount = releaseBurst > 0.12 ? 9 : 5;
    for (let n = 0; n < lineCount; n++) {
      if (this.rand01(t * 331 + n * 23) > 0.58 + releaseBurst * 0.18) continue;
      const y = this.rand01(t * 401 + n * 29) * out.height;
      out.line(0, y, out.width, y);
    }
    out.pop();

    const palette = this._paletteData();
    if (!this._applyPaletteShader(out, palette)) this._applyPaletteCpu(out, palette);
    return out;
  }

  snapshot() { const s = super.snapshot(); s.engineVersion = "1.0.20"; return s; }
}
window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV1020;
window.P5LAB_VISUAL_ENGINE_VERSION = "1.0.20";
