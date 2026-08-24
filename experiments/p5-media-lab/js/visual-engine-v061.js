/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.1
 * Photo-only. Every source draw is independently cropped. Every mode receives a
 * common PHOTO_CRUSH pass. Touch creates a high-contrast four-tone rupture; only
 * fast pressed movement adds a second recursive feedback layer.
 */
class P5LabVisualEngine {
  constructor(config, telemetry) {
    this.config=config; this.telemetry=telemetry;
    this.buffer=null; this.crushBuffer=null; this.ruptureBuffer=null; this.ruptureScratch=null;
    this.feedback=null; this.feedbackScratch=null; this.swipeFeedback=null; this.swipeScratch=null;
    this.mosaicSample=null; this.glowBuffer=null;
    this.modeIndex=0; this.modeStartedMs=0;
  }

  setup(w,h){ this.rebuild(w,h); this.modeStartedMs=millis(); this.announcePreset(); }

  rebuild(w,h){
    const mobile=P5LabUtils.isMobileLayout();
    const edge=mobile?P5LAB_CONFIG.render.maxBufferLongEdgeMobile:P5LAB_CONFIG.render.maxBufferLongEdgeDesktop;
    const s=P5LabUtils.fitInside(w,h,edge);
    this.buffer=createGraphics(s.width,s.height);
    this.crushBuffer=createGraphics(s.width,s.height);
    this.ruptureBuffer=createGraphics(s.width,s.height);
    this.ruptureScratch=createGraphics(s.width,s.height);
    const fs=mobile?this.config.feedbackResolutionScaleMobile:this.config.feedbackResolutionScaleDesktop;
    const fw=Math.max(96,Math.round(s.width*fs)), fh=Math.max(96,Math.round(s.height*fs));
    this.feedback=createGraphics(fw,fh); this.feedbackScratch=createGraphics(fw,fh);
    this.swipeFeedback=createGraphics(fw,fh); this.swipeScratch=createGraphics(fw,fh);
    const cols=mobile?this.config.mosaicColsMobile:this.config.mosaicColsDesktop;
    this.mosaicSample=createGraphics(cols,Math.max(2,Math.ceil(cols*s.height/s.width)));
    this.glowBuffer=createGraphics(Math.max(64,Math.round(s.width*.28)),Math.max(96,Math.round(s.height*.28)));
    [this.buffer,this.crushBuffer,this.ruptureBuffer,this.ruptureScratch,this.feedback,this.feedbackScratch,this.swipeFeedback,this.swipeScratch,this.mosaicSample,this.glowBuffer].forEach(g=>g.pixelDensity(1));
    this.feedback.background(0); this.feedbackScratch.background(0); this.swipeFeedback.background(0); this.swipeScratch.background(0);
    this.telemetry.event(`VISUAL BUFFER ${s.width}X${s.height}`);
  }

  currentPreset(){ return this.config.presets[this.modeIndex%this.config.presets.length]; }
  updateMode(){ if(millis()-this.modeStartedMs>P5LAB_CONFIG.app.modeDurationSec*1000){this.modeIndex=(this.modeIndex+1)%this.config.presets.length;this.modeStartedMs=millis();this.feedback.clear();this.feedbackScratch.clear();this.swipeFeedback.clear();this.swipeScratch.clear();this.announcePreset();} }
  announcePreset(){ this.telemetry.event(`MODE ${this.currentPreset().name}`); }

  render(_source,currentImage,imagePool,analysis,audio,interaction){
    this.updateMode();
    const p=this.currentPreset(), g=this.buffer;
    const pool=imagePool&&imagePool.length?imagePool:(currentImage?[currentImage]:[]);
    const t=this.tick(this.config.photoCutMs,interaction);

    g.push(); g.background(0);
    if(p.photoFeedback)this.drawPhotoFeedbackSource(g,pool,interaction,audio,t);
    else if(p.photoRapidCrop)this.drawPhotoRapidCrop(g,pool,interaction,audio,t);
    else if(p.photoRgbTear)this.drawPhotoRgbTear(g,pool,interaction,audio,t);
    else if(p.photoHalation)this.drawPhotoHalation(g,pool,interaction,audio,t);
    else if(p.photoShardSwap)this.drawPhotoShardSwap(g,pool,interaction,audio,t);
    else if(p.photoDoubleBlend)this.drawPhotoDoubleBlend(g,pool,interaction,audio,t);
    else if(p.photoBlendCycle)this.drawPhotoBlendCycle(g,pool,interaction,audio,t);
    else if(p.photoFull)this.drawPhotoFull(g,pool,interaction,audio,t);
    else if(p.mosaic)this.drawMosaic(g,pool,analysis,audio,interaction,p.mosaic,t);
    g.pop();

    // PHOTO_CRUSH is now a common pass on every scene.
    let stage=this.applyCommonCrush(g,pool,interaction,audio,t);

    // Stationary touch: rupture only. Fast touch: rupture then velocity feedback.
    if((interaction.pressure||0)>.035) stage=this.applyTouchRupture(stage,interaction,audio,t);
    if(p.feedback){ this.applyPhotoFeedback(stage,audio,interaction); stage=this.feedback; }

    const swipe=interaction.swipeSpeed||0;
    const threshold=this.config.swipeFeedbackThreshold;
    if(interaction.pressed&&swipe>threshold){ this.applySwipeFeedback(stage,interaction,audio); stage=this.swipeFeedback; }
    else { this.swipeFeedback.clear(); this.swipeScratch.clear(); }

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null,stage,255);
    this.drawVignette(interaction,audio,p);
    this.drawWaveformOverlay(audio,interaction);
  }

  tick(ms,interaction){ const press=interaction.pressure||0; return Math.floor(millis()/Math.max(30,ms*(1+press*this.config.touchTransitionSlowdown))); }
  hash32(seed){let x=(Math.floor(seed)|0)^0x9e3779b9;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return x>>>0;}
  rand01(seed){return this.hash32(seed)/4294967295;}
  imageAt(pool,seed){return pool.length?pool[this.hash32(seed)%pool.length]:null;}
  blendModeAt(seed){const m=[SCREEN,MULTIPLY,DIFFERENCE,ADD,LIGHTEST,DARKEST];return m[this.hash32(seed)%m.length];}

  cropFor(seed,interaction,audio,intensity=1){
    const press=interaction.pressure||0,minZ=this.config.sourceCropMinZoom,maxZ=this.config.sourceCropMaxZoom+press*this.config.sourceCropTouchBoost;
    const u=this.rand01(seed*17+3), zoom=minZ+Math.pow(u,1.45)*(maxZ-minZ)*intensity+audio.rms*.06;
    const safe=Math.max(0,zoom-1), pan=this.config.sourceCropPanFactor*safe;
    const ox=(this.rand01(seed*23+7)-.5)*2*pan+(interaction.x-.5)*pan*press*.75;
    const oy=(this.rand01(seed*31+11)-.5)*2*pan+(interaction.y-.5)*pan*press*.65;
    return {zoom:Math.max(1,zoom),ox,oy};
  }
  drawSource(g,img,alpha,seed,interaction,audio,intensity=1,tint=null){if(!img)return;const c=this.cropFor(seed,interaction,audio,intensity);P5LabUtils.drawCover(g,img,alpha,c.zoom,c.ox*g.width,c.oy*g.height,tint);}

  drawPhotoFull(g,pool,i,a,t){this.drawSource(g,this.imageAt(pool,t),255,t*41+1,i,a,1);}
  drawPhotoDoubleBlend(g,pool,i,a,t){const x=this.imageAt(pool,t*3+1),y=this.imageAt(pool,t*7+5);if(!x)return;this.drawSource(g,x,235,t*101+1,i,a,1);if(y){g.push();g.blendMode(this.blendModeAt(t+Math.floor(i.x*7)));this.drawSource(g,y,70+a.rms*115+i.pressure*100,t*103+2,i,a,1.08);g.blendMode(BLEND);g.pop();}}
  drawPhotoRapidCrop(g,pool,i,a,t){const x=this.imageAt(pool,t*11+3),y=this.imageAt(pool,t*17+9);this.drawSource(g,x,255,t*107+3,i,a,1.38);if(y){g.push();g.blendMode(t%2?DIFFERENCE:SCREEN);this.drawSource(g,y,42+i.pressure*145+a.rms*65,t*109+9,i,a,1.48);g.blendMode(BLEND);g.pop();}}
  drawPhotoShardSwap(g,pool,i,a,t){const base=this.imageAt(pool,t*5+1);if(!base)return;this.drawSource(g,base,255,t*113+1,i,a,1);const bands=9+Math.floor(i.y*10)+Math.floor(a.treble*5),bh=g.height/bands;for(let n=0;n<bands;n++){if((n+t)%3===0&&i.pressure<.1)continue;const img=this.imageAt(pool,t*31+n*13+7);if(!img)continue;g.push();const ctx=g.drawingContext;ctx.save();ctx.beginPath();ctx.rect(0,n*bh,g.width,bh+1);ctx.clip();this.drawSource(g,img,210,t*127+n*17,i,a,1.22);ctx.restore();g.pop();}}
  drawPhotoBlendCycle(g,pool,i,a,t){const imgs=[this.imageAt(pool,t*5+1),this.imageAt(pool,t*11+3),this.imageAt(pool,t*17+7)].filter(Boolean);if(!imgs.length)return;this.drawSource(g,imgs[0],225,t*131+1,i,a,1);for(let n=1;n<imgs.length;n++){g.push();g.blendMode(this.blendModeAt(t+n+Math.floor(i.x*7)));this.drawSource(g,imgs[n],48+n*34+a.rms*90+i.pressure*100,t*137+n*19,i,a,1.12+n*.08);g.blendMode(BLEND);g.pop();}}
  drawPhotoRgbTear(g,pool,i,a,t){const img=this.imageAt(pool,t*7+3);if(!img)return;const c=this.cropFor(t*139+3,i,a,1.08),d=this.config.rgbTearMaxPx*(.3+i.pressure*1.9+a.treble);P5LabUtils.drawCover(g,img,145,c.zoom,c.ox*g.width,c.oy*g.height);g.push();g.blendMode(ADD);P5LabUtils.drawCover(g,img,115,c.zoom,c.ox*g.width-d,c.oy*g.height,[255,35,35]);P5LabUtils.drawCover(g,img,95,c.zoom,c.ox*g.width+d*.25,c.oy*g.height+d*.12,[35,255,95]);P5LabUtils.drawCover(g,img,115,c.zoom,c.ox*g.width+d,c.oy*g.height-d*.14,[45,90,255]);g.blendMode(BLEND);g.pop();}
  drawPhotoHalation(g,pool,i,a,t){const img=this.imageAt(pool,t*7+2);if(!img)return;const c=this.cropFor(t*163+2,i,a,1.06);P5LabUtils.drawCover(g,img,235,c.zoom,c.ox*g.width,c.oy*g.height);const glow=this.glowBuffer;glow.clear();P5LabUtils.drawCover(glow,img,175+a.rms*65,c.zoom,c.ox*glow.width,c.oy*glow.height,[255,112,88]);try{glow.filter(BLUR,this.config.halationBlur+Math.floor(i.pressure*8));}catch(_){}g.push();g.blendMode(SCREEN);g.tint(255,72+a.rms*110+i.pressure*100);g.image(glow,-g.width*.05,-g.height*.04,g.width*1.1,g.height*1.08);g.noTint();g.blendMode(BLEND);g.pop();}
  drawPhotoFeedbackSource(g,pool,i,a,t){this.drawSource(g,this.imageAt(pool,t*19+2),235,t*167+2,i,a,1.35);const b=this.imageAt(pool,t*37+13);if(b&&t%2===0){g.push();g.blendMode(t%4===0?DIFFERENCE:SCREEN);this.drawSource(g,b,38+a.rms*70+i.pressure*110,t*173+13,i,a,1.28);g.blendMode(BLEND);g.pop();}}

  drawMosaic(g,pool,analysis,audio,i,variant,t){
    const img=this.imageAt(pool,t*11+5);if(!img)return;
    const cols=P5LabUtils.isMobileLayout()?this.config.mosaicColsMobile:this.config.mosaicColsDesktop,cell=g.width/cols,rows=Math.ceil(g.height/cell),s=this.mosaicSample;
    s.clear();this.drawSource(s,img,255,t*179+5,i,audio,1.18);s.loadPixels();g.background(variant==='mono'||variant==='dither'?238:0);g.noStroke();const pulse=.72+audio.rms*.72+.18*Math.sin(millis()*.006+audio.bass*8);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const idx=4*(y*s.width+x),r=s.pixels[idx]||0,gg=s.pixels[idx+1]||0,b=s.pixels[idx+2]||0,l=(r+gg+b)/(255*3);let sc;if(variant==='inverse')sc=.12+(1-l)*1.05;else if(variant==='dither')sc=l>((x+y*3)%5)/5?.94:.12;else if(variant==='pulse')sc=(.14+l*.92)*pulse;else sc=.14+l*1.02;sc=P5LabUtils.clamp(sc+i.pressure*.18,.05,1.35);const z=cell*sc,j=(noise(x*.14,y*.14,frameCount*.008)-.5)*cell*(analysis.motionSmooth+audio.treble*.4);if(variant==='mono'||variant==='dither')g.fill(l>.48?12:28,235);else g.fill(r,gg,b,235);g.rect(x*cell+(cell-z)/2+j,y*cell+(cell-z)/2,z,z);}
  }

  applyCommonCrush(src,pool,i,a,t){
    const out=this.crushBuffer;out.clear();out.push();
    const ctx=out.drawingContext;ctx.save();ctx.filter=`contrast(${this.config.crushContrast}) saturate(1.18)`;out.image(src,0,0,out.width,out.height);ctx.restore();
    try{out.filter(POSTERIZE,this.config.crushPosterizeLevels);}catch(_){}
    const intruder=this.imageAt(pool,t*211+17);
    if(intruder){out.blendMode((t%5===0||i.pressure>.2)?DIFFERENCE:MULTIPLY);this.drawSource(out,intruder,this.config.crushIntruderAlpha+i.pressure*34+a.treble*18,t*223+19,i,a,1.16);out.blendMode(BLEND);}
    out.pop();return out;
  }

  applyTouchRupture(src,i,a,t){
    const out=this.ruptureBuffer,scratch=this.ruptureScratch;out.clear();scratch.clear();
    scratch.push();const ctx=scratch.drawingContext;ctx.save();ctx.filter=`grayscale(1) contrast(${this.config.touchRuptureContrast})`;scratch.image(src,0,0,scratch.width,scratch.height);ctx.restore();scratch.pop();
    try{scratch.filter(POSTERIZE,this.config.touchRupturePosterizeLevels);}catch(_){}
    out.image(scratch,0,0,out.width,out.height);

    // Harsh but sparse horizontal dislocation. Mid grays survive only in the narrow
    // high-contrast threshold transition created above.
    const bands=this.config.touchRuptureBands, bh=out.height/bands;
    for(let n=0;n<bands;n++){if((n+t)%3!==0)continue;const shift=(this.rand01(t*307+n*17)-.5)*out.width*(.05+i.pressure*.18);out.image(scratch,shift,n*bh,out.width,bh+1,0,n*bh,scratch.width,bh+1);}
    out.push();out.stroke(255,18+i.pressure*38);out.strokeWeight(1);for(let n=0;n<7;n++){const y=this.rand01(t*331+n*23)*out.height;out.line(0,y,out.width,y);}out.pop();
    return out;
  }

  applyPhotoFeedback(current,a,i){
    const prev=this.feedback,next=this.feedbackScratch,press=i.pressure||0,scale=this.config.feedbackScale+press*.002-a.rms*.0015,w=next.width*scale,h=next.height*scale,x=(next.width-w)*(.5+(i.x-.5)*(.28+press*.25)),y=(next.height-h)*(.5+(i.y-.5)*(.28+press*.25));
    next.push();next.clear();next.background(0,Math.max(1,4+a.bass*6-press*2));next.tint(255,Math.min(225,this.config.feedbackAlpha+press*48));next.image(prev,x,y,w,h);next.noTint();next.blendMode(press>.08?DIFFERENCE:SCREEN);next.tint(255,92+a.rms*65+press*62);next.image(current,0,0,next.width,next.height);next.noTint();next.blendMode(BLEND);next.pop();this.feedback=next;this.feedbackScratch=prev;
  }

  applySwipeFeedback(current,i,a){
    const speed=P5LabUtils.clamp((i.swipeSpeed-this.config.swipeFeedbackThreshold)/(1-this.config.swipeFeedbackThreshold),0,1);
    const prev=this.swipeFeedback,next=this.swipeScratch;
    const scale=P5LabUtils.map01(speed,this.config.swipeFeedbackScaleMin,this.config.swipeFeedbackScaleMax);
    const w=next.width*scale,h=next.height*scale;
    const drift=(.01+.035*speed),x=(next.width-w)*.5+(i.x-.5)*next.width*drift,y=(next.height-h)*.5+(i.y-.5)*next.height*drift;
    const retain=P5LabUtils.map01(speed,this.config.swipeFeedbackAlphaMin,this.config.swipeFeedbackAlphaMax);
    next.push();next.clear();next.background(0,5);next.tint(255,retain);next.image(prev,x,y,w,h);next.noTint();next.blendMode(speed>.58?DIFFERENCE:SCREEN);next.tint(255,150+speed*85);next.image(current,0,0,next.width,next.height);next.noTint();next.blendMode(BLEND);next.pop();
    this.swipeFeedback=next;this.swipeScratch=prev;
  }

  drawVignette(i,a,p){const ctx=drawingContext,cx=width*(.5+(i.x-.5)*.08),cy=height*(.48+(i.y-.5)*.06),inner=Math.min(width,height)*(.16+a.rms*.04),outer=Math.max(width,height)*.70,strength=P5LabUtils.clamp(this.config.vignetteStrength+i.pressure*.11+(p.feedback?.05:0),0,.72),grad=ctx.createRadialGradient(cx,cy,inner,cx,cy,outer);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(.62,`rgba(0,0,0,${strength*.18})`);grad.addColorStop(1,`rgba(0,0,0,${strength})`);ctx.save();ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);ctx.restore();}
  drawWaveformOverlay(a,i){const wave=a.waveform;if(!wave||wave.length<2)return;push();noFill();stroke(255,75+a.rms*150);strokeWeight(.8+i.pressure*1.1);beginShape();const center=height*(.80-i.y*.15),amp=height*(.022+a.rms*.12);for(let n=0;n<wave.length;n++)vertex((n/(wave.length-1))*width,center+wave[n]*amp);endShape();pop();}

  snapshot(){const p=this.currentPreset(),fx=[p.photoFeedback&&'PHOTO_FDBK',p.photoRapidCrop&&'CROP',p.photoRgbTear&&'RGB_TEAR',p.photoHalation&&'HALATION',p.photoShardSwap&&'SHARD',p.photoDoubleBlend&&'DOUBLE',p.photoBlendCycle&&'BLEND',p.photoFull&&'PHOTO',p.mosaic&&`MOSAIC_${String(p.mosaic).toUpperCase()}`,'CRUSH','WAVE','VIGNETTE'].filter(Boolean).join('+');return{modeName:p.name,modeIndex:this.modeIndex,particleCount:0,activeFx:fx};}
}
window.P5LabVisualEngine=P5LabVisualEngine;
