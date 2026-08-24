/**
 * P5 MEDIA LAB 01 — MEDIA MANAGER
 *
 * v0.3.0 removes the decorative procedural fallback. During media loading the
 * work now keeps the last valid visual source (or black before the first source)
 * instead of showing a synthetic pink/purple signal unrelated to the user's media.
 *
 * Still images are preloaded as a small 10-image archive so photo modes can cut,
 * blend and tile them at 10–20+ changes/sec without network stalls.
 */
class P5LabMediaManager {
  constructor(assets, config, telemetry) {
    this.assets = assets;
    this.config = config;
    this.telemetry = telemetry;

    this.currentVideo = null;
    this.currentVideoIndex = -1;
    this.currentVideoBlobUrl = null;
    this.currentImage = null;
    this.currentImageIndex = -1;
    this.imageCache = new Map();
    this.imagePool = [];

    this.blackFallback = null;
    this.currentSource = null;
    this.currentSourceType = "BLACK";
    this.sourceLabel = "BLACK_FALLBACK";

    this.lastSourceSwitchMs = 0;
    this.lastImageSwitchMs = 0;
    this.started = false;
    this.pendingImage = false;
    this.videoPending = false;
    this.videoState = "IDLE";
    this.videoReadyState = 0;
    this.videoBytes = 0;
    this.primeVideoPromise = null;
  }

  setup() {
    this.blackFallback = createGraphics(8, 8);
    this.blackFallback.pixelDensity(1);
    this.blackFallback.background(0);
    this.currentSource = this.blackFallback;
    this.telemetry.event("BLACK FALLBACK READY");

    if (this.config.preloadAllImages && this.assets.images.length) {
      this.preloadImages();
    }

    if (this.config.useBlobVideoLoader && this.assets.videos.length > 0 && this.config.preferVideo) {
      this.primeVideoPromise = this.fetchVideoBlob(0);
    }
  }

  async preloadImages() {
    this.telemetry.event(`IMAGE PRELOAD ${this.assets.images.length}`);
    const jobs = this.assets.images.map(async (path, index) => {
      try {
        const img = await loadImage(path);
        this.imageCache.set(path, img);
        this.imagePool[index] = img;
        if (!this.currentImage) {
          this.currentImage = img;
          this.currentImageIndex = index;
        }
      } catch (_) {
        this.telemetry.event(`IMAGE ERROR ${P5LabUtils.basename(path)}`);
      }
    });
    await Promise.allSettled(jobs);
    this.imagePool = this.imagePool.filter(Boolean);
    this.telemetry.event(`IMAGE POOL READY ${this.imagePool.length}`);
  }

  async start() {
    if (this.started) return;
    this.started = true;
    this.lastImageSwitchMs = millis();

    if (this.assets.videos.length > 0 && this.config.preferVideo) {
      await this.switchVideo(0);
      this.lastSourceSwitchMs = millis();
    } else if (this.assets.images.length > 0) {
      await this.switchImage(0, true);
    }
  }

  update() {
    if (!this.started) return;

    if (this.currentVideo && this.currentVideo.elt) {
      const elt = this.currentVideo.elt;
      this.videoReadyState = Number(elt.readyState) || 0;
      if (!elt.paused && this.videoReadyState >= 2 && this.videoState !== "PLAYING") this.setVideoState("PLAYING");
    }

    const now = millis();
    if (this.assets.videos.length && !this.videoPending && now - this.lastSourceSwitchMs > P5LAB_CONFIG.app.sourceSwitchSec * 1000) {
      const next = (this.currentVideoIndex + 1) % this.assets.videos.length;
      this.switchVideo(next).finally(() => { this.lastSourceSwitchMs = millis(); });
    }

    if (this.assets.images.length && !this.pendingImage && now - this.lastImageSwitchMs > P5LAB_CONFIG.app.imageSwitchSec * 1000) {
      const next = (this.currentImageIndex + 1) % this.assets.images.length;
      this.switchImage(next, false);
      this.lastImageSwitchMs = now;
    }
  }

  async fetchVideoBlob(index) {
    const normalized = ((index % this.assets.videos.length) + this.assets.videos.length) % this.assets.videos.length;
    const path = this.assets.videos[normalized];
    const label = P5LabUtils.basename(path);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Number(this.config.videoFetchTimeoutMs) || 30000);
    this.setVideoState("FETCHING");
    this.telemetry.event(`VIDEO FETCH ${label}`);

    try {
      const response = await fetch(path, { cache: "force-cache", signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      this.videoBytes = blob.size || 0;
      this.telemetry.event(`VIDEO FETCHED ${label} ${(this.videoBytes / 1048576).toFixed(1)}MB`);
      return { index: normalized, path, label, objectUrl };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async switchVideo(index) {
    if (!this.assets.videos.length || this.videoPending) return;
    this.videoPending = true;

    const normalized = ((index % this.assets.videos.length) + this.assets.videos.length) % this.assets.videos.length;
    const path = this.assets.videos[normalized];
    const label = P5LabUtils.basename(path);
    let mediaUrl = path;
    let nextBlobUrl = null;

    try {
      if (this.config.useBlobVideoLoader) {
        const prepared = (normalized === 0 && this.primeVideoPromise)
          ? await this.primeVideoPromise
          : await this.fetchVideoBlob(normalized);
        this.primeVideoPromise = null;
        mediaUrl = prepared.objectUrl;
        nextBlobUrl = prepared.objectUrl;
      }

      this.setVideoState("DECODING");
      this.telemetry.event(`VIDEO DECODE ${label}`);

      await new Promise((resolve) => {
        let done = false;
        const finish = () => { if (!done) { done = true; clearTimeout(timeoutId); resolve(); } };
        const timeoutId = setTimeout(() => { this.setVideoState("DECODE_TIMEOUT"); finish(); }, 15000);
        const video = createVideo(mediaUrl);
        const elt = video.elt;
        video.hide();
        Object.assign(elt, { muted: true, defaultMuted: true, volume: 0, loop: true, autoplay: true, playsInline: true, preload: "auto" });
        elt.setAttribute("muted", "");
        elt.setAttribute("playsinline", "");

        const activate = () => {
          if (done || !elt || elt.readyState < 2) return;
          if (this.currentVideo && this.currentVideo !== video) {
            try { this.currentVideo.stop(); this.currentVideo.remove(); } catch (_) {}
          }
          if (this.currentVideoBlobUrl && this.currentVideoBlobUrl !== nextBlobUrl) {
            try { URL.revokeObjectURL(this.currentVideoBlobUrl); } catch (_) {}
          }
          this.currentVideo = video;
          this.currentVideoIndex = normalized;
          this.currentVideoBlobUrl = nextBlobUrl;
          this.currentSource = video;
          this.currentSourceType = "VIDEO";
          this.sourceLabel = label;
          this.videoReadyState = elt.readyState;
          this.setVideoState(elt.paused ? "READY" : "PLAYING");
          this.telemetry.event(`VIDEO ACTIVE ${label}`);
          finish();
        };

        ["loadeddata", "canplay", "playing"].forEach((name) => elt.addEventListener(name, activate));
        elt.addEventListener("waiting", () => this.setVideoState("BUFFERING"));
        elt.addEventListener("stalled", () => this.setVideoState("STALLED"));
        elt.addEventListener("error", () => { this.setVideoState("ERROR"); finish(); }, { once: true });

        try {
          const p = elt.play();
          if (p && p.catch) p.catch(() => this.setVideoState("PLAY_BLOCKED"));
        } catch (_) {}
      });
    } catch (_) {
      this.setVideoState("LOAD_ERROR");
      if (nextBlobUrl) try { URL.revokeObjectURL(nextBlobUrl); } catch (_) {}
    } finally {
      this.videoPending = false;
    }
  }

  setVideoState(next) { this.videoState = String(next); }

  async switchImage(index, makeBase = false) {
    if (!this.assets.images.length || this.pendingImage) return;
    this.pendingImage = true;
    const normalized = ((index % this.assets.images.length) + this.assets.images.length) % this.assets.images.length;
    const path = this.assets.images[normalized];

    try {
      let img = this.imageCache.get(path) || this.imagePool[normalized];
      if (!img) {
        img = await loadImage(path);
        this.imageCache.set(path, img);
        this.imagePool[normalized] = img;
      }
      this.currentImage = img;
      this.currentImageIndex = normalized;
      if (makeBase || !this.currentVideo) {
        this.currentSource = img;
        this.currentSourceType = "IMAGE";
        this.sourceLabel = P5LabUtils.basename(path);
      }
    } catch (_) {
      this.telemetry.event(`IMAGE ERROR ${P5LabUtils.basename(path)}`);
    } finally {
      this.pendingImage = false;
    }
  }

  getSource() { return this.currentSource || this.blackFallback; }
  getCurrentImage() { return this.currentImage; }
  getImagePool() { return this.imagePool.filter(Boolean); }

  snapshot() {
    return {
      sourceType: this.currentSourceType,
      sourceLabel: this.sourceLabel,
      videoIndex: this.currentVideoIndex,
      imageIndex: this.currentImageIndex,
      videoState: this.videoState,
      videoReadyState: this.videoReadyState,
      videoBytes: this.videoBytes,
      imagePoolSize: this.imagePool.filter(Boolean).length,
    };
  }
}

window.P5LabMediaManager = P5LabMediaManager;
