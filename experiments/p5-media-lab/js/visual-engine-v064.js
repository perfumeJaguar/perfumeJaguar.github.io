/** P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.4
 *
 * CHANGE FROM v0.6.3
 * ------------------
 * The saturated red accent is now painted AFTER the rupture tear/noise pass.
 * This keeps later compositing from turning the red accent into brown/maroon.
 *
 * Pipeline while touching:
 * source -> grayscale/high contrast -> 4 luminance bands -> tear/noise
 *        -> FINAL palette remap: black / dark gray / vivid red / near-white
 *
 * The upper-middle luminance band alone becomes vivid red.
 */
class P5LabVisualEngineV064 extends P5LabVisualEngine {
  applyTouchRupture(src,i,a,t){
    const out=this.ruptureBuffer,scratch=this.ruptureScratch;
    out.clear(); scratch.clear();

    // 1) Build the harsh monochrome/posterized source.
    scratch.push();
    const ctx=scratch.drawingContext;
    ctx.save();
    ctx.filter=`grayscale(1) contrast(${this.config.touchRuptureContrast})`;
    scratch.image(src,0,0,scratch.width,scratch.height);
    ctx.restore();
    scratch.pop();
    try{scratch.filter(POSTERIZE,this.config.touchRupturePosterizeLevels);}catch(_){}

    // 2) Perform rupture geometry while the material is still neutral.
    out.image(scratch,0,0,out.width,out.height);
    const bands=this.config.touchRuptureBands,bh=out.height/bands;
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

    // 3) FINAL palette remap. Nothing inside this rupture pass blends the red
    //    afterwards, so the accent remains visibly saturated.
    out.loadPixels();
    for(let p=0;p<out.pixels.length;p+=4){
      const r=out.pixels[p],g=out.pixels[p+1],b=out.pixels[p+2];
      const l=.299*r+.587*g+.114*b;
      if(l<64){
        out.pixels[p]=0; out.pixels[p+1]=0; out.pixels[p+2]=0;
      }else if(l<128){
        out.pixels[p]=72; out.pixels[p+1]=72; out.pixels[p+2]=72;
      }else if(l<192){
        out.pixels[p]=238; out.pixels[p+1]=18; out.pixels[p+2]=14;
      }else{
        out.pixels[p]=246; out.pixels[p+1]=246; out.pixels[p+2]=244;
      }
    }
    out.updatePixels();
    return out;
  }
}
window.P5LabVisualEngine=P5LabVisualEngineV064;
