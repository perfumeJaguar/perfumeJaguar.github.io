/**
 * P5 MEDIA LAB 01 — APPLICATION ORCHESTRATOR
 *
 * Rendering order per frame:
 * 1) smooth interaction
 * 2) update media/procedural source
 * 3) analyze downsampled image
 * 4) map image + pointer -> audio parameters and analyze audio
 * 5) render visual preset
 * 6) render telemetry at native canvas resolution
 */
let telemetry;
let mediaManager;
let analyzer;
let audioEngine;
let interaction;
let visualEngine;
let appStarted = false;
let resizeTimer = null;

async function setup() {
  try {
    const viewport = P5LabUtils.viewportSize();
    pixelDensity(P5LAB_CONFIG.render.pixelDensity);
    const canvas = createCanvas(viewport.width, viewport.height);
    canvas.parent("app");
    frameRate(P5LAB_CONFIG.app.targetFps);

    telemetry = new P5LabTelemetry(P5LAB_CONFIG.telemetry);
    interaction = new P5LabInteraction(P5LAB_CONFIG.interaction, telemetry);
    mediaManager = new P5LabMediaManager(P5LAB_ASSETS, P5LAB_CONFIG.media, telemetry);
    analyzer = new P5LabVideoAnalyzer(P5LAB_CONFIG.render, telemetry);
    audioEngine = new P5LabAudioEngine(P5LAB_ASSETS.audio, P5LAB_CONFIG.audio, telemetry);
    visualEngine = new P5LabVisualEngine(P5LAB_CONFIG.visual, telemetry);

    mediaManager.setup();
    analyzer.setup(viewport.width, viewport.height);
    visualEngine.setup(viewport.width, viewport.height);
    await audioEngine.setup();

    telemetry.event("SYSTEM READY / AWAITING USER GESTURE");
    bindStartScreen();
    bindViewportEvents();

    if (P5LAB_CONFIG.app.preventContextMenu) {
      document.addEventListener("contextmenu", (event) => event.preventDefault());
    }
  } catch (error) {
    showFatal(error);
  }
}

function draw() {
  if (!telemetry || !mediaManager || !analyzer || !audioEngine || !interaction || !visualEngine) {
    background(0);
    return;
  }

  interaction.update();
  mediaManager.update(interaction.snapshot(), audioEngine.snapshot());
  const source = mediaManager.getSource();
  const analysis = analyzer.update(source, interaction.snapshot());
  const audio = audioEngine.update(analysis, interaction.snapshot());

  visualEngine.render(
    source,
    mediaManager.getCurrentImage(),
    analysis,
    audio,
    interaction.snapshot(),
  );

  telemetry.render(makeSnapshot());
}

function makeSnapshot() {
  return {
    system: {
      fps: frameRate() || 0,
      bufferW: visualEngine.buffer ? visualEngine.buffer.width : 0,
      bufferH: visualEngine.buffer ? visualEngine.buffer.height : 0,
    },
    media: mediaManager.snapshot(),
    analysis: analyzer.snapshot(),
    audio: audioEngine.snapshot(),
    interaction: interaction.snapshot(),
    visual: visualEngine.snapshot(),
  };
}

function bindStartScreen() {
  const screen = document.getElementById("start-screen");
  const trigger = async () => {
    if (appStarted) return;
    appStarted = true;
    screen.classList.add("is-hidden");
    telemetry.event("USER GESTURE ACCEPTED");

    if (P5LAB_CONFIG.app.requestFullscreenOnStart) {
      try {
        const root = document.documentElement;
        if (!document.fullscreenElement && root.requestFullscreen) {
          try {
            await root.requestFullscreen({ navigationUI: "hide" });
          } catch (_) {
            await root.requestFullscreen();
          }
          telemetry.event("FULLSCREEN ACTIVE");
        }
      } catch (_) {
        telemetry.event("FULLSCREEN UNAVAILABLE / VIEWPORT MODE");
      }
    }

    try {
      await audioEngine.start();
    } catch (error) {
      telemetry.event(`AUDIO START ERROR ${error.message || "UNKNOWN"}`);
    }

    try {
      await mediaManager.start();
    } catch (error) {
      telemetry.event(`MEDIA START ERROR ${error.message || "UNKNOWN"}`);
    }
  };

  screen.addEventListener("pointerdown", trigger, { once: true });
  screen.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") trigger();
  });
}

function bindViewportEvents() {
  const scheduleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuildForViewport, 100);
  };

  window.addEventListener("resize", scheduleResize);
  window.addEventListener("orientationchange", scheduleResize);
  document.addEventListener("fullscreenchange", scheduleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleResize);
  }
}

function rebuildForViewport() {
  const viewport = P5LabUtils.viewportSize();
  resizeCanvas(viewport.width, viewport.height);
  analyzer.rebuild(viewport.width, viewport.height);
  visualEngine.rebuild(viewport.width, viewport.height);
  telemetry.event(`VIEWPORT ${viewport.width}X${viewport.height}`);
}

function mouseMoved() {
  if (interaction) interaction.move(mouseX, mouseY);
}

function mouseDragged() {
  if (interaction) interaction.move(mouseX, mouseY);
  return false;
}

function mousePressed() {
  if (interaction && appStarted) interaction.press(mouseX, mouseY);
  return false;
}

function mouseReleased() {
  if (interaction) interaction.release();
  return false;
}

function touchStarted(event) {
  if (interaction && appStarted && touches.length > 0) {
    interaction.press(touches[0].x, touches[0].y);
  }
  if (event) event.preventDefault();
  return false;
}

function touchMoved(event) {
  if (interaction && touches.length > 0) {
    interaction.move(touches[0].x, touches[0].y);
  }
  if (event) event.preventDefault();
  return false;
}

function touchEnded(event) {
  if (interaction) interaction.release();
  if (event) event.preventDefault();
  return false;
}

function showFatal(error) {
  console.error(error);
  const el = document.getElementById("fatal-message");
  el.hidden = false;
  el.textContent = `P5 MEDIA LAB / FATAL ERROR\n\n${error && error.stack ? error.stack : error}`;
}
