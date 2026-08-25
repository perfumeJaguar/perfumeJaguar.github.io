/**
 * DODREI — VISUAL ENGINE v0.8.0
 * =============================================================================
 * Config-control layer on top of v0.7.0.
 *
 * Adds:
 * - stable-ID / enabled mode playlist;
 * - sequence or shuffle mode advancement;
 * - config-driven enable/disable for the fixed visual stage pipeline;
 * - config-driven four-band rupture palette.
 *
 * Pipeline ORDER remains locked because current stages depend on previous buffers.
 * The config representation is intentionally future-proof: a later engine may
 * unlock compatible stages without changing the saved config shape.
 */
class DodreiVisualEngineV080 extends P5LabVisualEngineV070 {
  setup(w,h){
    const ctl=this.config.modeControl||{};
    this.modeIndex=Math.max(0,Math.floor(Number(ctl.startIndex)||0));
    this._modeBag=[];
    super.setup(w,h);
  }

  enabledPresets(){
    const list=Array.isArray(this.config.presets)?this.config.presets:[];
    const enabled=list.filter(p=>p&&p.enabled!==false);
    return enabled.length?enabled:list;
  }

  currentPreset(){
    const list=this.enabledPresets();
    if(!list.length)return {id:"fallback-full",name:"PHOTO_FULL",photoFull:true,enabled:true};
    return list[this.modeIndex%list.length];
  }

  refillModeBag(length,currentIndex){
    const bag=[];
    for(let i=0;i<length;i++)if(i!==currentIndex)bag.push(i);
    for(let i=bag.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [bag[i],bag[j]]=[bag[j],bag[i]];
    }
    this._modeBag=bag;
  }

  advanceMode(){
    const list=this.enabledPresets();
    if(list.length<=1){this.modeIndex=0;return;}
    const ctl=this.config.modeControl||{};
    if(ctl.strategy==="shuffle"){
      if(!this._modeBag||!this._modeBag.length)this.refillModeBag(list.length,this.modeIndex%list.length);
      this.modeIndex=this._modeBag.shift();
      return;
    }
    const next=(this.modeIndex%list.length)+1;
    if(next>=list.length&&ctl.loop===false)this.modeIndex=list.length-1;
    else this.modeIndex=next%list.length;
  }

  updateMode(){
    const duration=Math.max(.05,Number(P5LAB_CONFIG.app.modeDurationSec)||11)*1000;
    if(millis()-this.modeStartedMs<=duration)return;
    this.advanceMode();
    this.modeStartedMs=millis();
    this.feedback.clear();
    this.feedbackScratch.clear();
    this.swipeFeedback.clear();
    this.swipeScratch.clear();
    this.announcePreset();
  }

  announcePreset(){
    const p=this.currentPreset();
    this.telemetry.event(`MODE ${p.name||p.id||"UNKNOWN"}`);
  }

  pipelineEnabled(id,fallback=true){
    const stages=Array.isArray(this.config.pipeline)?this.config.pipeline:[];
    const stage=stages.find(x=>x&&x.id===id);
    return stage?stage.enabled!==false:fallback;
  }

  render(_source,currentImage,imagePool,analysis,audio,interaction){
    if(this.config.enabled===false){
      background(P5LAB_CONFIG.render.background);
      return;
    }
    this.updateMode();
    const p=this.currentPreset(),g=this.buffer;
    const pool=imagePool&&imagePool.length?imagePool:(currentImage?[currentImage]:[]);
    const t=this.tick(this.config.photoCutMs,interaction);

    g.push();
    g.background(0);
    if(this.pipelineEnabled("preset-composition")){
      if(p.photoFeedback)this.drawPhotoFeedbackSource(g,pool,interaction,audio,t);
      else if(p.photoRapidCrop)this.drawPhotoRapidCrop(g,pool,interaction,audio,t);
      else if(p.photoRgbTear)this.drawPhotoRgbTear(g,pool,interaction,audio,t);
      else if(p.photoHalation)this.drawPhotoHalation(g,pool,interaction,audio,t);
      else if(p.photoShardSwap)this.drawPhotoShardSwap(g,pool,interaction,audio,t);
      else if(p.photoDoubleBlend)this.drawPhotoDoubleBlend(g,pool,interaction,audio,t);
      else if(p.photoBlendCycle)this.drawPhotoBlendCycle(g,pool,interaction,audio,t);
      else if(p.photoFull)this.drawPhotoFull(g,pool,interaction,audio,t);
      else if(p.mosaic)this.drawMosaic(g,pool,analysis,audio,interaction,p.mosaic,t);
    }
    g.pop();

    let stage=g;
    if(this.pipelineEnabled("common-crush"))stage=this.applyCommonCrush(stage,pool,interaction,audio,t);

    if(this.pipelineEnabled("touch-rupture")&&(interaction.pressure||0)>.035){
      stage=this.applyTouchRupture(stage,interaction,audio,t);
    }

    if(this.pipelineEnabled("preset-feedback")&&p.feedback){
      this.applyPhotoFeedback(stage,audio,interaction);
      stage=this.feedback;
    }

    const swipe=interaction.swipeSpeed||0;
    const threshold=Number(this.config.swipeFeedbackThreshold)||0;
    if(this.pipelineEnabled("swipe-feedback")&&interaction.pressed&&swipe>threshold){
      this.applySwipeFeedback(stage,interaction,audio);
      stage=this.swipeFeedback;
    }else{
      this.swipeFeedback.clear();
      this.swipeScratch.clear();
    }

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null,stage,255);
    if(this.pipelineEnabled("vignette"))this.drawVignette(interaction,audio,p);
    if(this.pipelineEnabled("waveform"))this.drawWaveformOverlay(audio,interaction);
  }

  applyTouchRupture(src,i,a,t){
    const out=this.ruptureBuffer,scratch=this.ruptureScratch;
    const mobile=P5LabUtils.isMobileLayout();
    const skip=Math.max(1,mobile
      ? (this.config.touchRuptureFrameSkipMobile||2)
      : (this.config.touchRuptureFrameSkipDesktop||1));

    const now=millis();
    const freshGesture=(now-this._lastRuptureCallMs)>80;
    this._lastRuptureCallMs=now;
    this._ruptureFrameCounter++;
    if(!freshGesture&&skip>1&&(this._ruptureFrameCounter%skip)!==1)return out;

    out.clear();
    scratch.clear();
    scratch.push();
    const ctx=scratch.drawingContext;
    ctx.save();
    ctx.filter=`grayscale(1) contrast(${this.config.touchRuptureContrast})`;
    scratch.image(src,0,0,scratch.width,scratch.height);
    ctx.restore();
    scratch.pop();

    out.image(scratch,0,0,out.width,out.height);
    const bands=Math.max(1,Math.floor(this.config.touchRuptureBands||13));
    const bh=out.height/bands;
    for(let n=0;n<bands;n++){
      if((n+t)%3!==0)continue;
      const shift=(this.rand01(t*307+n*17)-.5)*out.width*(.05+i.pressure*.18);
      out.image(scratch,shift,n*bh,out.width,bh+1,0,n*bh,scratch.width,bh+1);
    }

    out.push();
    out.stroke(255,18+i.pressure*38);
    out.strokeWeight(1);
    for(let n=0;n<7;n++){
      const y=this.rand01(t*331+n*23)*out.height;
      out.line(0,y,out.width,y);
    }
    out.pop();

    const pal=this.config.touchPalette||{};
    const th=Array.isArray(pal.thresholds)&&pal.thresholds.length>=3?pal.thresholds:[64,128,192];
    const colors=Array.isArray(pal.colors)&&pal.colors.length>=4?pal.colors:[
      [0,0,0],[72,72,72],[238,94,90],[246,246,244]
    ];
    const colorAt=(idx)=>{
      const c=colors[idx]||[0,0,0];
      return [
        P5LabUtils.clamp(Number(c[0])||0,0,255),
        P5LabUtils.clamp(Number(c[1])||0,0,255),
        P5LabUtils.clamp(Number(c[2])||0,0,255)
      ];
    };

    out.loadPixels();
    const px=out.pixels;
    for(let p=0;p<px.length;p+=4){
      const l=.299*px[p]+.587*px[p+1]+.114*px[p+2];
      const idx=l<Number(th[0])?0:l<Number(th[1])?1:l<Number(th[2])?2:3;
      const c=colorAt(idx);
      px[p]=c[0];px[p+1]=c[1];px[p+2]=c[2];
    }
    out.updatePixels();
    return out;
  }

  snapshot(){
    const s=super.snapshot();
    const p=this.currentPreset();
    s.engineVersion="0.8.0";
    s.presetId=p.id||p.name||"UNKNOWN";
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS=DodreiVisualEngineV080;
window.P5LAB_VISUAL_ENGINE_VERSION="0.8.0";
