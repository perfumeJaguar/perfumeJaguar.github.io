/**
 * v0.6.0 touch-audio rupture patch.
 * Keeps the proven v0.5 native+parallel-FX engine, but when pressure rises it
 * crossfades away from the clean native track and emphasizes the distorted /
 * delayed wet duplicate. Transport speed remains almost unchanged.
 *
 * v0.10.7 tuning: the touch layer keeps the same character at a lower level so
 * touching no longer creates such a large loudness jump against the dry source.
 */
(() => {
  if (!window.P5LabAudioEngine) return;
  const baseUpdate = window.P5LabAudioEngine.prototype.update;

  window.P5LabAudioEngine.prototype.update = function patchedUpdate(analysis, interaction) {
    const data = baseUpdate.call(this, analysis, interaction);
    const press = P5LabUtils.clamp(interaction.pressure || 0, 0, 1);

    const dryDuck = P5LabUtils.clamp(Number(this.config.touchFxDryDuck) || 0.28, 0, 0.9);
    const wetScale = P5LabUtils.clamp(Number(this.config.touchFxWetScale) || 0.45, 0, 1);
    const directBase = P5LabUtils.clamp(Number(this.config.touchFxDirectGainBase) || 0.34, 0, 1);
    const directPress = P5LabUtils.clamp(Number(this.config.touchFxDirectGainPress) || 0.12, 0, 1);
    const delayGainScale = P5LabUtils.clamp(Number(this.config.touchFxDelayGainScale) || 0.72, 0, 1);
    const distortionScale = P5LabUtils.clamp(Number(this.config.touchFxDistortionScale) || 0.65, 0, 1);
    const feedbackScale = P5LabUtils.clamp(Number(this.config.touchFxFeedbackScale) || 0.68, 0, 1);
    const resonanceMaxQ = Math.max(1.2, Number(this.config.touchFxResonanceMaxQ) || 6.8);

    // Keep most of the original dry level under touch; the wet duplicate now
    // supplements rather than overwhelms the native track.
    if (this.nativeAudio) {
      try {
        const dryScale = 1 - press * dryDuck;
        this.nativeAudio.volume = P5LabUtils.clamp(this.config.masterVolume * dryScale, 0, 1);
      } catch (_) {}
    }

    if (this.fxActive && this.fxCtx) {
      const now = this.fxCtx.currentTime;
      const wet = this.config.fxWetMin + press * (this.config.fxWetMax - this.config.fxWetMin) * wetScale;
      const touchDistortion = P5LabUtils.clamp((data.distortion || 0) * distortionScale, 0, this.config.maxDistortion);
      const touchFeedback = P5LabUtils.clamp((data.delayFeedback || 0) * feedbackScale, 0, this.config.maxDelayFeedback);
      try {
        this.fxDirectGain.gain.setTargetAtTime(wet * (directBase + press * directPress), now, 0.02);
        this.fxDelayGain.gain.setTargetAtTime(wet * delayGainScale, now, 0.02);
        this.fxFeedback.gain.setTargetAtTime(touchFeedback, now, 0.02);
        this.fxFilter.Q.setTargetAtTime(1.2 + press * (resonanceMaxQ - 1.2), now, 0.02);
      } catch (_) {}

      if (Math.abs(touchDistortion - this.lastDistortionCurve) > 0.02) {
        try { this.fxShaper.curve = this.makeDistortionCurve(touchDistortion); } catch (_) {}
        this.lastDistortionCurve = touchDistortion;
      }

      data.wet = wet;
      data.distortion = touchDistortion;
      data.delayFeedback = touchFeedback;
    }

    return data;
  };
})();
