/**
 * One interaction vocabulary for mouse and touch.
 * No sliders or extra buttons: position and press/release are the only controls.
 */
class P5LabInteraction {
  constructor(config, telemetry) {
    this.config = config;
    this.telemetry = telemetry;
    this.targetX = 0.5;
    this.targetY = 0.5;
    this.x = 0.5;
    this.y = 0.5;
    this.pressed = false;
    this.pressure = 0;
    this.hasInteracted = false;
  }

  update() {
    this.x = P5LabUtils.lerp(this.x, this.targetX, this.config.smoothing);
    this.y = P5LabUtils.lerp(this.y, this.targetY, this.config.smoothing);
    const targetPressure = this.pressed ? 1 : 0;
    this.pressure = P5LabUtils.lerp(this.pressure, targetPressure, this.pressed ? 0.2 : 0.08);
  }

  move(clientX, clientY) {
    this.targetX = P5LabUtils.clamp(clientX / Math.max(1, width), 0, 1);
    this.targetY = P5LabUtils.clamp(clientY / Math.max(1, height), 0, 1);
    this.hasInteracted = true;
  }

  press(clientX, clientY) {
    this.move(clientX, clientY);
    this.pressed = true;
    this.telemetry.event("POINTER DOWN / SAMPLE HOLD");
  }

  release() {
    if (this.pressed) this.telemetry.event("POINTER UP");
    this.pressed = false;
  }

  snapshot() {
    return {
      x: this.x,
      y: this.y,
      pressure: this.pressure,
      pressed: this.pressed,
    };
  }
}

window.P5LabInteraction = P5LabInteraction;
