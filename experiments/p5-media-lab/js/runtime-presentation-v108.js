/** DODREI — RUNTIME PRESENTATION */
(() => {
  const config = window.DODREI_CONFIG || window.P5LAB_CONFIG;
  if (!config) return;
  config.telemetry = config.telemetry || {};
  config.telemetry.opacity = 0.26;
  config.telemetry.secondaryOpacity = 0.14;
  config.telemetry.faintOpacity = 0.07;
})();
