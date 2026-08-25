/** DODREI — VISUAL ENGINE v1.0.15
 * Performance diet without reducing the main composition raster:
 * - HC/GS/LS consecutive CSS-filter stages are batched into one full-resolution pass;
 * - BL uses a reduced mobile scratch surface, then returns to the full-resolution POST surface;
 * - global FB history is stored at an even smaller temporal-memory resolution.
 * Touch rupture/swipe behavior and the 2x mobile main composition remain unchanged.
 */
class DodreiVisualEngineV1015 extends DodreiVisualEngineV1012 {
  rebuild(w,h){
    super.rebuild(w,h);
    const f=this.postCommonFxConfig();
    const mobile=P5LabUtils.isMobileLayout();

    const makeGraphics=(old,width,height)=>{
      try{old?.remove?.();}catch(_){}
      const g=createGraphics(Math.max(1,Math.round(width)),Math.max(1,Math.round(height)));
      g.pixelDensity(1);g.clear();return g;
    };

    // FB is intentionally a soft temporal memory. Keep it much smaller than the
    // already performance-oriented preset-feedback buffer.
    const fbScale=P5LabUtils.clamp(Number(f.feedbackBufferScale)||0.60,0.30,1.0);
    const fw=Math.max(64,Math.round((this.feedback?.width||w)*fbScale));
    const fh=Math.max(64,Math.round((this.feedback?.height||h)*fbScale));
    this.globalFeedback=makeGraphics(this.globalFeedback,fw,fh);
    this.globalFeedbackScratch=makeGraphics(this.globalFeedbackScratch,fw,fh);

    // BL is visually soft by definition. Mobile performs the blur on a smaller
    // scratch surface while HC/LS and the final POST surface stay full resolution.
    const blurScale=mobile
      ? P5LabUtils.clamp(Number(f.blurRenderScaleMobile)||0.65,0.45,1.0)
      : P5LabUtils.clamp(Number(f.blurRenderScaleDesktop)||1.0,0.70,1.0);
    const bw=Math.max(96,Math.round((this.postCommonBuffer?.width||w)*blurScale));
    const bh=Math.max(96,Math.round((this.postCommonBuffer?.height||h)*blurScale));
    this.postBlurScratch=makeGraphics(this.postBlurScratch,bw,bh);
    this._postCommonDirty=true;
  }

  _runCssFilterBatch(out,filters){
    if(!out||!filters?.length)return;
    const s=this.postCommonScratch;
    s.clear();s.push();
    const ctx=s.drawingContext;ctx.save();
    ctx.filter=filters.join(" ");
    s.image(out,0,0,s.width,s.height);
    ctx.restore();s.pop();
    out.clear();out.image(s,0,0,out.width,out.height);
  }

  _blur(out,amountPx){
    const amount=P5LabUtils.clamp(Number(amountPx)||0,0,8);
    if(amount<=0.01)return;
    const s=this.postBlurScratch;
    if(!s||s.width>=out.width*0.98||s.height>=out.height*0.98){
      return super._blur(out,amount);
    }

    const scale=Math.min(s.width/out.width,s.height/out.height);
    s.clear();s.push();
    const ctx=s.drawingContext;ctx.save();
    ctx.imageSmoothingEnabled=true;
    try{ctx.imageSmoothingQuality="high";}catch(_){}
    // Keep approximately the same visible blur radius after the scratch surface
    // is enlarged back to the full POST raster.
    ctx.filter=`blur(${Math.max(0.25,amount*scale)}px)`;
    s.image(out,0,0,s.width,s.height);
    ctx.restore();s.pop();

    out.clear();out.push();
    const outCtx=out.drawingContext;
    try{outCtx.imageSmoothingEnabled=true;outCtx.imageSmoothingQuality="high";}catch(_){}
    out.image(s,0,0,out.width,out.height);
    out.pop();
  }

  applyPostCommonFx(src,pool,interaction,audio,state){
    const f=this.postCommonFxConfig();
    const order=this.postCommonFxOrder();
    let stage=src;
    let filterBatch=[];

    const ensurePost=()=>{
      if(stage!==this.postCommonBuffer)stage=this._copyPost(stage);
      return stage;
    };
    const flushFilters=()=>{
      if(!filterBatch.length)return;
      ensurePost();
      this._runCssFilterBatch(stage,filterBatch);
      filterBatch=[];
    };

    for(const key of order){
      // These preserve their exact Canvas-filter order but share one raster pass.
      if(key==="highContrast"){
        filterBatch.push(`contrast(${Math.max(1,Number(f.highContrastAmount)||3.2)})`);
        filterBatch.push(`saturate(${Math.max(0,Number(f.highContrastSaturation)||1.08)})`);
        continue;
      }
      if(key==="lowSaturation"){
        const amount=Number.isFinite(Number(f.lowSaturationAmount))?Number(f.lowSaturationAmount):0.5;
        filterBatch.push(`saturate(${P5LabUtils.clamp(amount,0,1)})`);
        continue;
      }
      if(key==="grayscale"){
        filterBatch.push("grayscale(1)");
        continue;
      }

      flushFilters();

      if(key==="crush"){
        stage=this.applyCommonCrush(stage,pool,interaction,audio,state.frameIndex);
        continue;
      }

      ensurePost();
      if(key==="bw")this._binaryBw(stage,P5LabUtils.clamp(Number(f.bwThreshold)||0.5,0,1));
      else if(key==="blur")this._blur(stage,Number.isFinite(Number(f.blurAmountPx))?Number(f.blurAmountPx):1.2);
      else if(key==="feedback")this._globalFeedbackPass(stage);
      else if(key==="darken")this._darken(stage,Number(f.darkenAlpha)||0.46);
      else if(key==="strongVignette")this._strongVignette(stage,Number(f.strongVignetteStrength)||0.96,Number(f.strongVignetteInner)||0.16,Number(f.strongVignetteOuter)||0.72);
    }

    flushFilters();
    if(stage!==this.postCommonBuffer)stage=this._copyPost(stage);
    this._postCommonDirty=false;
    return stage;
  }

  snapshot(){
    const s=super.snapshot();
    const f=this.postCommonFxConfig();
    s.engineVersion="1.0.15";
    s.performanceDiet={
      batchedCssPost:true,
      feedbackBufferScale:Number(f.feedbackBufferScale)||0.60,
      blurRenderScale:P5LabUtils.isMobileLayout()?Number(f.blurRenderScaleMobile)||0.65:Number(f.blurRenderScaleDesktop)||1.0,
    };
    return s;
  }
}
window.P5LAB_VISUAL_ENGINE_CLASS=DodreiVisualEngineV1015;
window.P5LAB_VISUAL_ENGINE_VERSION="1.0.15";
