/**
 * DODREI — VISUAL ENGINE v1.0.4
 * =============================================================================
 * Touch-playback timing revision on top of v1.0.3.
 *
 * - while pointer/touch is held, the virtual visual timeline advances at 50%;
 * - this slows image cuts and crop/layout evolution together;
 * - touch rupture, swipe feedback, POST bypass, audio FX, and outer render FPS
 *   remain on their existing clocks and are not slowed here.
 */
class DodreiVisualEngineV1004 extends DodreiVisualEngineV1003 {
  _baseClockState(interaction) {
    const timing = this._timingConfig();
    const fps = Math.max(1, Number(timing.compositionFps) || 30);
    const intervalMs = 1000 / fps;
    const now = millis();
    const speed = this._speedPreset();
    const maxDeltaMs = Math.max(16, Number(timing.maxDeltaMs) || 100);

    const touchMultiplier = interaction?.pressed
      ? P5LabUtils.clamp(Number(this.config.touchPlaybackSpeedMultiplier) || 0.5, 0.05, 1)
      : 1;

    if (!(this._virtualLastWallMs > 0)) {
      this._virtualLastWallMs = now;
    } else {
      const wallDelta = P5LabUtils.clamp(now - this._virtualLastWallMs, 0, maxDeltaMs);
      this._virtualLastWallMs = now;
      this._virtualTimeMs += wallDelta * speed.multiplier * touchMultiplier;
    }

    const visualStateIntervalMs = Math.max(10, Number(timing.visualStateIntervalMs) || 45);
    const frameIndex = Math.floor(this._virtualTimeMs / visualStateIntervalMs);

    const baseCutIntervalMs = Math.max(30, Number(timing.cutIntervalMs) || 240);
    const cutIntervalMs = baseCutIntervalMs;
    const cutTick = Math.floor(this._virtualTimeMs / cutIntervalMs);

    return {
      fps,
      intervalMs,
      frameIndex,
      sampleMs: this._virtualTimeMs,
      cutTick,
      cutIntervalMs,
      visualSpeedLevel: speed.level,
      visualSpeedMultiplier: speed.multiplier,
      touchPlaybackSpeedMultiplier: touchMultiplier,
      visualStateIntervalMs,
    };
  }

  snapshot() {
    const s = super.snapshot();
    s.engineVersion = "1.0.4";
    s.touchPlaybackSpeedMultiplier = P5LabUtils.clamp(
      Number(this.config.touchPlaybackSpeedMultiplier) || 0.5,
      0.05,
      1
    );
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV1004;
window.P5LAB_VISUAL_ENGINE_VERSION = "1.0.4";
