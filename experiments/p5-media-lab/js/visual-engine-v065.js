/** P5 MEDIA LAB 01 — VISUAL ENGINE v0.6.5
 * Fix: preset feedback must happen BEFORE touch rupture.
 * v0.6.4 recolored inside applyTouchRupture(), but render() then ran PHOTO_FEEDBACK
 * on top of that result. A stationary press could therefore show old gray feedback
 * instead of the intended red palette. v0.6.5 makes rupture the final stationary
 * touch pass. Swipe feedback still comes afterwards intentionally, because it is
 * the gesture-driven feedback requested for fast dragging.
 */
class P5LabVisualEngineV065 extends P5LabVisualEngineV064 {
  render(_source,currentImage,imagePool,analysis,audio,interaction){
    this.updateMode();
    const p=this.currentPreset(),g=this.buffer;
    const pool=imagePool&&imagePool.length?imagePool:(currentImage?[currentImage]:[]);
    const t=this.tick(this.config.photoCutMs,interaction);

    g.push();g.background(0);
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

    let stage=this.applyCommonCrush(g,pool,interaction,audio,t);

    // Preset feedback belongs to the ordinary image construction pipeline.
    // It must NOT be allowed to wash out the touch palette.
    if(p.feedback){this.applyPhotoFeedback(stage,audio,interaction);stage=this.feedback;}

    // Stationary touch ends here: this is now the final palette operation.
    if((interaction.pressure||0)>.035)stage=this.applyTouchRupture(stage,interaction,audio,t);

    // Only an actual fast swipe may recursively process the already-ruptured image.
    const swipe=interaction.swipeSpeed||0,threshold=this.config.swipeFeedbackThreshold;
    if(interaction.pressed&&swipe>threshold){this.applySwipeFeedback(stage,interaction,audio);stage=this.swipeFeedback;}
    else{this.swipeFeedback.clear();this.swipeScratch.clear();}

    background(P5LAB_CONFIG.render.background);
    P5LabUtils.drawCover(null,stage,255);
    this.drawVignette(interaction,audio,p);
    this.drawWaveformOverlay(audio,interaction);
  }
}
window.P5LabVisualEngine=P5LabVisualEngineV065;
