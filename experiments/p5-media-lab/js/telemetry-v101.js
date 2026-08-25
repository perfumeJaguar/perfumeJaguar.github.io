/**
 * DODREI — TELEMETRY STYLE PATCH v1.0.1
 * =============================================================================
 * Keeps the existing telemetry data/corruption logic, but changes presentation:
 * - IBM Plex Mono (with monospace fallback)
 * - muted gray-green text instead of pure white
 * - lower alpha hierarchy
 * - very subtle stable drift + occasional per-line horizontal displacement
 *
 * No blur, shadow stack, or chromatic split is used here; the goal is a dry,
 * institutional/backrooms tone with negligible extra rendering cost.
 */
(() => {
  const Telemetry = window.P5LabTelemetry;
  if (!Telemetry || !Telemetry.prototype.render) return;

  const baseRender = Telemetry.prototype.render;
  const baseDrawLines = Telemetry.prototype.drawLines;

  const hash32 = (seed) => {
    let x = (Math.floor(seed) | 0) ^ 0x85ebca6b;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return x >>> 0;
  };

  Telemetry.prototype.drawLines = function styledDrawLines(lines, x, y, lineHeight) {
    const cfg = window.P5LAB_CONFIG?.telemetry || this.config || {};
    const chance = P5LabUtils.clamp(Number(cfg.lineJitterChance) || 0, 0, 1);
    const amount = Math.max(0, Number(cfg.lineJitterPx) || 0);
    const slotMs = Math.max(120, Number(cfg.glitchIntervalMs) || 260);
    const slot = Math.floor(millis() / slotMs);

    for (let i = 0; i < lines.length; i += 1) {
      let dx = 0;
      if (chance > 0 && amount > 0) {
        const h = hash32(slot * 4099 + Math.floor(y + i * lineHeight) * 31 + i * 137);
        if ((h / 4294967295) < chance) {
          const sign = (hash32(h + 17) & 1) ? 1 : -1;
          const scale = 0.45 + (hash32(h + 29) / 4294967295) * 0.55;
          dx = sign * amount * scale;
        }
      }
      baseDrawLines.call(this, [lines[i]], x + dx, y + i * lineHeight, lineHeight);
    }
  };

  Telemetry.prototype.render = function styledRender(snapshot) {
    const cfg = window.P5LAB_CONFIG?.telemetry || this.config || {};
    const rgb = Array.isArray(cfg.textColor) && cfg.textColor.length >= 3
      ? cfg.textColor.map((v) => P5LabUtils.clamp(Number(v) || 0, 0, 255))
      : [190, 215, 196];
    const font = String(cfg.fontFamily || "IBM Plex Mono");
    const driftPx = Math.max(0, Number(cfg.driftPx) || 0);
    const driftIntervalMs = Math.max(1000, Number(cfg.driftIntervalMs) || 7000);
    const driftSlot = Math.floor(millis() / driftIntervalMs);
    const hx = hash32(driftSlot * 101 + 7);
    const hy = hash32(driftSlot * 131 + 11);
    const dx = driftPx > 0 ? ((hx % 3) - 1) * driftPx : 0;
    const dy = driftPx > 0 ? ((hy % 3) - 1) * driftPx : 0;

    const originalTextFont = window.textFont;
    const originalFill = window.fill;
    const originalTranslate = window.translate;
    let firstTranslate = true;

    try {
      if (typeof originalTextFont === "function") {
        window.textFont = function patchedTextFont(value, ...rest) {
          const chosen = value === "monospace" ? font : value;
          return originalTextFont.call(window, chosen, ...rest);
        };
      }

      if (typeof originalFill === "function") {
        window.fill = function patchedFill(...args) {
          if (args.length === 1 && typeof args[0] === "number") {
            const alpha = P5LabUtils.clamp(args[0], 0, 255);
            return originalFill.call(window, rgb[0], rgb[1], rgb[2], alpha);
          }
          return originalFill.apply(window, args);
        };
      }

      if (typeof originalTranslate === "function") {
        window.translate = function patchedTranslate(x, y, ...rest) {
          if (firstTranslate) {
            firstTranslate = false;
            return originalTranslate.call(window, (Number(x) || 0) + dx, (Number(y) || 0) + dy, ...rest);
          }
          return originalTranslate.call(window, x, y, ...rest);
        };
      }

      return baseRender.call(this, snapshot);
    } finally {
      if (originalTextFont) window.textFont = originalTextFont;
      if (originalFill) window.fill = originalFill;
      if (originalTranslate) window.translate = originalTranslate;
    }
  };

  Telemetry.prototype.render._dodreiV101 = true;
  Telemetry.prototype.render._baseRender = baseRender;
})();
