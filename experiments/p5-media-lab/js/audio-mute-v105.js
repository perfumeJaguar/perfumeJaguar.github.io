/** DODREI — AUDIO MUTE PATCH v1.0.5 */
(() => {
  const AudioEngine = window.P5LabAudioEngine;
  if (!AudioEngine || AudioEngine.prototype._dodreiMuteV105) return;

  const baseRequestPlay = AudioEngine.prototype.requestPlay;
  const baseUpdate = AudioEngine.prototype.update;
  const baseSnapshot = AudioEngine.prototype.snapshot;

  AudioEngine.prototype.setMuted = function setMuted(muted) {
    this.muted = !!muted;

    if (this.nativeAudio) {
      try {
        this.nativeAudio.muted = this.muted;
        this.nativeAudio.defaultMuted = this.muted;
      } catch (_) {}
    }

    if (this.fxActive && this.fxCtx) {
      const now = this.fxCtx.currentTime;
      try {
        if (this.muted) {
          this.fxDirectGain?.gain?.setTargetAtTime(0, now, 0.015);
          this.fxDelayGain?.gain?.setTargetAtTime(0, now, 0.015);
        }
      } catch (_) {}
    }

    if (this.telemetry?.event) this.telemetry.event(`AUDIO MUTE ${this.muted ? "ON" : "OFF"}`);
    return this.muted;
  };

  AudioEngine.prototype.isMuted = function isMuted() {
    return !!this.muted;
  };

  AudioEngine.prototype.requestPlay = function requestPlayV105(reason) {
    const result = baseRequestPlay.call(this, reason);
    if (this.nativeAudio) {
      try {
        this.nativeAudio.muted = !!this.muted;
        this.nativeAudio.defaultMuted = !!this.muted;
      } catch (_) {}
    }
    return result;
  };

  AudioEngine.prototype.update = function updateV105(analysis, interaction) {
    const data = baseUpdate.call(this, analysis, interaction);

    if (this.nativeAudio) {
      try { this.nativeAudio.muted = !!this.muted; } catch (_) {}
    }

    if (this.muted && this.fxActive && this.fxCtx) {
      const now = this.fxCtx.currentTime;
      try {
        this.fxDirectGain?.gain?.setTargetAtTime(0, now, 0.015);
        this.fxDelayGain?.gain?.setTargetAtTime(0, now, 0.015);
      } catch (_) {}
    }

    return data;
  };

  AudioEngine.prototype.snapshot = function snapshotV105() {
    return { ...baseSnapshot.call(this), muted: !!this.muted };
  };

  AudioEngine.prototype._dodreiMuteV105 = true;
})();
