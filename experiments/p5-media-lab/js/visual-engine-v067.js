/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.7
 * ------------------------------------------------------------
 * PERFORMANCE REVISION
 *
 * The v0.6.6 root fix finally activated the intended touch rupture engine, but
 * that also exposed its real cost on mobile: a full-resolution pixel read/write
 * every rendered frame could drop a 60 fps phone to ~15 fps while pressed.
 *
 * v0.6.7 changes the touch path only:
 *   - rupture buffers run at reduced resolution (mobile 45%, desktop 70%);
 *   - mobile rupture is recalculated every 2nd frame and reused in-between;
 *   - the redundant p5 POSTERIZE pass is removed: the final four-band palette
 *     remap already performs the quantisation in one pixel loop;
 *   - a fresh press always forces a new rupture frame, avoiding stale output;
 *   - swipe feedback remains separate and begins only above config threshold.
 *
 * TOUCH PALETTE
 *   black -> dark gray -> light gray -> vivid red
 * The former WHITE band is now the red band. Both gray levels are neutral again.
 */
class P5LabVisualEngineV067 extends P5LabVisualEngineV066 {
  constructor(config,telemetry){
    super(config,telemetry);
    this._ruptureFrameCounter=0;
    this._lastRuptureCallMs=-Infinity;
  }

  rebuild(w,h){
    // Let the established engine rebuild all ordinary processing buffers first.
    super.rebuild(w,h);

    // Then replace only the expensive touch-rupture buffers with smaller ones.
    const mobile=P5LabUtils.isMobileLayout();
    const scale=mobile
      ? (this.config.touchRuptureResolutionScaleMobile||0.45)
      : (this.config.touchRuptureResolutionScaleDesktop||0.70);
    const rw=Math.max(96,Math.round(this.buffer.width*scale));
    const rh=Math.max(96,Math.round(this.buffer.height*scale));

    try{if(this.ruptureBuffer&&this.ruptureBuffer.remove)this.ruptureBuffer.remove();}catch(_){}
    try{if(this.ruptureScratch&&this.ruptureScratch.remove)this.ruptureScratch.remove();}catch(_){}
    this.ruptureBuffer=createGraphics(rw,rh);
    this.ruptureScratch=createGraphics(rw,rh);
    this.ruptureBuffer.pixelDensity(1);
    this.ruptureScratch.pixelDensity(1);

    // Halation is removed from the active experiment in v0.6.7. Keep only a
    // microscopic compatibility buffer because the inherited class has a field
    // for it; no active preset calls the blur path anymore.
    try{if(this.glowBuffer&&this.glowBuffer.remove)this.glowBuffer.remove();}catch(_){}
    this.glowBuffer=createGraphics(2,2);
    this.glowBuffer.pixelDensity(1);

    this._ruptureFrameCounter=0;
    this._lastRuptureCallMs=-Infinity;
    this.telemetry.event(`RUPTURE BUFFER ${rw}X${rh}`);
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

    // On a continuous press, mobile computes the heavy pixel pass only every
    // second rendered frame. On a new press we always calculate immediately.
    if(!freshGesture&&skip>1&&(this._ruptureFrameCounter%skip)!==1)return out;

    out.clear();
    scratch.clear();

    // 1) Downscale the current scene while converting it to high-contrast mono.
    // No POSTERIZE call: the explicit palette mapping below already quantizes it.
    scratch.push();
    const ctx=scratch.drawingContext;
    ctx.save();
    ctx.filter=`grayscale(1) contrast(${this.config.touchRuptureContrast})`;
    scratch.image(src,0,0,scratch.width,scratch.height);
    ctx.restore();
    scratch.pop();

    // 2) Harsh horizontal rupture while the material is still neutral grayscale.
    out.image(scratch,0,0,out.width,out.height);
    const bands=this.config.touchRuptureBands;
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

    // 3) One and only pixel loop: four hard luminance bands.
    // Gray values are restored; the old brightest/white band becomes vivid red.
    out.loadPixels();
    const px=out.pixels;
    for(let p=0;p<px.length;p+=4){
      const l=.299*px[p]+.587*px[p+1]+.114*px[p+2];
      if(l<64){
        px[p]=0; px[p+1]=0; px[p+2]=0;
      }else if(l<128){
        px[p]=72; px[p+1]=72; px[p+2]=72;
      }else if(l<192){
        px[p]=158; px[p+1]=158; px[p+2]=158;
      }else{
        px[p]=238; px[p+1]=18; px[p+2]=14;
      }
    }
    out.updatePixels();
    return out;
  }

  snapshot(){
    const s=super.snapshot();
    s.engineVersion='0.6.7';
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS=P5LabVisualEngineV067;
window.P5LAB_VISUAL_ENGINE_VERSION='0.6.7';
