/** DODREI — MEMORY RECALL v1.0.26
 * 1s hold captures one archive entry + its resident p5.Image reference.
 * When activated, the visual engine reads this state and locks PRE-FX composition
 * to that single still image until pointer/touch release. The DOM layer remains
 * only a transparent thumbnail + text overlay.
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
  let visible=false;
  let showToken=0;
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

  function show(target,imgRef){
    const node=el();
    if(!node||!target||!imgRef)return;

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

    const frame=node.querySelector('.memory-recall-frame');
    const img=node.querySelector('.memory-recall-thumb');
    node.querySelector('.memory-recall-id').textContent=`MEMORY ${m.id}`;
    node.querySelector('.memory-recall-text').textContent=m.text;

    if(frame)frame.classList.remove('is-loaded');
    if(img){
      const token=++showToken;
      img.alt=`Memory ${m.id}`;
      img.onload=()=>{if(token===showToken&&frame)frame.classList.add('is-loaded');};
      img.onerror=()=>{if(token===showToken&&frame)frame.classList.remove('is-loaded');};
      img.src=target.path;
      if(img.complete&&img.naturalWidth>0&&frame)frame.classList.add('is-loaded');
    }

    node.classList.add('is-visible');
    visible=true;
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
    showToken+=1;
    state={active:false,key:null,path:null,archiveIndex:-1,id:null,text:null,img:null};
    if(visible){
      const node=el();
      if(node)node.classList.remove('is-visible');
      visible=false;
    }
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
