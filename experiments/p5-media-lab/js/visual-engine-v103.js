/**
 * DODREI — VISUAL ENGINE v0.10.3
 * =============================================================================
 * Cut-speed separation layer on top of v0.10.2.
 *
 * v0.10.2 made the base visual cadence visible, but its cut tick was sampled from
 * the base-frame timestamp. That made image changes feel coupled to BASE FPS.
 *
 * v0.10.3 keeps the clocks independent:
 * - BASE VISUAL CLOCK: crop/layout/blend/LUMA state at 15/24/30/60fps;
 * - CUT CLOCK: image-choice/cut tempo from wall-clock millis(), independent of
 *   the base-frame sample time;
 * - POST FX CLOCK: every available outer render frame.
 *
 * The cut clock has four runtime presets. Default: S2 = 240ms.
 */
class DodreiVisualEngineV103 extends DodreiVisualEngineV102 {
  _baseClockState(interaction) {
    const timing = this._timingConfig();
    const fps = Math.max(1, Number(timing.compositionFps) || 30);
    const intervalMs = 1000 / fps;
    const now = millis();
    const frameIndex = Math.floor(now / intervalMs);
    const sampleMs = frameIndex * intervalMs;

    const press = interaction.pressure || 0;
    const slowdown = Math.max(0, Number(this.config.touchTransitionSlowdown) || 0);
    const configuredCutMs = Math.max(30, Number(timing.cutIntervalMs) || 240);
    const cutIntervalMs = configuredCutMs * (1 + press * slowdown);

    // Cut tempo follows real wall-clock time. The result is still sampled on the
    // next base frame, but changing BASE FPS no longer changes the cut clock.
    const cutTick = Math.floor(now / cutIntervalMs);

    return { fps, intervalMs, frameIndex, sampleMs, cutTick, cutIntervalMs };
  }

  setCutSpeed(level, intervalMs) {
    const timing = this._timingConfig();
    const nextLevel = String(level || "S2").toUpperCase();
    const nextMs = Math.max(30, Number(intervalMs) || 240);

    timing.cutSpeedLevel = nextLevel;
    timing.cutIntervalMs = nextMs;

    // Force an immediate sample so the runtime button cannot visually lag.
    this._compositionLastMs = -Infinity;

    if (this.telemetry && typeof this.telemetry.event === "function") {
      this.telemetry.event(`CUT SPEED ${nextLevel} ${Math.round(nextMs)}MS`);
    }

    return { level: nextLevel, intervalMs: nextMs };
  }

  snapshot() {
    const s = super.snapshot();
    const timing = this._timingConfig();
    s.engineVersion = "0.10.3";
    s.cutSpeedLevel = String(timing.cutSpeedLevel || "S2");
    s.cutIntervalMs = Math.max(30, Number(timing.cutIntervalMs) || 240);
    s.cutClock = "WALL_TIME";
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV103;
window.P5LAB_VISUAL_ENGINE_VERSION = "0.10.3";
