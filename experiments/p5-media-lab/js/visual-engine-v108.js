/**
 * DODREI — VISUAL ENGINE v0.10.8
 * Adds LOW SATURATION (LS) to the activation-ordered POST COMMON FX chain.
 * LS uses a lightweight canvas saturate() pass; 0.50 means half saturation.
 */
class DodreiVisualEngineV108 extends DodreiVisualEngineV107 {
  _postFxKeys() {
    return ["bw", "grayscale", "lowSaturation", "crush", "highContrast", "darken", "strongVignette"];
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
        crush: "CRUSH",
        highContrast: "HIGH CONTRAST",
        darken: "DARKEN",
        strongVignette: "STRONG VIGNETTE",
      }[key];
      const short = {
        bw: "BW",
        grayscale: "GS",
        lowSaturation: "LS",
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

  _lowSaturation(out, amount) {
    const s = this.postCommonScratch;
    s.clear();
    s.push();
    const ctx = s.drawingContext;
    ctx.save();
    ctx.filter = `saturate(${P5LabUtils.clamp(amount, 0, 1)})`;
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

  snapshot() {
    const s = super.snapshot();
    const f = this.postCommonFxConfig();
    s.engineVersion = "0.10.8";
    s.postCommonFx.lowSaturation = !!f.lowSaturation;
    s.postCommonFx.order = this.postCommonFxOrder().slice();
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV108;
window.P5LAB_VISUAL_ENGINE_VERSION = "0.10.8";
