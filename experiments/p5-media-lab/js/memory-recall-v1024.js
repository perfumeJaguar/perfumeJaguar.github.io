/** DODREI — MEMORY RECALL PROTOTYPE v1.0.24
 * Deterministically maps every archive image to a placeholder memory fragment.
 * Holding the image for 2s reveals the fragment; release lets it fade away.
 */
(()=>{
  const HOLD_MS=2000;
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
  let timer=null,heldKey=null,heldIndex=-1,visible=false;
  const el=()=>document.getElementById("memory-recall");
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function manager(){return typeof mediaManager!=="undefined"?mediaManager:null;}
  function entry(){
    const mm=manager();
    if(!mm||!Array.isArray(mm.archiveEntries)||!mm.archiveEntries.length)return null;
    const idx=Number(mm.currentImageIndex);
    return mm.archiveEntries[idx]||null;
  }
  function textFor(e){
    const h=hash(e.key||e.path||String(e.archiveIndex));
    const text=fragments[h%fragments.length];
    const id=String((e.archiveIndex||0)+1).padStart(3,"0");
    return{id,text};
  }
  function begin(){
    if(typeof appStarted==="undefined"||!appStarted||window.DODREI_RUNTIME_PAUSED)return;
    const e=entry();if(!e)return;
    heldKey=e.key;heldIndex=e.archiveIndex;
    clearTimeout(timer);
    timer=setTimeout(()=>{
      const mm=manager();
      if(!heldKey||!mm)return;
      const target=mm.archiveEntries.find(x=>x.key===heldKey);if(!target)return;
      const m=textFor(target),node=el();if(!node)return;
      node.querySelector(".memory-recall-id").textContent=`MEMORY ${m.id}`;
      node.querySelector(".memory-recall-text").textContent=m.text;
      node.classList.add("is-visible");visible=true;
    },HOLD_MS);
  }
  function end(){
    clearTimeout(timer);timer=null;heldKey=null;heldIndex=-1;
    if(visible){const node=el();if(node)node.classList.remove("is-visible");visible=false;}
  }
  window.DODREI_MEMORY_RECALL={begin,end};
  document.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse"&&e.button!==0)return;
    if(e.target&&e.target.closest&&e.target.closest("button,#start-screen"))return;
    begin();
  },{passive:true});
  document.addEventListener("pointerup",end,{passive:true});
  document.addEventListener("pointercancel",end,{passive:true});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)end();});
})();
