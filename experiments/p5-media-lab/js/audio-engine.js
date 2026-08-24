/** P5 MEDIA LAB 01 — AUDIO ENGINE
 * v0.2.0 keeps output deliberately primitive: one DOM HTMLAudioElement directly
 * to the device. No p5.sound/WebAudio routing is involved. If Chrome rejects the
 * first play request, every later artwork tap is allowed to retry play() inside
 * that fresh user gesture.
 */
class P5LabAudioEngine {
  constructor(assetPath,config,telemetry){this.assetPath=assetPath;this.config=config;this.telemetry=telemetry;this.nativeAudio=null;this.started=false;this.fileLoaded=false;this.playState='IDLE';this.contextState='DIRECT';this.lastReportedState='';this.data={rms:0,bass:0,mid:0,treble:0,filterHz:config.minFilterHz,delayTime:0,delayFeedback:0,distortion:0,rate:1,pan:0,waveform:[]};}
  async setup(){
    if(!this.config.enabled||!this.assetPath)return;
    const a=document.createElement('audio');a.src=this.assetPath;a.preload='auto';a.loop=true;a.controls=false;a.setAttribute('playsinline','');a.setAttribute('webkit-playsinline','');a.volume=P5LabUtils.clamp(this.config.masterVolume,0,1);a.style.position='fixed';a.style.width='1px';a.style.height='1px';a.style.opacity='0';a.style.pointerEvents='none';document.body.appendChild(a);this.nativeAudio=a;
    this.telemetry.event(`AUDIO DIRECT LOAD ${P5LabUtils.basename(this.assetPath)}`);
    a.addEventListener('loadedmetadata',()=>{this.fileLoaded=true;if(!this.started)this.playState='READY';this.telemetry.event('AUDIO METADATA');});
    a.addEventListener('canplay',()=>{this.fileLoaded=true;this.telemetry.event('AUDIO CANPLAY');});
    a.addEventListener('playing',()=>{this.playState='PLAYING';this.telemetry.event('AUDIO PLAYING');});
    a.addEventListener('pause',()=>{if(this.started&&!a.ended)this.playState='PAUSED';});
    a.addEventListener('waiting',()=>this.playState='BUFFERING');
    a.addEventListener('stalled',()=>this.playState='STALLED');
    a.addEventListener('error',()=>{const c=a.error?a.error.code:0;this.playState=`ERROR_${c||'UNKNOWN'}`;this.telemetry.event(`AUDIO ERROR ${c||'?'}`);});
    try{a.load();}catch(_){}
  }
  start(){this.started=true;return this.requestPlay('START');}
  retryFromGesture(){if(!this.started||!this.nativeAudio||!this.nativeAudio.paused)return;this.requestPlay('GESTURE_RETRY');}
  requestPlay(reason){
    if(!this.config.enabled||!this.nativeAudio)return Promise.resolve();
    try{const a=this.nativeAudio;a.muted=false;a.defaultMuted=false;a.volume=P5LabUtils.clamp(this.config.masterVolume,0,1);const p=a.play();this.playState='PLAY_REQUESTED';this.telemetry.event(`AUDIO PLAY REQUEST ${reason}`);if(p&&typeof p.then==='function'){p.then(()=>{this.playState='PLAYING';this.telemetry.event(`AUDIO PLAY OK ${reason}`);}).catch(e=>{this.playState='PLAY_BLOCKED';this.telemetry.event(`AUDIO BLOCKED ${reason} ${e&&e.name?e.name:'ERROR'}`);});return p;}}catch(e){this.playState='PLAY_ERROR';this.telemetry.event(`AUDIO PLAY ERROR ${e.message||'UNKNOWN'}`);}return Promise.resolve();
  }
  update(analysis,interaction){
    if(!this.config.enabled)return this.data;const local=analysis.localLuma||0,motion=analysis.motionSmooth||0,press=interaction.pressure||0,filterHz=P5LabUtils.map01(Math.pow(local,.7),this.config.minFilterHz,this.config.maxFilterHz),delayTime=P5LabUtils.map01(interaction.x,.025,this.config.maxDelayTime),delayFeedback=P5LabUtils.clamp(motion*this.config.maxDelayFeedback+press*.08,0,this.config.maxDelayFeedback),distortion=P5LabUtils.clamp((1-interaction.y)*this.config.maxDistortion*(.35+motion),0,this.config.maxDistortion),rate=P5LabUtils.map01(interaction.y,this.config.minRate,this.config.maxRate),pan=interaction.x*2-1;
    if(this.nativeAudio){try{this.nativeAudio.playbackRate=rate;}catch(_){}try{this.nativeAudio.volume=P5LabUtils.clamp(this.config.masterVolume,0,1);}catch(_){}if(!this.nativeAudio.paused&&this.nativeAudio.readyState>=2)this.playState='PLAYING';}
    if(this.playState!==this.lastReportedState){this.lastReportedState=this.playState;this.telemetry.event(`AUDIO STATE ${this.playState}`);}
    this.data={rms:0,bass:0,mid:0,treble:0,filterHz,delayTime,delayFeedback,distortion,rate,pan,waveform:[]};return this.data;
  }
  snapshot(){return{...this.data,state:this.playState,contextState:this.contextState,fileLoaded:this.fileLoaded,safeDryOutput:true,nativePaused:this.nativeAudio?this.nativeAudio.paused:null,nativeReadyState:this.nativeAudio?this.nativeAudio.readyState:null};}
}
window.P5LabAudioEngine=P5LabAudioEngine;
