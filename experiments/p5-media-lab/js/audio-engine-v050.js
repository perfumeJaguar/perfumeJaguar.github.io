/**
 * P5 MEDIA LAB 01 — AUDIO ENGINE v0.5.0
 *
 * Audible architecture:
 *   1) Native <audio> remains the guaranteed dry playback path.
 *   2) The same decoded MP3 buffer is replayed in a separate Web Audio graph.
 *   3) That parallel graph supplies an interactive wet layer only.
 *
 * If the FX context fails or is blocked, the dry native track keeps playing.
 * This preserves the stable mobile baseline while finally making filter/delay/
 * distortion real, audible interactions rather than telemetry-only targets.
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
    this.contextState = "DIRECT+PCM+FX";
    this.lastReportedState = "";

    this.analysisBuffer = null;
    this.analysisChannel = null;
    this.analysisSampleRate = 0;
    this.analysisReady = false;

    this.fxCtx = null;
    this.fxSource = null;
    this.fxFilter = null;
    this.fxShaper = null;
    this.fxDelay = null;
    this.fxFeedback = null;
    this.fxDirectGain = null;
    this.fxDelayGain = null;
    this.fxActive = false;
    this.fxState = "OFF";
    this.lastDistortionCurve = -1;

    this.data = {
      rms: 0, bass: 0, mid: 0, treble: 0,
      filterHz: config.minFilterHz,
      delayTime: 0,
      delayFeedback: 0,
      distortion: 0,
      rate: 1,
      pan: 0,
      wet: 0,
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
    Object.assign(audio.style, { position: "fixed", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
    document.body.appendChild(audio);
    this.nativeAudio = audio;

    this.telemetry.event(`AUDIO DIRECT LOAD ${P5LabUtils.basename(this.assetPath)}`);
    audio.addEventListener("loadedmetadata", () => { this.fileLoaded = true; if (!this.started) this.playState = "READY"; });
    audio.addEventListener("canplay", () => { this.fileLoaded = true; });
    audio.addEventListener("playing", () => { this.playState = "PLAYING"; });
    audio.addEventListener("pause", () => { if (this.started && !audio.ended) this.playState = "PAUSED"; });
    audio.addEventListener("waiting", () => { this.playState = "BUFFERING"; });
    audio.addEventListener("stalled", () => { this.playState = "STALLED"; });
    audio.addEventListener("error", () => {
      const code = audio.error ? audio.error.code : 0;
      this.playState = `ERROR_${code || "UNKNOWN"}`;
      this.telemetry.event(`AUDIO ERROR ${code || "?"}`);
    });
    try { audio.load(); } catch (_) {}
    this.preparePcmAnalysis();
  }

  async preparePcmAnalysis() {
    try {
      this.telemetry.event("AUDIO PCM FETCH");
      const response = await fetch(this.assetPath, { cache: "force-cache" });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const bytes = await response.arrayBuffer();
      const decodeCtx = getAudioContext();
      const decoded = await decodeCtx.decodeAudioData(bytes.slice(0));
      this.analysisBuffer = decoded;
      this.analysisChannel = decoded.getChannelData(0);
      this.analysisSampleRate = decoded.sampleRate;
      this.analysisReady = true;
      this.telemetry.event(`AUDIO PCM READY ${decoded.duration.toFixed(1)}S`);
      if (this.started) this.fxState = "WAIT_GESTURE";
    } catch (error) {
      this.analysisReady = false;
      this.fxState = "PCM_ERROR";
      this.telemetry.event(`AUDIO PCM ERROR ${error && error.message ? error.message : "UNKNOWN"}`);
    }
  }

  start() {
    this.started = true;
    const p = this.requestPlay("START");
    this.ensureFxFromGesture();
    return p;
  }

  retryFromGesture() {
    if (!this.started) return;
    if (this.nativeAudio && this.nativeAudio.paused) this.requestPlay("GESTURE_RETRY");
    this.ensureFxFromGesture();
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
        promise.then(() => { this.playState = "PLAYING"; }).catch((error) => {
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

  ensureFxFromGesture() {
    if (!this.config.fxEnabled || this.fxActive) return;
    if (!this.analysisReady || !this.analysisBuffer) {
      this.fxState = "WAIT_PCM";
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) { this.fxState = "UNSUPPORTED"; return; }
      if (!this.fxCtx) this.fxCtx = new AudioCtx();
      const ctx = this.fxCtx;
      const begin = () => {
        if (this.fxActive) return;
        this.buildFxGraph();
        const offset = this.analysisBuffer.duration > 0 ? (this.nativeAudio.currentTime % this.analysisBuffer.duration) : 0;
        this.fxSource.start(0, offset);
        this.fxActive = true;
        this.fxState = "ACTIVE";
        this.telemetry.event("AUDIO FX ACTIVE");
      };
      if (ctx.state === "suspended") {
        const r = ctx.resume();
        if (r && r.then) r.then(begin).catch(() => { this.fxState = "BLOCKED"; });
        else begin();
      } else begin();
    } catch (error) {
      this.fxState = "ERROR";
      this.telemetry.event(`AUDIO FX ERROR ${error.message || "UNKNOWN"}`);
    }
  }

  buildFxGraph() {
    const ctx = this.fxCtx;
    this.fxSource = ctx.createBufferSource();
    this.fxSource.buffer = this.analysisBuffer;
    this.fxSource.loop = true;

    this.fxFilter = ctx.createBiquadFilter();
    this.fxFilter.type = "lowpass";
    this.fxFilter.frequency.value = 6000;
    this.fxFilter.Q.value = 1.2;

    this.fxShaper = ctx.createWaveShaper();
    this.fxShaper.oversample = "2x";
    this.fxShaper.curve = this.makeDistortionCurve(0.08);

    this.fxDelay = ctx.createDelay(Math.max(1, this.config.maxDelayTime + 0.2));
    this.fxDelay.delayTime.value = 0.12;
    this.fxFeedback = ctx.createGain();
    this.fxFeedback.gain.value = 0.18;

    this.fxDirectGain = ctx.createGain();
    this.fxDelayGain = ctx.createGain();
    this.fxDirectGain.gain.value = this.config.fxWetMin * 0.55;
    this.fxDelayGain.gain.value = this.config.fxWetMin;

    this.fxSource.connect(this.fxFilter);
    this.fxFilter.connect(this.fxShaper);
    this.fxShaper.connect(this.fxDirectGain);
    this.fxDirectGain.connect(ctx.destination);
    this.fxShaper.connect(this.fxDelay);
    this.fxDelay.connect(this.fxDelayGain);
    this.fxDelayGain.connect(ctx.destination);
    this.fxDelay.connect(this.fxFeedback);
    this.fxFeedback.connect(this.fxDelay);
  }

  makeDistortionCurve(amount) {
    const n = 256;
    const curve = new Float32Array(n);
    const drive = 1 + P5LabUtils.clamp(amount, 0, 1) * 24;
    for (let i = 0; i < n; i += 1) {
      const x = (i * 2) / (n - 1) - 1;
      curve[i] = Math.tanh(x * drive) / Math.tanh(drive);
    }
    return curve;
  }

  update(analysis, interaction) {
    if (!this.config.enabled) return this.data;
    const local = analysis.localLuma || 0;
    const motion = analysis.motionSmooth || 0;
    const press = interaction.pressure || 0;

    // Transport now moves only slightly.
    const pointerRate = P5LabUtils.map01(interaction.y, this.config.minRate, this.config.maxRate);
    const lumaRate = P5LabUtils.map01(local, this.config.lumaRateMin, this.config.lumaRateMax);
    const rate = P5LabUtils.clamp(pointerRate * lumaRate * (1 + press * this.config.pressRateBoost), 0.92, 1.08);

    // Actual wet-FX mappings.
    const horizontalCutoff = P5LabUtils.map01(Math.pow(interaction.x, 0.72), this.config.minFilterHz, this.config.maxFilterHz);
    const filterHz = P5LabUtils.clamp(horizontalCutoff * (0.72 + local * 0.48), this.config.minFilterHz, this.config.maxFilterHz);
    const delayTime = P5LabUtils.map01(interaction.y, 0.035, this.config.maxDelayTime);
    const delayFeedback = P5LabUtils.clamp(0.12 + press * 0.46 + motion * 0.18, 0, this.config.maxDelayFeedback);
    const distortion = P5LabUtils.clamp(press * this.config.maxDistortion + (1 - interaction.y) * 0.12, 0, this.config.maxDistortion);
    const wet = P5LabUtils.map01(P5LabUtils.clamp(press + motion * 0.25, 0, 1), this.config.fxWetMin, this.config.fxWetMax);
    const pan = interaction.x * 2 - 1;

    if (this.nativeAudio) {
      try { this.nativeAudio.playbackRate = rate; } catch (_) {}
      try { this.nativeAudio.volume = P5LabUtils.clamp(this.config.masterVolume, 0, 1); } catch (_) {}
      if (!this.nativeAudio.paused && this.nativeAudio.readyState >= 2) this.playState = "PLAYING";
    }

    if (this.fxActive && this.fxCtx) {
      const now = this.fxCtx.currentTime;
      const smooth = 0.035;
      try {
        this.fxFilter.frequency.setTargetAtTime(filterHz, now, smooth);
        this.fxFilter.Q.setTargetAtTime(0.8 + press * 7.5, now, smooth);
        this.fxDelay.delayTime.setTargetAtTime(delayTime, now, smooth);
        this.fxFeedback.gain.setTargetAtTime(delayFeedback, now, smooth);
        this.fxDirectGain.gain.setTargetAtTime(wet * 0.42, now, smooth);
        this.fxDelayGain.gain.setTargetAtTime(wet, now, smooth);
      } catch (_) {}
      if (Math.abs(distortion - this.lastDistortionCurve) > 0.025) {
        try { this.fxShaper.curve = this.makeDistortionCurve(distortion); } catch (_) {}
        this.lastDistortionCurve = distortion;
      }
    }

    if (this.playState !== this.lastReportedState) {
      this.lastReportedState = this.playState;
      this.telemetry.event(`AUDIO STATE ${this.playState}`);
    }

    const pcm = this.readPcmSnapshot();
    this.data = { rms: pcm.rms, bass: pcm.bass, mid: pcm.mid, treble: pcm.treble, filterHz, delayTime, delayFeedback, distortion, rate, pan, wet, waveform: pcm.waveform };
    return this.data;
  }

  readPcmSnapshot() {
    if (!this.analysisReady || !this.analysisChannel || !this.nativeAudio || !this.analysisBuffer) return { rms:0,bass:0,mid:0,treble:0,waveform:[] };
    const data=this.analysisChannel,sr=this.analysisSampleRate,n=Math.max(128,Number(this.config.pcmWindowSize)||512),duration=this.analysisBuffer.duration||1,t=(this.nativeAudio.currentTime||0)%duration,start=Math.floor(t*sr)%data.length;
    let sumSq=0;for(let i=0;i<n;i++){const v=data[(start+i)%data.length]||0;sumSq+=v*v;}const rms=P5LabUtils.clamp(Math.sqrt(sumSq/n)*3.2,0,1);
    const points=Math.max(32,Number(this.config.waveformPoints)||128),waveform=new Array(points);for(let i=0;i<points;i++)waveform[i]=data[(start+Math.floor((i/points)*n))%data.length]||0;
    return { rms, bass:this.bandApprox(data,start,n,sr,[55,90,140,210]), mid:this.bandApprox(data,start,n,sr,[350,700,1400,2800]), treble:this.bandApprox(data,start,n,sr,[4200,6200,8500,11000]), waveform };
  }
  bandApprox(data,start,n,sr,fs){let sum=0;for(const f of fs)sum+=this.goertzelAmplitude(data,start,n,sr,f);return P5LabUtils.clamp((sum/fs.length)*5.5,0,1);}
  goertzelAmplitude(data,start,n,sr,f){if(f>=sr*.49)return 0;const omega=2*Math.PI*f/sr,coeff=2*Math.cos(omega);let q0=0,q1=0,q2=0;for(let i=0;i<n;i++){q0=(data[(start+i)%data.length]||0)+coeff*q1-q2;q2=q1;q1=q0;}const power=Math.max(0,q1*q1+q2*q2-coeff*q1*q2);return 2*Math.sqrt(power)/n;}

  snapshot() {
    return { ...this.data, state:this.playState, contextState:this.contextState, fileLoaded:this.fileLoaded, analysisReady:this.analysisReady, fxState:this.fxState, fxActive:this.fxActive, nativePaused:this.nativeAudio?this.nativeAudio.paused:null, nativeReadyState:this.nativeAudio?this.nativeAudio.readyState:null };
  }
}
window.P5LabAudioEngine=P5LabAudioEngine;
