/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.5.0
 *
 * Main change: every visual mode now passes through one common destructive crop
 * stage before final presentation. Touch no longer mainly speeds the archive;
 * it deepens crop, RGB separation, blend opacity, halation, feedback persistence
 * and vignette movement. Audio waveform remains globally visible.
 */
class P5LabVisualEngine {
  constructor(config, telemetry) {
    this.config = config;
    this.telemetry = telemetry;
    this.buffer = null;
    this.cropBuffer = null;
    this.feedback = null;
    this.feedbackScratch = null;
    this.mosaicSample = null;
    this.glowBuffer = null;
    this.modeIndex = 0;
    this.modeStartedMs = 0;
  }

  setup(w, h) { this.rebuild(w, h); this.modeStartedMs = millis(); this.announcePreset(); }

  rebuild(w, h) {
    const mobile = P5LabUtils.isMobileLayout();
    const edge = mobile ? P5LAB_CONFIG.render.maxBufferLongEdgeMobile : P5LAB_CONFIG.render.maxBufferLongEdgeDesktop;
    const size = P5LabUtils.fitInside(w, h, edge);
    this.buffer = createGraphics(size.width, size.height);
    this.cropBuffer = createGraphics(size.width, size.height);

    const fs = mobile ? this.config.feedbackResolutionScaleMobile : this.config.feedbackResolutionScaleDesktop;
    this.feedback = createGraphics(Math.max(96, Math.round(size.width * fs)), Math.max(96, Math.round(size.height * fs)));
    this.feedbackScratch = createGraphics(this.feedback.width, this.feedback.height);

    const cols = mobile ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    this.mosaicSample = createGraphics(cols, Math.max(2, Math.ceil(cols * size.height / size.width)));
    this.glowBuffer = createGraphics(Math.max(64, Math.round(size.width * 0.28)), Math.max(96, Math.round(size.height * 0.28)));
    [this.buffer, this.cropBuffer, this.feedback, this.feedbackScratch, this.mosaicSample, this.glowBuffer].forEach(g => g.pixelDensity(1));
    this.feedback.background(0); this.feedbackScratch.background(0);
    this.telemetry.event(`VISUAL BUFFER ${size.width}X${size.height}`);
  }

  currentPreset() { return this.config.presets[this.modeIndex % this.config.presets.length]; }
  updateMode() {
    if (millis() - this.modeStartedMs > P5LAB_CONFIG.app.modeDurationSec * 1000) {
      this.modeIndex = (this.modeIndex + 1) % this.config.presets.length;
      this.modeStartedMs = millis();
      this.feedback.clear(); this.feedbackScratch.clear();
      this.announcePreset();
    }
  }
  announcePreset() { this.telemetry.event(`MODE ${this.currentPreset().name}`); }

  render(source, currentImage, imagePool, analysis, audio, interaction) {
    this.updateMode();
    const p = this.currentPreset();
    const g = this.buffer;
    const pool = imagePool && imagePool.length ? imagePool : (currentImage ? [currentImage] : []);

    g.push(); g.background(0);
    if (p.photoFeedback) this.drawPhotoFeedbackSource(g, pool, interaction, audio);
    else if (p.photoRapidCrop) this.drawPhotoRapidCrop(g, pool, interaction, audio);
    else if (p.photoRgbTear) this.drawPhotoRgbTear(g, pool, interaction, audio);
    else if (p.photoHalation) this.drawPhotoHalation(g, pool, interaction, audio);
    else if (p.photoShardSwap) this.drawPhotoShardSwap(g, pool, interaction, audio);
    else if (p.photoDoubleBlend) this.drawPhotoDoubleBlend(g, pool, interaction, audio);
    else if (p.photoBlendCycle) this.drawPhotoBlendCycle(g, pool, interaction, audio);
    else if (p.photoCrush) this.drawPhotoCrush(g, pool, interaction, audio);
    else if (p.photoFull) this.drawPhotoFull(g, pool, interaction, audio);
    else {
      if (p.base) this.drawBase(g, source, analysis, audio, interaction);
      if (p.mosaic) this.drawMosaic(g, source, analysis, audio, interaction, p.mosaic);
      if (p.posterize) { try { g.filter(POSTERIZE, Math.floor(P5LabUtils.map01(interaction.x, 3, 9))); } catch (_) {} }
      this.drawScanlines(g, analysis, audio);
    }
    g.pop();

    // Global crop/destruction pass: applies to every mode, not only crop presets.
    const cropped = this.applyGlobalCrop(g, interaction, audio);
    if (p.feedback) this.applyPhotoFeedback(cropped, audio, interaction);

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null, p.feedback ? this.feedback : cropped, 255);
    this.drawVignette(interaction, audio, p);
    this.drawWaveformOverlay(audio, interaction);
  }

  tick(ms, interaction) {
    // Pressure only accelerates image turnover slightly; most touch energy is now
    // spent on effect depth and recursive persistence.
    return Math.floor(millis() / Math.max(28, ms * (1 - (interaction.pressure || 0) * 0.12)));
  }

  imageAt(pool, seed) {
    if (!pool.length) return null;
    let x = (Math.floor(seed) | 0) ^ 0x9e3779b9;
    x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16;
    return pool[(x >>> 0) % pool.length];
  }
  blendModeAt(seed) { const m=[SCREEN,MULTIPLY,DIFFERENCE,ADD,LIGHTEST,DARKEST]; return m[Math.abs(Math.floor(seed))%m.length]; }

  cropState(interaction, audio, tick = 0) {
    const n1 = noise(tick * 0.71 + 3.1), n2 = noise(tick * 1.37 + 8.2), n3 = noise(tick * 2.11 + 19.4);
    const pressure = interaction.pressure || 0;
    const minZ = this.config.cropMinZoom;
    const maxZ = this.config.cropMaxZoom + pressure * this.config.cropPressBoost;
    const zoom = minZ + n3 * (maxZ - minZ) + audio.rms * 0.22;
    const sx = (n1 - 0.5) * this.config.cropOffsetScale + (interaction.x - 0.5) * (0.24 + pressure * 0.42);
    const sy = (n2 - 0.5) * this.config.cropOffsetScale + (interaction.y - 0.5) * (0.18 + pressure * 0.34);
    return { zoom, sx, sy };
  }

  applyGlobalCrop(src, interaction, audio) {
    const out = this.cropBuffer;
    const tick = Math.floor(millis() / (70 - (interaction.pressure || 0) * 8));
    const c = this.cropState(interaction, audio, tick);
    out.clear();
    P5LabUtils.drawCover(out, src, 255, c.zoom, c.sx * out.width, c.sy * out.height);
    return out;
  }

  drawPhotoFull(g,pool,interaction,audio){const t=this.tick(this.config.photoCutMs,interaction),img=this.imageAt(pool,t);if(!img)return;P5LabUtils.drawCover(g,img,255,1.08+audio.rms*.05);}

  drawPhotoDoubleBlend(g,pool,interaction,audio){const t=this.tick(105,interaction),a=this.imageAt(pool,t*3+1),b=this.imageAt(pool,t*7+5);if(!a)return;P5LabUtils.drawCover(g,a,235,1.08);if(!b)return;g.push();g.blendMode(this.blendModeAt(t+Math.floor(interaction.x*6)));P5LabUtils.drawCover(g,b,70+audio.rms*120+interaction.pressure*95,1.25+interaction.y*.35,(.5-interaction.x)*70,(interaction.y-.5)*60);g.blendMode(BLEND);g.pop();}

  drawPhotoRapidCrop(g,pool,interaction,audio){const t=this.tick(this.config.photoCutMs,interaction),img=this.imageAt(pool,t*11+3);if(!img)return;const c=this.cropState(interaction,audio,t*3);P5LabUtils.drawCover(g,img,255,1.65+c.zoom*.72,c.sx*g.width*1.15,c.sy*g.height*1.15);if(interaction.pressure>.05){const b=this.imageAt(pool,t*17+9);if(b){g.push();g.blendMode(t%2?DIFFERENCE:SCREEN);P5LabUtils.drawCover(g,b,60+interaction.pressure*145+audio.rms*70,2.0+c.zoom*.4,-c.sx*g.width*.55,c.sy*g.height*.5);g.blendMode(BLEND);g.pop();}}}

  drawPhotoShardSwap(g,pool,interaction,audio){const t=this.tick(72,interaction),base=this.imageAt(pool,t*5+1);if(!base)return;P5LabUtils.drawCover(g,base,255,1.15);const bands=10+Math.floor(interaction.y*12)+Math.floor(audio.treble*6),bh=g.height/bands;for(let i=0;i<bands;i++){if((i+t)%3===0&&interaction.pressure<.12)continue;const img=this.imageAt(pool,t*31+i*13+7);if(!img)continue;g.push();const ctx=g.drawingContext;ctx.save();ctx.beginPath();ctx.rect(0,i*bh,g.width,bh+1);ctx.clip();P5LabUtils.drawCover(g,img,210,1.45+audio.bass*.3,(noise(t*.33,i*.61)-.5)*g.width*(.3+interaction.pressure*.7),0);ctx.restore();g.pop();}}

  drawPhotoBlendCycle(g,pool,interaction,audio){const t=this.tick(98,interaction),imgs=[this.imageAt(pool,t*5+1),this.imageAt(pool,t*11+3),this.imageAt(pool,t*17+7)].filter(Boolean);if(!imgs.length)return;P5LabUtils.drawCover(g,imgs[0],225,1.12);for(let i=1;i<imgs.length;i++){g.push();g.blendMode(this.blendModeAt(t+i+Math.floor(interaction.x*6)));P5LabUtils.drawCover(g,imgs[i],45+i*35+audio.rms*95+interaction.pressure*100,1.35+i*.18,(interaction.x-.5)*g.width*.12*i,(.5-interaction.y)*g.height*.1*i);g.blendMode(BLEND);g.pop();}}

  drawPhotoRgbTear(g,pool,interaction,audio){const t=this.tick(82,interaction),img=this.imageAt(pool,t*7+3);if(!img)return;const a=this.config.rgbTearMaxPx*(.35+interaction.pressure*1.8+audio.treble);P5LabUtils.drawCover(g,img,145,1.18);g.push();g.blendMode(ADD);P5LabUtils.drawCover(g,img,115,1.18,-a,0,[255,35,35]);P5LabUtils.drawCover(g,img,95,1.14,a*.25,a*.15,[35,255,95]);P5LabUtils.drawCover(g,img,115,1.2,a,-a*.16,[45,90,255]);g.blendMode(BLEND);g.pop();if(interaction.pressure>.08||audio.bass>.22){const b=this.imageAt(pool,t*19+11);if(b){g.push();g.blendMode(DIFFERENCE);P5LabUtils.drawCover(g,b,40+interaction.pressure*140+audio.bass*75,1.7+interaction.y*.5);g.blendMode(BLEND);g.pop();}}}

  drawPhotoCrush(g,pool,interaction,audio){const t=this.tick(108,interaction),img=this.imageAt(pool,t*13+5);if(!img)return;P5LabUtils.drawCover(g,img,255,1.3+interaction.pressure*.3);try{g.filter(POSTERIZE,Math.max(2,Math.min(7,2+Math.floor(interaction.x*4+audio.rms*2))));}catch(_){}const b=this.imageAt(pool,t*29+9);if(b){g.push();g.blendMode(interaction.y>.5?DIFFERENCE:MULTIPLY);P5LabUtils.drawCover(g,b,45+interaction.pressure*145+audio.treble*80,1.8+audio.bass*.4,(interaction.x-.5)*g.width*.28,(interaction.y-.5)*g.height*.24);g.blendMode(BLEND);g.pop();}}

  drawPhotoHalation(g,pool,interaction,audio){const t=this.tick(160,interaction),img=this.imageAt(pool,t*7+2);if(!img)return;P5LabUtils.drawCover(g,img,235,1.22+interaction.pressure*.18);const glow=this.glowBuffer;glow.clear();P5LabUtils.drawCover(glow,img,170+audio.rms*70,1.25+interaction.y*.12,0,0,[255,112,88]);try{glow.filter(BLUR,this.config.halationBlur+Math.floor(interaction.pressure*8));}catch(_){}g.push();g.blendMode(SCREEN);g.tint(255,75+audio.rms*110+interaction.pressure*95);g.image(glow,-g.width*.05,-g.height*.04,g.width*1.1,g.height*1.08);g.noTint();g.blendMode(BLEND);g.pop();}

  drawPhotoFeedbackSource(g,pool,interaction,audio){const t=this.tick(64,interaction),img=this.imageAt(pool,t*19+2);if(!img)return;const c=this.cropState(interaction,audio,t*5);P5LabUtils.drawCover(g,img,235,1.8+c.zoom*.75,c.sx*g.width*1.3,c.sy*g.height*1.3);if(t%2===0){const b=this.imageAt(pool,t*37+13);if(b){g.push();g.blendMode(t%4===0?DIFFERENCE:SCREEN);P5LabUtils.drawCover(g,b,40+audio.rms*75+interaction.pressure*105,1.8+c.zoom*.35,-c.sx*g.width*.4,-c.sy*g.height*.35);g.blendMode(BLEND);g.pop();}}}

  applyPhotoFeedback(current,audio,interaction){const prev=this.feedback,next=this.feedbackScratch,press=interaction.pressure||0;const scale=this.config.feedbackScale+press*.002-audio.rms*.0015,w=next.width*scale,h=next.height*scale,x=(next.width-w)*(.5+(interaction.x-.5)*(.28+press*.24)),y=(next.height-h)*(.5+(interaction.y-.5)*(.28+press*.24));next.push();next.clear();next.background(0,Math.max(1,4+audio.bass*6-press*2));next.tint(255,Math.min(220,this.config.feedbackAlpha+press*42));next.image(prev,x,y,w,h);next.noTint();next.blendMode(press>.12?DIFFERENCE:SCREEN);next.tint(255,95+audio.rms*65+press*55);next.image(current,0,0,next.width,next.height);next.noTint();next.blendMode(BLEND);next.pop();this.feedback=next;this.feedbackScratch=prev;}

  drawBase(g,source,analysis,audio,interaction){P5LabUtils.drawCover(g,source,255,1.08+interaction.pressure*.12+audio.bass*.04,(interaction.x-.5)*18,(interaction.y-.5)*18);}

  drawMosaic(g,source,analysis,audio,interaction,variant){const cols=P5LabUtils.isMobileLayout()?this.config.mosaicColsMobile:this.config.mosaicColsDesktop,cell=g.width/cols,rows=Math.ceil(g.height/cell),s=this.mosaicSample;s.clear();P5LabUtils.drawCover(s,source,255,1.18+interaction.pressure*.15,(interaction.x-.5)*s.width*.12,(interaction.y-.5)*s.height*.12);s.loadPixels();g.background(variant==='mono'||variant==='dither'?238:0);g.noStroke();const pulse=.72+audio.rms*.7+.18*Math.sin(millis()*.006+audio.bass*8);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const idx=4*(y*s.width+x),r=s.pixels[idx]||0,gg=s.pixels[idx+1]||0,b=s.pixels[idx+2]||0,l=(r+gg+b)/(255*3);let sc;if(variant==='inverse')sc=.12+(1-l)*1.05;else if(variant==='dither')sc=l>(((x+y*3)%5)/5)?.94:.12;else if(variant==='pulse')sc=(.14+l*.92)*pulse;else sc=.14+l*1.02;sc=P5LabUtils.clamp(sc+interaction.pressure*.22,.05,1.45);const size=cell*sc,j=(noise(x*.14,y*.14,frameCount*.008)-.5)*cell*(analysis.motionSmooth+audio.treble*.5+interaction.pressure*.3);if(variant==='mono'||variant==='dither')g.fill(l>.48?12:28,235);else g.fill(r,gg,b,235);g.rect(x*cell+(cell-size)/2+j,y*cell+(cell-size)/2,size,size);}}

  drawScanlines(g,analysis,audio){g.push();g.stroke(255,8+20*audio.treble+18*analysis.motionSmooth);for(let y=0;y<g.height;y+=this.config.scanlineSpacing)g.line(0,y,g.width,y);g.pop();}

  drawVignette(interaction,audio,p){const ctx=drawingContext,cx=width*(.5+(interaction.x-.5)*.14),cy=height*(.48+(interaction.y-.5)*.10),inner=Math.min(width,height)*(.14+audio.rms*.04),outer=Math.max(width,height)*.72,str=P5LabUtils.clamp(this.config.vignetteStrength+interaction.pressure*.22+(p.feedback?.08:0),0,.82),gr=ctx.createRadialGradient(cx,cy,inner,cx,cy,outer);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.58,`rgba(0,0,0,${str*.18})`);gr.addColorStop(1,`rgba(0,0,0,${str})`);ctx.save();ctx.fillStyle=gr;ctx.fillRect(0,0,width,height);ctx.restore();}

  drawWaveformOverlay(audio,interaction){const w=audio.waveform;if(!w||w.length<2)return;push();noFill();stroke(255,75+audio.rms*150);strokeWeight(.8+interaction.pressure*1.5);beginShape();const center=height*(.80-interaction.y*.15),amp=height*(.022+audio.rms*.12);for(let i=0;i<w.length;i++)vertex((i/(w.length-1))*width,center+w[i]*amp);endShape();pop();}

  snapshot(){const p=this.currentPreset();const fx=[p.photoFull&&'PHOTO',p.photoDoubleBlend&&'DOUBLE',p.photoRapidCrop&&'CROP',p.photoShardSwap&&'SHARD',p.photoBlendCycle&&'BLEND',p.photoRgbTear&&'RGB_TEAR',p.photoCrush&&'CRUSH',p.photoHalation&&'HALATION',p.photoFeedback&&'PHOTO_FDBK',p.mosaic&&`MOSAIC_${String(p.mosaic).toUpperCase()}`,'GLOBAL_CROP','WAVE','VIGNETTE'].filter(Boolean).join('+');return{modeName:p.name,modeIndex:this.modeIndex,particleCount:0,activeFx:fx};}
}
window.P5LabVisualEngine=P5LabVisualEngine;
