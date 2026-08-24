/**
 * P5 MEDIA LAB 01 — MEDIA MANAGER v0.6.0
 *
 * Photo-only build. Before START becomes active this manager tries to discover
 * every supported file in assets/images through GitHub's public Contents API.
 * If discovery fails, the static assets.js list remains as a fallback.
 */
class P5LabMediaManager {
  constructor(assets, config, telemetry) {
    this.assets = assets;
    this.config = config;
    this.telemetry = telemetry;

    this.currentImage = null;
    this.currentImageIndex = -1;
    this.imageCache = new Map();
    this.imagePool = [];
    this.imageLoadedCount = 0;
    this.imageFailedCount = 0;
    this.discoveryState = "IDLE";
    this.started = false;
    this.lastImageSwitchMs = 0;

    this.blackFallback = null;
    this.currentSource = null;
    this.currentSourceType = "BLACK";
    this.sourceLabel = "BLACK_FALLBACK";
  }

  async setup() {
    this.blackFallback = createGraphics(8, 8);
    this.blackFallback.pixelDensity(1);
    this.blackFallback.background(0);
    this.currentSource = this.blackFallback;

    this.setLoadingStatus("SCANNING ARCHIVE", "READING IMAGE FOLDER");
    if (this.config.autoDiscoverImages) await this.discoverImages();

    this.imagePool = new Array(this.assets.images.length).fill(null);
    if (this.config.preloadAllImages && this.assets.images.length) {
      await this.preloadImagesBounded();
    }

    this.setLoadingStatus("TOUCH TO START", `${this.imageLoadedCount}/${this.assets.images.length} IMAGES READY`);
    this.telemetry.event(`IMAGE ARCHIVE READY ${this.imageLoadedCount}/${this.assets.images.length}`);
  }

  setLoadingStatus(action, note) {
    const actionEl = document.querySelector(".start-action");
    const noteEl = document.querySelector(".start-note");
    if (actionEl) actionEl.textContent = action;
    if (noteEl) noteEl.textContent = `v0.6.0 / ${note}`;
  }

  async discoverImages() {
    const owner = this.config.githubOwner;
    const repo = this.config.githubRepo;
    const branch = this.config.githubBranch || "main";
    const dir = this.config.githubImageDir;
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${dir}?ref=${encodeURIComponent(branch)}`;

    this.discoveryState = "SCANNING";
    this.telemetry.event("IMAGE DIRECTORY SCAN");

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`GITHUB_${response.status}`);
      const entries = await response.json();
      if (!Array.isArray(entries)) throw new Error("GITHUB_DIRECTORY_RESPONSE_INVALID");

      const allowed = new Set((this.config.imageExtensions || []).map((x) => String(x).toLowerCase()));
      const names = entries
        .filter((entry) => entry && entry.type === "file" && entry.name)
        .map((entry) => entry.name)
        .filter((name) => allowed.has(String(name).split(".").pop().toLowerCase()))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

      if (!names.length) throw new Error("NO_SUPPORTED_IMAGES");

      this.assets.images = names.map((name) => `./assets/images/${encodeURIComponent(name)}`);
      this.discoveryState = "READY";
      this.telemetry.event(`IMAGE DIRECTORY FOUND ${names.length}`);
      this.setLoadingStatus("LOADING ARCHIVE", `${names.length} FILES FOUND`);
    } catch (error) {
      this.discoveryState = "FALLBACK";
      this.telemetry.event(`IMAGE SCAN FALLBACK ${error && error.message ? error.message : "ERROR"}`);
      this.setLoadingStatus("LOADING FALLBACK", `${this.assets.images.length} MANIFEST FILES`);
    }
  }

  loadImageAsync(path) {
    return new Promise((resolve, reject) => {
      try {
        loadImage(path, resolve, (error) => reject(error || new Error("IMAGE_LOAD_FAILED")));
      } catch (error) {
        reject(error);
      }
    });
  }

  async preloadImagesBounded() {
    const total = this.assets.images.length;
    const concurrency = Math.max(1, Math.min(6, Number(this.config.imagePreloadConcurrency) || 3));
    let cursor = 0;
    this.telemetry.event(`IMAGE PRELOAD ${total} / ${concurrency} WORKERS`);

    const worker = async () => {
      while (true) {
        const index = cursor++;
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
            this.currentSource = img;
            this.currentSourceType = "IMAGE";
            this.sourceLabel = P5LabUtils.basename(path);
          }
        } catch (_) {
          this.imageFailedCount += 1;
          this.telemetry.event(`IMAGE ERROR ${P5LabUtils.basename(path)}`);
        }
        this.setLoadingStatus("LOADING IMAGES", `${this.imageLoadedCount + this.imageFailedCount}/${total}  READY ${this.imageLoadedCount}`);
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()));
  }

  async start() {
    if (this.started) return;
    this.started = true;
    this.lastImageSwitchMs = millis();
    if (this.currentImage) {
      this.currentSource = this.currentImage;
      this.currentSourceType = "IMAGE";
      this.sourceLabel = P5LabUtils.basename(this.assets.images[this.currentImageIndex] || "IMAGE");
    }
  }

  update() {
    if (!this.started || !this.imageLoadedCount) return;
    const now = millis();
    if (now - this.lastImageSwitchMs > P5LAB_CONFIG.app.imageSwitchSec * 1000) {
      this.advanceToNextLoadedImage();
      this.lastImageSwitchMs = now;
    }
  }

  advanceToNextLoadedImage() {
    const total = this.imagePool.length;
    if (!total) return;
    for (let step = 1; step <= total; step += 1) {
      const index = (this.currentImageIndex + step + total) % total;
      const img = this.imagePool[index];
      if (!img) continue;
      this.currentImage = img;
      this.currentImageIndex = index;
      this.currentSource = img;
      this.currentSourceType = "IMAGE";
      this.sourceLabel = P5LabUtils.basename(this.assets.images[index]);
      return;
    }
  }

  getSource() { return this.currentSource || this.currentImage || this.blackFallback; }
  getCurrentImage() { return this.currentImage; }
  getImagePool() { return this.imagePool.filter(Boolean); }

  snapshot() {
    return {
      sourceType: this.currentSourceType,
      sourceLabel: this.sourceLabel,
      videoIndex: -1,
      imageIndex: this.currentImageIndex,
      videoState: "DISABLED",
      videoReadyState: 0,
      videoBytes: 0,
      imagePoolSize: this.imageLoadedCount,
      imagePoolTotal: this.assets.images.length,
      imageFailedCount: this.imageFailedCount,
      discoveryState: this.discoveryState,
    };
  }
}

window.P5LabMediaManager = P5LabMediaManager;
