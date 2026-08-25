/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.8
 * ------------------------------------------------------------
 * Small visual revision on top of v0.6.7:
 *   - mobile rupture buffer scale is controlled by config (now 0.50);
 *   - palette returns to BLACK -> DARK GRAY -> RED -> WHITE;
 *   - the red replaces the former light-gray band again;
 *   - red saturation is reduced by roughly one third from the previous vivid red.
 *
 * Performance behavior from v0.6.7 is preserved:
 *   low-resolution touch buffer + every-2nd-frame mobile recalculation.
 */
class P5LabVisualEngineV068 extends P5LabVisualEngineV067 {
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

    // 1) Downscale current scene and convert to high-contrast monochrome.
    scratch.push();
    const ctx=scratch.drawingContext;
    ctx.save();
    ctx.filter=`grayscale(1) contrast(${this.config.touchRuptureContrast})`;
    scratch.image(src,0,0,scratch.width,scratch.height);
    ctx.restore();
    scratch.pop();

    // 2) Horizontal rupture while the material is still neutral grayscale.
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

    // 3) Final four-band palette.
    //    The third band, formerly LIGHT GRAY in v0.6.7, is now a moderately
    //    desaturated red. The brightest band returns to near-white.
    out.loadPixels();
    const px=out.pixels;
    for(let p=0;p<px.length;p+=4){
      const l=.299*px[p]+.587*px[p+1]+.114*px[p+2];
      if(l<64){
        px[p]=0; px[p+1]=0; px[p+2]=0;
      }else if(l<128){
        px[p]=72; px[p+1]=72; px[p+2]=72;
      }else if(l<192){
        // Previous vivid red was approximately RGB(238,18,14).
        // Saturation is reduced by about one third while keeping brightness high.
        px[p]=238; px[p+1]=94; px[p+2]=90;
      }else{
        px[p]=246; px[p+1]=246; px[p+2]=244;
      }
    }
    out.updatePixels();
    return out;
  }

  snapshot(){
    const s=super.snapshot();
    s.engineVersion='0.6.8';
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS=P5LabVisualEngineV068;
window.P5LAB_VISUAL_ENGINE_VERSION='0.6.8';
