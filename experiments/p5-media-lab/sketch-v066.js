/** P5 MEDIA LAB 01 — APPLICATION ORCHESTRATOR v0.6.6 */
let telemetry,mediaManager,analyzer,audioEngine,interaction,visualEngine;
let appStarted=false,appStartedMs=0,resizeTimer=null,runtimeFailed=false,lastViewportW=0,lastViewportH=0;
window.DODREI_RUNTIME_PAUSED=false;

async function setup(){
  try{
    const v=P5LabUtils.viewportSize();
    lastViewportW=v.width;lastViewportH=v.height;
    pixelDensity(P5LAB_CONFIG.render.pixelDensity);
    const c=createCanvas(v.width,v.height);c.parent('app');
    frameRate(P5LAB_CONFIG.app.targetFps);
    telemetry=new P5LabTelemetry(P5LAB_CONFIG.telemetry);
    interaction=new P5LabInteraction(P5LAB_CONFIG.interaction,telemetry);
    mediaManager=new P5LabMediaManager(P5LAB_ASSETS,P5LAB_CONFIG.media,telemetry);
    analyzer=new P5LabVideoAnalyzer(P5LAB_CONFIG.render,telemetry);
    audioEngine=new P5LabAudioEngine(P5LAB_ASSETS.audio,P5LAB_CONFIG.audio,telemetry);
    window.DODREI_AUDIO_ENGINE=audioEngine;
    const VisualEngineClass=window.P5LAB_VISUAL_ENGINE_CLASS||P5LabVisualEngine;
    visualEngine=new VisualEngineClass(P5LAB_CONFIG.visual,telemetry);
    analyzer.setup(v.width,v.height);visualEngine.setup(v.width,v.height);
    telemetry.event(`VISUAL ENGINE ${window.P5LAB_VISUAL_ENGINE_VERSION||'BASE'} ACTIVE`);
    await Promise.allSettled([mediaManager.setup(),audioEngine.setup()]);
    telemetry.event('SYSTEM READY / AWAITING USER GESTURE');
    bindStartScreen();bindViewportEvents();
    if(P5LAB_CONFIG.app.preventContextMenu)document.addEventListener('contextmenu',e=>e.preventDefault());
  }catch(e){showFatal(e);}
}

function startupState(){
  const cfg=P5LAB_CONFIG.app||{};
  const elapsed=appStarted?Math.max(0,millis()-appStartedMs):0;
  const teleStart=Math.max(0,Number(cfg.telemetryStartDelayMs)||3000);
  const stagger=Math.max(0,Number(cfg.telemetryStaggerMs)||200);
  const teleEnd=teleStart+stagger*2;
  const dimAt=teleEnd+Math.max(0,Number(cfg.visualDimDelayAfterTelemetryMs)||3000);
  const fullAt=dimAt+Math.max(1,Number(cfg.visualFullDelayAfterDimMs)||1000);
  let telemetryStage=0;
  if(appStarted&&elapsed>=teleStart)telemetryStage=1;
  if(appStarted&&elapsed>=teleStart+stagger)telemetryStage=2;
  if(appStarted&&elapsed>=teleStart+stagger*2)telemetryStage=3;
  let visualOpacity=0;
  if(appStarted&&elapsed>=dimAt)visualOpacity=elapsed>=fullAt?1:0.20;
  if(window.DODREI_STARTUP){window.DODREI_STARTUP.telemetryStage=telemetryStage;window.DODREI_STARTUP.visualOpacity=visualOpacity;}
  return{telemetryStage,visualOpacity};
}

function draw(){
  if(runtimeFailed)return;
  try{
    if(!telemetry||!mediaManager||!analyzer||!audioEngine||!interaction||!visualEngine){background(0);return;}
    interaction.update();mediaManager.update();
    const source=mediaManager.getSource();const interactionSnapshot=interaction.snapshot();
    const analysis=analyzer.update(source,interactionSnapshot);const audio=audioEngine.update(analysis,interactionSnapshot);
    const state=startupState();
    background(P5LAB_CONFIG.render.background);
    if(state.visualOpacity>0){
      visualEngine.render(source,mediaManager.getCurrentImage(),mediaManager.getImagePool(),analysis,audio,interactionSnapshot);
      if(state.visualOpacity<1){push();noStroke();fill(0,255*(1-state.visualOpacity));rect(0,0,width,height);pop();}
    }
    if(state.telemetryStage>0)telemetry.render(makeSnapshot());
  }catch(e){runtimeFailed=true;showFatal(e);try{noLoop();}catch(_){}}
}

function makeSnapshot(){return{system:{fps:frameRate()||0,bufferW:visualEngine.buffer?visualEngine.buffer.width:0,bufferH:visualEngine.buffer?visualEngine.buffer.height:0},media:mediaManager.snapshot(),analysis:analyzer.snapshot(),audio:audioEngine.snapshot(),interaction:interaction.snapshot(),visual:visualEngine.snapshot()};}

function bindStartScreen(){
  const screen=document.getElementById('start-screen');
  const trigger=()=>{
    if(appStarted)return;appStarted=true;appStartedMs=millis();telemetry.event('USER GESTURE ACCEPTED');
    let ap,mp;try{ap=audioEngine.start();}catch(e){telemetry.event(`AUDIO START ERROR ${e.message||'UNKNOWN'}`);ap=Promise.reject(e);}
    try{mp=mediaManager.start();}catch(e){telemetry.event(`MEDIA START ERROR ${e.message||'UNKNOWN'}`);mp=Promise.reject(e);}
    const hold=Math.max(0,Number(P5LAB_CONFIG.app.startScreenHoldMs)||3000);
    setTimeout(()=>{screen.classList.add('is-hidden');if(window.DODREI_STARTUP)window.DODREI_STARTUP.startScreenReleased=true;},hold);
    Promise.allSettled([Promise.resolve(ap),Promise.resolve(mp)]).then(r=>{telemetry.event(`AUDIO START ${r[0].status}`);telemetry.event(`MEDIA START ${r[1].status}`);});
  };
  screen.addEventListener('click',trigger,{once:true});screen.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')trigger();});
}

window.DODREI_SET_PAUSED=(paused)=>{const next=!!paused;window.DODREI_RUNTIME_PAUSED=next;try{if(audioEngine&&typeof audioEngine.setPlaybackPaused==='function')audioEngine.setPlaybackPaused(next);}catch(_){}try{if(next){if(typeof noLoop==='function')noLoop();}else{if(visualEngine&&Object.prototype.hasOwnProperty.call(visualEngine,'_virtualLastWallMs'))visualEngine._virtualLastWallMs=millis();if(typeof loop==='function')loop();}}catch(_){}try{if(telemetry)telemetry.event(`VISUAL PLAYBACK ${next?'PAUSED':'RESUMED'}`);}catch(_){}return next;};
function bindViewportEvents(){const schedule=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(rebuildForViewport,320);};window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);document.addEventListener('fullscreenchange',schedule);document.addEventListener('webkitfullscreenchange',schedule);}
function rebuildForViewport(){if(!analyzer||!visualEngine||!telemetry)return;const v=P5LabUtils.viewportSize();if(Math.abs(v.width-lastViewportW)<2&&Math.abs(v.height-lastViewportH)<2)return;lastViewportW=v.width;lastViewportH=v.height;try{resizeCanvas(v.width,v.height);analyzer.rebuild(v.width,v.height);visualEngine.rebuild(v.width,v.height);telemetry.event(`VIEWPORT ${v.width}X${v.height}`);if(!window.DODREI_RUNTIME_PAUSED&&!isLooping())loop();}catch(e){runtimeFailed=true;showFatal(e);}}
function retryAudio(){if(audioEngine&&appStarted)audioEngine.retryFromGesture();}
function mouseMoved(){if(interaction)interaction.move(mouseX,mouseY);}function mouseDragged(){if(interaction)interaction.move(mouseX,mouseY);return false;}function mousePressed(){retryAudio();if(interaction&&appStarted)interaction.press(mouseX,mouseY);return false;}function mouseReleased(){if(interaction)interaction.release();return false;}
function touchStarted(event){retryAudio();if(interaction&&appStarted&&touches.length>0)interaction.press(touches[0].x,touches[0].y);if(event)event.preventDefault();return false;}function touchMoved(event){if(interaction&&touches.length>0)interaction.move(touches[0].x,touches[0].y);if(event)event.preventDefault();return false;}function touchEnded(event){if(interaction)interaction.release();if(event)event.preventDefault();return false;}
function showFatal(error){console.error(error);const el=document.getElementById('fatal-message');if(!el)return;el.hidden=false;el.textContent=`P5 MEDIA LAB / FATAL ERROR\n\n${error&&error.stack?error.stack:error}`;}
