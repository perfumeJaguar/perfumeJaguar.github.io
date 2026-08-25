/** DODREI — tiny runtime controls: mode step + base FPS + visual speed. */
window.addEventListener("DOMContentLoaded", () => {
  const modeButton = document.getElementById("mode-next-button");
  const fpsButton = document.getElementById("composition-fps-button");
  // Keep the existing DOM id for compatibility; this is now VISUAL SPEED.
  const speedButton = document.getElementById("cut-speed-button");
  const config = window.DODREI_CONFIG || window.P5LAB_CONFIG || {};
  const modeControl = config.visual?.modeControl || {};
  const timing = config.timing || (config.timing = {});

  const FPS_OPTIONS = [15, 24, 30, 60];
  const SPEED_OPTIONS = [
    { level: "S1", multiplier: 0.25 },
    { level: "S2", multiplier: 0.75 },
    { level: "S3", multiplier: 1.00 },
    { level: "S4", multiplier: 1.50 },
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

  const currentSpeed = () => {
    const level = String(timing.visualSpeedLevel || timing.cutSpeedLevel || "").toUpperCase();
    const exact = SPEED_OPTIONS.find((option) => option.level === level);
    if (exact) return exact;

    const multiplier = Number(timing.visualSpeedMultiplier);
    if (Number.isFinite(multiplier) && multiplier > 0) {
      return SPEED_OPTIONS.reduce((best, option) =>
        Math.abs(option.multiplier - multiplier) < Math.abs(best.multiplier - multiplier) ? option : best,
      SPEED_OPTIONS[1]);
    }
    return SPEED_OPTIONS[1];
  };

  const updateSpeedButton = () => {
    if (!speedButton) return;
    const option = currentSpeed();
    speedButton.textContent = option.level;
    speedButton.setAttribute(
      "aria-label",
      `Visual speed ${option.level}, ${option.multiplier.toFixed(2)} times. Click to cycle.`
    );
    speedButton.title = `Visual speed ${option.level}: ${option.multiplier.toFixed(2)}x`;
  };

  const nextSpeed = (current) => {
    const index = SPEED_OPTIONS.findIndex((option) => option.level === current.level);
    return SPEED_OPTIONS[(index >= 0 ? index + 1 : 1) % SPEED_OPTIONS.length];
  };

  if (speedButton) {
    speedButton.addEventListener("pointerdown", stopPointer);
    speedButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const next = nextSpeed(currentSpeed());
      const engine = window.DODREI_VISUAL_ENGINE;

      if (engine && typeof engine.setVisualSpeed === "function") {
        engine.setVisualSpeed(next.level, next.multiplier);
      } else {
        timing.visualSpeedLevel = next.level;
        timing.visualSpeedMultiplier = next.multiplier;
        timing.cutSpeedLevel = next.level;
        if (engine && engine.telemetry && typeof engine.telemetry.event === "function") {
          engine.telemetry.event(`VISUAL SPEED ${next.level} ${next.multiplier.toFixed(2)}X`);
        }
      }
      updateSpeedButton();
    });
    updateSpeedButton();
  }
});
