/** DODREI — AUDIO MUTE / PAUSE-SILENCE PATCH v1.0.8 */
(() => {
  const AudioEngine = window.P5LabAudioEngine;
  if (!AudioEngine || AudioEngine.prototype._dodreiMuteV108) return;

  const baseRequestPlay = AudioEngine.prototype.requestPlay;
  const baseUpdate = AudioEngine.prototype.update;
  const baseSnapshot = AudioEngine.prototype.snapshot;

  AudioEngine.prototype._outputMuted = function _outputMuted() {
    return !!this.muted || !!this.playbackPaused;
  };

  AudioEngine.prototype._applyOutputMute = function _applyOutputMute() {
    const effective = this._outputMuted();
    if (this.nativeAudio) {
      try {
        this.nativeAudio.muted = effective;
        this.nativeAudio.defaultMuted = effective;
      } catch (_) {}
    }
    if (effective && this.fxActive && this.fxCtx) {
      const now = this.fxCtx.currentTime;
      try {
        this.fxDirectGain?.gain?.setTargetAtTime(0, now, 0.015);
        this.fxDelayGain?.gain?.setTargetAtTime(0, now, 0.015);
      } catch (_) {}
    }
    return effective;
  };

  AudioEngine.prototype.setMuted = function setMuted(muted) {
    this.muted = !!muted;
    this._applyOutputMute();
    if (this.telemetry?.event) this.telemetry.event(`AUDIO MUTE ${this.muted ? "ON" : "OFF"}`);
    return this.muted;
  };

  AudioEngine.prototype.isMuted = function isMuted() {
    return !!this.muted;
  };

  AudioEngine.prototype.setPlaybackPaused = function setPlaybackPaused(paused) {
    this.playbackPaused = !!paused;
    this._applyOutputMute();
    if (this.telemetry?.event) this.telemetry.event(`AUDIO WITH VISUAL ${this.playbackPaused ? "SILENT" : "ACTIVE"}`);
    return this.playbackPaused;
  };

  AudioEngine.prototype.requestPlay = function requestPlayV108(reason) {
    const result = baseRequestPlay.call(this, reason);
    this._applyOutputMute();
    return result;
  };

  AudioEngine.prototype.update = function updateV108(analysis, interaction) {
    const data = baseUpdate.call(this, analysis, interaction);
    this._applyOutputMute();
    return data;
  };

  AudioEngine.prototype.snapshot = function snapshotV108() {
    return {
      ...baseSnapshot.call(this),
      muted: !!this.muted,
      playbackPaused: !!this.playbackPaused,
      outputMuted: this._outputMuted(),
    };
  };

  AudioEngine.prototype._dodreiMuteV105 = true;
  AudioEngine.prototype._dodreiMuteV108 = true;
})();
