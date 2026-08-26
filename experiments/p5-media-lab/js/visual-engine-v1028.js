/** DODREI — VISUAL ENGINE v1.0.28
 * Memory recall presentation returns to text-only.
 *
 * - the v1.0.27 thumbnail is removed completely from the canvas path;
 * - readability dimming is now a full-frame translucent black field, leaving
 *   room for future recall media without tying the composition to a text panel;
 * - the shade enters quickly and MEMORY id/body copy fade in more gently;
 * - shade + text are still composited BEFORE the current ordered POST chain, so
 *   HC/GS/FB/ST/GL can continue to disturb the typography as part of the image.
 */
class DodreiVisualEngineV1028 extends DodreiVisualEngineV1027 {
  _memoryOverlayMetrics(out) {
    const cssW = Math.max(1, Number(width) || out.width);
    const cssH = Math.max(1, Number(height) || out.height);
    const sx = out.width / cssW;
    const sy = out.height / cssH;
    const u = Math.min(sx, sy);
    const idPx = Math.max(8 * u, Math.min(11 * u, cssW * 0.022 * u));
    const textPx = Math.max(16 * u, Math.min(25 * u, cssW * 0.045 * u));
    const textLine = textPx * 1.42;
    const maxTextW = Math.min(out.width * 0.72, 620 * sx);
    return { cssW, cssH, sx, sy, u, idPx, textPx, textLine, maxTextW };
  }

  _memoryFadeState(recall) {
    const start = Number(recall?.activatedAt);
    const now = performance.now();
    const elapsed = Number.isFinite(start) && start > 0 ? Math.max(0, now - start) : 9999;
    const smooth = (v) => {
      const t = P5LabUtils.clamp(v, 0, 1);
      return t * t * (3 - 2 * t);
    };
    return {
      shade: smooth(elapsed / 260),
      text: smooth((elapsed - 35) / 520),
    };
  }

  _drawMemoryOverlay(out, recall) {
    if (!out || !recall?.text) return;
    const m = this._memoryOverlayMetrics(out);
    const fade = this._memoryFadeState(recall);
    const ctx = out.drawingContext;

    // Full-frame readability field. It belongs to the artwork surface and is
    // intentionally placed before POST rather than being a DOM/UI treatment.
    out.push();
    out.noStroke();
    out.fill(0, 106 * fade.shade);
    out.rect(0, 0, out.width, out.height);
    out.pop();

    ctx.save();
    ctx.font = `400 ${m.textPx}px "Cormorant Garamond", Georgia, serif`;
    const lines = this._wrapMemoryText(ctx, recall.text, m.maxTextW);
    ctx.restore();

    const cx = out.width * 0.5;
    const blockH = m.idPx * 1.35 + 10 * m.u + Math.max(m.textLine, lines.length * m.textLine);
    const blockTop = P5LabUtils.clamp(
      out.height * 0.52 - blockH * 0.5,
      24 * m.u,
      Math.max(24 * m.u, out.height - blockH - 24 * m.u)
    );
    const idY = blockTop;
    const textY = idY + m.idPx * 1.35 + 10 * m.u;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.shadowColor = `rgba(0,0,0,${0.96 * fade.text})`;
    ctx.shadowBlur = 8 * m.u;
    ctx.shadowOffsetY = 1 * m.u;

    ctx.font = `400 ${m.idPx}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.fillStyle = `rgba(222,220,214,${0.66 * fade.text})`;
    ctx.fillText(`MEMORY ${recall.id || "---"}`, cx, idY);

    ctx.font = `400 ${m.textPx}px "Cormorant Garamond", Georgia, serif`;
    ctx.fillStyle = `rgba(242,239,232,${0.94 * fade.text})`;
    for (let n = 0; n < lines.length; n += 1) {
      ctx.fillText(lines[n], cx, textY + n * m.textLine);
    }
    ctx.restore();
  }

  snapshot() {
    const s = super.snapshot();
    s.engineVersion = "1.0.28";
    s.memoryRecall = {
      ...(s.memoryRecall || {}),
      thumbnail: false,
      fullFrameReadabilityField: true,
      textFadeMs: 520,
      overlayReceivesPostFx: true,
    };
    return s;
  }
}
window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV1028;
window.P5LAB_VISUAL_ENGINE_VERSION = "1.0.28";
