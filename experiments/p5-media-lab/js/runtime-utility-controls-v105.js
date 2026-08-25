/** DODREI — PAUSE / MUTE UTILITY CONTROLS v1.0.5 */
window.addEventListener("DOMContentLoaded", () => {
  const pauseButton = document.getElementById("runtime-pause-button");
  const muteButton = document.getElementById("runtime-mute-button");
  const stopPointer = (event) => event.stopPropagation();

  const setPressed = (button, pressed, label, title) => {
    if (!button) return;
    button.setAttribute("aria-pressed", pressed ? "true" : "false");
    button.setAttribute("aria-label", label);
    button.title = title;
  };

  if (pauseButton) {
    const refreshPause = () => {
      const paused = !!window.DODREI_RUNTIME_PAUSED;
      pauseButton.textContent = "PAU";
      setPressed(
        pauseButton,
        paused,
        paused ? "Resume visual playback" : "Pause visual playback",
        paused ? "Resume visual playback" : "Pause visual playback"
      );
    };

    pauseButton.addEventListener("pointerdown", stopPointer);
    pauseButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const next = !window.DODREI_RUNTIME_PAUSED;
      if (typeof window.DODREI_SET_PAUSED === "function") window.DODREI_SET_PAUSED(next);
      else {
        window.DODREI_RUNTIME_PAUSED = next;
        try { if (next && typeof noLoop === "function") noLoop(); else if (!next && typeof loop === "function") loop(); } catch (_) {}
      }
      refreshPause();
    });
    refreshPause();
  }

  if (muteButton) {
    const refreshMute = () => {
      const engine = window.DODREI_AUDIO_ENGINE;
      const muted = engine && typeof engine.isMuted === "function" ? engine.isMuted() : !!window.DODREI_RUNTIME_MUTED;
      muteButton.textContent = "MUT";
      setPressed(
        muteButton,
        muted,
        muted ? "Unmute audio" : "Mute audio",
        muted ? "Unmute audio" : "Mute audio"
      );
    };

    muteButton.addEventListener("pointerdown", stopPointer);
    muteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const engine = window.DODREI_AUDIO_ENGINE;
      const current = engine && typeof engine.isMuted === "function" ? engine.isMuted() : !!window.DODREI_RUNTIME_MUTED;
      const next = !current;
      window.DODREI_RUNTIME_MUTED = next;
      if (engine && typeof engine.setMuted === "function") engine.setMuted(next);
      refreshMute();
    });
    refreshMute();
  }
});
