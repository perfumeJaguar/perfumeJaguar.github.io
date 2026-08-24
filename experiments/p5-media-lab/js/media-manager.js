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
    this.videoPending = false;
    this.videoState = "IDLE";
    this.videoReadyState = 0;
  }

  setup() {
    this.procedural = createGraphics(640, 960);
    this.procedural.pixelDensity(1);
    this.currentSource = this.procedural;
    this.telemetry.event("PROCEDURAL FALLBACK READY");
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
    } else {
      this.telemetry.event("NO USER MEDIA / USING SYNTH SOURCE");
    }
  }

  update(interaction, audioSnapshot) {
    this.updateProcedural(interaction, audioSnapshot);
    if (!this.started) return;

    if (this.currentVideo && this.currentVideo.elt) {
      this.videoReadyState = Number(this.currentVideo.elt.readyState) || 0;
      if (!this.currentVideo.elt.paused && this.videoReadyState >= 2 && this.videoState !== "PLAYING") {
        this.setVideoState("PLAYING");
      }
    }

    const now = millis();
    if (
      this.assets.videos.length > 0 &&
      !this.videoPending &&
      now - this.lastSourceSwitchMs > P5LAB_CONFIG.app.sourceSwitchSec * 1000
    ) {
      const next = (this.currentVideoIndex + 1) % this.assets.videos.length;
      this.switchVideo(next).finally(() => {
        this.lastSourceSwitchMs = millis();
      });
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
    if (!this.assets.videos.length || this.videoPending) return;
    this.videoPending = true;

    const normalized = ((index % this.assets.videos.length) + this.assets.videos.length) % this.assets.videos.length;
    const path = this.assets.videos[normalized];
    const label = P5LabUtils.basename(path);

    this.telemetry.event(`VIDEO LOAD ${label}`);
    this.setVideoState("LOADING");

    if (this.currentVideo) {
      try {
        this.currentVideo.stop();
        this.currentVideo.remove();
      } catch (_) {}
      this.currentVideo = null;
    }

    this.currentSource = this.procedural;
    this.currentSourceType = "PROCEDURAL";
    this.sourceLabel = "PROCEDURAL_SIGNAL";

    try {
      await new Promise((resolve) => {
        let resolved = false;
        let activated = false;
        let timeoutId = null;

        const finish = () => {
          if (resolved) return;
          resolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          resolve();
        };

        const activate = (video) => {
          if (activated) return;
          const elt = video.elt;
          if (!elt || elt.readyState < 2) return;

          activated = true;
          this.currentVideo = video;
          this.currentVideoIndex = normalized;
          this.currentSource = video;
          this.currentSourceType = "VIDEO";
          this.sourceLabel = label;
          this.videoReadyState = elt.readyState;
          this.setVideoState(elt.paused ? "READY" : "PLAYING");
          this.telemetry.event(`VIDEO ACTIVE ${label}`);
          finish();
        };

        const video = createVideo(path);
        this.currentVideo = video;
        this.currentVideoIndex = normalized;

        const elt = video.elt;
        video.hide();

        // Mobile autoplay policies care about the native `muted` flag, not only
        // a volume of zero. Set all relevant HTMLMediaElement properties before
        // play() is requested. The initial play() call happens synchronously from
        // the user's first gesture whenever this is the first clip.
        elt.muted = true;
        elt.defaultMuted = true;
        elt.volume = 0;
        elt.loop = true;
        elt.autoplay = true;
        elt.playsInline = true;
        elt.preload = "auto";
        elt.setAttribute("muted", "");
        elt.setAttribute("playsinline", "");
        elt.setAttribute("webkit-playsinline", "");

        const tryPlay = (reason) => {
          try {
            const promise = elt.play();
            this.telemetry.event(`VIDEO PLAY REQUEST ${reason}`);
            if (promise && typeof promise.then === "function") {
              promise
                .then(() => {
                  this.setVideoState("PLAYING");
                  activate(video);
                })
                .catch((error) => {
                  this.setVideoState("PLAY_BLOCKED");
                  this.telemetry.event(`VIDEO PLAY BLOCKED ${error && error.name ? error.name : "ERROR"}`);
                });
            }
          } catch (error) {
            this.setVideoState("PLAY_ERROR");
            this.telemetry.event(`VIDEO PLAY ERROR ${error.message || "UNKNOWN"}`);
          }
        };

        elt.addEventListener("loadedmetadata", () => {
          this.videoReadyState = elt.readyState;
          this.setVideoState("METADATA");
        }, { once: true });

        elt.addEventListener("loadeddata", () => {
          this.videoReadyState = elt.readyState;
          this.setVideoState("LOADED_DATA");
          activate(video);
        }, { once: true });

        elt.addEventListener("canplay", () => {
          this.videoReadyState = elt.readyState;
          this.setVideoState("CAN_PLAY");
          activate(video);
          if (elt.paused) tryPlay("CANPLAY");
        }, { once: true });

        elt.addEventListener("playing", () => {
          this.videoReadyState = elt.readyState;
          this.setVideoState("PLAYING");
          activate(video);
        });

        elt.addEventListener("waiting", () => this.setVideoState("BUFFERING"));
        elt.addEventListener("stalled", () => this.setVideoState("STALLED"));
        elt.addEventListener("error", () => {
          const code = elt.error ? elt.error.code : 0;
          this.setVideoState(`ERROR_${code || "UNKNOWN"}`);
          this.telemetry.event(`VIDEO ERROR ${label} CODE ${code || "?"}`);
          finish();
        }, { once: true });

        // This immediate native play request is intentional. For the first clip
        // it executes inside the original pointer gesture. Later clip switches
        // remain eligible for autoplay because the element is genuinely muted.
        tryPlay("GESTURE/AUTO");

        // 13–15 MB test clips can need more than seven seconds on a phone. Keep
        // the procedural source visible while loading rather than aborting early.
        timeoutId = setTimeout(() => {
          if (!activated) {
            this.setVideoState("TIMEOUT");
            this.telemetry.event(`VIDEO TIMEOUT ${label}`);
            finish();
          }
        }, 20000);
      });
    } finally {
      this.videoPending = false;
    }
  }

  setVideoState(next) {
    if (next === this.videoState) return;
    this.videoState = String(next);
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
      videoState: this.videoState,
      videoReadyState: this.videoReadyState,
    };
  }
}

window.P5LabMediaManager = P5LabMediaManager;
