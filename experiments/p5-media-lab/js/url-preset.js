/**
 * DODREI — URL PRESET / SHARE LINK
 * =============================================================================
 * Reads a small, validated set of runtime controls from location.search before
 * the visual engine is created. Invalid values are ignored so config defaults
 * remain authoritative.
 *
 * Supported query parameters:
 *   fps=15|24|30|60
 *   speed=S1|S2|S3|S4|S5
 *   post=0|1
 *   fx=HC,LS,BL,DK   (ordered; NONE is also valid)
 *   mode=<preset id>
 */
(() => {
  const config = window.DODREI_CONFIG || window.P5LAB_CONFIG;
  if (!config) return;

  const timing = config.timing || (config.timing = {});
  const visual = config.visual || (config.visual = {});
  const postFx = visual.postCommonFx || (visual.postCommonFx = {});
  const modeControl = visual.modeControl || (visual.modeControl = {});
  const presets = Array.isArray(visual.presets) ? visual.presets : [];

  const FPS_VALUES = [15, 24, 30, 60];
  const SPEED_VALUES = {
    S1: 0.25,
    S2: 0.50,
    S3: 0.70,
    S4: 1.00,
    S5: 1.50,
  };
  const FX_BY_TOKEN = {
    BW: "bw",
    GS: "grayscale",
    LS: "lowSaturation",
    BL: "blur",
    CR: "crush",
    HC: "highContrast",
    DK: "darken",
    VG: "strongVignette",
  };
  const TOKEN_BY_FX = Object.fromEntries(Object.entries(FX_BY_TOKEN).map(([token, key]) => [key, token]));
  const FX_KEYS = Object.values(FX_BY_TOKEN);
  const PARAM_KEYS = ["fps", "speed", "post", "fx", "mode"];

  const params = new URLSearchParams(window.location.search);
  const applied = {};

  if (params.has("fps")) {
    const fps = Number(params.get("fps"));
    if (FPS_VALUES.includes(fps)) {
      timing.compositionFps = fps;
      applied.fps = fps;
    }
  }

  if (params.has("speed")) {
    const speed = String(params.get("speed") || "").trim().toUpperCase();
    if (Object.prototype.hasOwnProperty.call(SPEED_VALUES, speed)) {
      timing.visualSpeedLevel = speed;
      timing.visualSpeedMultiplier = SPEED_VALUES[speed];
      timing.cutSpeedLevel = speed;
      applied.speed = speed;
    }
  }

  if (params.has("post")) {
    const value = String(params.get("post") || "").trim();
    if (value === "0" || value === "1") {
      postFx.masterEnabled = value === "1";
      applied.post = value;
    }
  }

  if (params.has("fx")) {
    const raw = String(params.get("fx") || "").trim().toUpperCase();
    const tokens = raw === "NONE"
      ? []
      : raw.split(",").map((item) => item.trim()).filter(Boolean);
    const unique = new Set(tokens);
    const valid = raw === "NONE" || (
      tokens.length > 0 &&
      unique.size === tokens.length &&
      tokens.every((token) => Object.prototype.hasOwnProperty.call(FX_BY_TOKEN, token))
    );

    if (valid) {
      for (const key of FX_KEYS) postFx[key] = false;
      postFx.order = [];
      for (const token of tokens) {
        const key = FX_BY_TOKEN[token];
        postFx[key] = true;
        postFx.order.push(key);
      }
      applied.fx = raw;
    }
  }

  if (params.has("mode")) {
    const mode = String(params.get("mode") || "").trim().toLowerCase();
    const index = presets.findIndex((preset) => String(preset?.id || "").toLowerCase() === mode);
    if (index >= 0) {
      modeControl.startIndex = index;
      applied.mode = presets[index].id;
    }
  }

  const activeFxTokens = () => {
    const order = Array.isArray(postFx.order) ? postFx.order : [];
    const result = [];
    const seen = new Set();
    for (const key of order) {
      if (!TOKEN_BY_FX[key] || !postFx[key] || seen.has(key)) continue;
      seen.add(key);
      result.push(TOKEN_BY_FX[key]);
    }
    for (const key of FX_KEYS) {
      if (!TOKEN_BY_FX[key] || !postFx[key] || seen.has(key)) continue;
      seen.add(key);
      result.push(TOKEN_BY_FX[key]);
    }
    return result;
  };

  const currentModeId = () => {
    const engine = window.DODREI_VISUAL_ENGINE;
    try {
      const preset = engine && typeof engine.currentPreset === "function" ? engine.currentPreset() : null;
      if (preset?.id) return preset.id;
    } catch (_) {}
    const index = Math.max(0, Math.min(presets.length - 1, Number(modeControl.startIndex) || 0));
    return presets[index]?.id || "";
  };

  const currentSpeedLevel = () => {
    const level = String(timing.visualSpeedLevel || timing.cutSpeedLevel || "").toUpperCase();
    if (Object.prototype.hasOwnProperty.call(SPEED_VALUES, level)) return level;
    const multiplier = Number(timing.visualSpeedMultiplier);
    let best = "S2";
    let bestDistance = Infinity;
    for (const [name, value] of Object.entries(SPEED_VALUES)) {
      const d = Math.abs(value - multiplier);
      if (d < bestDistance) { best = name; bestDistance = d; }
    }
    return best;
  };

  const buildShareUrl = () => {
    const url = new URL(window.location.href);
    for (const key of PARAM_KEYS) url.searchParams.delete(key);

    const fps = Number(timing.compositionFps);
    url.searchParams.set("fps", FPS_VALUES.includes(fps) ? String(fps) : "24");
    url.searchParams.set("speed", currentSpeedLevel());
    url.searchParams.set("post", postFx.masterEnabled === false ? "0" : "1");

    const tokens = activeFxTokens();
    url.searchParams.set("fx", tokens.length ? tokens.join(",") : "NONE");

    const mode = currentModeId();
    if (mode) url.searchParams.set("mode", mode);

    return url.toString();
  };

  config.meta = config.meta || {};
  config.meta.urlPresetApplied = Object.keys(applied).length ? applied : null;

  window.DODREI_URL_PRESET = {
    buildShareUrl,
    applied,
    supported: {
      fps: FPS_VALUES.slice(),
      speed: Object.keys(SPEED_VALUES),
      fx: Object.keys(FX_BY_TOKEN),
    },
  };
})();
