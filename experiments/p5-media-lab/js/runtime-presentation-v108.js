/** DODREI — RUNTIME PRESENTATION v1.0.9 */
(() => {
  const config = window.DODREI_CONFIG || window.P5LAB_CONFIG;
  if (!config) return;
  config.app = config.app || {};
  config.app.version = "1.0.9";
  config.app.interfaceDelayMs = 1000;
  config.app.visualDelayMs = 4000;
  config.telemetry = config.telemetry || {};
  config.telemetry.opacity = 0.26;
  config.telemetry.secondaryOpacity = 0.14;
  config.telemetry.faintOpacity = 0.07;
})();
