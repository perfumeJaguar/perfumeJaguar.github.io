/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.6
 *
 * ROOT FIX
 * --------
 * Earlier patch files tried to replace the active engine with:
 *   window.P5LabVisualEngine = SomeNewSubclass
 *
 * But the original `class P5LabVisualEngine { ... }` is a top-level class lexical
 * binding. Reassigning a same-named property on `window` does NOT replace that
 * lexical binding. The application therefore kept constructing the original v0.6.1
 * engine, which is why v0.6.3–v0.6.5 could show new version numbers while the
 * rupture remained grayscale.
 *
 * From v0.6.6 onward the application does not rely on replacing the old class name.
 * Each visual build registers its constructor explicitly in
 * `window.P5LAB_VISUAL_ENGINE_CLASS`, and sketch-v066.js instantiates that registry.
 * This is also the extension point for future visual engine revisions.
 */
class P5LabVisualEngineV066 extends P5LabVisualEngineV065 {
  snapshot(){
    const s=super.snapshot();
    s.engineVersion='0.6.6';
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS=P5LabVisualEngineV066;
window.P5LAB_VISUAL_ENGINE_VERSION='0.6.6';
