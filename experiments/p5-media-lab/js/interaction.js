/**
 * One interaction vocabulary for mouse and touch.
 * Position, press/release and normalized swipe velocity are the only controls.
 */
class P5LabInteraction {
  constructor(config, telemetry) {
    this.config = config;
    this.telemetry = telemetry;
    this.targetX = 0.5; this.targetY = 0.5;
    this.x = 0.5; this.y = 0.5;
    this.pressed = false; this.pressure = 0;
    this.swipeSpeed = 0; this.targetSwipeSpeed = 0;
    this.lastMoveX = 0.5; this.lastMoveY = 0.5;
    this.lastMoveAt = performance.now();
    this.hasInteracted = false;
  }

  update() {
    this.x = P5LabUtils.lerp(this.x, this.targetX, this.config.smoothing);
    this.y = P5LabUtils.lerp(this.y, this.targetY, this.config.smoothing);
    this.pressure = P5LabUtils.lerp(this.pressure, this.pressed ? 1 : 0, this.pressed ? 0.2 : 0.08);

    const idleMs = performance.now() - this.lastMoveAt;
    if (!this.pressed || idleMs > 55) this.targetSwipeSpeed *= this.pressed ? 0.72 : 0.45;
    this.swipeSpeed = P5LabUtils.lerp(this.swipeSpeed, this.targetSwipeSpeed, this.pressed ? 0.32 : 0.18);
    if (this.swipeSpeed < 0.002) this.swipeSpeed = 0;
  }

  move(clientX, clientY) {
    const nx = P5LabUtils.clamp(clientX / Math.max(1, width), 0, 1);
    const ny = P5LabUtils.clamp(clientY / Math.max(1, height), 0, 1);
    const now = performance.now();
    const dt = Math.max(8, now - this.lastMoveAt) / 1000;
    const dx = nx - this.lastMoveX, dy = ny - this.lastMoveY;
    const screensPerSecond = Math.sqrt(dx * dx + dy * dy) / dt;
    // Roughly 3.2 screen-lengths/sec is treated as an intentionally fast swipe.
    this.targetSwipeSpeed = this.pressed ? P5LabUtils.clamp(screensPerSecond / 3.2, 0, 1) : 0;
    this.lastMoveX = nx; this.lastMoveY = ny; this.lastMoveAt = now;
    this.targetX = nx; this.targetY = ny;
    this.hasInteracted = true;
  }

  press(clientX, clientY) {
    this.pressed = true;
    this.lastMoveAt = performance.now();
    this.lastMoveX = P5LabUtils.clamp(clientX / Math.max(1, width), 0, 1);
    this.lastMoveY = P5LabUtils.clamp(clientY / Math.max(1, height), 0, 1);
    this.targetSwipeSpeed = 0; this.swipeSpeed = 0;
    this.move(clientX, clientY);
    this.telemetry.event("POINTER DOWN / RUPTURE HOLD");
  }

  release() {
    if (this.pressed) this.telemetry.event("POINTER UP");
    this.pressed = false;
    this.targetSwipeSpeed = 0;
  }

  snapshot() {
    return { x:this.x, y:this.y, pressure:this.pressure, pressed:this.pressed, swipeSpeed:this.swipeSpeed };
  }
}
window.P5LabInteraction = P5LabInteraction;
