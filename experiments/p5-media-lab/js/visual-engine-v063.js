/** P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.3
 * Touch rupture palette:
 *   black -> dark gray -> vivid red -> near-white
 *
 * The image is converted to grayscale + high contrast + 4-level posterize FIRST.
 * Only the upper-middle luminance band is recolored red. The darker middle band
 * deliberately stays neutral gray, so red appears as a narrow accent around
 * brighter threshold boundaries instead of tinting the whole image.
 */
class P5LabVisualEngineV063 extends P5LabVisualEngine {
  applyTouchRupture(src,i,a,t){
    const out=this.ruptureBuffer,scratch=this.ruptureScratch;out.clear();scratch.clear();
    scratch.push();const ctx=scratch.drawingContext;ctx.save();ctx.filter=`grayscale(1) contrast(${this.config.touchRuptureContrast})`;scratch.image(src,0,0,scratch.width,scratch.height);ctx.restore();scratch.pop();
    try{scratch.filter(POSTERIZE,this.config.touchRupturePosterizeLevels);}catch(_){}

    // Four luminance bands after grayscale/posterize:
    // 0: black, 1: dark neutral gray, 2: saturated red, 3: near-white.
    scratch.loadPixels();
    for(let p=0;p<scratch.pixels.length;p+=4){
      const l=scratch.pixels[p];
      if(l<64){scratch.pixels[p]=0;scratch.pixels[p+1]=0;scratch.pixels[p+2]=0;}
      else if(l<128){scratch.pixels[p]=72;scratch.pixels[p+1]=72;scratch.pixels[p+2]=72;}
      else if(l<192){scratch.pixels[p]=230;scratch.pixels[p+1]=22;scratch.pixels[p+2]=18;}
      else{scratch.pixels[p]=245;scratch.pixels[p+1]=245;scratch.pixels[p+2]=242;}
    }
    scratch.updatePixels();
    out.image(scratch,0,0,out.width,out.height);

    const bands=this.config.touchRuptureBands,bh=out.height/bands;
    for(let n=0;n<bands;n++){if((n+t)%3!==0)continue;const shift=(this.rand01(t*307+n*17)-.5)*out.width*(.05+i.pressure*.18);out.image(scratch,shift,n*bh,out.width,bh+1,0,n*bh,scratch.width,bh+1);}
    out.push();out.stroke(255,18+i.pressure*38);out.strokeWeight(1);for(let n=0;n<7;n++){const y=this.rand01(t*331+n*23)*out.height;out.line(0,y,out.width,y);}out.pop();
    return out;
  }
}
window.P5LabVisualEngine=P5LabVisualEngineV063;
