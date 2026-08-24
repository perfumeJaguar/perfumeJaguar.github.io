/**
 * v0.6.0 touch-audio rupture patch.
 * Keeps the proven v0.5 native+parallel-FX engine, but when pressure rises it
 * crossfades away from the clean native track and emphasizes the distorted /
 * delayed wet duplicate. Transport speed remains almost unchanged.
 */
(() => {
  if (!window.P5LabAudioEngine) return;
  const baseUpdate = window.P5LabAudioEngine.prototype.update;

  window.P5LabAudioEngine.prototype.update = function patchedUpdate(analysis, interaction) {
    const data = baseUpdate.call(this, analysis, interaction);
    const press = P5LabUtils.clamp(interaction.pressure || 0, 0, 1);

    // Beautiful dry playback dominates at rest. Touch makes the clean copy recede
    // while the parallel distorted/delayed copy comes forward.
    if (this.nativeAudio) {
      try {
        const dryScale = 1 - press * 0.62;
        this.nativeAudio.volume = P5LabUtils.clamp(this.config.masterVolume * dryScale, 0, 1);
      } catch (_) {}
    }

    if (this.fxActive && this.fxCtx) {
      const now = this.fxCtx.currentTime;
      const wet = this.config.fxWetMin + press * (this.config.fxWetMax - this.config.fxWetMin);
      const grotesqueDistortion = Math.max(data.distortion || 0, press * this.config.maxDistortion);
      const grotesqueFeedback = Math.max(data.delayFeedback || 0, 0.10 + press * 0.68);
      try {
        this.fxDirectGain.gain.setTargetAtTime(wet * (0.38 + press * 0.25), now, 0.02);
        this.fxDelayGain.gain.setTargetAtTime(wet, now, 0.02);
        this.fxFeedback.gain.setTargetAtTime(Math.min(this.config.maxDelayFeedback, grotesqueFeedback), now, 0.02);
        this.fxFilter.Q.setTargetAtTime(1.2 + press * 11.0, now, 0.02);
      } catch (_) {}

      if (Math.abs(grotesqueDistortion - this.lastDistortionCurve) > 0.02) {
        try { this.fxShaper.curve = this.makeDistortionCurve(grotesqueDistortion); } catch (_) {}
        this.lastDistortionCurve = grotesqueDistortion;
      }

      data.wet = wet;
      data.distortion = grotesqueDistortion;
      data.delayFeedback = Math.min(this.config.maxDelayFeedback, grotesqueFeedback);
    }

    return data;
  };
})();
