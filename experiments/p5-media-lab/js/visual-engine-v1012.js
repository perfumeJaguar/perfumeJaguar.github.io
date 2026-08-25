/** DODREI — VISUAL ENGINE v1.0.12
 * Removes the PHOTO_DOUBLE_BLEND-only feedback behavior from v1.0.11 by
 * extending v1.0.7 directly, and adds FEEDBACK as an ordered global POST FX.
 */
class DodreiVisualEngineV1012 extends DodreiVisualEngineV1007 {
  rebuild(w,h){
    super.rebuild(w,h);
    const fw=Math.max(1,this.feedback?.width||Math.round((this.buffer?.width||w)*0.52));
    const fh=Math.max(1,this.feedback?.height||Math.round((this.buffer?.height||h)*0.52));
    const make=(old)=>{try{old?.remove?.();}catch(_){} const g=createGraphics(fw,fh);g.pixelDensity(1);g.clear();return g;};
    this.globalFeedback=make(this.globalFeedback);
    this.globalFeedbackScratch=make(this.globalFeedbackScratch);
  }

  _postFxKeys(){
    return ["bw","grayscale","lowSaturation","blur","feedback","crush","highContrast","darken","strongVignette"];
  }

  setPostCommonFx(key,enabled){
    const allowed=new Set(this._postFxKeys());
    if(!allowed.has(key)) return false;
    const f=this.postCommonFxConfig();
    const next=!!enabled;
    f[key]=next;
    const order=this.postCommonFxOrder().filter((item)=>item!==key);
    if(next) order.push(key);
    f.order=order;
    this._postCommonDirty=true;
    if(key==="feedback"){
      try{this.globalFeedback?.clear();this.globalFeedbackScratch?.clear();}catch(_){}
    }
    if(this.telemetry?.event){
      const short={bw:"BW",grayscale:"GS",lowSaturation:"LS",blur:"BL",feedback:"FB",crush:"CR",highContrast:"HC",darken:"DK",strongVignette:"VG"};
      this.telemetry.event(`POST FX ${short[key]||key} ${next?"ON":"OFF"}${f.order.length?` ${f.order.map((item)=>short[item]||item).join(">")}`:""}`);
    }
    return next;
  }

  _globalFeedbackPass(out){
    if(!out||!this.globalFeedback||!this.globalFeedbackScratch) return;
    const f=this.postCommonFxConfig();
    const prev=this.globalFeedback;
    const next=this.globalFeedbackScratch;
    const scale=P5LabUtils.clamp(Number(f.feedbackScale)||0.996,0.96,1.04);
    const retain=P5LabUtils.clamp(Number(f.feedbackRetainAlpha)||58,0,255);
    const currentAlpha=P5LabUtils.clamp(Number(f.feedbackCurrentAlpha)||218,0,255);

    out.push();
    out.blendMode(SCREEN);
    out.tint(255,retain);
    const w=out.width*scale,h=out.height*scale;
    out.image(prev,(out.width-w)*0.5,(out.height-h)*0.5,w,h);
    out.noTint();out.blendMode(BLEND);out.pop();

    next.push();next.clear();next.tint(255,currentAlpha);next.image(out,0,0,next.width,next.height);next.noTint();next.pop();
    this.globalFeedback=next;this.globalFeedbackScratch=prev;
  }

  applyPostCommonFx(src,pool,interaction,audio,state){
    const f=this.postCommonFxConfig();
    const order=this.postCommonFxOrder();
    let stage=src;
    for(const key of order){
      if(key==="crush"){
        stage=this.applyCommonCrush(stage,pool,interaction,audio,state.frameIndex);
        continue;
      }
      if(stage===src) stage=this._copyPost(src);
      else if(stage!==this.postCommonBuffer) stage=this._copyPost(stage);

      if(key==="highContrast") this._highContrast(stage,Math.max(1,Number(f.highContrastAmount)||3.2),Math.max(0,Number(f.highContrastSaturation)||1.08));
      else if(key==="bw") this._binaryBw(stage,P5LabUtils.clamp(Number(f.bwThreshold)||0.5,0,1));
      else if(key==="grayscale") this._grayscale(stage);
      else if(key==="lowSaturation") this._lowSaturation(stage,Number.isFinite(Number(f.lowSaturationAmount))?Number(f.lowSaturationAmount):0.5);
      else if(key==="blur") this._blur(stage,Number.isFinite(Number(f.blurAmountPx))?Number(f.blurAmountPx):1.2);
      else if(key==="feedback") this._globalFeedbackPass(stage);
      else if(key==="darken") this._darken(stage,Number(f.darkenAlpha)||0.46);
      else if(key==="strongVignette") this._strongVignette(stage,Number(f.strongVignetteStrength)||0.96,Number(f.strongVignetteInner)||0.16,Number(f.strongVignetteOuter)||0.72);
    }
    if(stage!==this.postCommonBuffer) stage=this._copyPost(stage);
    this._postCommonDirty=false;
    return stage;
  }

  snapshot(){
    const s=super.snapshot();const f=this.postCommonFxConfig();
    s.engineVersion="1.0.12";
    s.postCommonFx={...(s.postCommonFx||{}),feedback:!!f.feedback,order:this.postCommonFxOrder().slice()};
    return s;
  }
}
window.P5LAB_VISUAL_ENGINE_CLASS=DodreiVisualEngineV1012;
window.P5LAB_VISUAL_ENGINE_VERSION="1.0.12";
