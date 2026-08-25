/**
 * P5 MEDIA LAB 01 — VISUAL ENGINE v0.7.0
 * ------------------------------------------------------------
 * Crop-space revision on top of v0.6.8.
 *
 * The crop zoom remains an artistic fixed range from config. What changes here
 * is position: the random crop can now travel across the complete overflow made
 * by BOTH object-fit:cover and the extra crop zoom. A portrait source on a wide
 * display can therefore reveal its formerly hidden top/bottom regions over time.
 */
class P5LabVisualEngineV070 extends P5LabVisualEngineV068 {
  adaptiveCropFor(g,img,seed,interaction,audio,intensity=1){
    const base=super.cropFor(seed,interaction,audio,intensity);
    const minZoom=Math.max(1,Number(this.config.sourceCropMinZoom)||1);
    const maxZoom=Math.max(minZoom,Number(this.config.sourceCropMaxZoom)||minZoom);
    const zoom=P5LabUtils.clamp(base.zoom,minZoom,maxZoom);
    const size=P5LabUtils.sourceSize(img);
    if(!size.width||!size.height||!g||!g.width||!g.height)return {zoom,ox:0,oy:0};

    const coverScale=Math.max(g.width/size.width,g.height/size.height);
    const dw=size.width*coverScale*zoom;
    const dh=size.height*coverScale*zoom;
    const overflowX=Math.max(0,dw-g.width);
    const overflowY=Math.max(0,dh-g.height);
    const panFraction=P5LabUtils.clamp(Number(this.config.sourceCropOverflowPan)||1,0,1);

    // drawCover() starts from a centered cover. Offsets of +/- overflow/2 move
    // that cover all the way to either legal edge without exposing letterbox.
    const rx=(this.rand01(seed*43+17)-.5)*overflowX*panFraction;
    const ry=(this.rand01(seed*47+29)-.5)*overflowY*panFraction;

    // Preserve a modest touch-directed bias, but clamp it inside the legal
    // overflow so touch can never reveal an empty canvas edge.
    const press=interaction.pressure||0;
    const touchX=(interaction.x-.5)*overflowX*press*.28;
    const touchY=(interaction.y-.5)*overflowY*press*.28;
    const maxX=overflowX*.5;
    const maxY=overflowY*.5;

    return {
      zoom,
      ox:P5LabUtils.clamp(rx+touchX,-maxX,maxX),
      oy:P5LabUtils.clamp(ry+touchY,-maxY,maxY),
    };
  }

  drawSource(g,img,alpha,seed,interaction,audio,intensity=1,tint=null){
    if(!img)return;
    const c=this.adaptiveCropFor(g,img,seed,interaction,audio,intensity);
    P5LabUtils.drawCover(g,img,alpha,c.zoom,c.ox,c.oy,tint);
  }

  // RGB tear needs one shared crop for all three channels, so it cannot simply
  // call drawSource() three times with independent crop positions.
  drawPhotoRgbTear(g,pool,i,a,t){
    const img=this.imageAt(pool,t*7+3);
    if(!img)return;
    const c=this.adaptiveCropFor(g,img,t*139+3,i,a,1.08);
    const d=this.config.rgbTearMaxPx*(.3+i.pressure*1.9+a.treble);
    P5LabUtils.drawCover(g,img,145,c.zoom,c.ox,c.oy);
    g.push();
    g.blendMode(ADD);
    P5LabUtils.drawCover(g,img,115,c.zoom,c.ox-d,c.oy,[255,35,35]);
    P5LabUtils.drawCover(g,img,95,c.zoom,c.ox+d*.25,c.oy+d*.12,[35,255,95]);
    P5LabUtils.drawCover(g,img,115,c.zoom,c.ox+d,c.oy-d*.14,[45,90,255]);
    g.blendMode(BLEND);
    g.pop();
  }

  snapshot(){
    const s=super.snapshot();
    s.engineVersion='0.7.0';
    return s;
  }
}

window.P5LAB_VISUAL_ENGINE_CLASS=P5LabVisualEngineV070;
window.P5LAB_VISUAL_ENGINE_VERSION='0.7.0';
