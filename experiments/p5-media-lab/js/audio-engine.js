/**
 * P5 MEDIA LAB 01 — AUDIO ENGINE v0.3.0
 *
 * Audible output remains the proven direct HTMLAudioElement path. A separate
 * decoded PCM copy of the same MP3 is used for analysis only, so FFT/RMS-style
 * control data can return without routing the audible media through Web Audio.
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
    this.contextState = "DIRECT+PCM";
    this.lastReportedState = "";

    this.analysisBuffer = null;
    this.analysisChannel = null;
    this.analysisSampleRate = 0;
    this.analysisReady = false;

    this.data = {
      rms: 0, bass: 0, mid: 0, treble: 0,
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
    if (!this.config.enabled || !this.assetPath) return;

    const a = document.createElement("audio");
    a.src = this.assetPath;
    a.preload = "auto";
    a.loop = true;
    a.controls = false;
    a.setAttribute("playsinline", "");
    a.setAttribute("webkit-playsinline", "");
    a.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1);
    a.style.position = "fixed";
    a.style.width = "1px";
    a.style.height = "1px";
    a.style.opacity = "0";
    a.style.pointerEvents = "none";
    document.body.appendChild(a);
    this.nativeAudio = a;

    this.telemetry.event(`AUDIO DIRECT LOAD ${P5LabUtils.basename(this.assetPath)}`);

    a.addEventListener("loadedmetadata", () => {
      this.fileLoaded = true;
      if (!this.started) this.playState = "READY";
      this.telemetry.event("AUDIO METADATA");
    });
    a.addEventListener("canplay", () => { this.fileLoaded = true; this.telemetry.event("AUDIO CANPLAY"); });
    a.addEventListener("playing", () => { this.playState = "PLAYING"; this.telemetry.event("AUDIO PLAYING"); });
    a.addEventListener("pause", () => { if (this.started && !a.ended) this.playState = "PAUSED"; });
    a.addEventListener("waiting", () => this.playState = "BUFFERING");
    a.addEventListener("stalled", () => this.playState = "STALLED");
    a.addEventListener("error", () => {
      const c = a.error ? a.error.code : 0;
      this.playState = `ERROR_${c || "UNKNOWN"}`;
      this.telemetry.event(`AUDIO ERROR ${c || "?"}`);
    });

    try { a.load(); } catch (_) {}

    // Analysis preparation is intentionally asynchronous and non-blocking. The
    // start screen must not wait for the complete MP3 to decode.
    this.preparePcmAnalysis();
  }

  async preparePcmAnalysis() {
    try {
      this.telemetry.event("AUDIO PCM FETCH");
      const response = await fetch(this.assetPath, { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const bytes = await response.arrayBuffer();
      const ctx = getAudioContext();
      const decoded = await ctx.decodeAudioData(bytes.slice(0));
      this.analysisBuffer = decoded;
      this.analysisChannel = decoded.getChannelData(0);
      this.analysisSampleRate = decoded.sampleRate;
      this.analysisReady = true;
      this.telemetry.event(`AUDIO PCM READY ${decoded.duration.toFixed(1)}S`);
    } catch (error) {
      this.analysisReady = false;
      this.telemetry.event(`AUDIO PCM ERROR ${error && error.message ? error.message : "UNKNOWN"}`);
    }
  }

  start() {
    this.started = true;
    return this.requestPlay("START");
  }

  retryFromGesture() {
    if (!this.started || !this.nativeAudio || !this.nativeAudio.paused) return;
    this.requestPlay("GESTURE_RETRY");
  }

  requestPlay(reason) {
    if (!this.config.enabled || !this.nativeAudio) return Promise.resolve();
    try {
      const a = this.nativeAudio;
      a.muted = false;
      a.defaultMuted = false;
      a.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1);
      const p = a.play();
      this.playState = "PLAY_REQUESTED";
      this.telemetry.event(`AUDIO PLAY REQUEST ${reason}`);
      if (p && typeof p.then === "function") {
        p.then(() => {
          this.playState = "PLAYING";
          this.telemetry.event(`AUDIO PLAY OK ${reason}`);
        }).catch((e) => {
          this.playState = "PLAY_BLOCKED";
          this.telemetry.event(`AUDIO BLOCKED ${reason} ${e && e.name ? e.name : "ERROR"}`);
        });
        return p;
      }
    } catch (e) {
      this.playState = "PLAY_ERROR";
      this.telemetry.event(`AUDIO PLAY ERROR ${e.message || "UNKNOWN"}`);
    }
    return Promise.resolve();
  }

  update(analysis, interaction) {
    if (!this.config.enabled) return this.data;

    const local = analysis.localLuma || 0;
    const motion = analysis.motionSmooth || 0;
    const press = interaction.pressure || 0;

    // The audible direct-output interaction is deliberately obvious now: Y,
    // picked luminance and press all alter rate/pitch. preservesPitch=false makes
    // the relationship audible as pitch as well as duration where supported.
    const pointerRate = P5LabUtils.map01(interaction.y, this.config.minRate, this.config.maxRate);
    const lumaRate = P5LabUtils.map01(local, 0.90, 1.10);
    const rate = P5LabUtils.clamp(pointerRate * lumaRate * (1 + press * 0.10), 0.45, 1.65);
    const pan = interaction.x * 2 - 1;
    const filterHz = P5LabUtils.map01(Math.pow(local, 0.7), this.config.minFilterHz, this.config.maxFilterHz);
    const delayTime = P5LabUtils.map01(interaction.x, 0.025, this.config.maxDelayTime);
    const delayFeedback = P5LabUtils.clamp(motion * this.config.maxDelayFeedback + press * 0.08, 0, this.config.maxDelayFeedback);
    const distortion = P5LabUtils.clamp((1 - interaction.y) * this.config.maxDistortion * (0.35 + motion), 0, this.config.maxDistortion);

    if (this.nativeAudio) {
      try {
        this.nativeAudio.playbackRate = rate;
        if ("preservesPitch" in this.nativeAudio) this.nativeAudio.preservesPitch = false;
        if ("webkitPreservesPitch" in this.nativeAudio) this.nativeAudio.webkitPreservesPitch = false;
      } catch (_) {}
      try { this.nativeAudio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1); } catch (_) {}
      if (!this.nativeAudio.paused && this.nativeAudio.readyState >= 2) this.playState = "PLAYING";
    }

    if (this.playState !== this.lastReportedState) {
      this.lastReportedState = this.playState;
      this.telemetry.event(`AUDIO STATE ${this.playState}`);
    }

    const pcm = this.readPcmSnapshot();
    this.data = {
      rms: pcm.rms,
      bass: pcm.bass,
      mid: pcm.mid,
      treble: pcm.treble,
      filterHz,
      delayTime,
      delayFeedback,
      distortion,
      rate,
      pan,
      waveform: pcm.waveform,
    };
    return this.data;
  }

  readPcmSnapshot() {
    if (!this.analysisReady || !this.analysisChannel || !this.nativeAudio || !this.analysisBuffer) {
      return { rms: 0, bass: 0, mid: 0, treble: 0, waveform: [] };
    }

    const data = this.analysisChannel;
    const sr = this.analysisSampleRate;
    const n = Math.max(128, Number(this.config.pcmWindowSize) || 512);
    const duration = this.analysisBuffer.duration || 1;
    const t = (this.nativeAudio.currentTime || 0) % duration;
    const start = Math.floor(t * sr) % data.length;

    let sumSq = 0;
    for (let i = 0; i < n; i += 1) {
      const v = data[(start + i) % data.length] || 0;
      sumSq += v * v;
    }
    const rms = P5LabUtils.clamp(Math.sqrt(sumSq / n) * 3.2, 0, 1);

    const points = Math.max(32, Number(this.config.waveformPoints) || 128);
    const waveform = new Array(points);
    for (let i = 0; i < points; i += 1) {
      waveform[i] = data[(start + Math.floor((i / points) * n)) % data.length] || 0;
    }

    const bass = this.bandApprox(data, start, n, sr, [55, 90, 140, 210]);
    const mid = this.bandApprox(data, start, n, sr, [350, 700, 1400, 2800]);
    const treble = this.bandApprox(data, start, n, sr, [4200, 6200, 8500, 11000]);
    return { rms, bass, mid, treble, waveform };
  }

  bandApprox(data, start, n, sampleRate, frequencies) {
    let sum = 0;
    for (const f of frequencies) sum += this.goertzelAmplitude(data, start, n, sampleRate, f);
    return P5LabUtils.clamp(sum / frequencies.length * 5.5, 0, 1);
  }

  goertzelAmplitude(data, start, n, sampleRate, frequency) {
    if (frequency >= sampleRate * 0.49) return 0;
    const omega = 2 * Math.PI * frequency / sampleRate;
    const coeff = 2 * Math.cos(omega);
    let q0 = 0, q1 = 0, q2 = 0;
    for (let i = 0; i < n; i += 1) {
      q0 = (data[(start + i) % data.length] || 0) + coeff * q1 - q2;
      q2 = q1;
      q1 = q0;
    }
    const power = Math.max(0, q1 * q1 + q2 * q2 - coeff * q1 * q2);
    return 2 * Math.sqrt(power) / n;
  }

  snapshot() {
    return {
      ...this.data,
      state: this.playState,
      contextState: this.contextState,
      fileLoaded: this.fileLoaded,
      analysisReady: this.analysisReady,
      nativePaused: this.nativeAudio ? this.nativeAudio.paused : null,
      nativeReadyState: this.nativeAudio ? this.nativeAudio.readyState : null,
    };
  }
}

window.P5LabAudioEngine = P5LabAudioEngine;
