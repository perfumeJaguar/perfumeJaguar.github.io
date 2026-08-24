/** Shared helpers. Kept dependency-free so every other module can use them. */
window.P5LabUtils = {
  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  },

  lerp(current, target, amount) {
    return current + (target - current) * amount;
  },

  map01(value, outMin, outMax) {
    const v = Math.min(1, Math.max(0, value));
    return outMin + (outMax - outMin) * v;
  },

  isPortrait() {
    return window.innerHeight >= window.innerWidth;
  },

  isMobileLayout() {
    return Math.min(window.innerWidth, window.innerHeight) < 720;
  },

  viewportSize() {
    // visualViewport tracks the actually visible area on mobile Chrome as its
    // address/navigation bars expand and collapse. Fallback keeps compatibility.
    if (window.visualViewport) {
      return {
        width: Math.max(1, Math.round(window.visualViewport.width)),
        height: Math.max(1, Math.round(window.visualViewport.height)),
      };
    }

    return {
      width: Math.max(1, window.innerWidth),
      height: Math.max(1, window.innerHeight),
    };
  },

  fitInside(srcW, srcH, maxLongEdge) {
    const longEdge = Math.max(srcW, srcH);
    if (longEdge <= maxLongEdge) {
      return { width: Math.max(1, Math.round(srcW)), height: Math.max(1, Math.round(srcH)) };
    }

    const scale = maxLongEdge / longEdge;
    return {
      width: Math.max(1, Math.round(srcW * scale)),
      height: Math.max(1, Math.round(srcH * scale)),
    };
  },

  sourceSize(source) {
    if (!source) return { width: 0, height: 0 };
    const elt = source.elt;
    if (elt && elt.videoWidth && elt.videoHeight) {
      return { width: elt.videoWidth, height: elt.videoHeight };
    }
    return {
      width: Number(source.width) || 0,
      height: Number(source.height) || 0,
    };
  },

  // Draw any image/video/graphics source like CSS object-fit: cover.
  // Edges may be cropped, but no letterboxing is ever introduced.
  // `tintRGB` is optional and is useful for additive channel-separation passes.
  drawCover(target, source, alpha = 255, zoom = 1, offsetX = 0, offsetY = 0, tintRGB = null) {
    if (!source) return;
    const sourceSize = this.sourceSize(source);
    if (!sourceSize.width || !sourceSize.height) return;

    // `target` is normally a p5.Graphics buffer. Passing null means draw to the
    // main global-mode canvas; this avoids treating browser `window` as Graphics.
    const isGraphics = target && typeof target.image === "function" && typeof target.push === "function";
    const tw = isGraphics ? target.width : width;
    const th = isGraphics ? target.height : height;
    const scale = Math.max(tw / sourceSize.width, th / sourceSize.height) * zoom;
    const dw = sourceSize.width * scale;
    const dh = sourceSize.height * scale;
    const dx = (tw - dw) * 0.5 + offsetX;
    const dy = (th - dh) * 0.5 + offsetY;
    const tintArgs = tintRGB
      ? [tintRGB[0], tintRGB[1], tintRGB[2], alpha]
      : [255, alpha];

    if (isGraphics) {
      target.push();
      target.tint(...tintArgs);
      target.image(source, dx, dy, dw, dh);
      target.noTint();
      target.pop();
    } else {
      push();
      tint(...tintArgs);
      image(source, dx, dy, dw, dh);
      noTint();
      pop();
    }
  },

  formatTime(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const minutes = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const millis = Math.floor((s - Math.floor(s)) * 1000);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  },

  basename(path) {
    if (!path) return "NONE";
    const clean = String(path).split("?")[0];
    return clean.substring(clean.lastIndexOf("/") + 1) || clean;
  },
};
