/**
 * P5 MEDIA LAB 01 — MEDIA MANAGER v0.4.0
 *
 * Important still-image policy:
 * - p5 loadImage() is wrapped in an explicit callback Promise. Do not rely on
 *   `await loadImage(path)` as if it were a stable Promise API.
 * - Images load through a small worker pool instead of all at once. This avoids
 *   mobile Chrome/network bursts that previously left only a few usable images.
 * - imagePool keeps asset indexes stable; failed or pending slots remain null.
 * - With the current ten low-resolution images all assets remain resident. The
 *   same code supports a much larger manifest; memory policy can later become a
 *   rolling working set without rewriting visual presets.
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
    this.imagePool = new Array(this.assets.images.length).fill(null);
    this.imageLoadedCount = 0;
    this.imageFailedCount = 0;
    this.imagePreloadPromise = null;

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
      this.imagePreloadPromise = this.preloadImagesBounded();
    }

    if (this.config.useBlobVideoLoader && this.assets.videos.length > 0 && this.config.preferVideo) {
      this.primeVideoPromise = this.fetchVideoBlob(0);
    }
  }

  loadImageAsync(path) {
    return new Promise((resolve, reject) => {
      try {
        loadImage(
          path,
          (img) => resolve(img),
          (error) => reject(error || new Error("IMAGE_LOAD_FAILED")),
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async preloadImagesBounded() {
    const total = this.assets.images.length;
    const concurrency = Math.max(1, Math.min(6, Number(this.config.imagePreloadConcurrency) || 3));
    let cursor = 0;

    this.telemetry.event(`IMAGE PRELOAD START ${total} / ${concurrency} WORKERS`);

    const worker = async () => {
      while (true) {
        const index = cursor;
        cursor += 1;
        if (index >= total) return;

        const path = this.assets.images[index];
        try {
          const img = await this.loadImageAsync(path);
          this.imagePool[index] = img;
          this.imageCache.set(path, img);
          this.imageLoadedCount += 1;

          if (!this.currentImage) {
            this.currentImage = img;
            this.currentImageIndex = index;
          }

          this.telemetry.event(`IMAGE READY ${index + 1}/${total} ${P5LabUtils.basename(path)}`);
          this.trimImageCacheIfNeeded();
        } catch (_) {
          this.imageFailedCount += 1;
          this.telemetry.event(`IMAGE ERROR ${index + 1}/${total} ${P5LabUtils.basename(path)}`);
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);
    this.telemetry.event(`IMAGE POOL READY ${this.imageLoadedCount}/${total}`);
  }

  trimImageCacheIfNeeded() {
    const limit = Math.max(1, Number(this.config.imageCacheLimit) || this.assets.images.length);
    // Current build intentionally allows enough capacity for the whole planned
    // archive. If a future 50-image test needs a rolling set, change this policy
    // here rather than letting visual code know about loading/eviction.
    if (this.imageCache.size <= limit) return;

    for (const [path, img] of this.imageCache.entries()) {
      const index = this.assets.images.indexOf(path);
      if (img === this.currentImage) continue;
      this.imageCache.delete(path);
      if (index >= 0) this.imagePool[index] = null;
      if (this.imageCache.size <= limit) break;
    }
  }

  async start() {
    if (this.started) return;
    this.started = true;
    this.lastImageSwitchMs = millis();

    // Do not block start on the complete photo archive. At least one image will
    // appear as soon as its worker finishes, while video/audio remain responsive.
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
      if (!elt.paused && this.videoReadyState >= 2 && this.videoState !== "PLAYING") {
        this.setVideoState("PLAYING");
      }
    }

    const now = millis();
    if (
      this.assets.videos.length &&
      !this.videoPending &&
      now - this.lastSourceSwitchMs > P5LAB_CONFIG.app.sourceSwitchSec * 1000
    ) {
      const next = (this.currentVideoIndex + 1) % this.assets.videos.length;
      this.switchVideo(next).finally(() => { this.lastSourceSwitchMs = millis(); });
    }

    if (
      this.assets.images.length &&
      !this.pendingImage &&
      now - this.lastImageSwitchMs > P5LAB_CONFIG.app.imageSwitchSec * 1000
    ) {
      this.advanceToNextLoadedImage();
      this.lastImageSwitchMs = now;
    }
  }

  advanceToNextLoadedImage() {
    if (!this.imageLoadedCount) return;
    const total = this.imagePool.length;
    for (let step = 1; step <= total; step += 1) {
      const index = (this.currentImageIndex + step + total) % total;
      const img = this.imagePool[index];
      if (!img) continue;
      this.currentImage = img;
      this.currentImageIndex = index;
      return;
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
        const finish = () => {
          if (!done) {
            done = true;
            clearTimeout(timeoutId);
            resolve();
          }
        };
        const timeoutId = setTimeout(() => {
          this.setVideoState("DECODE_TIMEOUT");
          finish();
        }, 15000);

        const video = createVideo(mediaUrl);
        const elt = video.elt;
        video.hide();
        Object.assign(elt, {
          muted: true,
          defaultMuted: true,
          volume: 0,
          loop: true,
          autoplay: true,
          playsInline: true,
          preload: "auto",
        });
        elt.setAttribute("muted", "");
        elt.setAttribute("playsinline", "");

        const activate = () => {
          if (done || !elt || elt.readyState < 2) return;
          if (this.currentVideo && this.currentVideo !== video) {
            try {
              this.currentVideo.stop();
              this.currentVideo.remove();
            } catch (_) {}
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
        elt.addEventListener("error", () => {
          this.setVideoState("ERROR");
          finish();
        }, { once: true });

        try {
          const playPromise = elt.play();
          if (playPromise && playPromise.catch) playPromise.catch(() => this.setVideoState("PLAY_BLOCKED"));
        } catch (_) {}
      });
    } catch (_) {
      this.setVideoState("LOAD_ERROR");
      if (nextBlobUrl) {
        try { URL.revokeObjectURL(nextBlobUrl); } catch (_) {}
      }
    } finally {
      this.videoPending = false;
    }
  }

  setVideoState(next) {
    this.videoState = String(next);
  }

  async switchImage(index, makeBase = false) {
    if (!this.assets.images.length || this.pendingImage) return;
    this.pendingImage = true;

    const normalized = ((index % this.assets.images.length) + this.assets.images.length) % this.assets.images.length;
    const path = this.assets.images[normalized];

    try {
      let img = this.imagePool[normalized] || this.imageCache.get(path);
      if (!img) {
        img = await this.loadImageAsync(path);
        if (!this.imagePool[normalized]) this.imageLoadedCount += 1;
        this.imagePool[normalized] = img;
        this.imageCache.set(path, img);
        this.trimImageCacheIfNeeded();
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

  getSource() {
    return this.currentSource || this.currentImage || this.blackFallback;
  }

  getCurrentImage() {
    return this.currentImage;
  }

  getImagePool() {
    return this.imagePool.filter(Boolean);
  }

  snapshot() {
    return {
      sourceType: this.currentSourceType,
      sourceLabel: this.sourceLabel,
      videoIndex: this.currentVideoIndex,
      imageIndex: this.currentImageIndex,
      videoState: this.videoState,
      videoReadyState: this.videoReadyState,
      videoBytes: this.videoBytes,
      imagePoolSize: this.imageLoadedCount,
      imagePoolTotal: this.assets.images.length,
      imageFailedCount: this.imageFailedCount,
    };
  }
}

window.P5LabMediaManager = P5LabMediaManager;
