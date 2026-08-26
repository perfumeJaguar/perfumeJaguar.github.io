/** DODREI — VISUAL ENGINE v1.0.22
 * ST now behaves like subtle film/projection light instability:
 * - no positional jitter and no scratch-buffer copy;
 * - mostly 0–2.2% dimming held in short, irregular plateaus;
 * - rare brief 4.5–7.5% light dips;
 * - implemented as a single translucent black overlay for negligible cost.
 */
class DodreiVisualEngineV1022 extends DodreiVisualEngineV1021 {
  constructor(config,telemetry){
    super(config,telemetry);
    this._stUntil=0;
    this._stDim=0;
    this._stSerial=0;
  }

  _instability(out){
    const now=millis();
    if(now>=this._stUntil){
      const serial=++this._stSerial;
      const r=this.rand01(serial*71+Math.floor(now/173));

      // Most of the time the projector is almost stable. A small plateau is
      // held rather than re-randomized every frame so it reads as light drift,
      // not digital noise.
      if(r>0.94){
        this._stDim=0.045+this.rand01(serial*83)*0.030;
        this._stUntil=now+70+this.rand01(serial*89)*170;
      }else{
        this._stDim=this.rand01(serial*97)*0.022;
        this._stUntil=now+140+this.rand01(serial*101)*520;
      }
    }

    if(this._stDim<=0.001)return;
    out.push();
    out.noStroke();
    out.fill(0,255*this._stDim);
    out.rect(0,0,out.width,out.height);
    out.pop();
  }

  snapshot(){
    const s=super.snapshot();
    s.engineVersion="1.0.22";
    s.instabilityStyle="FILM_LIGHT_DIM";
    return s;
  }
}
window.P5LAB_VISUAL_ENGINE_CLASS=DodreiVisualEngineV1022;
window.P5LAB_VISUAL_ENGINE_VERSION="1.0.22";
