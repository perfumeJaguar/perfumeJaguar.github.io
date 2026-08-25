/** DODREI — runtime controls: mode + base FPS + visual speed + POST COMMON FX + share. */
window.addEventListener("DOMContentLoaded", () => {
  const modeButton = document.getElementById("mode-next-button");
  const fpsButton = document.getElementById("composition-fps-button");
  const speedButton = document.getElementById("cut-speed-button");
  const postMasterButton = document.getElementById("post-fx-master-button");
  const shareButton = document.getElementById("share-settings-button");
  const shareToast = document.getElementById("share-toast");
  const config = window.DODREI_CONFIG || window.P5LAB_CONFIG || {};
  const modeControl = config.visual?.modeControl || {};
  const timing = config.timing || (config.timing = {});
  const visual = config.visual || (config.visual = {});
  const postFx = visual.postCommonFx || (visual.postCommonFx = {});

  const FPS_OPTIONS = [15, 24, 30, 60];
  const SPEED_OPTIONS = [
    { level: "S1", multiplier: 0.25 },
    { level: "S2", multiplier: 0.50 },
    { level: "S3", multiplier: 0.70 },
    { level: "S4", multiplier: 1.00 },
    { level: "S5", multiplier: 1.50 },
  ];
  const POST_FX_OPTIONS = [
    { id: "post-fx-bw-button", key: "bw", label: "BW", title: "Binary black / white" },
    { id: "post-fx-gray-button", key: "grayscale", label: "GS", title: "Grayscale" },
    { id: "post-fx-low-sat-button", key: "lowSaturation", label: "LS", title: "Low saturation" },
    { id: "post-fx-blur-button", key: "blur", label: "BL", title: "Soft blur" },
    { id: "post-fx-crush-button", key: "crush", label: "CR", title: "Common Crush" },
    { id: "post-fx-contrast-button", key: "highContrast", label: "HC", title: "High contrast color" },
    { id: "post-fx-darken-button", key: "darken", label: "DK", title: "Darken overlay" },
    { id: "post-fx-vignette-button", key: "strongVignette", label: "VG", title: "Strong vignette" },
  ];

  const stopPointer = (event) => event.stopPropagation();

  if (modeButton) {
    if (modeControl.manualButtonEnabled === false) modeButton.hidden = true;
    else {
      modeButton.addEventListener("pointerdown", stopPointer);
      modeButton.addEventListener("click", (event) => {
        event.preventDefault(); event.stopPropagation();
        const engine = window.DODREI_VISUAL_ENGINE;
        if (engine && typeof engine.manualAdvanceMode === "function") engine.manualAdvanceMode();
      });
    }
  }

  const currentFps = () => {
    const n = Number(timing.compositionFps);
    return Number.isFinite(n) && n > 0 ? n : 24;
  };
  const updateFpsButton = () => {
    if (!fpsButton) return;
    const fps = currentFps();
    fpsButton.textContent = String(fps);
    fpsButton.setAttribute("aria-label", `Base visual FPS ${fps}. Click to cycle.`);
    fpsButton.title = `Base visual FPS: ${fps}`;
  };
  const nextFps = (current) => {
    const exact = FPS_OPTIONS.indexOf(current);
    if (exact >= 0) return FPS_OPTIONS[(exact + 1) % FPS_OPTIONS.length];
    return FPS_OPTIONS.find((fps) => fps > current) || FPS_OPTIONS[0];
  };

  if (fpsButton) {
    fpsButton.addEventListener("pointerdown", stopPointer);
    fpsButton.addEventListener("click", (event) => {
      event.preventDefault(); event.stopPropagation();
      const next = nextFps(currentFps());
      const engine = window.DODREI_VISUAL_ENGINE;
      if (engine && typeof engine.setBaseVisualFps === "function") engine.setBaseVisualFps(next);
      else timing.compositionFps = next;
      updateFpsButton();
    });
    updateFpsButton();
  }

  const currentSpeed = () => {
    const level = String(timing.visualSpeedLevel || timing.cutSpeedLevel || "").toUpperCase();
    const exact = SPEED_OPTIONS.find((option) => option.level === level);
    if (exact) return exact;
    const multiplier = Number(timing.visualSpeedMultiplier);
    if (Number.isFinite(multiplier) && multiplier > 0) {
      return SPEED_OPTIONS.reduce((best, option) =>
        Math.abs(option.multiplier - multiplier) < Math.abs(best.multiplier - multiplier) ? option : best,
      SPEED_OPTIONS[0]);
    }
    return SPEED_OPTIONS[1];
  };
  const updateSpeedButton = () => {
    if (!speedButton) return;
    const option = currentSpeed();
    speedButton.textContent = option.level;
    speedButton.setAttribute("aria-label", `Visual speed ${option.level}, ${option.multiplier.toFixed(2)} times. Click to cycle.`);
    speedButton.title = `Visual speed ${option.level}: ${option.multiplier.toFixed(2)}x`;
  };
  const nextSpeed = (current) => {
    const index = SPEED_OPTIONS.findIndex((option) => option.level === current.level);
    return SPEED_OPTIONS[(index >= 0 ? index + 1 : 0) % SPEED_OPTIONS.length];
  };

  if (speedButton) {
    speedButton.addEventListener("pointerdown", stopPointer);
    speedButton.addEventListener("click", (event) => {
      event.preventDefault(); event.stopPropagation();
      const next = nextSpeed(currentSpeed());
      const engine = window.DODREI_VISUAL_ENGINE;
      if (engine && typeof engine.setVisualSpeed === "function") engine.setVisualSpeed(next.level, next.multiplier);
      else {
        timing.visualSpeedLevel = next.level;
        timing.visualSpeedMultiplier = next.multiplier;
        timing.cutSpeedLevel = next.level;
      }
      updateSpeedButton();
    });
    updateSpeedButton();
  }

  const postMasterEnabled = () => postFx.masterEnabled !== false;
  const updatePostMasterButton = () => {
    if (!postMasterButton) return;
    const enabled = postMasterEnabled();
    postMasterButton.textContent = "POST";
    postMasterButton.setAttribute("aria-pressed", enabled ? "true" : "false");
    postMasterButton.setAttribute("aria-label", `Post common FX master: ${enabled ? "on" : "bypassed"}. Click to toggle.`);
    postMasterButton.title = `POST COMMON FX: ${enabled ? "ON" : "BYPASS"}`;
  };
  const updatePostFxButton = (button, option) => {
    const enabled = !!postFx[option.key];
    button.textContent = option.label;
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.setAttribute("aria-label", `Post common FX ${option.title}: ${enabled ? "on" : "off"}. Click to toggle.`);
    button.title = `${option.title}: ${enabled ? "ON" : "OFF"}`;
  };
  const updatePostFxLock = () => {
    const locked = !postMasterEnabled();
    for (const option of POST_FX_OPTIONS) {
      const button = document.getElementById(option.id);
      if (!button) continue;
      button.disabled = locked;
      button.setAttribute("aria-disabled", locked ? "true" : "false");
    }
  };

  if (postMasterButton) {
    postMasterButton.addEventListener("pointerdown", stopPointer);
    postMasterButton.addEventListener("click", (event) => {
      event.preventDefault(); event.stopPropagation();
      const next = !postMasterEnabled();
      const engine = window.DODREI_VISUAL_ENGINE;
      if (engine && typeof engine.setPostMasterEnabled === "function") engine.setPostMasterEnabled(next);
      else postFx.masterEnabled = next;
      updatePostMasterButton(); updatePostFxLock();
    });
  }

  for (const option of POST_FX_OPTIONS) {
    const button = document.getElementById(option.id);
    if (!button) continue;
    button.addEventListener("pointerdown", stopPointer);
    button.addEventListener("click", (event) => {
      event.preventDefault(); event.stopPropagation();
      if (!postMasterEnabled()) return;
      const next = !postFx[option.key];
      const engine = window.DODREI_VISUAL_ENGINE;
      if (engine && typeof engine.setPostCommonFx === "function") engine.setPostCommonFx(option.key, next);
      else postFx[option.key] = next;
      updatePostFxButton(button, option);
    });
    updatePostFxButton(button, option);
  }

  let toastTimer = null;
  const showShareToast = (message) => {
    if (!shareToast) return;
    shareToast.textContent = message;
    shareToast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => shareToast.classList.remove("is-visible"), 1200);
  };
  const fallbackCopy = (text) => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  };

  if (shareButton) {
    shareButton.addEventListener("pointerdown", stopPointer);
    shareButton.addEventListener("click", async (event) => {
      event.preventDefault(); event.stopPropagation();
      const url = window.DODREI_URL_PRESET?.buildShareUrl?.() || window.location.href;
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
        else if (!fallbackCopy(url)) throw new Error("copy unavailable");
        showShareToast("LINK COPIED");
      } catch (_) {
        try {
          if (!fallbackCopy(url)) throw new Error("copy failed");
          showShareToast("LINK COPIED");
        } catch (_) {
          showShareToast("COPY FAILED");
        }
      }
    });
  }

  updatePostMasterButton();
  updatePostFxLock();
});
