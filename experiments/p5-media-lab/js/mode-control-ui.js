/** DODREI — tiny manual mode-step control. */
window.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("mode-next-button");
  if (!button) return;

  const ctl = window.DODREI_CONFIG?.visual?.modeControl || {};
  if (ctl.manualButtonEnabled === false) {
    button.hidden = true;
    return;
  }

  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const engine = window.DODREI_VISUAL_ENGINE;
    if (engine && typeof engine.manualAdvanceMode === "function") {
      engine.manualAdvanceMode();
    }
  });
});
