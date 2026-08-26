/** DODREI — INTERACTION v1.0.20
 * Faster, velocity-aware release tail for touch rupture.
 */
class DodreiInteractionV1020 extends P5LabInteraction {
  constructor(config, telemetry) {
    super(config, telemetry);
    this.releaseEnergy = 0;
    this.releaseAt = -1e9;
  }

  update() {
    this.x = P5LabUtils.lerp(this.x, this.targetX, this.config.smoothing);
    this.y = P5LabUtils.lerp(this.y, this.targetY, this.config.smoothing);

    if (this.pressed) {
      this.pressure = P5LabUtils.lerp(this.pressure, 1, 0.2);
      this.releaseEnergy = 0;
    } else {
      // Short tail: a still hold disappears quickly; a fast swipe gets a little more air.
      const speedLift = P5LabUtils.clamp(this.releaseEnergy, 0, 1);
      const decay = 0.28 - speedLift * 0.10;
      this.pressure = P5LabUtils.lerp(this.pressure, 0, decay);
      if (this.pressure < 0.012) this.pressure = 0;
      this.releaseEnergy *= 0.82;
      if (this.releaseEnergy < 0.01) this.releaseEnergy = 0;
    }

    const idleMs = performance.now() - this.lastMoveAt;
    if (!this.pressed || idleMs > 55) this.targetSwipeSpeed *= this.pressed ? 0.72 : 0.32;
    this.swipeSpeed = P5LabUtils.lerp(this.swipeSpeed, this.targetSwipeSpeed, this.pressed ? 0.32 : 0.30);
    if (this.swipeSpeed < 0.002) this.swipeSpeed = 0;
  }

  release() {
    if (this.pressed) this.telemetry.event("POINTER UP / FRACTURE TAIL");
    this.releaseEnergy = P5LabUtils.clamp(Math.max(this.swipeSpeed, this.targetSwipeSpeed) * 1.15, 0, 1);
    this.releaseAt = performance.now();
    this.pressed = false;
    this.targetSwipeSpeed = 0;
  }

  snapshot() {
    const s = super.snapshot();
    const age = performance.now() - this.releaseAt;
    s.releaseEnergy = age < 420 ? this.releaseEnergy : 0;
    s.releaseAgeMs = age;
    return s;
  }
}
window.P5LabInteraction = DodreiInteractionV1020;
