/**
 * P5 MEDIA LAB 01 — AUDIO ENGINE
 *
 * v0.1.5 stability baseline:
 * - Audible playback bypasses p5.sound and Web Audio completely.
 * - A plain HTMLAudioElement is used as the direct device output path.
 * - No MediaElementSourceNode is created in this baseline because routing a
 *   media element into a suspended AudioContext can silence otherwise valid
 *   playback on mobile Chrome.
 * - FFT/RMS stay at zero temporarily. Once direct playback is proven reliable,
 *   analysis/effects can be layered back on one step at a time.
 */
class P5LabAudioEngine {
  constructor(assetPath, config, telemetry) {
    this.assetPath = assetPath;
    this.config = config;
    this.telemetry = telemetry;

    this.nativeAudio = null;
    this.started = false;
    this.fileLoaded = false;
    this.playState = "IDLE";
    this.contextState = "BYPASS";
    this.lastReportedState = "";

    this.data = {
      rms: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      filterHz: config.minFilterHz,
      delayTime: 0,
      delayFeedback: 0,
      distortion: 0,
      rate: 1,
      pan: 0,
      waveform: [],
    };
  }

  async setup() {
    if (!this.config.enabled) return;
    if (!this.assetPath) {
      this.playState = "NO_FILE";
      return;
    }

    const audio = document.createElement("audio");
    audio.src = this.assetPath;
    audio.preload = "auto";
    audio.loop = true;
    audio.controls = false;
    audio.playsInline = true;
    audio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1);
    audio.style.display = "none";

    // Keep the element attached to the document. Mobile browsers are generally
    // most predictable when media elements participate in the DOM lifecycle.
    document.body.appendChild(audio);
    this.nativeAudio = audio;

    this.telemetry.event(`AUDIO DIRECT LOAD ${P5LabUtils.basename(this.assetPath)}`);

    audio.addEventListener("loadedmetadata", () => {
      this.fileLoaded = true;
      if (!this.started) this.playState = "READY";
      this.telemetry.event("AUDIO DIRECT METADATA");
    });

    audio.addEventListener("canplay", () => {
      this.fileLoaded = true;
      this.telemetry.event("AUDIO DIRECT CANPLAY");
    });

    audio.addEventListener("playing", () => {
      this.playState = "PLAYING";
      this.telemetry.event("AUDIO DIRECT PLAYING");
    });

    audio.addEventListener("waiting", () => {
      this.playState = "BUFFERING";
    });

    audio.addEventListener("pause", () => {
      if (this.started && !audio.ended) this.playState = "PAUSED";
    });

    audio.addEventListener("stalled", () => {
      this.playState = "STALLED";
    });

    audio.addEventListener("error", () => {
      const code = audio.error ? audio.error.code : 0;
      this.playState = `ERROR_${code || "UNKNOWN"}`;
      this.telemetry.event(`AUDIO DIRECT ERROR ${code || "?"}`);
    });

    try { audio.load(); } catch (_) {}
  }

  start() {
    if (!this.config.enabled || this.started) return Promise.resolve();
    this.started = true;
    this.contextState = "BYPASS";

    if (!this.nativeAudio) {
      this.playState = "NO_ELEMENT";
      return Promise.resolve();
    }

    // play() is intentionally the first browser-sensitive operation performed by
    // this method. No AudioContext resume, fullscreen request, or awaited work is
    // allowed before it.
    try {
      const audio = this.nativeAudio;
      audio.muted = false;
      audio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1);
      const playPromise = audio.play();
      this.playState = "PLAY_REQUESTED";
      this.telemetry.event("AUDIO DIRECT PLAY REQUESTED");

      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            this.playState = "PLAYING";
            this.telemetry.event("AUDIO DIRECT PLAY RESOLVED");
          })
          .catch((error) => {
            this.playState = "PLAY_BLOCKED";
            this.telemetry.event(`AUDIO DIRECT PLAY BLOCKED ${error && error.name ? error.name : "ERROR"}`);
          });
        return playPromise;
      }
    } catch (error) {
      this.playState = "PLAY_ERROR";
      this.telemetry.event(`AUDIO DIRECT PLAY ERROR ${error.message || "UNKNOWN"}`);
    }

    return Promise.resolve();
  }

  update(analysis, interaction) {
    if (!this.config.enabled) return this.data;

    const local = analysis.localLuma || 0;
    const motion = analysis.motionSmooth || 0;
    const press = interaction.pressure || 0;

    const filterHz = P5LabUtils.map01(Math.pow(local, 0.7), this.config.minFilterHz, this.config.maxFilterHz);
    const delayTime = P5LabUtils.map01(interaction.x, 0.025, this.config.maxDelayTime);
    const delayFeedback = P5LabUtils.clamp(motion * this.config.maxDelayFeedback + press * 0.08, 0, this.config.maxDelayFeedback);
    const distortion = P5LabUtils.clamp((1 - interaction.y) * this.config.maxDistortion * (0.35 + motion), 0, this.config.maxDistortion);
    const rate = P5LabUtils.map01(interaction.y, this.config.minRate, this.config.maxRate);
    const pan = interaction.x * 2 - 1;

    if (this.nativeAudio) {
      try { this.nativeAudio.playbackRate = rate; } catch (_) {}
      try { this.nativeAudio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1); } catch (_) {}

      if (!this.nativeAudio.paused && this.nativeAudio.readyState >= 2) {
        this.playState = "PLAYING";
      }
    }

    if (this.playState !== this.lastReportedState) {
      this.lastReportedState = this.playState;
      this.telemetry.event(`AUDIO STATE ${this.playState}`);
    }

    this.data = {
      rms: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      filterHz,
      delayTime,
      delayFeedback,
      distortion,
      rate,
      pan,
      waveform: [],
    };

    return this.data;
  }

  snapshot() {
    return {
      ...this.data,
      state: this.playState,
      contextState: this.contextState,
      fileLoaded: this.fileLoaded,
      safeDryOutput: true,
      nativePaused: this.nativeAudio ? this.nativeAudio.paused : null,
      nativeReadyState: this.nativeAudio ? this.nativeAudio.readyState : null,
    };
  }
}

window.P5LabAudioEngine = P5LabAudioEngine;
