/** DODREI — VISUAL ENGINE v1.0.11
 * Adds a restrained recursive afterimage only to PHOTO_DOUBLE_BLEND.
 * The inherited feedback buffer is reused, so no additional full-size buffer is allocated.
 */
class DodreiVisualEngineV1011 extends DodreiVisualEngineV1007 {
  render(source,currentImage,imagePool,analysis,audio,interaction){
    const preset=this.currentPreset();
    const isDouble=!!preset?.photoDoubleBlend;
    const oldFeedback=preset?.feedback;
    if(isDouble) preset.feedback=true;
    super.render(source,currentImage,imagePool,analysis,audio,interaction);
    if(isDouble) preset.feedback=oldFeedback;
  }

  applyPhotoFeedback(current,audio,interaction){
    const preset=this.currentPreset();
    if(!preset?.photoDoubleBlend) return super.applyPhotoFeedback(current,audio,interaction);

    const prev=this.feedback;
    const next=this.feedbackScratch;
    const ratio=typeof this._frameRatio==="function"?this._frameRatio():1;
    const scale=typeof this._timeScale==="function"?this._timeScale(0.9975,ratio):0.9975;
    const retain=typeof this._timeRetainAlpha==="function"?this._timeRetainAlpha(46,ratio):46;
    const w=next.width*scale,h=next.height*scale;
    const x=(next.width-w)*0.5,y=(next.height-h)*0.5;

    next.push();next.clear();
    next.tint(255,retain);next.image(prev,x,y,w,h);next.noTint();
    next.blendMode(SCREEN);next.tint(255,222);next.image(current,0,0,next.width,next.height);next.noTint();next.blendMode(BLEND);next.pop();
    this.feedback=next;this.feedbackScratch=prev;
  }

  snapshot(){const s=super.snapshot();s.engineVersion="1.0.11";return s;}
}
window.P5LAB_VISUAL_ENGINE_CLASS=DodreiVisualEngineV1011;
window.P5LAB_VISUAL_ENGINE_VERSION="1.0.11";
