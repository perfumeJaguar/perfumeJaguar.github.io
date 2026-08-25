/**
 * DODREI — VISUAL ENGINE v1.0.7
 * =============================================================================
 * Mobile image-quality pass on top of v1.0.4.
 *
 * The browser viewport is expressed in CSS pixels (for example 360x642), while
 * modern phones have substantially more physical display pixels. Earlier builds
 * sized the main composition buffer from that CSS-pixel viewport, so a 360x642
 * phone could end up presenting a 360x642 artwork buffer across a much denser
 * physical screen.
 *
 * v1.0.7 oversamples only the ordinary mobile composition/post buffers. Heavy
 * feedback, swipe, touch-rupture, and analyzer buffers are intentionally left at
 * the sizes created by the inherited mobile performance path.
 */
class DodreiVisualEngineV1007 extends DodreiVisualEngineV1004 {
  rebuild(w, h) {
    // Build the established runtime first. This deliberately creates feedback,
    // swipe, rupture and analysis-adjacent visual buffers at their old mobile
    // performance sizes.
    super.rebuild(w, h);

    const mobile = P5LabUtils.isMobileLayout();
    if (!mobile) return;

    const renderCfg = P5LAB_CONFIG.render || {};
    const oversample = P5LabUtils.clamp(Number(renderCfg.mobileMainOversample) || 2.0, 1, 3);
    if (oversample <= 1.001) return;

    const maxLongEdge = Math.max(
      1,
      (Number(renderCfg.maxBufferLongEdgeMobile) || 720) * oversample
    );
    const s = P5LabUtils.fitInside(w * oversample, h * oversample, maxLongEdge);

    // If inherited sizing already meets/exceeds the target, leave it alone.
    if (this.buffer && this.buffer.width >= s.width && this.buffer.height >= s.height) return;

    const replaceGraphics = (key, width, height) => {
      try {
        const old = this[key];
        if (old && typeof old.remove === "function") old.remove();
      } catch (_) {}
      const next = createGraphics(width, height);
      next.pixelDensity(1);
      this[key] = next;
    };

    // Ordinary composition + common POST processing receive the higher raster.
    replaceGraphics("buffer", s.width, s.height);
    replaceGraphics("crushBuffer", s.width, s.height);
    replaceGraphics("postCommonBuffer", s.width, s.height);
    replaceGraphics("postCommonScratch", s.width, s.height);

    this._postCommonDirty = true;
    this.telemetry.event(`MOBILE MAIN 2X ${s.width}X${s.height}`);
  }

  snapshot() {
    const s = super.snapshot();
    s.engineVersion = "1.0.7";
    s.mobileMainOversample = P5LabUtils.isMobileLayout()
      ? P5LabUtils.clamp(Number(P5LAB_CONFIG.render?.mobileMainOversample) || 2.0, 1, 3)
      : 1;
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS = DodreiVisualEngineV1007;
window.P5LAB_VISUAL_ENGINE_VERSION = "1.0.7";
