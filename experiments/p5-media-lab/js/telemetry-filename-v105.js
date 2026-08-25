/** DODREI — DISPLAY FILENAME OBFUSCATION v1.0.5 */
(() => {
  const Telemetry = window.P5LabTelemetry;
  if (!Telemetry || Telemetry.prototype._dodreiFilenameV105) return;

  const baseRender = Telemetry.prototype.render;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  const aliasFilename = function aliasFilename(raw) {
    const value = String(raw ?? "");
    if (!value) return value;

    if (!this._filenameAliasCache) this._filenameAliasCache = new Map();
    if (this._filenameAliasCache.has(value)) return this._filenameAliasCache.get(value);

    const dot = value.lastIndexOf(".");
    const hasExtension = dot > 0 && dot < value.length - 1;
    const stem = hasExtension ? value.slice(0, dot) : value;
    const extension = hasExtension ? value.slice(dot) : "";

    const aliasedStem = stem.replace(/\p{L}/gu, () => letters[Math.floor(Math.random() * letters.length)]);
    const result = aliasedStem + extension;
    this._filenameAliasCache.set(value, result);
    return result;
  };

  Telemetry.prototype.aliasFilename = aliasFilename;
  Telemetry.prototype.render = function filenameRenderV105(snapshot) {
    const media = snapshot?.media;
    if (!media?.sourceLabel || media.sourceType !== "IMAGE") return baseRender.call(this, snapshot);

    const nextSnapshot = {
      ...snapshot,
      media: {
        ...media,
        sourceLabel: this.aliasFilename(media.sourceLabel),
      },
    };
    return baseRender.call(this, nextSnapshot);
  };

  Telemetry.prototype._dodreiFilenameV105 = true;
})();
