/** DODREI — tiny runtime controls: mode step + composition cadence. */
window.addEventListener("DOMContentLoaded", () => {
  const modeButton = document.getElementById("mode-next-button");
  const fpsButton = document.getElementById("composition-fps-button");
  const config = window.DODREI_CONFIG || window.P5LAB_CONFIG || {};
  const modeControl = config.visual?.modeControl || {};
  const FPS_OPTIONS = [15, 24, 30, 60];

  const stopPointer = (event) => {
    event.stopPropagation();
  };

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

  if (!fpsButton) return;

  const timing = config.timing || (config.timing = {});

  const currentFps = () => {
    const n = Number(timing.compositionFps);
    return Number.isFinite(n) && n > 0 ? n : 30;
  };

  const updateFpsButton = () => {
    const fps = currentFps();
    fpsButton.textContent = String(fps);
    fpsButton.setAttribute("aria-label", `Composition FPS ${fps}. Click to cycle.`);
    fpsButton.title = `Composition FPS: ${fps}`;
  };

  const nextFps = (current) => {
    const exact = FPS_OPTIONS.indexOf(current);
    if (exact >= 0) return FPS_OPTIONS[(exact + 1) % FPS_OPTIONS.length];
    return FPS_OPTIONS.find((fps) => fps > current) || FPS_OPTIONS[0];
  };

  fpsButton.addEventListener("pointerdown", stopPointer);
  fpsButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const next = nextFps(currentFps());
    timing.compositionFps = next;
    updateFpsButton();

    const engine = window.DODREI_VISUAL_ENGINE;
    if (engine && engine.telemetry && typeof engine.telemetry.event === "function") {
      engine.telemetry.event(`COMPOSITION FPS ${next}`);
    }
  });

  updateFpsButton();
});
