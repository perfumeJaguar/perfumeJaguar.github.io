/** DODREI — MEMORY RECALL v1.0.27
 * 1s hold captures one archive entry + its resident p5.Image reference.
 * Visual presentation is now rendered by visual-engine-v1027 inside the p5
 * pipeline so thumbnail/text can receive the current POST FX chain. The DOM node
 * is retained only as an aria-live text mirror and is never made visually active.
 */
(()=>{
  const HOLD_MS=1000;
  const fragments=[
    "I remember the light more clearly than the room.",
    "We stayed there longer than I remember.",
    "Someone was laughing just outside the frame.",
    "I thought I would remember this forever.",
    "The air was colder than it looks.",
    "There was a smell I cannot name anymore.",
    "I don't remember why we went there.",
    "For a while, this was an ordinary day.",
    "I remember waiting. I don't remember for what.",
    "Maybe this happened differently.",
    "Nothing important happened here. I think.",
    "The sound of that evening is gone.",
    "We had already begun to forget it.",
    "I can still place the silence.",
    "There should have been someone beside me.",
    "This part returns without a beginning.",
    "I remember the weather, but not the conversation.",
    "It felt permanent then.",
    "I had forgotten this existed.",
    "Somewhere after this, the memory breaks.",
    "The color is probably wrong now.",
    "I remember leaving before I remember arriving.",
    "There was music from another room.",
    "For years I remembered only this corner."
  ];

  let timer=null;
  let heldKey=null;
  let heldImage=null;
  let state={active:false,key:null,path:null,archiveIndex:-1,id:null,text:null,img:null};

  const el=()=>document.getElementById('memory-recall');

  function hash(s){
    let h=2166136261;
    for(let i=0;i<s.length;i++){
      h^=s.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  }

  function entry(){
    if(typeof mediaManager==='undefined'||!mediaManager||!mediaManager.archiveEntries||!mediaManager.archiveEntries.length)return null;
    const idx=Number(mediaManager.currentImageIndex);
    return mediaManager.archiveEntries[idx]||null;
  }

  function residentImageFor(e){
    if(!e||typeof mediaManager==='undefined'||!mediaManager)return null;
    if(mediaManager.currentImageIndex===e.archiveIndex&&mediaManager.currentImage)return mediaManager.currentImage;
    const resident=Array.isArray(mediaManager.activeEntries)
      ? mediaManager.activeEntries.find(x=>x&&x.key===e.key&&x.img)
      : null;
    return resident?.img||null;
  }

  function textFor(e){
    const h=hash(e.key||e.path||String(e.archiveIndex));
    const text=fragments[h%fragments.length];
    const id=String((e.archiveIndex||0)+1).padStart(3,'0');
    return {id,text};
  }

  function mirrorAria(m){
    const node=el();
    if(!node)return;
    node.classList.remove('is-visible');
    const idNode=node.querySelector('.memory-recall-id');
    const textNode=node.querySelector('.memory-recall-text');
    if(idNode)idNode.textContent=`MEMORY ${m.id}`;
    if(textNode)textNode.textContent=m.text;
  }

  function show(target,imgRef){
    if(!target||!imgRef)return;
    const m=textFor(target);
    state={
      active:true,
      key:target.key,
      path:target.path,
      archiveIndex:target.archiveIndex,
      id:m.id,
      text:m.text,
      img:imgRef,
    };
    mirrorAria(m);
  }

  function begin(){
    if(typeof appStarted==='undefined'||!appStarted||window.DODREI_RUNTIME_PAUSED)return;
    const e=entry();
    if(!e)return;

    heldKey=e.key;
    heldImage=residentImageFor(e);
    clearTimeout(timer);
    timer=setTimeout(()=>{
      if(!heldKey||typeof mediaManager==='undefined'||!mediaManager)return;
      const target=mediaManager.archiveEntries.find(x=>x.key===heldKey);
      if(!target)return;
      const imgRef=heldImage||residentImageFor(target);
      if(!imgRef)return;
      show(target,imgRef);
    },HOLD_MS);
  }

  function end(){
    clearTimeout(timer);
    timer=null;
    heldKey=null;
    heldImage=null;
    state={active:false,key:null,path:null,archiveIndex:-1,id:null,text:null,img:null};
    const node=el();
    if(node)node.classList.remove('is-visible');
  }

  window.DODREI_MEMORY_RECALL={
    begin,
    end,
    getState:()=>state,
  };

  document.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(e.target&&e.target.closest&&e.target.closest('button,#start-screen'))return;
    begin();
  },{passive:true});
  document.addEventListener('pointerup',end,{passive:true});
  document.addEventListener('pointercancel',end,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)end();});
})();
