/**
 * P5 MEDIA LAB 01 — MEDIA MANAGER v0.7.0
 *
 * Photo-only rolling working set.
 * - discovers the full archive as lightweight path metadata;
 * - keeps only a bounded resident pool of decoded p5.Image objects;
 * - stages replacement images sequentially in the background;
 * - swaps only after staging succeeds, then drops old references for GC;
 * - isolates candidate-selection policy so future multi-set mixing can evolve
 *   without coupling it to the visual engine.
 */
class P5LabMediaManager {
  constructor(assets, config, telemetry) {
    this.assets = assets;
    this.config = config;
    this.telemetry = telemetry;

    this.archiveEntries = [];
    this.activeEntries = [];
    this.stagingEntries = [];
    this.imagePool = [];
    this.imageCache = new Map();
    this.shuffleBag = [];

    this.currentImage = null;
    this.currentImageIndex = -1;
    this.currentActiveIndex = -1;
    this.imageLoadedCount = 0;
    this.imageFailedCount = 0;
    this.discoveryState = "IDLE";
    this.rotationState = "IDLE";
    this.rotationBusy = false;
    this.rotationCycle = 0;
    this.started = false;
    this.lastImageSwitchMs = 0;
    this.lastRotationCompletedMs = 0;

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
    if (!this.archiveEntries.length) this.registerArchive(this.assets.images || [], "default");

    this.resetShuffleBag();
    await this.loadInitialWorkingSet();

    this.setLoadingStatus("TOUCH TO START", `${this.imageLoadedCount}/${this.archiveEntries.length} RESIDENT`);
    this.telemetry.event(`IMAGE WORKING SET READY ${this.imageLoadedCount}/${this.archiveEntries.length}`);
  }

  setLoadingStatus(action, note) {
    const actionEl = document.querySelector(".start-action");
    const noteEl = document.querySelector(".start-note");
    if (actionEl) actionEl.textContent = action;
    if (noteEl) noteEl.textContent = `v0.7.0 / ${note}`;
  }

  configuredImageSets() {
    const configured = Array.isArray(this.config.imageSets) ? this.config.imageSets : [];
    const valid = configured
      .filter((set) => set && set.id)
      .map((set) => ({ id: String(set.id), subdir: String(set.subdir || "").replace(/^\/+|\/+$/g, "") }));
    return valid.length ? valid : [{ id: "default", subdir: "" }];
  }

  async discoverImages() {
    const owner = this.config.githubOwner;
    const repo = this.config.githubRepo;
    const branch = this.config.githubBranch || "main";
    const rootDir = String(this.config.githubImageDir || "").replace(/\/+$/g, "");
    const allowed = new Set((this.config.imageExtensions || []).map((x) => String(x).toLowerCase()));
    const discovered = [];
    let setSuccessCount = 0;

    this.discoveryState = "SCANNING";
    this.telemetry.event("IMAGE DIRECTORY SCAN");

    for (const set of this.configuredImageSets()) {
      const repoDir = set.subdir ? `${rootDir}/${set.subdir}` : rootDir;
      const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${repoDir}?ref=${encodeURIComponent(branch)}`;

      try {
        const response = await fetch(url, {
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(`GITHUB_${response.status}`);
        const entries = await response.json();
        if (!Array.isArray(entries)) throw new Error("GITHUB_DIRECTORY_RESPONSE_INVALID");

        const names = entries
          .filter((entry) => entry && entry.type === "file" && entry.name)
          .map((entry) => entry.name)
          .filter((name) => allowed.has(String(name).split(".").pop().toLowerCase()));

        for (const name of names) {
          const webPath = set.subdir
            ? `./assets/images/${encodeURIComponent(set.subdir)}/${encodeURIComponent(name)}`
            : `./assets/images/${encodeURIComponent(name)}`;
          discovered.push({ path: webPath, setId: set.id });
        }
        setSuccessCount += 1;
        this.telemetry.event(`IMAGE SET ${set.id} FOUND ${names.length}`);
      } catch (error) {
        this.telemetry.event(`IMAGE SET ${set.id} ERROR ${error && error.message ? error.message : "ERROR"}`);
      }
    }

    if (!discovered.length) {
      this.discoveryState = "FALLBACK";
      this.telemetry.event("IMAGE SCAN FALLBACK");
      this.setLoadingStatus("LOADING FALLBACK", `${(this.assets.images || []).length} MANIFEST FILES`);
      this.registerArchive(this.assets.images || [], "default");
      return;
    }

    this.archiveEntries = discovered.map((entry, archiveIndex) => ({
      key: `${entry.setId}:${entry.path}`,
      path: entry.path,
      setId: entry.setId,
      archiveIndex,
    }));
    this.assets.images = this.archiveEntries.map((entry) => entry.path);
    this.discoveryState = setSuccessCount === this.configuredImageSets().length ? "READY" : "PARTIAL";
    this.telemetry.event(`IMAGE ARCHIVE FOUND ${this.archiveEntries.length}`);
    this.setLoadingStatus("LOADING WORKING SET", `${this.archiveEntries.length} FILES FOUND`);
  }

  registerArchive(paths, setId = "default") {
    this.archiveEntries = (paths || []).map((path, archiveIndex) => ({
      key: `${setId}:${path}`,
      path,
      setId,
      archiveIndex,
    }));
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

  shuffle(entries) {
    const out = entries.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  resetShuffleBag(excludedKeys = new Set()) {
    // Selection policy boundary. Today this is a shuffle-bag over all sets.
    // Future policies (per-set quota, A/B alternation, weighted folders, etc.)
    // should be implemented here / in takeCandidates(), not in the renderer.
    this.shuffleBag = this.shuffle(this.archiveEntries.filter((entry) => !excludedKeys.has(entry.key)));
    this.rotationCycle += 1;
  }

  takeCandidates(count) {
    const blocked = new Set([
      ...this.activeEntries.map((entry) => entry.key),
      ...this.stagingEntries.map((entry) => entry.key),
    ]);
    const selected = [];
    let guard = Math.max(4, this.archiveEntries.length * 3);

    while (selected.length < count && guard-- > 0) {
      if (!this.shuffleBag.length) this.resetShuffleBag(new Set([...blocked, ...selected.map((entry) => entry.key)]));
      if (!this.shuffleBag.length) break;
      const entry = this.shuffleBag.shift();
      if (!entry || blocked.has(entry.key) || selected.some((x) => x.key === entry.key)) continue;
      selected.push(entry);
    }
    return selected;
  }

  async loadInitialWorkingSet() {
    const target = Math.min(
      this.archiveEntries.length,
      Math.max(1, Number(this.config.activeImageLimit) || 20)
    );
    const concurrency = Math.max(1, Math.min(6, Number(this.config.initialLoadConcurrency) || 3));
    const candidates = this.takeCandidates(target);
    let cursor = 0;

    this.rotationState = "INITIAL_LOAD";
    this.telemetry.event(`IMAGE INITIAL LOAD ${target} / ${concurrency} WORKERS`);

    const worker = async () => {
      while (true) {
        const index = cursor++;
        if (index >= candidates.length) return;
        const entry = candidates[index];
        try {
          const img = await this.loadImageAsync(entry.path);
          const resident = { ...entry, img };
          this.activeEntries.push(resident);
          this.imageCache.set(entry.path, img);
        } catch (_) {
          this.imageFailedCount += 1;
          this.telemetry.event(`IMAGE ERROR ${P5LabUtils.basename(entry.path)}`);
        }
        this.imageLoadedCount = this.activeEntries.length;
        this.setLoadingStatus("LOADING IMAGES", `${this.imageLoadedCount}/${target} RESIDENT`);
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(1, candidates.length)) }, () => worker()));
    this.refreshImagePool();
    this.rotationState = "IDLE";

    if (this.activeEntries.length) this.setCurrentEntry(this.activeEntries[0], 0);
  }

  refreshImagePool() {
    this.imagePool = this.activeEntries.map((entry) => entry.img).filter(Boolean);
    this.imageLoadedCount = this.imagePool.length;
  }

  setCurrentEntry(entry, activeIndex) {
    if (!entry || !entry.img) return;
    this.currentImage = entry.img;
    this.currentImageIndex = entry.archiveIndex;
    this.currentActiveIndex = activeIndex;
    this.currentSource = entry.img;
    this.currentSourceType = "IMAGE";
    this.sourceLabel = P5LabUtils.basename(entry.path);
  }

  async start() {
    if (this.started) return;
    this.started = true;
    const now = millis();
    this.lastImageSwitchMs = now;
    this.lastRotationCompletedMs = now;
    if (this.activeEntries.length) this.setCurrentEntry(this.activeEntries[0], 0);
  }

  update() {
    if (!this.started || !this.imageLoadedCount) return;
    const now = millis();

    if (now - this.lastImageSwitchMs > P5LAB_CONFIG.app.imageSwitchSec * 1000) {
      this.advanceToNextLoadedImage();
      this.lastImageSwitchMs = now;
    }

    const intervalMs = Math.max(250, (Number(this.config.rotationIntervalSec) || 5) * 1000);
    if (!this.rotationBusy && this.archiveEntries.length > this.activeEntries.length && now - this.lastRotationCompletedMs >= intervalMs) {
      this.rotateWorkingSet().catch((error) => {
        this.rotationBusy = false;
        this.rotationState = "ERROR";
        this.lastRotationCompletedMs = millis();
        this.telemetry.event(`IMAGE ROTATION ERROR ${error && error.message ? error.message : "ERROR"}`);
      });
    }
  }

  advanceToNextLoadedImage() {
    const total = this.activeEntries.length;
    if (!total) return;
    const next = (this.currentActiveIndex + 1 + total) % total;
    this.setCurrentEntry(this.activeEntries[next], next);
  }

  async rotateWorkingSet() {
    if (this.rotationBusy) return;
    this.rotationBusy = true;
    this.rotationState = "STAGING";
    this.stagingEntries = [];

    const availableOutsidePool = Math.max(0, this.archiveEntries.length - this.activeEntries.length);
    const requested = Math.min(
      Math.max(1, Number(this.config.rotationBatchSize) || 5),
      availableOutsidePool
    );
    const candidates = this.takeCandidates(requested);

    // Background rotation intentionally stays sequential. The config exists as
    // a policy knob, but values above 1 are clamped for predictable decode load.
    const concurrency = Math.min(1, Math.max(1, Number(this.config.rotationLoadConcurrency) || 1));
    this.telemetry.event(`IMAGE STAGE ${candidates.length} / ${concurrency} WORKER`);

    for (const entry of candidates) {
      try {
        const img = await this.loadImageAsync(entry.path);
        const staged = { ...entry, img };
        this.stagingEntries.push(staged);
        this.imageCache.set(entry.path, img);
      } catch (_) {
        this.imageFailedCount += 1;
        this.telemetry.event(`IMAGE ERROR ${P5LabUtils.basename(entry.path)}`);
      }
    }

    if (this.stagingEntries.length) this.commitStagedRotation();
    else this.telemetry.event("IMAGE ROTATION SKIPPED");

    this.stagingEntries = [];
    this.rotationBusy = false;
    this.rotationState = "IDLE";
    this.lastRotationCompletedMs = millis();
  }

  commitStagedRotation() {
    const replaceCount = Math.min(this.stagingEntries.length, this.activeEntries.length);
    const evicted = this.activeEntries.splice(0, replaceCount);
    this.activeEntries.push(...this.stagingEntries.slice(0, replaceCount));

    const evictedKeys = new Set(evicted.map((entry) => entry.key));
    for (const entry of evicted) this.imageCache.delete(entry.path);

    // If the analyzer/current-source pointer was one of the evicted references,
    // move it immediately so the old decoded image can become garbage-collectable.
    const currentWasEvicted = evictedKeys.has(
      this.archiveEntries[this.currentImageIndex] ? this.archiveEntries[this.currentImageIndex].key : ""
    );

    this.refreshImagePool();
    if (currentWasEvicted || this.currentActiveIndex >= this.activeEntries.length) {
      if (this.activeEntries.length) this.setCurrentEntry(this.activeEntries[0], 0);
    } else if (this.currentImage) {
      const idx = this.activeEntries.findIndex((entry) => entry.img === this.currentImage);
      this.currentActiveIndex = idx >= 0 ? idx : 0;
    }

    // Drop the temporary resident references held by the eviction list itself.
    evicted.length = 0;
    this.telemetry.event(`IMAGE SWAP ${replaceCount} / RESIDENT ${this.activeEntries.length}`);
  }

  getSource() { return this.currentSource || this.currentImage || this.blackFallback; }
  getCurrentImage() { return this.currentImage; }
  getImagePool() { return this.imagePool; }

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
      imagePoolTotal: this.archiveEntries.length,
      imageFailedCount: this.imageFailedCount,
      imageStagingSize: this.stagingEntries.length,
      imageSetCount: new Set(this.archiveEntries.map((entry) => entry.setId)).size,
      imageRotationState: this.rotationState,
      imageRotationCycle: this.rotationCycle,
      discoveryState: this.discoveryState,
    };
  }
}

window.P5LabMediaManager = P5LabMediaManager;
