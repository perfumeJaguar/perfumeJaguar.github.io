/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.0
 *
 * Photo-only sampler. Cropping now belongs to every individual source draw,
 * not to a global final zoom. Each source instance receives an independent crop
 * scale and crop position, so one photograph can behave like many source images.
 * Touch slows turnover only slightly and instead activates a harsh monochrome
 * rupture pass while deepening feedback/blend/halation/channel separation.
 */
class P5LabVisualEngine {
  constructor(config, telemetry) {
    this.config = config;
    this.telemetry = telemetry;
    this.buffer = null;
    this.feedback = null;
    this.feedbackScratch = null;
    this.mosaicSample = null;
    this.glowBuffer = null;
    this.ruptureBuffer = null;
    this.modeIndex = 0;
    this.modeStartedMs = 0;
  }

  setup(w, h) { this.rebuild(w, h); this.modeStartedMs = millis(); this.announcePreset(); }

  rebuild(w, h) {
    const mobile = P5LabUtils.isMobileLayout();
    const edge = mobile ? P5LAB_CONFIG.render.maxBufferLongEdgeMobile : P5LAB_CONFIG.render.maxBufferLongEdgeDesktop;
    const size = P5LabUtils.fitInside(w, h, edge);
    this.buffer = createGraphics(size.width, size.height);
    this.ruptureBuffer = createGraphics(size.width, size.height);

    const fs = mobile ? this.config.feedbackResolutionScaleMobile : this.config.feedbackResolutionScaleDesktop;
    this.feedback = createGraphics(Math.max(96, Math.round(size.width * fs)), Math.max(96, Math.round(size.height * fs)));
    this.feedbackScratch = createGraphics(this.feedback.width, this.feedback.height);
    const cols = mobile ? this.config.mosaicColsMobile : this.config.mosaicColsDesktop;
    this.mosaicSample = createGraphics(cols, Math.max(2, Math.ceil(cols * size.height / size.width)));
    this.glowBuffer = createGraphics(Math.max(64, Math.round(size.width * 0.28)), Math.max(96, Math.round(size.height * 0.28)));
    [this.buffer, this.ruptureBuffer, this.feedback, this.feedbackScratch, this.mosaicSample, this.glowBuffer].forEach((g) => g.pixelDensity(1));
    this.feedback.background(0);
    this.feedbackScratch.background(0);
    this.telemetry.event(`VISUAL BUFFER ${size.width}X${size.height}`);
  }

  currentPreset() { return this.config.presets[this.modeIndex % this.config.presets.length]; }
  updateMode() {
    if (millis() - this.modeStartedMs > P5LAB_CONFIG.app.modeDurationSec * 1000) {
      this.modeIndex = (this.modeIndex + 1) % this.config.presets.length;
      this.modeStartedMs = millis();
      this.feedback.clear();
      this.feedbackScratch.clear();
      this.announcePreset();
    }
  }
  announcePreset() { this.telemetry.event(`MODE ${this.currentPreset().name}`); }

  render(_source, currentImage, imagePool, analysis, audio, interaction) {
    this.updateMode();
    const p = this.currentPreset();
    const g = this.buffer;
    const pool = imagePool && imagePool.length ? imagePool : (currentImage ? [currentImage] : []);
    const t = this.tick(this.config.photoCutMs, interaction);

    g.push();
    g.background(0);
    if (p.photoFeedback) this.drawPhotoFeedbackSource(g, pool, interaction, audio, t);
    else if (p.photoRapidCrop) this.drawPhotoRapidCrop(g, pool, interaction, audio, t);
    else if (p.photoRgbTear) this.drawPhotoRgbTear(g, pool, interaction, audio, t);
    else if (p.photoHalation) this.drawPhotoHalation(g, pool, interaction, audio, t);
    else if (p.photoShardSwap) this.drawPhotoShardSwap(g, pool, interaction, audio, t);
    else if (p.photoDoubleBlend) this.drawPhotoDoubleBlend(g, pool, interaction, audio, t);
    else if (p.photoBlendCycle) this.drawPhotoBlendCycle(g, pool, interaction, audio, t);
    else if (p.photoCrush) this.drawPhotoCrush(g, pool, interaction, audio, t);
    else if (p.photoFull) this.drawPhotoFull(g, pool, interaction, audio, t);
    else if (p.mosaic) this.drawMosaic(g, pool, analysis, audio, interaction, p.mosaic, t);
    g.pop();

    // The rupture is deliberately pre-feedback. Pressed black/white fragments can
    // therefore remain in the recursive trail after the finger is released.
    if ((interaction.pressure || 0) > 0.035) this.applyTouchRupture(g, interaction, audio, t);
    if (p.feedback) this.applyPhotoFeedback(g, audio, interaction);

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null, p.feedback ? this.feedback : g, 255);
    this.drawVignette(interaction, audio, p);
    this.drawWaveformOverlay(audio, interaction);
  }

  tick(ms, interaction) {
    const press = interaction.pressure || 0;
    return Math.floor(millis() / Math.max(30, ms * (1 + press * this.config.touchTransitionSlowdown)));
  }

  hash32(seed) {
    let x = (Math.floor(seed) | 0) ^ 0x9e3779b9;
    x ^= x >>> 16; x = Math.imul(x, 0x7feb352d); x ^= x >>> 15; x = Math.imul(x, 0x846ca68b); x ^= x >>> 16;
    return x >>> 0;
  }
  rand01(seed) { return this.hash32(seed) / 4294967295; }
  imageAt(pool, seed) { return pool.length ? pool[this.hash32(seed) % pool.length] : null; }
  blendModeAt(seed) { const modes = [SCREEN, MULTIPLY, DIFFERENCE, ADD, LIGHTEST, DARKEST]; return modes[this.hash32(seed) % modes.length]; }

  cropFor(seed, interaction, audio, intensity = 1) {
    const press = interaction.pressure || 0;
    const minZ = this.config.sourceCropMinZoom;
    const maxZ = this.config.sourceCropMaxZoom + press * this.config.sourceCropTouchBoost;
    // Squared-ish distribution favors mild crops but still produces occasional
    // severe magnification. Near-1x frames remain a normal outcome.
    const u = this.rand01(seed * 17 + 3);
    const zoom = minZ + Math.pow(u, 1.45) * (maxZ - minZ) * intensity + audio.rms * 0.06;
    const safe = Math.max(0, zoom - 1);
    const pan = this.config.sourceCropPanFactor * safe;
    const ox = (this.rand01(seed * 23 + 7) - 0.5) * 2 * pan + (interaction.x - 0.5) * pan * press * 0.75;
    const oy = (this.rand01(seed * 31 + 11) - 0.5) * 2 * pan + (interaction.y - 0.5) * pan * press * 0.65;
    return { zoom: Math.max(1, zoom), ox, oy };
  }

  drawSource(g, img, alpha, seed, interaction, audio, intensity = 1, tint = null) {
    if (!img) return;
    const c = this.cropFor(seed, interaction, audio, intensity);
    P5LabUtils.drawCover(g, img, alpha, c.zoom, c.ox * g.width, c.oy * g.height, tint);
  }

  drawPhotoFull(g,pool,interaction,audio,t){const img=this.imageAt(pool,t);this.drawSource(g,img,255,t*41+1,interaction,audio,1.0);}

  drawPhotoDoubleBlend(g,pool,interaction,audio,t){const a=this.imageAt(pool,t*3+1),b=this.imageAt(pool,t*7+5);if(!a)return;this.drawSource(g,a,235,t*101+1,interaction,audio,1.0);if(!b)return;g.push();g.blendMode(this.blendModeAt(t+Math.floor(interaction.x*7)));this.drawSource(g,b,70+audio.rms*115+interaction.pressure*100,t*103+2,interaction,audio,1.08);g.blendMode(BLEND);g.pop();}

  drawPhotoRapidCrop(g,pool,interaction,audio,t){const img=this.imageAt(pool,t*11+3);if(!img)return;this.drawSource(g,img,255,t*107+3,interaction,audio,1.35);const b=this.imageAt(pool,t*17+9);if(b){g.push();g.blendMode(t%2?DIFFERENCE:SCREEN);this.drawSource(g,b,42+interaction.pressure*145+audio.rms*65,t*109+9,interaction,audio,1.42);g.blendMode(BLEND);g.pop();}}

  drawPhotoShardSwap(g,pool,interaction,audio,t){const base=this.imageAt(pool,t*5+1);if(!base)return;this.drawSource(g,base,255,t*113+1,interaction,audio,1.0);const bands=9+Math.floor(interaction.y*10)+Math.floor(audio.treble*5),bh=g.height/bands;for(let i=0;i<bands;i++){if((i+t)%3===0&&interaction.pressure<.1)continue;const img=this.imageAt(pool,t*31+i*13+7);if(!img)continue;g.push();const ctx=g.drawingContext;ctx.save();ctx.beginPath();ctx.rect(0,i*bh,g.width,bh+1);ctx.clip();this.drawSource(g,img,210,t*127+i*17,interaction,audio,1.2);ctx.restore();g.pop();}}

  drawPhotoBlendCycle(g,pool,interaction,audio,t){const imgs=[this.imageAt(pool,t*5+1),this.imageAt(pool,t*11+3),this.imageAt(pool,t*17+7)].filter(Boolean);if(!imgs.length)return;this.drawSource(g,imgs[0],225,t*131+1,interaction,audio,1.0);for(let i=1;i<imgs.length;i++){g.push();g.blendMode(this.blendModeAt(t+i+Math.floor(interaction.x*7)));this.drawSource(g,imgs[i],48+i*34+audio.rms*90+interaction.pressure*100,t*137+i*19,interaction,audio,1.12+i*.08);g.blendMode(BLEND);g.pop();}}

  drawPhotoRgbTear(g,pool,interaction,audio,t){const img=this.imageAt(pool,t*7+3);if(!img)return;const c=this.cropFor(t*139+3,interaction,audio,1.08),a=this.config.rgbTearMaxPx*(.3+interaction.pressure*1.9+audio.treble);P5LabUtils.drawCover(g,img,145,c.zoom,c.ox*g.width,c.oy*g.height);g.push();g.blendMode(ADD);P5LabUtils.drawCover(g,img,115,c.zoom,c.ox*g.width-a,c.oy*g.height,[255,35,35]);P5LabUtils.drawCover(g,img,95,c.zoom,c.ox*g.width+a*.25,c.oy*g.height+a*.12,[35,255,95]);P5LabUtils.drawCover(g,img,115,c.zoom,c.ox*g.width+a,c.oy*g.height-a*.14,[45,90,255]);g.blendMode(BLEND);g.pop();const b=this.imageAt(pool,t*19+11);if(b&&(interaction.pressure>.05||audio.bass>.2)){g.push();g.blendMode(DIFFERENCE);this.drawSource(g,b,36+interaction.pressure*145+audio.bass*70,t*149+11,interaction,audio,1.25);g.blendMode(BLEND);g.pop();}}

  drawPhotoCrush(g,pool,interaction,audio,t){const img=this.imageAt(pool,t*13+5);if(!img)return;this.drawSource(g,img,255,t*151+5,interaction,audio,1.12);try{g.filter(POSTERIZE,Math.max(2,Math.min(7,2+Math.floor(interaction.x*4+audio.rms*2))));}catch(_){}const b=this.imageAt(pool,t*29+9);if(b){g.push();g.blendMode(interaction.y>.5?DIFFERENCE:MULTIPLY);this.drawSource(g,b,45+interaction.pressure*145+audio.treble*80,t*157+9,interaction,audio,1.3);g.blendMode(BLEND);g.pop();}}

  drawPhotoHalation(g,pool,interaction,audio,t){const img=this.imageAt(pool,t*7+2);if(!img)return;const c=this.cropFor(t*163+2,interaction,audio,1.05);P5LabUtils.drawCover(g,img,235,c.zoom,c.ox*g.width,c.oy*g.height);const glow=this.glowBuffer;glow.clear();P5LabUtils.drawCover(glow,img,175+audio.rms*65,c.zoom,c.ox*glow.width,c.oy*glow.height,[255,112,88]);try{glow.filter(BLUR,this.config.halationBlur+Math.floor(interaction.pressure*8));}catch(_){}g.push();g.blendMode(SCREEN);g.tint(255,72+audio.rms*110+interaction.pressure*100);g.image(glow,-g.width*.05,-g.height*.04,g.width*1.1,g.height*1.08);g.noTint();g.blendMode(BLEND);g.pop();}

  drawPhotoFeedbackSource(g,pool,interaction,audio,t){const img=this.imageAt(pool,t*19+2);if(!img)return;this.drawSource(g,img,235,t*167+2,interaction,audio,1.35);const b=this.imageAt(pool,t*37+13);if(b&&t%2===0){g.push();g.blendMode(t%4===0?DIFFERENCE:SCREEN);this.drawSource(g,b,38+audio.rms*70+interaction.pressure*110,t*173+13,interaction,audio,1.25);g.blendMode(BLEND);g.pop();}}

  drawMosaic(g,pool,analysis,audio,interaction,variant,t){const img=this.imageAt(pool,t*11+5);if(!img)return;const cols=P5LabUtils.isMobileLayout()?this.config.mosaicColsMobile:this.config.mosaicColsDesktop,cell=g.width/cols,rows=Math.ceil(g.height/cell),s=this.mosaicSample;s.clear();this.drawSource(s,img,255,t*179+5,interaction,audio,1.15);s.loadPixels();g.background(variant==='mono'||variant==='dither'?238:0);g.noStroke();const pulse=.72+audio.rms*.72+.18*Math.sin(millis()*.006+audio.bass*8);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const idx=4*(y*s.width+x),r=s.pixels[idx]||0,gg=s.pixels[idx+1]||0,b=s.pixels[idx+2]||0,l=(r+gg+b)/(255*3);let sc;if(variant==='inverse')sc=.12+(1-l)*1.05;else if(variant==='dither')sc=l>((x+y*3)%5)/5?.94:.12;else if(variant==='pulse')sc=(.14+l*.92)*pulse;else sc=.14+l*1.02;sc=P5LabUtils.clamp(sc+interaction.pressure*.18,.05,1.35);const sz=cell*sc,j=(noise(x*.14,y*.14,frameCount*.008)-.5)*cell*(analysis.motionSmooth+audio.treble*.4);if(variant==='mono'||variant==='dither')g.fill(l>.48?12:28,235);else g.fill(r,gg,b,235);g.rect(x*cell+(cell-sz)/2+j,y*cell+(cell-sz)/2,sz,sz);}}

  applyPhotoFeedback(current,audio,interaction){const prev=this.feedback,next=this.feedbackScratch,press=interaction.pressure||0,scale=this.config.feedbackScale+press*.002-audio.rms*.0015,w=next.width*scale,h=next.height*scale,x=(next.width-w)*(.5+(interaction.x-.5)*(.28+press*.25)),y=(next.height-h)*(.5+(interaction.y-.5)*(.28+press*.25));next.push();next.clear();next.background(0,Math.max(1,4+audio.bass*6-press*2));next.tint(255,Math.min(225,this.config.feedbackAlpha+press*48));next.image(prev,x,y,w,h);next.noTint();next.blendMode(press>.08?DIFFERENCE:SCREEN);next.tint(255,92+audio.rms*65+press*62);next.image(current,0,0,next.width,next.height);next.noTint();next.blendMode(BLEND);next.pop();this.feedback=next;this.feedbackScratch=prev;}

  applyTouchRupture(g,interaction,audio,t){const press=P5LabUtils.clamp(interaction.pressure||0,0,1),r=this.ruptureBuffer;r.clear();r.image(g,0,0);try{r.filter(GRAY);const th=P5LabUtils.map01(interaction.x,this.config.touchRuptureThresholdMin,this.config.touchRuptureThresholdMax);r.filter(THRESHOLD,th);}catch(_){}g.clear();g.image(r,0,0);const bands=this.config.touchRuptureBands+Math.floor(press*9),bh=g.height/bands;for(let i=0;i<bands;i++){if((i+t)%2)continue;const y=i*bh,shift=(this.rand01(t*211+i*17)-.5)*g.width*(.08+press*.24);g.copy(r,0,y,r.width,bh,shift,y,g.width,bh);}g.push();g.blendMode(DIFFERENCE);g.stroke(255,55+press*150);g.strokeWeight(1);const lines=14+Math.floor(press*24);for(let i=0;i<lines;i++){const y=this.rand01(t*223+i*31)*g.height;g.line(0,y,g.width,y+(this.rand01(t*227+i*43)-.5)*10);}g.blendMode(BLEND);g.pop();}

  drawVignette(interaction,audio,preset){const ctx=drawingContext,cx=width*(.5+(interaction.x-.5)*.1),cy=height*(.48+(interaction.y-.5)*.07),inner=Math.min(width,height)*(.16+audio.rms*.04),outer=Math.max(width,height)*.7,strength=P5LabUtils.clamp(this.config.vignetteStrength+interaction.pressure*.14+(preset.feedback?.06:0),0,.78),grad=ctx.createRadialGradient(cx,cy,inner,cx,cy,outer);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(.62,`rgba(0,0,0,${strength*.18})`);grad.addColorStop(1,`rgba(0,0,0,${strength})`);ctx.save();ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);ctx.restore();}

  drawWaveformOverlay(audio,interaction){const wave=audio.waveform;if(!wave||wave.length<2)return;push();noFill();stroke(255,75+audio.rms*150);strokeWeight(.8+interaction.pressure*1.3);beginShape();const center=height*(.80-interaction.y*.15),amp=height*(.022+audio.rms*.12);for(let i=0;i<wave.length;i++)vertex(i/(wave.length-1)*width,center+wave[i]*amp);endShape();pop();}

  snapshot(){const p=this.currentPreset();const fx=[p.photoFeedback&&'PHOTO_FDBK',p.photoRapidCrop&&'CROP',p.photoRgbTear&&'RGB_TEAR',p.photoHalation&&'HALATION',p.photoShardSwap&&'SHARD',p.photoDoubleBlend&&'DOUBLE',p.photoBlendCycle&&'BLEND',p.photoCrush&&'CRUSH',p.photoFull&&'PHOTO',p.mosaic&&`MOSAIC_${String(p.mosaic).toUpperCase()}`,'SRC_CROP','WAVE','VIGNETTE'].filter(Boolean).join('+');return{modeName:p.name,modeIndex:this.modeIndex,particleCount:0,activeFx:fx};}
}
window.P5LabVisualEngine=P5LabVisualEngine;
