/** DODREI — VISUAL ENGINE v1.0.22
 * ST behaves like subtle film/projection light instability.
 * Resize stability patch: dispose inherited p5.Graphics surfaces before rebuild
 * so fullscreen/window-size transitions do not accumulate stale GPU canvases.
 */
class DodreiVisualEngineV1022 extends DodreiVisualEngineV1021 {
  constructor(config,telemetry){
    super(config,telemetry);
    this._stUntil=0;
    this._stDim=0;
    this._stSerial=0;
  }

  rebuild(w,h){
    // Older engine layers recreate several Graphics surfaces without disposing
    // the previous instances first. Because resize/fullscreen can call rebuild
    // repeatedly, explicitly release every active surface at the top of the
    // final engine before letting the inherited chain allocate the new set.
    const keys=[
      "buffer","crushBuffer","ruptureBuffer","ruptureScratch",
      "feedback","feedbackScratch","swipeFeedback","swipeScratch",
      "mosaicSample","glowBuffer","postCommonBuffer","postCommonScratch",
      "globalFeedback","globalFeedbackScratch","postBlurScratch","postGlitchScratch"
    ];
    const seen=new Set();
    for(const key of keys){
      const g=this[key];
      if(g&&!seen.has(g)){
        seen.add(g);
        try{g.remove?.();}catch(_){}
      }
      this[key]=null;
    }
    super.rebuild(w,h);
    this._postCommonDirty=true;
  }

  _instability(out){
    const now=millis();
    if(now>=this._stUntil){
      const serial=++this._stSerial;
      const r=this.rand01(serial*71+Math.floor(now/173));
      if(r>0.94){
        this._stDim=0.045+this.rand01(serial*83)*0.030;
        this._stUntil=now+70+this.rand01(serial*89)*170;
      }else{
        this._stDim=this.rand01(serial*97)*0.022;
        this._stUntil=now+140+this.rand01(serial*101)*520;
      }
    }
    if(this._stDim<=0.001)return;
    out.push();
    out.noStroke();
    out.fill(0,255*this._stDim);
    out.rect(0,0,out.width,out.height);
    out.pop();
  }

  snapshot(){
    const s=super.snapshot();
    s.engineVersion="1.0.22";
    s.instabilityStyle="FILM_LIGHT_DIM";
    s.resizeGraphicsDisposal=true;
    return s;
  }
}
window.P5LAB_VISUAL_ENGINE_CLASS=DodreiVisualEngineV1022;
window.P5LAB_VISUAL_ENGINE_VERSION="1.0.22";
