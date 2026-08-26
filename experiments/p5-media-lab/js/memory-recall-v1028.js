/** DODREI — MEMORY RECALL v1.0.28
 * 1s hold captures one archive entry + its resident p5.Image reference.
 * v1.0.28 keeps the visual lock/state bridge, removes thumbnail presentation,
 * adds activation timing for canvas text fade-in, and broadens the deterministic
 * fragment pool toward mundane notes, numbers, interrupted records and neutral
 * technical scraps instead of uniformly literary memory sentences.
 */
(()=>{
  const HOLD_MS=1000;
  const fragments=[
    "I remember the light more clearly than the room.",
    "bought dish soap. forgot salt.",
    "192.0.2.44:441",
    "blue folder, second drawer",
    "train 6:18 maybe 6:21",
    "keep this one",
    "the small towel was still damp",
    "03 / 17 / 17 / 42",
    "ask J about the cable",
    "window left open",
    "198.51.100.27:8080",
    "coffee filters / batteries",
    "don't use the front entrance",
    "00:14 / track B / too slow",
    "there were two receipts",
    "left shoe still wet",
    "10.0.3.7:22",
    "maybe Thursday",
    "same corner, different year",
    "call ended / no answer /",
    "three keys, one missing",
    "room tone too loud",
    "save as copy_03",
    "the bus was almost empty",
    "18 04 77 02",
    "one more take then—",
    "the cup was already chipped",
    "port 5931 open?",
    "milk / envelopes / tape",
    "I don't remember writing this.",
    "back door sticks when it rains",
    "203.0.113.8:5931",
    "someone moved the chair",
    "leave enough for tomorrow",
    "4:31 / battery 12%",
    "the plastic bag under the sink",
    "not before noon",
    "receipt in coat pocket",
    "172.16.0.12:443",
    "there was music upstairs",
    "need the smaller adapter",
    "12, 19, 31, 31",
    "turn off hallway light",
    "the color was different",
    "called M about the—",
    "03:18 / west stairwell /",
    "box marked winter",
    "send later",
    "we waited by the vending machine",
    "7.4 / 7.4 / 6.9",
    "bring the black cable, not the long one",
    "same thing as last time, except",
    "the air conditioner was too loud",
    "192.168.1.34:3000",
    "check room tone again",
    "left it on the third shelf",
    "if the weather stays like this we can",
    "0917 0428 11",
    "don't erase",
    "the glass was already empty",
    "2B / shelf 4 / behind the",
    "I think we came back the same way.",
    "Friday, or the day before.",
    "17:52 / 004 / 31%"
  ];

  let timer=null;
  let heldKey=null;
  let heldImage=null;
  let state={active:false,key:null,path:null,archiveIndex:-1,id:null,text:null,img:null,activatedAt:0};

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
      activatedAt:performance.now(),
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
    state={active:false,key:null,path:null,archiveIndex:-1,id:null,text:null,img:null,activatedAt:0};
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
