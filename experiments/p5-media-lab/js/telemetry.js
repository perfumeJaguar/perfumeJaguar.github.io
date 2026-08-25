/**
 * Telemetry is instrumentation and visual material at the same time.
 * Internal values stay real, while mode/effect labels are intentionally rendered
 * as semi-corrupted pseudo-system names rather than honest implementation names.
 */
class P5LabTelemetry {
  constructor(config){this.config=config;this.events=[];this.metrics={};this.frameJitter=0;}
  event(message){const stamp=performance.now()/1000;this.events.unshift({time:stamp,message:String(message).toUpperCase()});this.events.length=Math.min(this.events.length,this.config.maxEvents);}
  set(name,value){this.metrics[name]=value;}

  aliasMode(name){
    const map={
      PHOTO_FEEDBACK_CROP:'NULL//VEIL_7F',PHOTO_RAPID_CROP:'CUT.RASTER//19',PHOTO_RGB_TEAR:'CHR_MA::W0UND',PHOTO_HALATION:'HALO//FOG_ERR',PHOTO_SHARD_SWAP:'SHARD.BLEED//A3',PHOTO_DOUBLE_BLEND:'TWIN_EXPOSURE//NULL',PHOTO_BLEND_CYCLE:'MIX.CYCLE//BROKEN',PHOTO_FULL:'SOURCE//UNMARKED',LUMA_BLOCKS:'LUX_GRID//D4',LUMA_VOID:'VOID.LUMA//00',LUMA_MONO:'ASH_FIELD//1B',LUMA_DITHER:'DITHER//GHOST_8',LUMA_PULSE:'LUX.PULSE//ERR'
    };
    return map[name]||String(name||'UNKNOWN');
  }

  aliasFx(raw){
    const s=String(raw||'BASE');
    const replacements=[['PHOTO_FDBK','MEM_ECHO'],['CROP','FRAG'],['RGB_TEAR','CHR_SPLIT'],['HALATION','HALO_FOG'],['SHARD','RASTER_CUT'],['DOUBLE','TWIN_NULL'],['BLEND','MIX_ERR'],['PHOTO','SRC'],['MOSAIC_NORMAL','LUX_GRID'],['MOSAIC_INVERSE','VOID_GRID'],['MOSAIC_MONO','ASH_GRID'],['MOSAIC_DITHER','DITHER_GHOST'],['MOSAIC_PULSE','LUX_PULSE'],['CRUSH','CRSH'],['RUPTURE','RUPTR'],['SWIPE_FDBK','DRAG_ECHO'],['WAVE','SIG_WAVE'],['VIGNETTE','EDGE_NULL']];
    let out=s;for(const [a,b] of replacements)out=out.split(a).join(b);return out;
  }

  glitchLabel(text,seed=0){
    if(!this.config.glitchLabels)return text;
    const chars=['/','_','?','0','X',':'];let s=String(text);const phase=Math.floor(millis()/430)+seed;
    if((phase%4)!==0||s.length<5)return s;const i=Math.abs((phase*17+seed*13))%s.length,c=chars[Math.abs(phase+seed)%chars.length];return s.slice(0,i)+c+s.slice(i+1);
  }

  render(snapshot){
    if(!this.config.enabled)return;
    const mobile=P5LabUtils.isMobileLayout(),margin=mobile?this.config.marginMobile:this.config.marginDesktop,size=mobile?this.config.fontSizeMobile:this.config.fontSizeDesktop,rowStep=size*this.config.lineHeight;
    const motion=snapshot.analysis.motionSmooth||0,glitch=this.config.glitchOnMotion&&motion>.28;
    if(glitch&&frameCount%3===0)this.frameJitter=random(-2.5,2.5)*motion;else this.frameJitter*=.72;

    push();translate(this.frameJitter,0);textFont('monospace');textSize(size);textLeading(rowStep);noStroke();
    const bright=255*this.config.opacity,secondary=255*this.config.secondaryOpacity,faint=255*this.config.faintOpacity;
    const loaded=snapshot.media.imagePoolSize||0,total=snapshot.media.imagePoolTotal||0,failed=snapshot.media.imageFailedCount||0;
    const mode=this.glitchLabel(this.aliasMode(snapshot.visual.modeName),3),fx=this.glitchLabel(this.aliasFx(snapshot.visual.activeFx),9);
    const engine=snapshot.visual.engineVersion||window.P5LAB_VISUAL_ENGINE_VERSION||'BASE';
    const baseTarget=Number(snapshot.visual.baseFpsTarget||snapshot.visual.compositionFps||0);
    const baseActual=Number(snapshot.visual.baseFpsActual||0);
    const speedLevel=String(snapshot.visual.visualSpeedLevel||P5LAB_CONFIG.timing?.visualSpeedLevel||'S2');
    const speedMultiplier=Number(snapshot.visual.visualSpeedMultiplier||P5LAB_CONFIG.timing?.visualSpeedMultiplier||0.75);
    const cutEstimate=Number(snapshot.visual.effectiveCutIntervalMs||0);
    const stateHz=Number(snapshot.visual.effectiveVisualStateHz||0);

    const leftLines=[
      `${P5LAB_CONFIG.app.title}   V${P5LAB_CONFIG.app.version}`,
      `AUTHOR        ${this.config.author||'Hoyeon Choi'}`,
      `ENGINE        V${engine}`,
      `MODE          ${mode}`,
      `FX            ${fx}`,
      `SOURCE        ${snapshot.media.sourceLabel}`,
      `SOURCE_TYPE   ${snapshot.media.sourceType}`,
      `IMAGE_POOL    ${loaded}/${total}`,
      `IMAGE_FAIL    ${failed}`,
      `VIDEO_STATE   ${snapshot.media.videoState||'DISABLED'}`,
      `AUDIO_STATE   ${snapshot.audio.state||'IDLE'}`,
      `AUDIO_MODE    ${snapshot.audio.contextState||'UNKNOWN'}`,
      `AUDIO_PCM     ${snapshot.audio.analysisReady?'READY':'LOADING'}`,
      `AUDIO_FX      ${this.glitchLabel(snapshot.audio.fxState||'OFF',14)}`,
      `FRAME         ${String(frameCount).padStart(7,'0')}`,
      `TIME          ${P5LabUtils.formatTime(millis()/1000)}`,
      `FPS           ${snapshot.system.fps.toFixed(1)}`,
      `BASE_FPS      ${baseTarget ? `${baseTarget.toFixed(0)} / ${baseActual.toFixed(1)}` : 'N/A'}`,
      `VIS_SPEED     ${speedLevel} / ${speedMultiplier.toFixed(2)}X`,
      `STATE_HZ      ${stateHz ? stateHz.toFixed(1) : 'N/A'}`,
      `CUT_EST       ${cutEstimate ? `${cutEstimate.toFixed(0)}MS` : 'N/A'}`,
      `VIEWPORT      ${width} x ${height}`,
      `BUFFER        ${snapshot.system.bufferW} x ${snapshot.system.bufferH}`,
    ];
    fill(bright);this.drawLines(leftLines,margin,margin,rowStep);

    const parameterLines=[
      `POINTER_X     ${snapshot.interaction.x.toFixed(3)}`,`POINTER_Y     ${snapshot.interaction.y.toFixed(3)}`,`PRESSURE      ${snapshot.interaction.pressure.toFixed(3)}`,`SWIPE_SPEED   ${(snapshot.interaction.swipeSpeed||0).toFixed(3)}`,`LOCAL_LUMA    ${snapshot.analysis.localLuma.toFixed(3)}`,`GLOBAL_LUMA   ${snapshot.analysis.globalLuma.toFixed(3)}`,`MOTION        ${snapshot.analysis.motion.toFixed(3)}`,`MOTION_S      ${snapshot.analysis.motionSmooth.toFixed(3)}`,`AUDIO_RMS     ${snapshot.audio.rms.toFixed(3)}`,`BASS          ${snapshot.audio.bass.toFixed(3)}`,`MID           ${snapshot.audio.mid.toFixed(3)}`,`TREBLE        ${snapshot.audio.treble.toFixed(3)}`,`FILTER_HZ     ${snapshot.audio.filterHz.toFixed(0)}`,`DELAY_TIME    ${snapshot.audio.delayTime.toFixed(3)}`,`DELAY_FB      ${snapshot.audio.delayFeedback.toFixed(3)}`,`DISTORT       ${snapshot.audio.distortion.toFixed(3)}`,`WET           ${(snapshot.audio.wet||0).toFixed(3)}`,`RATE          ${snapshot.audio.rate.toFixed(3)}`
    ];
    fill(secondary);if(width>820)this.drawLines(parameterLines,width-margin-180,margin,rowStep);else this.drawLines(parameterLines.slice(0,18),margin,margin+leftLines.length*rowStep+rowStep,rowStep);

    const eventCount=mobile?Math.min(9,this.events.length):this.events.length,startY=height-margin-eventCount*rowStep;
    for(let i=eventCount-1;i>=0;i--){const evt=this.events[i],ageFade=1-i/Math.max(1,eventCount);fill(faint+(secondary-faint)*ageFade);text(`> ${evt.message}`,margin,startY+(eventCount-1-i)*rowStep);}
    pop();
  }

  drawLines(lines,x,y,lineHeight){for(let i=0;i<lines.length;i++)text(lines[i],x,y+i*lineHeight);}
}
window.P5LabTelemetry=P5LabTelemetry;
