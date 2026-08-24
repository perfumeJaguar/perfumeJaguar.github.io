/**
 * AudioEngine demonstrates both file playback and synthesis.
 * Mapping philosophy:
 * - pointer-picked video luminance -> low-pass cutoff
 * - global motion -> delay feedback
 * - pointer X -> stereo pan
 * - pointer Y -> playback rate / distortion balance
 * - audio FFT -> visual engine (reverse direction)
 */
class P5LabAudioEngine {
  constructor(assetPath, config, telemetry) {
    this.assetPath = assetPath;
    this.config = config;
    this.telemetry = telemetry;

    this.soundFile = null;
    this.fileLoaded = false;
    this.source = null;

    this.filter = null;
    this.delay = null;
    this.reverb = null;
    this.distortionFx = null;
    this.amp = null;
    this.fft = null;

    this.oscA = null;
    this.oscB = null;
    this.started = false;
    this.usingFallback = false;
    this.playState = "IDLE";
    this.contextState = "UNKNOWN";
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

    this.filter = new p5.Filter("lowpass");
    this.delay = new p5.Delay(0.18, 0.22);
    this.reverb = new p5.Reverb(this.config.reverbDecay);
    this.distortionFx = typeof p5.Distortion === "function" ? new p5.Distortion() : null;
    if (this.distortionFx) {
      try { this.distortionFx.set(0.05, "2x"); } catch (_) {}
    }

    this.amp = new p5.Amplitude(0.88);

    // p5.sound 0.4.x uses p5.FFT(fftSize); smoothing is configured separately.
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
        this.telemetry.event("AUDIO FILE FAILED / FALLBACK AVAILABLE");
      }
    }
  }

  start() {
    if (!this.config.enabled || this.started) return Promise.resolve();
    this.started = true;

    // IMPORTANT: nothing that requires a user gesture may be placed after an
    // awaited fullscreen promise. This method is called directly from pointerdown,
    // so resume + play requests are issued immediately in the gesture call stack.
    try {
      const ctx = getAudioContext();
      this.contextState = ctx && ctx.state ? ctx.state.toUpperCase() : "UNKNOWN";
      this.telemetry.event(`AUDIO CONTEXT ${this.contextState}`);

      const resumePromise = userStartAudio();
      if (resumePromise && typeof resumePromise.then === "function") {
        resumePromise
          .then(() => {
            const current = getAudioContext();
            this.contextState = current && current.state ? current.state.toUpperCase() : "RUNNING";
            this.telemetry.event(`AUDIO CONTEXT ${this.contextState}`);
          })
          .catch((error) => {
            this.contextState = "RESUME_ERROR";
            this.telemetry.event(`AUDIO RESUME ERROR ${error && error.name ? error.name : "ERROR"}`);
          });
      }
    } catch (error) {
      this.contextState = "CONTEXT_ERROR";
      this.telemetry.event(`AUDIO CONTEXT ERROR ${error.message || "UNKNOWN"}`);
    }

    if (this.fileLoaded && this.soundFile) {
      this.source = this.soundFile;
      this.routeSource(this.soundFile);

      try { this.soundFile.setVolume(this.config.masterVolume); } catch (_) {}

      try {
        // p5.sound 0.4.x separates the loop flag from starting playback.
        // Official examples use loop(true) followed by play() from a gesture.
        this.soundFile.loop(true);
        this.soundFile.play();
        this.playState = "PLAY_REQUESTED";
        this.telemetry.event("AUDIO PLAY REQUESTED");
      } catch (error) {
        this.playState = "PLAY_ERROR";
        this.telemetry.event(`AUDIO PLAY ERROR ${error.message || "UNKNOWN"}`);
      }
    } else if (this.config.syntheticFallback) {
      this.startFallbackSynth();
      this.playState = "SYNTH_REQUESTED";
      this.telemetry.event("SYNTH AUDIO FALLBACK START");
    }

    return Promise.resolve();
  }

  routeSource(source) {
    try {
      source.disconnect();
      this.filter.disconnect();
      this.delay.disconnect();
      this.reverb.disconnect();
      if (this.distortionFx) this.distortionFx.disconnect();

      source.connect(this.filter);
      this.filter.connect(this.delay);
      this.delay.connect(this.reverb);

      if (this.distortionFx) {
        this.reverb.connect(this.distortionFx);
        this.distortionFx.connect();
      } else {
        this.reverb.connect();
      }

      this.amp.setInput(this.distortionFx || this.reverb);
      this.fft.setInput(this.distortionFx || this.reverb);
      this.telemetry.event("AUDIO ROUTE READY");
    } catch (error) {
      this.telemetry.event(`AUDIO ROUTE FALLBACK ${error.message || "ERROR"}`);
      try {
        source.connect();
        this.amp.setInput(source);
        this.fft.setInput(source);
      } catch (_) {}
    }
  }

  startFallbackSynth() {
    this.usingFallback = true;
    this.oscA = new p5.Oscillator(82.41, "sine");
    this.oscB = new p5.Oscillator(123.47, "triangle");

    this.oscA.amp(this.config.fallbackOscAmp);
    this.oscB.amp(this.config.fallbackOscAmp * 0.45);
    this.oscA.start();
    this.oscB.start();

    try {
      this.oscA.disconnect();
      this.oscB.disconnect();
      this.oscA.connect(this.filter);
      this.oscB.connect(this.filter);
      this.filter.disconnect();
      this.delay.disconnect();
      this.reverb.disconnect();
      this.filter.connect(this.delay);
      this.delay.connect(this.reverb);
      this.reverb.connect();
      this.amp.setInput(this.reverb);
      this.fft.setInput(this.reverb);
    } catch (_) {
      this.telemetry.event("SYNTH ROUTE DEGRADED");
    }
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

    if (this.started) {
      try {
        const ctx = getAudioContext();
        this.contextState = ctx && ctx.state ? ctx.state.toUpperCase() : this.contextState;
      } catch (_) {}

      if (this.soundFile) {
        try {
          if (this.soundFile.isPlaying()) this.playState = "PLAYING";
          else if (this.playState === "PLAY_REQUESTED" && this.contextState === "RUNNING") this.playState = "WAITING";
        } catch (_) {}
      } else if (this.usingFallback && this.contextState === "RUNNING") {
        this.playState = "SYNTH_PLAYING";
      }

      if (this.playState !== this.lastReportedState) {
        this.lastReportedState = this.playState;
        this.telemetry.event(`AUDIO STATE ${this.playState}`);
      }

      try { this.filter.set(filterHz, 1.2 + motion * 7); } catch (_) {}
      try { this.delay.delayTime(delayTime); } catch (_) {}
      try { this.delay.feedback(delayFeedback); } catch (_) {}
      try { this.delay.filter(Math.min(14000, filterHz * 1.35), 0.7 + motion * 3); } catch (_) {}
      try { if (this.distortionFx) this.distortionFx.set(distortion, "2x"); } catch (_) {}

      if (this.soundFile && this.soundFile.isPlaying()) {
        try { this.soundFile.rate(rate); } catch (_) {}
        try { this.soundFile.pan(pan); } catch (_) {}
      }

      if (this.usingFallback && this.oscA && this.oscB) {
        const root = 48 + local * 115 + analysis.globalLuma * 35;
        this.oscA.freq(root, 0.08);
        this.oscB.freq(root * (1.49 + motion * 0.03), 0.08);
        this.oscA.pan(pan * 0.55);
        this.oscB.pan(-pan * 0.35);
      }
    }

    let rms = 0;
    let bass = 0;
    let mid = 0;
    let treble = 0;
    let waveform = [];

    if (this.started && this.amp && this.fft) {
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

  snapshot() {
    return {
      ...this.data,
      state: this.playState,
      contextState: this.contextState,
      fileLoaded: this.fileLoaded,
    };
  }
}

window.P5LabAudioEngine = P5LabAudioEngine;
