/**
 * MediaManager owns the currently active video/image source.
 * Only one video element is kept alive at a time to avoid loading 10+ decoders
 * on a phone. Images are lazy-loaded and kept in a small LRU-like cache.
 */
class P5LabMediaManager {
  constructor(assets, config, telemetry) {
    this.assets = assets;
    this.config = config;
    this.telemetry = telemetry;

    this.currentVideo = null;
    this.currentVideoIndex = -1;
    this.currentImage = null;
    this.currentImageIndex = -1;
    this.imageCache = new Map();

    this.procedural = null;
    this.currentSource = null;
    this.currentSourceType = "PROCEDURAL";
    this.sourceLabel = "PROCEDURAL_SIGNAL";
    this.lastSourceSwitchMs = 0;
    this.lastImageSwitchMs = 0;
    this.started = false;
    this.pendingImage = false;
  }

  setup() {
    this.procedural = createGraphics(640, 960);
    this.procedural.pixelDensity(1);
    this.currentSource = this.procedural;
    this.telemetry.event("PROCEDURAL FALLBACK READY");
  }

  async start() {
    this.started = true;
    this.lastSourceSwitchMs = millis();
    this.lastImageSwitchMs = millis();

    if (this.assets.videos.length > 0 && this.config.preferVideo) {
      await this.switchVideo(0);
    } else if (this.assets.images.length > 0) {
      await this.switchImage(0);
    } else {
      this.telemetry.event("NO USER MEDIA / USING SYNTH SOURCE");
    }
  }

  update(interaction, audioSnapshot) {
    this.updateProcedural(interaction, audioSnapshot);
    if (!this.started) return;

    const now = millis();
    if (this.assets.videos.length > 0 && now - this.lastSourceSwitchMs > P5LAB_CONFIG.app.sourceSwitchSec * 1000) {
      const next = (this.currentVideoIndex + 1) % this.assets.videos.length;
      this.switchVideo(next);
      this.lastSourceSwitchMs = now;
    }

    if (this.assets.images.length > 0 && !this.pendingImage && now - this.lastImageSwitchMs > P5LAB_CONFIG.app.imageSwitchSec * 1000) {
      const next = (this.currentImageIndex + 1) % this.assets.images.length;
      this.switchImage(next, false);
      this.lastImageSwitchMs = now;
    }

    if (!this.currentSource) {
      this.currentSource = this.procedural;
      this.currentSourceType = "PROCEDURAL";
      this.sourceLabel = "PROCEDURAL_SIGNAL";
    }
  }

  updateProcedural(interaction, audioSnapshot) {
    const g = this.procedural;
    const t = millis() * 0.0002;
    const amp = audioSnapshot ? audioSnapshot.rms : 0;
    const px = interaction ? interaction.x : 0.5;
    const py = interaction ? interaction.y : 0.5;

    g.push();
    g.background(5, 10, 12);
    g.noStroke();

    const bands = 48;
    for (let i = 0; i < bands; i += 1) {
      const y = (i / bands) * g.height;
      const n = noise(i * 0.13, t * 4);
      const r = 18 + 190 * noise(i * 0.11, t + 10);
      const gg = 12 + 100 * noise(i * 0.09, t + 20);
      const b = 25 + 210 * noise(i * 0.07, t + 30);
      g.fill(r, gg, b, 190);
      g.rect(0, y, g.width, g.height / bands + 2 + n * 12);
    }

    g.blendMode(ADD);
    for (let i = 0; i < 26; i += 1) {
      const a = t * (0.3 + i * 0.006) + i * 0.4;
      const x = g.width * (0.5 + 0.44 * sin(a * 7.1 + px * 4));
      const y = g.height * (0.5 + 0.44 * cos(a * 4.7 + py * 5));
      const size = 3 + 42 * noise(i * 0.2, t * 8) * (0.4 + amp * 4);
      g.fill(255, 24 + i * 5);
      g.circle(x, y, size);
    }
    g.blendMode(BLEND);

    g.stroke(255, 34);
    g.strokeWeight(1);
    for (let x = 0; x < g.width; x += 24) {
      const offset = (noise(x * 0.01, t * 3) - 0.5) * 50;
      g.line(x + offset, 0, x - offset, g.height);
    }

    g.pop();
  }

  async switchVideo(index) {
    if (!this.assets.videos.length) return;
    const normalized = ((index % this.assets.videos.length) + this.assets.videos.length) % this.assets.videos.length;
    const path = this.assets.videos[normalized];

    this.telemetry.event(`VIDEO LOAD ${P5LabUtils.basename(path)}`);

    if (this.currentVideo) {
      try {
        this.currentVideo.stop();
        this.currentVideo.remove();
      } catch (_) {
      }
      this.currentVideo = null;
      this.currentSource = this.procedural;
      this.currentSourceType = "PROCEDURAL";
      this.sourceLabel = "PROCEDURAL_SIGNAL";
    }

    await new Promise((resolve) => {
      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        resolve();
      };

      const video = createVideo(path, () => {
        try {
          video.hide();
          video.attribute("playsinline", "");
          video.attribute("webkit-playsinline", "");
          video.volume(this.config.videosMuted ? 0 : 1);
          video.loop();
          this.currentVideo = video;
          this.currentVideoIndex = normalized;
          this.currentSource = video;
          this.currentSourceType = "VIDEO";
          this.sourceLabel = P5LabUtils.basename(path);
          this.telemetry.event(`VIDEO ACTIVE ${this.sourceLabel}`);
        } catch (error) {
          this.telemetry.event(`VIDEO INIT ERROR ${error.message || "UNKNOWN"}`);
        }
        finish();
      });

      setTimeout(() => {
        if (!resolved && !this.currentVideo) {
          try { video.remove(); } catch (_) {}
          this.telemetry.event(`VIDEO TIMEOUT ${P5LabUtils.basename(path)}`);
          finish();
        }
      }, 7000);
    });
  }

  async switchImage(index, makeBase = false) {
    if (!this.assets.images.length || this.pendingImage) return;
    this.pendingImage = true;

    const normalized = ((index % this.assets.images.length) + this.assets.images.length) % this.assets.images.length;
    const path = this.assets.images[normalized];

    try {
      let img = this.imageCache.get(path);
      if (!img) {
        this.telemetry.event(`IMAGE LOAD ${P5LabUtils.basename(path)}`);
        img = await loadImage(path);
        this.imageCache.set(path, img);
        this.trimImageCache();
      }

      this.currentImage = img;
      this.currentImageIndex = normalized;
      if (makeBase || !this.currentVideo) {
        this.currentSource = img;
        this.currentSourceType = "IMAGE";
        this.sourceLabel = P5LabUtils.basename(path);
      }
    } catch (error) {
      this.telemetry.event(`IMAGE ERROR ${P5LabUtils.basename(path)}`);
    } finally {
      this.pendingImage = false;
    }
  }

  trimImageCache() {
    while (this.imageCache.size > this.config.imageCacheLimit) {
      const firstKey = this.imageCache.keys().next().value;
      this.imageCache.delete(firstKey);
    }
  }

  getSource() {
    return this.currentSource || this.procedural;
  }

  getCurrentImage() {
    return this.currentImage;
  }

  snapshot() {
    return {
      sourceType: this.currentSourceType,
      sourceLabel: this.sourceLabel,
      videoIndex: this.currentVideoIndex,
      imageIndex: this.currentImageIndex,
    };
  }
}

window.P5LabMediaManager = P5LabMediaManager;
