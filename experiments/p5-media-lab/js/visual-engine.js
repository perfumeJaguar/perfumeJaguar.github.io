/** P5 MEDIA LAB 01 — VISUAL ENGINE
 * A deliberately broad sampler: video processing + full-frame still-image work.
 * Particle synthesis is intentionally absent in v0.2.0.
 */
class P5LabVisualEngine {
  constructor(config, telemetry) {
    this.config=config; this.telemetry=telemetry; this.buffer=null; this.feedback=null;
    this.feedbackScratch=null; this.mosaicSample=null; this.modeIndex=0; this.modeStartedMs=0;
  }
  setup(w,h){ this.rebuild(w,h); this.modeStartedMs=millis(); this.announcePreset(); }
  rebuild(w,h){
    const mobile=P5LabUtils.isMobileLayout();
    const edge=mobile?P5LAB_CONFIG.render.maxBufferLongEdgeMobile:P5LAB_CONFIG.render.maxBufferLongEdgeDesktop;
    const s=P5LabUtils.fitInside(w,h,edge);
    this.buffer=createGraphics(s.width,s.height); this.feedback=createGraphics(s.width,s.height); this.feedbackScratch=createGraphics(s.width,s.height);
    const cols=mobile?this.config.mosaicColsMobile:this.config.mosaicColsDesktop;
    this.mosaicSample=createGraphics(cols,Math.max(2,Math.ceil(cols*s.height/s.width)));
    [this.buffer,this.feedback,this.feedbackScratch,this.mosaicSample].forEach(g=>g.pixelDensity(1));
    this.feedback.background(0); this.feedbackScratch.background(0); this.telemetry.event(`VISUAL BUFFER ${s.width}X${s.height}`);
  }
  currentPreset(){ return this.config.presets[this.modeIndex%this.config.presets.length]; }
  updateMode(){ if(millis()-this.modeStartedMs>P5LAB_CONFIG.app.modeDurationSec*1000){this.modeIndex=(this.modeIndex+1)%this.config.presets.length;this.modeStartedMs=millis();this.announcePreset();} }
  announcePreset(){ this.telemetry.event(`MODE ${this.currentPreset().name}`); }
  render(source,img,analysis,audio,interaction){
    this.updateMode(); const p=this.currentPreset(),g=this.buffer; g.push(); g.background(0);
    if(p.photoFull) this.drawPhotoFull(g,img,interaction);
    else if(p.photoDouble) this.drawPhotoDouble(g,img,analysis,interaction);
    else if(p.photoStrobe) this.drawPhotoStrobe(g,img,interaction);
    else {
      if(p.base) this.drawBase(g,source,analysis,audio,interaction);
      if(p.rgbSplit) this.drawRgbSplit(g,source,analysis,interaction);
      if(p.slices) this.drawSlices(g,source,analysis,interaction);
      if(p.mosaic) this.drawMosaic(g,source,analysis,audio,interaction,p.mosaic);
      if(p.waveform) this.drawWaveform(g,audio,interaction);
      this.drawScanlines(g,analysis,audio);
      if(p.posterize){try{g.filter(POSTERIZE,Math.floor(P5LabUtils.map01(interaction.x,3,8)));}catch(_){}}
    }
    g.pop();
    if(p.feedback) this.applyFeedback(g,analysis,audio,interaction); else {this.feedback.clear();this.feedback.image(g,0,0);}
    background(P5LAB_CONFIG.render.background); P5LabUtils.drawCover(null,p.feedback?this.feedback:g,255);
  }
  drawPhotoFull(g,img,interaction){
    if(!img){g.background(0);return;}
    // Still image is the entire frame: no floating collage object.
    const zoom=1+interaction.pressure*0.06;
    P5LabUtils.drawCover(g,img,255,zoom,(interaction.x-.5)*g.width*.025,(interaction.y-.5)*g.height*.025);
  }
  drawPhotoDouble(g,img,analysis,interaction){
    if(!img){g.background(0);return;}
    // Two full-frame exposures of the same rapidly changing archive image. The
    // second pass is offset/zoomed and screened, producing photographic rather
    // than sprite-like double exposure.
    P5LabUtils.drawCover(g,img,210,1.02,(interaction.x-.5)*18,0);
    g.push(); g.blendMode(SCREEN);
    P5LabUtils.drawCover(g,img,105+analysis.localLuma*70,1.18,(-.5+interaction.x)*-42,(interaction.y-.5)*36,[190,215,255]);
    g.blendMode(BLEND); g.pop();
  }
  drawPhotoStrobe(g,img,interaction){
    if(!img){g.background(0);return;}
    // Quantized time creates abrupt cuts. Each time cell derives a deterministic
    // crop/zoom from noise, so ten originals read like hundreds of shots.
    const tick=Math.floor(millis()/95);
    const n1=noise(tick*1.731), n2=noise(tick*3.117+20), n3=noise(tick*5.331+40);
    const zoom=1.12+n3*1.45;
    const ox=(n1-.5)*g.width*.72, oy=(n2-.5)*g.height*.72;
    P5LabUtils.drawCover(g,img,255,zoom,ox,oy);
    if(tick%7===0){g.push();g.blendMode(DIFFERENCE);P5LabUtils.drawCover(g,img,90,1.02,-ox*.12,-oy*.12);g.blendMode(BLEND);g.pop();}
    if(interaction.pressure>.15){g.push();g.blendMode(SCREEN);P5LabUtils.drawCover(g,img,100,1.45,-ox*.3,oy*.2);g.pop();}
  }
  drawBase(g,source,analysis,audio,interaction){
    const zoom=1+interaction.pressure*.035+audio.bass*.012,maxShift=14*analysis.motionSmooth;
    P5LabUtils.drawCover(g,source,255,zoom,(interaction.x-.5)*maxShift,(interaction.y-.5)*maxShift);
  }
  drawRgbSplit(g,source,analysis,interaction){
    const a=this.config.rgbSplitMaxPx*(.2+analysis.motionSmooth*.8+interaction.pressure*.4);g.push();g.blendMode(ADD);
    P5LabUtils.drawCover(g,source,120,1.005,-a,0,[255,55,55]);P5LabUtils.drawCover(g,source,105,1,a*.25,a*.1,[55,255,120]);P5LabUtils.drawCover(g,source,115,1.008,a,-a*.1,[70,110,255]);g.blendMode(BLEND);g.pop();
  }
  drawSlices(g,source,analysis,interaction){
    const count=P5LabUtils.isMobileLayout()?this.config.sliceCountMobile:this.config.sliceCountDesktop,sliceH=g.height/count,t=millis()*.001;
    for(let i=0;i<count;i++){const y=i*sliceH,n=noise(i*.23,t*.6)-.5,off=n*g.width*(.04+analysis.motionSmooth*.18)*(.7+interaction.pressure);g.push();const c=g.drawingContext;c.save();c.beginPath();c.rect(0,y,g.width,sliceH+1);c.clip();P5LabUtils.drawCover(g,source,180,1+Math.abs(n)*.018,off,0);c.restore();g.pop();}
  }
  drawMosaic(g,source,analysis,audio,interaction,variant){
    const cols=P5LabUtils.isMobileLayout()?this.config.mosaicColsMobile:this.config.mosaicColsDesktop,cell=g.width/cols,rows=Math.ceil(g.height/cell),s=this.mosaicSample;
    s.clear();P5LabUtils.drawCover(s,source,255);s.loadPixels();g.background(variant==='mono'?245:0);g.noStroke();
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const idx=4*(y*s.width+x),r=s.pixels[idx]||0,gg=s.pixels[idx+1]||0,b=s.pixels[idx+2]||0,l=(r+gg+b)/(255*3);
      let scale=variant==='inverse'?(.18+(1-l)*.92):(.16+l*.98); scale+=interaction.pressure*.18;
      const size=cell*scale,j=(noise(x*.14,y*.14,frameCount*.008)-.5)*cell*analysis.motionSmooth*1.4;
      if(variant==='mono') g.fill(l<.5?15:20,225); else g.fill(r,gg,b,235);
      g.rect(x*cell+(cell-size)/2+j,y*cell+(cell-size)/2,size,size);
    }
  }
  drawWaveform(g,audio,interaction){const w=audio.waveform;if(!w||w.length<2)return;g.push();g.noFill();g.stroke(255,95+audio.rms*120);g.beginShape();const yc=g.height*(.78-interaction.y*.18),amp=g.height*(.035+audio.rms*.13);for(let i=0;i<w.length;i+=2)g.vertex(i/(w.length-1)*g.width,yc+w[i]*amp);g.endShape();g.pop();}
  drawScanlines(g,analysis,audio){g.push();g.stroke(255,10+18*audio.treble+20*analysis.motionSmooth);for(let y=0;y<g.height;y+=this.config.scanlineSpacing)g.line(0,y,g.width,y);g.pop();}
  applyFeedback(current,analysis,audio,interaction){const prev=this.feedback,next=this.feedbackScratch,scale=this.config.feedbackScale-analysis.motionSmooth*.004,w=next.width*scale,h=next.height*scale,x=(next.width-w)*(.5+(interaction.x-.5)*.2),y=(next.height-h)*(.5+(interaction.y-.5)*.2);next.push();next.clear();next.background(0,16+audio.bass*20);next.tint(255,this.config.feedbackAlpha);next.image(prev,x,y,w,h);next.noTint();next.blendMode(SCREEN);next.tint(255,155+audio.rms*80);next.image(current,0,0);next.noTint();next.blendMode(BLEND);next.pop();this.feedback=next;this.feedbackScratch=prev;}
  snapshot(){const p=this.currentPreset();const fx=[p.photoFull&&'PHOTO',p.photoDouble&&'DOUBLE',p.photoStrobe&&'STROBE',p.rgbSplit&&'RGB',p.slices&&'SLICE',p.mosaic&&`MOSAIC_${String(p.mosaic).toUpperCase()}`,p.feedback&&'FDBK',p.waveform&&'WAVE',p.posterize&&'POST'].filter(Boolean).join('+')||'BASE';return{modeName:p.name,modeIndex:this.modeIndex,particleCount:0,activeFx:fx};}
}
window.P5LabVisualEngine=P5LabVisualEngine;
