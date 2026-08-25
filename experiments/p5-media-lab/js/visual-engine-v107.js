/**
 * DODREI — VISUAL ENGINE v0.10.7
 * Ordered POST COMMON FX + grayscale layer on top of v0.10.5.
 *
 * POST COMMON FX order is no longer hard-coded. Enabling an effect appends it
 * to the active chain; disabling removes it. Re-enabling therefore moves it to
 * the end of the chain. Startup order is supplied by config.postCommonFx.order.
 */
class DodreiVisualEngineV107 extends DodreiVisualEngineV105 {
  _postFxKeys() {
    return ["bw", "grayscale", "crush", "highContrast", "darken", "strongVignette"];
  }

  postCommonFxOrder() {
    const f = this.postCommonFxConfig();
    const allowed = this._postFxKeys();
    const active = allowed.filter((key) => !!f[key]);
    const seen = new Set();
    const order = [];

    if (Array.isArray(f.order)) {
      for (const key of f.order) {
        if (!allowed.includes(key) || !f[key] || seen.has(key)) continue;
        seen.add(key);
        order.push(key);
      }
    }
    for (const key of active) {
      if (seen.has(key)) continue;
      seen.add(key);
      order.push(key);
    }

    f.order = order;
    return order;
  }

  hasPostCommonFx() {
    return this.postCommonFxOrder().length > 0;
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
        crush: "CRUSH",
        highContrast: "HIGH CONTRAST",
        darken: "DARKEN",
        strongVignette: "STRONG VIGNETTE",
      }[key];
      const short = {
        bw: "BW",
        grayscale: "GS",
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

  _grayscale(out) {
    const s = this.postCommonScratch;
    s.clear();
    s.push();
    const ctx = s.drawingContext;
    ctx.save();
    ctx.filter = "grayscale(1)";
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
      } else if (key === "darken") {
        this._darken(stage, Number(f.darkenAlpha) || 0.46);
      } else if (key === "strongVignette") {
        this._strongVignette(stage, Number(f.strongVignetteStrength) || 0.96, Number(f.strongVignetteInner) || 0.16, Number(f.strongVignetteOuter) || 0.72);
      }
    }

    // Keep one stable cached surface regardless of which effect happened last.
    if (stage !== this.postCommonBuffer) stage = this._copyPost(stage);
    this._postCommonDirty = false;
    return stage;
  }

  snapshot() {
    const s = super.snapshot();
    const f = this.postCommonFxConfig();
    s.engineVersion = "0.10.7";
    s.postCommonFx = {
      bw: !!f.bw,
      grayscale: !!f.grayscale,
      crush: !!f.crush,
      highContrast: !!f.highContrast,
      darken: !!f.darken,
      strongVignette: !!f.strongVignette,
      order: this.postCommonFxOrder().slice(),
    };
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV107;
window.P5LAB_VISUAL_ENGINE_VERSION = "0.10.7";
