/**
 * DODREI — VISUAL ENGINE v0.10.4
 * =============================================================================
 * Virtual visual-time layer on top of v0.10.3.
 *
 * v0.10.3 separated image cut timing from BASE FPS, but crop/layout/blend seeds
 * still used the sampled base-frame index directly. That made apparent visual
 * speed remain strongly tied to BASE FPS.
 *
 * v0.10.4 introduces a continuous virtual clock:
 * - VISUAL SPEED scales how fast virtual time advances;
 * - BASE FPS only samples that virtual timeline;
 * - image-choice cutTick and crop/layout/blend/LUMA state all derive from the
 *   same virtual timeline;
 * - POST FX stay on the outer render clock.
 */
class DodreiVisualEngineV104 extends DodreiVisualEngineV103 {
  constructor(config, telemetry) {
    super(config, telemetry);
    this._virtualTimeMs = 0;
    this._virtualLastWallMs = 0;
  }

  rebuild(w, h) {
    super.rebuild(w, h);
    // Preserve virtual position across resize, but discard the resize gap.
    this._virtualLastWallMs = millis();
  }

  _speedPreset() {
    const timing = this._timingConfig();
    const level = String(timing.visualSpeedLevel || timing.cutSpeedLevel || "S2").toUpperCase();
    const defaults = { S1: 0.5, S2: 0.75, S3: 1.0, S4: 1.5 };
    const fallback = defaults[level] || defaults.S2;
    const multiplier = Math.max(0.05, Number(timing.visualSpeedMultiplier) || fallback);
    return { level, multiplier };
  }

  _advanceVirtualClock(now) {
    const timing = this._timingConfig();
    const maxDeltaMs = Math.max(16, Number(timing.maxDeltaMs) || 100);
    const speed = this._speedPreset();

    if (!(this._virtualLastWallMs > 0)) {
      this._virtualLastWallMs = now;
      return speed;
    }

    const wallDelta = P5LabUtils.clamp(now - this._virtualLastWallMs, 0, maxDeltaMs);
    this._virtualLastWallMs = now;
    this._virtualTimeMs += wallDelta * speed.multiplier;
    return speed;
  }

  _baseClockState(interaction) {
    const timing = this._timingConfig();
    const fps = Math.max(1, Number(timing.compositionFps) || 30);
    const intervalMs = 1000 / fps;
    const now = millis();
    const speed = this._advanceVirtualClock(now);

    // Discrete visual-state timeline. Speed controls how fast this advances;
    // BASE FPS only decides how often the current state is sampled/displayed.
    const visualStateIntervalMs = Math.max(10, Number(timing.visualStateIntervalMs) || 45);
    const frameIndex = Math.floor(this._virtualTimeMs / visualStateIntervalMs);

    const press = interaction.pressure || 0;
    const slowdown = Math.max(0, Number(this.config.touchTransitionSlowdown) || 0);
    const baseCutIntervalMs = Math.max(30, Number(timing.cutIntervalMs) || 240);
    const cutIntervalMs = baseCutIntervalMs * (1 + press * slowdown);
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
      visualStateIntervalMs,
    };
  }

  setVisualSpeed(level, multiplier) {
    const timing = this._timingConfig();
    const nextLevel = String(level || "S2").toUpperCase();
    const nextMultiplier = Math.max(0.05, Number(multiplier) || 0.75);

    timing.visualSpeedLevel = nextLevel;
    timing.visualSpeedMultiplier = nextMultiplier;
    // Mirror the legacy field so older editor/telemetry code remains compatible.
    timing.cutSpeedLevel = nextLevel;

    // Keep accumulated virtual position; only future time advances faster/slower.
    this._virtualLastWallMs = millis();
    this._compositionLastMs = -Infinity;

    if (this.telemetry && typeof this.telemetry.event === "function") {
      this.telemetry.event(`VISUAL SPEED ${nextLevel} ${nextMultiplier.toFixed(2)}X`);
    }

    return { level: nextLevel, multiplier: nextMultiplier };
  }

  snapshot() {
    const s = super.snapshot();
    const timing = this._timingConfig();
    const speed = this._speedPreset();
    const baseCutMs = Math.max(30, Number(timing.cutIntervalMs) || 240);
    const visualStateIntervalMs = Math.max(10, Number(timing.visualStateIntervalMs) || 45);

    s.engineVersion = "0.10.4";
    s.visualSpeedLevel = speed.level;
    s.visualSpeedMultiplier = speed.multiplier;
    s.virtualTimeMs = this._virtualTimeMs;
    s.cutIntervalMs = baseCutMs;
    s.effectiveCutIntervalMs = baseCutMs / speed.multiplier;
    s.visualStateIntervalMs = visualStateIntervalMs;
    s.effectiveVisualStateHz = 1000 * speed.multiplier / visualStateIntervalMs;
    s.cutClock = "VIRTUAL_TIME";
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV104;
window.P5LAB_VISUAL_ENGINE_VERSION = "0.10.4";
