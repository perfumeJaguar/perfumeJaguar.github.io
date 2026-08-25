/** DODREI — tiny runtime controls: mode step + base FPS + cut speed. */
window.addEventListener("DOMContentLoaded", () => {
  const modeButton = document.getElementById("mode-next-button");
  const fpsButton = document.getElementById("composition-fps-button");
  const cutButton = document.getElementById("cut-speed-button");
  const config = window.DODREI_CONFIG || window.P5LAB_CONFIG || {};
  const modeControl = config.visual?.modeControl || {};
  const timing = config.timing || (config.timing = {});

  const FPS_OPTIONS = [15, 24, 30, 60];
  const CUT_OPTIONS = [
    { level: "S1", ms: 320 },
    { level: "S2", ms: 240 },
    { level: "S3", ms: 170 },
    { level: "S4", ms: 110 },
  ];

  const stopPointer = (event) => event.stopPropagation();

  if (modeButton) {
    if (modeControl.manualButtonEnabled === false) {
      modeButton.hidden = true;
    } else {
      modeButton.addEventListener("pointerdown", stopPointer);
      modeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const engine = window.DODREI_VISUAL_ENGINE;
        if (engine && typeof engine.manualAdvanceMode === "function") {
          engine.manualAdvanceMode();
        }
      });
    }
  }

  const currentFps = () => {
    const n = Number(timing.compositionFps);
    return Number.isFinite(n) && n > 0 ? n : 30;
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
      event.preventDefault();
      event.stopPropagation();
      const next = nextFps(currentFps());
      const engine = window.DODREI_VISUAL_ENGINE;

      if (engine && typeof engine.setBaseVisualFps === "function") {
        engine.setBaseVisualFps(next);
      } else {
        timing.compositionFps = next;
        if (engine && engine.telemetry && typeof engine.telemetry.event === "function") {
          engine.telemetry.event(`BASE VISUAL FPS ${next}`);
        }
      }
      updateFpsButton();
    });
    updateFpsButton();
  }

  const currentCut = () => {
    const level = String(timing.cutSpeedLevel || "").toUpperCase();
    const exact = CUT_OPTIONS.find((option) => option.level === level);
    if (exact) return exact;

    const ms = Number(timing.cutIntervalMs);
    if (Number.isFinite(ms) && ms > 0) {
      return CUT_OPTIONS.reduce((best, option) =>
        Math.abs(option.ms - ms) < Math.abs(best.ms - ms) ? option : best,
      CUT_OPTIONS[1]);
    }
    return CUT_OPTIONS[1];
  };

  const updateCutButton = () => {
    if (!cutButton) return;
    const option = currentCut();
    cutButton.textContent = option.level;
    cutButton.setAttribute(
      "aria-label",
      `Cut speed ${option.level}, ${option.ms} milliseconds. Click to cycle.`
    );
    cutButton.title = `Cut speed ${option.level}: ${option.ms} ms`;
  };

  const nextCut = (current) => {
    const index = CUT_OPTIONS.findIndex((option) => option.level === current.level);
    return CUT_OPTIONS[(index >= 0 ? index + 1 : 1) % CUT_OPTIONS.length];
  };

  if (cutButton) {
    cutButton.addEventListener("pointerdown", stopPointer);
    cutButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const next = nextCut(currentCut());
      const engine = window.DODREI_VISUAL_ENGINE;

      if (engine && typeof engine.setCutSpeed === "function") {
        engine.setCutSpeed(next.level, next.ms);
      } else {
        timing.cutSpeedLevel = next.level;
        timing.cutIntervalMs = next.ms;
        if (engine && engine.telemetry && typeof engine.telemetry.event === "function") {
          engine.telemetry.event(`CUT SPEED ${next.level} ${next.ms}MS`);
        }
      }
      updateCutButton();
    });
    updateCutButton();
  }
});
