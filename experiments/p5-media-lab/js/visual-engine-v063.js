/** P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.3
 * Same v0.6.1 engine, with touch rupture mid-gray bands remapped to muted red.
 */
// Load v0.6.1 first; this patch subclasses it without duplicating the engine.
class P5LabVisualEngineV063 extends P5LabVisualEngine {
  applyTouchRupture(src,i,a,t){
    const out=this.ruptureBuffer,scratch=this.ruptureScratch;out.clear();scratch.clear();
    scratch.push();const ctx=scratch.drawingContext;ctx.save();ctx.filter=`grayscale(1) contrast(${this.config.touchRuptureContrast})`;scratch.image(src,0,0,scratch.width,scratch.height);ctx.restore();scratch.pop();
    try{scratch.filter(POSTERIZE,this.config.touchRupturePosterizeLevels);}catch(_){}

    // Re-map the four luminance levels: black / muted dark red / muted red / white.
    scratch.loadPixels();
    for(let p=0;p<scratch.pixels.length;p+=4){
      const l=scratch.pixels[p];
      if(l<64){scratch.pixels[p]=0;scratch.pixels[p+1]=0;scratch.pixels[p+2]=0;}
      else if(l<128){scratch.pixels[p]=92;scratch.pixels[p+1]=48;scratch.pixels[p+2]=48;}
      else if(l<192){scratch.pixels[p]=142;scratch.pixels[p+1]=72;scratch.pixels[p+2]=68;}
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
