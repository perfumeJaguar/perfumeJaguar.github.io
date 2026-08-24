/**
 * P5 MEDIA LAB 01 — AUDIO ENGINE v0.4.0
 *
 * Audible output remains the proven direct HTMLAudioElement path. A separately
 * decoded PCM copy of the same MP3 supplies analysis values without touching the
 * physical output route.
 *
 * Audible interaction in this build:
 * - pointer Y: top = slower, bottom = faster;
 * - sampled image/video luminance: dark = slower, bright = faster;
 * - press/hold: adds a small speed/pitch boost;
 * - preservesPitch=false asks supported browsers to let pitch move with speed.
 *
 * Filter/delay/distortion values are still control signals only. They are shown
 * in telemetry but are not yet inserted into the audible route, because the
 * direct native route is the first configuration confirmed to make sound on the
 * target mobile Chrome device.
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
    if (!this.config.enabled || !this.assetPath) return;

    const audio = document.createElement("audio");
    audio.src = this.assetPath;
    audio.preload = "auto";
    audio.loop = true;
    audio.controls = false;
    audio.setAttribute("playsinline", "");
    audio.setAttribute("webkit-playsinline", "");
    audio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1);
    audio.style.position = "fixed";
    audio.style.width = "1px";
    audio.style.height = "1px";
    audio.style.opacity = "0";
    audio.style.pointerEvents = "none";
    document.body.appendChild(audio);
    this.nativeAudio = audio;

    this.telemetry.event(`AUDIO DIRECT LOAD ${P5LabUtils.basename(this.assetPath)}`);

    audio.addEventListener("loadedmetadata", () => {
      this.fileLoaded = true;
      if (!this.started) this.playState = "READY";
      this.telemetry.event("AUDIO METADATA");
    });
    audio.addEventListener("canplay", () => {
      this.fileLoaded = true;
      this.telemetry.event("AUDIO CANPLAY");
    });
    audio.addEventListener("playing", () => {
      this.playState = "PLAYING";
      this.telemetry.event("AUDIO PLAYING");
    });
    audio.addEventListener("pause", () => {
      if (this.started && !audio.ended) this.playState = "PAUSED";
    });
    audio.addEventListener("waiting", () => { this.playState = "BUFFERING"; });
    audio.addEventListener("stalled", () => { this.playState = "STALLED"; });
    audio.addEventListener("error", () => {
      const code = audio.error ? audio.error.code : 0;
      this.playState = `ERROR_${code || "UNKNOWN"}`;
      this.telemetry.event(`AUDIO ERROR ${code || "?"}`);
    });

    try { audio.load(); } catch (_) {}

    // Non-blocking: the start screen never waits for the whole MP3 to decode.
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
      const audio = this.nativeAudio;
      audio.muted = false;
      audio.defaultMuted = false;
      audio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1);
      const promise = audio.play();
      this.playState = "PLAY_REQUESTED";
      this.telemetry.event(`AUDIO PLAY REQUEST ${reason}`);
      if (promise && typeof promise.then === "function") {
        promise.then(() => {
          this.playState = "PLAYING";
          this.telemetry.event(`AUDIO PLAY OK ${reason}`);
        }).catch((error) => {
          this.playState = "PLAY_BLOCKED";
          this.telemetry.event(`AUDIO BLOCKED ${reason} ${error && error.name ? error.name : "ERROR"}`);
        });
        return promise;
      }
    } catch (error) {
      this.playState = "PLAY_ERROR";
      this.telemetry.event(`AUDIO PLAY ERROR ${error.message || "UNKNOWN"}`);
    }
    return Promise.resolve();
  }

  update(analysis, interaction) {
    if (!this.config.enabled) return this.data;

    const local = analysis.localLuma || 0;
    const motion = analysis.motionSmooth || 0;
    const press = interaction.pressure || 0;

    const pointerRate = P5LabUtils.map01(interaction.y, this.config.minRate, this.config.maxRate);
    const lumaRate = P5LabUtils.map01(local, this.config.lumaRateMin, this.config.lumaRateMax);
    const pressBoost = 1 + press * this.config.pressRateBoost;
    const rate = P5LabUtils.clamp(pointerRate * lumaRate * pressBoost, 0.45, 1.65);

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
      try {
        this.nativeAudio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1);
      } catch (_) {}
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
    const sampleRate = this.analysisSampleRate;
    const n = Math.max(128, Number(this.config.pcmWindowSize) || 512);
    const duration = this.analysisBuffer.duration || 1;
    const time = (this.nativeAudio.currentTime || 0) % duration;
    const start = Math.floor(time * sampleRate) % data.length;

    let sumSq = 0;
    for (let i = 0; i < n; i += 1) {
      const value = data[(start + i) % data.length] || 0;
      sumSq += value * value;
    }
    const rms = P5LabUtils.clamp(Math.sqrt(sumSq / n) * 3.2, 0, 1);

    const points = Math.max(32, Number(this.config.waveformPoints) || 128);
    const waveform = new Array(points);
    for (let i = 0; i < points; i += 1) {
      waveform[i] = data[(start + Math.floor((i / points) * n)) % data.length] || 0;
    }

    const bass = this.bandApprox(data, start, n, sampleRate, [55, 90, 140, 210]);
    const mid = this.bandApprox(data, start, n, sampleRate, [350, 700, 1400, 2800]);
    const treble = this.bandApprox(data, start, n, sampleRate, [4200, 6200, 8500, 11000]);
    return { rms, bass, mid, treble, waveform };
  }

  bandApprox(data, start, n, sampleRate, frequencies) {
    let sum = 0;
    for (const frequency of frequencies) {
      sum += this.goertzelAmplitude(data, start, n, sampleRate, frequency);
    }
    return P5LabUtils.clamp((sum / frequencies.length) * 5.5, 0, 1);
  }

  goertzelAmplitude(data, start, n, sampleRate, frequency) {
    if (frequency >= sampleRate * 0.49) return 0;
    const omega = 2 * Math.PI * frequency / sampleRate;
    const coeff = 2 * Math.cos(omega);
    let q0 = 0;
    let q1 = 0;
    let q2 = 0;
    for (let i = 0; i < n; i += 1) {
      q0 = (data[(start + i) % data.length] || 0) + coeff * q1 - q2;
      q2 = q1;
      q1 = q0;
    }
    const power = Math.max(0, q1 * q1 + q2 * q2 - coeff * q1 * q2);
    return (2 * Math.sqrt(power)) / n;
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
