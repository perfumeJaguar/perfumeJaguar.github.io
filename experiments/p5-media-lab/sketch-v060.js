/** P5 MEDIA LAB 01 — APPLICATION ORCHESTRATOR v0.6.0 */
let telemetry,mediaManager,analyzer,audioEngine,interaction,visualEngine;
let appStarted=false,resizeTimer=null,runtimeFailed=false,lastViewportW=0,lastViewportH=0;

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
    visualEngine=new P5LabVisualEngine(P5LAB_CONFIG.visual,telemetry);
    analyzer.setup(v.width,v.height);
    visualEngine.setup(v.width,v.height);

    // Real loading phase: archive discovery/preload and audio prep run together.
    await Promise.allSettled([mediaManager.setup(),audioEngine.setup()]);
    telemetry.event('SYSTEM READY / AWAITING USER GESTURE');
    bindStartScreen();bindViewportEvents();
    if(P5LAB_CONFIG.app.preventContextMenu)document.addEventListener('contextmenu',e=>e.preventDefault());
  }catch(e){showFatal(e);}
}

function draw(){
  if(runtimeFailed)return;
  try{
    if(!telemetry||!mediaManager||!analyzer||!audioEngine||!interaction||!visualEngine){background(0);return;}
    interaction.update();
    mediaManager.update();
    const source=mediaManager.getSource();
    const analysis=analyzer.update(source,interaction.snapshot());
    const audio=audioEngine.update(analysis,interaction.snapshot());
    visualEngine.render(source,mediaManager.getCurrentImage(),mediaManager.getImagePool(),analysis,audio,interaction.snapshot());
    telemetry.render(makeSnapshot());
  }catch(e){runtimeFailed=true;showFatal(e);try{noLoop();}catch(_){}}
}

function makeSnapshot(){return{system:{fps:frameRate()||0,bufferW:visualEngine.buffer?visualEngine.buffer.width:0,bufferH:visualEngine.buffer?visualEngine.buffer.height:0},media:mediaManager.snapshot(),analysis:analyzer.snapshot(),audio:audioEngine.snapshot(),interaction:interaction.snapshot(),visual:visualEngine.snapshot()};}

function bindStartScreen(){const screen=document.getElementById('start-screen');const trigger=()=>{if(appStarted)return;appStarted=true;telemetry.event('USER GESTURE ACCEPTED');let ap,mp;try{ap=audioEngine.start();}catch(e){telemetry.event(`AUDIO START ERROR ${e.message||'UNKNOWN'}`);ap=Promise.reject(e);}try{mp=mediaManager.start();}catch(e){telemetry.event(`MEDIA START ERROR ${e.message||'UNKNOWN'}`);mp=Promise.reject(e);}screen.classList.add('is-hidden');Promise.allSettled([Promise.resolve(ap),Promise.resolve(mp)]).then(r=>{telemetry.event(`AUDIO START ${r[0].status}`);telemetry.event(`MEDIA START ${r[1].status}`);});};screen.addEventListener('click',trigger,{once:true});screen.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')trigger();});}
function bindViewportEvents(){const schedule=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(rebuildForViewport,180);};window.addEventListener('resize',schedule);window.addEventListener('orientationchange',schedule);}
function rebuildForViewport(){if(!analyzer||!visualEngine||!telemetry)return;const v=P5LabUtils.viewportSize();if(Math.abs(v.width-lastViewportW)<2&&Math.abs(v.height-lastViewportH)<2)return;lastViewportW=v.width;lastViewportH=v.height;try{resizeCanvas(v.width,v.height);analyzer.rebuild(v.width,v.height);visualEngine.rebuild(v.width,v.height);telemetry.event(`VIEWPORT ${v.width}X${v.height}`);if(!isLooping())loop();}catch(e){runtimeFailed=true;showFatal(e);}}
function retryAudio(){if(audioEngine&&appStarted)audioEngine.retryFromGesture();}
function mouseMoved(){if(interaction)interaction.move(mouseX,mouseY);}function mouseDragged(){if(interaction)interaction.move(mouseX,mouseY);return false;}function mousePressed(){retryAudio();if(interaction&&appStarted)interaction.press(mouseX,mouseY);return false;}function mouseReleased(){if(interaction)interaction.release();return false;}
function touchStarted(event){retryAudio();if(interaction&&appStarted&&touches.length>0)interaction.press(touches[0].x,touches[0].y);if(event)event.preventDefault();return false;}function touchMoved(event){if(interaction&&touches.length>0)interaction.move(touches[0].x,touches[0].y);if(event)event.preventDefault();return false;}function touchEnded(event){if(interaction)interaction.release();if(event)event.preventDefault();return false;}
function showFatal(error){console.error(error);const el=document.getElementById('fatal-message');if(!el)return;el.hidden=false;el.textContent=`P5 MEDIA LAB / FATAL ERROR\n\n${error&&error.stack?error.stack:error}`;}
