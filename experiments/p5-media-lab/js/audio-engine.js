/**
 * P5 MEDIA LAB 01 — AUDIO ENGINE
 *
 * Stability policy (v0.1.4):
 * - Audible playback in safeDryOutput mode uses a native HTMLAudioElement.
 * - The element is routed through the browser Web Audio API directly.
 * - Web Audio AnalyserNode data drives RMS / FFT / waveform telemetry.
 * - p5.sound effect nodes are retained only for the optional experimental wet path.
 *
 * Why: mobile tests reported p5.SoundFile.isPlaying() === true and a RUNNING
 * AudioContext while the actual device output remained silent. The native media
 * element path gives us an independent, browser-level playback baseline before
 * reintroducing experimental p5.sound routing.
 */
class P5LabAudioEngine {
  constructor(assetPath, config, telemetry) {
    this.assetPath = assetPath;
    this.config = config;
    this.telemetry = telemetry;

    this.started = false;
    this.fileLoaded = false;
    this.playState = "IDLE";
    this.contextState = "UNKNOWN";
    this.lastReportedState = "";

    // Reliable native/Web Audio path.
    this.nativeAudio = null;
    this.mediaNode = null;
    this.analyserNode = null;
    this.panNode = null;
    this.gainNode = null;
    this.freqData = null;
    this.timeData = null;

    // Optional experimental p5.sound path retained for later tests.
    this.soundFile = null;
    this.filter = null;
    this.delay = null;
    this.reverb = null;
    this.distortionFx = null;
    this.amp = null;
    this.fft = null;

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

    if (this.config.safeDryOutput) {
      this.setupNativePath();
      return;
    }

    // Experimental p5.sound path. Not used by the current stability build.
    this.filter = new p5.Filter("lowpass");
    this.delay = new p5.Delay(0.18, 0.22);
    this.reverb = new p5.Reverb(this.config.reverbDecay);
    this.distortionFx = typeof p5.Distortion === "function" ? new p5.Distortion() : null;
    this.amp = new p5.Amplitude(0.88);
    this.fft = new p5.FFT(128);
    try { this.fft.smooth(0.82); } catch (_) {}

    if (this.assetPath) {
      try {
        this.telemetry.event(`AUDIO LOAD ${P5LabUtils.basename(this.assetPath)}`);
        this.soundFile = await loadSound(this.assetPath);
        this.fileLoaded = true;
        this.playState = "READY";
        this.telemetry.event(`AUDIO READY ${P5LabUtils.basename(this.assetPath)}`);
      } catch (error) {
        this.playState = "FILE_ERROR";
        this.telemetry.event(`AUDIO FILE FAILED ${error && error.message ? error.message : "UNKNOWN"}`);
      }
    }
  }

  setupNativePath() {
    if (!this.assetPath) {
      this.playState = "NO_FILE";
      return;
    }

    this.telemetry.event(`AUDIO NATIVE LOAD ${P5LabUtils.basename(this.assetPath)}`);

    const audio = new Audio();
    audio.src = this.assetPath;
    audio.preload = "auto";
    audio.loop = true;
    audio.playsInline = true;
    audio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1);
    this.nativeAudio = audio;

    audio.addEventListener("loadedmetadata", () => {
      this.fileLoaded = true;
      if (!this.started) this.playState = "READY";
      this.telemetry.event("AUDIO NATIVE METADATA");
    });
    audio.addEventListener("canplay", () => {
      this.fileLoaded = true;
      this.telemetry.event("AUDIO NATIVE CANPLAY");
    });
    audio.addEventListener("playing", () => {
      this.playState = "PLAYING";
      this.telemetry.event("AUDIO NATIVE PLAYING");
    });
    audio.addEventListener("waiting", () => {
      this.playState = "BUFFERING";
    });
    audio.addEventListener("stalled", () => {
      this.playState = "STALLED";
    });
    audio.addEventListener("error", () => {
      const code = audio.error ? audio.error.code : 0;
      this.playState = `ERROR_${code || "UNKNOWN"}`;
      this.telemetry.event(`AUDIO NATIVE ERROR ${code || "?"}`);
    });

    // Build the Web Audio graph now. Creating nodes is allowed while the context
    // is suspended; only resuming the context needs the first user gesture.
    try {
      const ctx = getAudioContext();
      this.contextState = ctx && ctx.state ? ctx.state.toUpperCase() : "UNKNOWN";

      this.mediaNode = ctx.createMediaElementSource(audio);
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.82;
      this.freqData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyserNode.fftSize);

      this.panNode = typeof ctx.createStereoPanner === "function" ? ctx.createStereoPanner() : null;
      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = 1;

      this.mediaNode.connect(this.analyserNode);
      if (this.panNode) {
        this.analyserNode.connect(this.panNode);
        this.panNode.connect(this.gainNode);
      } else {
        this.analyserNode.connect(this.gainNode);
      }
      this.gainNode.connect(ctx.destination);

      this.telemetry.event("AUDIO NATIVE ROUTE READY");
    } catch (error) {
      this.playState = "ROUTE_ERROR";
      this.telemetry.event(`AUDIO NATIVE ROUTE ERROR ${error.message || "UNKNOWN"}`);
    }
  }

  start() {
    if (!this.config.enabled || this.started) return Promise.resolve();
    this.started = true;

    let resumePromise = Promise.resolve();
    try {
      const ctx = getAudioContext();
      this.contextState = ctx && ctx.state ? ctx.state.toUpperCase() : "UNKNOWN";
      this.telemetry.event(`AUDIO CONTEXT ${this.contextState}`);
      resumePromise = ctx && typeof ctx.resume === "function" ? ctx.resume() : userStartAudio();
      Promise.resolve(resumePromise)
        .then(() => {
          const current = getAudioContext();
          this.contextState = current && current.state ? current.state.toUpperCase() : "RUNNING";
          this.telemetry.event(`AUDIO CONTEXT ${this.contextState}`);
        })
        .catch((error) => {
          this.contextState = "RESUME_ERROR";
          this.telemetry.event(`AUDIO RESUME ERROR ${error && error.name ? error.name : "ERROR"}`);
        });
    } catch (error) {
      this.contextState = "CONTEXT_ERROR";
      this.telemetry.event(`AUDIO CONTEXT ERROR ${error.message || "UNKNOWN"}`);
    }

    if (this.config.safeDryOutput && this.nativeAudio) {
      // Issue play() directly inside the original user gesture. The routed audio
      // becomes audible as soon as the AudioContext resume above completes.
      try {
        const playPromise = this.nativeAudio.play();
        this.playState = "PLAY_REQUESTED";
        this.telemetry.event("AUDIO NATIVE PLAY REQUESTED");
        if (playPromise && typeof playPromise.then === "function") {
          playPromise
            .then(() => {
              this.playState = "PLAYING";
              this.telemetry.event("AUDIO NATIVE PLAY RESOLVED");
            })
            .catch((error) => {
              this.playState = "PLAY_BLOCKED";
              this.telemetry.event(`AUDIO NATIVE PLAY BLOCKED ${error && error.name ? error.name : "ERROR"}`);
            });
        }
      } catch (error) {
        this.playState = "PLAY_ERROR";
        this.telemetry.event(`AUDIO NATIVE PLAY ERROR ${error.message || "UNKNOWN"}`);
      }
      return Promise.resolve(resumePromise);
    }

    if (this.soundFile) {
      try {
        this.soundFile.setVolume(this.config.masterVolume);
        this.soundFile.loop(true);
        this.soundFile.play();
        this.playState = "PLAY_REQUESTED";
      } catch (error) {
        this.playState = "PLAY_ERROR";
        this.telemetry.event(`AUDIO PLAY ERROR ${error.message || "UNKNOWN"}`);
      }
    }

    return Promise.resolve(resumePromise);
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

    try {
      const ctx = getAudioContext();
      this.contextState = ctx && ctx.state ? ctx.state.toUpperCase() : this.contextState;
    } catch (_) {}

    if (this.config.safeDryOutput && this.nativeAudio) {
      try { this.nativeAudio.playbackRate = rate; } catch (_) {}
      try { this.nativeAudio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1); } catch (_) {}
      try {
        if (this.panNode) this.panNode.pan.value = P5LabUtils.clamp(pan, -1, 1);
      } catch (_) {}

      if (!this.nativeAudio.paused && this.nativeAudio.readyState >= 2 && this.playState !== "PLAYING") {
        this.playState = "PLAYING";
      }
    } else if (this.soundFile) {
      try {
        if (this.soundFile.isPlaying()) {
          this.playState = "PLAYING";
          this.soundFile.rate(rate);
          this.soundFile.pan(pan);
        }
      } catch (_) {}
    }

    if (this.playState !== this.lastReportedState) {
      this.lastReportedState = this.playState;
      this.telemetry.event(`AUDIO STATE ${this.playState}`);
    }

    let rms = 0;
    let bass = 0;
    let mid = 0;
    let treble = 0;
    let waveform = [];

    if (this.config.safeDryOutput && this.analyserNode && this.freqData && this.timeData) {
      try {
        this.analyserNode.getByteFrequencyData(this.freqData);
        this.analyserNode.getByteTimeDomainData(this.timeData);

        let sq = 0;
        waveform = new Array(this.timeData.length);
        for (let i = 0; i < this.timeData.length; i += 1) {
          const v = (this.timeData[i] - 128) / 128;
          waveform[i] = v;
          sq += v * v;
        }
        rms = P5LabUtils.clamp(Math.sqrt(sq / this.timeData.length) * 2.4, 0, 1);

        bass = this.bandEnergy(20, 250);
        mid = this.bandEnergy(250, 4000);
        treble = this.bandEnergy(4000, 12000);
      } catch (_) {}
    } else if (this.amp && this.fft) {
      try {
        rms = P5LabUtils.clamp(this.amp.getLevel() * 2.4, 0, 1);
        this.fft.analyze();
        bass = P5LabUtils.clamp(this.fft.getEnergy("bass") / 255, 0, 1);
        mid = P5LabUtils.clamp(this.fft.getEnergy("mid") / 255, 0, 1);
        treble = P5LabUtils.clamp(this.fft.getEnergy("treble") / 255, 0, 1);
        waveform = this.fft.waveform();
      } catch (_) {}
    }

    this.data = {
      rms,
      bass,
      mid,
      treble,
      filterHz,
      delayTime,
      delayFeedback,
      distortion,
      rate,
      pan,
      waveform,
    };

    return this.data;
  }

  bandEnergy(lowHz, highHz) {
    if (!this.freqData || !this.analyserNode) return 0;
    const ctx = getAudioContext();
    const nyquist = ctx.sampleRate / 2;
    const start = Math.max(0, Math.floor((lowHz / nyquist) * this.freqData.length));
    const end = Math.min(this.freqData.length - 1, Math.ceil((highHz / nyquist) * this.freqData.length));
    if (end < start) return 0;

    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      sum += this.freqData[i];
      count += 1;
    }
    return count ? P5LabUtils.clamp((sum / count) / 255, 0, 1) : 0;
  }

  snapshot() {
    return {
      ...this.data,
      state: this.playState,
      contextState: this.contextState,
      fileLoaded: this.fileLoaded,
      safeDryOutput: !!this.config.safeDryOutput,
      nativePaused: this.nativeAudio ? this.nativeAudio.paused : null,
      nativeReadyState: this.nativeAudio ? this.nativeAudio.readyState : null,
    };
  }
}

window.P5LabAudioEngine = P5LabAudioEngine;
