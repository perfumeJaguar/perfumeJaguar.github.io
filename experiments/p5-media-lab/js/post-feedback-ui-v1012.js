/** DODREI — GLOBAL FEEDBACK POST FX CONTROL v1.0.12 */
window.addEventListener("DOMContentLoaded",()=>{
  const button=document.getElementById("post-fx-feedback-button");
  const master=document.getElementById("post-fx-master-button");
  const config=window.DODREI_CONFIG||window.P5LAB_CONFIG||{};
  const postFx=config.visual?.postCommonFx||(config.visual.postCommonFx={});
  if(!button)return;
  const refresh=()=>{
    const enabled=!!postFx.feedback;
    const locked=postFx.masterEnabled===false;
    button.textContent="FB";
    button.setAttribute("aria-pressed",enabled?"true":"false");
    button.setAttribute("aria-label",`Post common FX Feedback: ${enabled?"on":"off"}. Click to toggle.`);
    button.title=`Feedback: ${enabled?"ON":"OFF"}`;
    button.disabled=locked;
    button.setAttribute("aria-disabled",locked?"true":"false");
  };
  button.addEventListener("pointerdown",e=>e.stopPropagation());
  button.addEventListener("click",e=>{
    e.preventDefault();e.stopPropagation();
    if(postFx.masterEnabled===false)return;
    const next=!postFx.feedback;
    const engine=window.DODREI_VISUAL_ENGINE;
    if(engine&&typeof engine.setPostCommonFx==="function")engine.setPostCommonFx("feedback",next);
    else{
      postFx.feedback=next;
      const order=Array.isArray(postFx.order)?postFx.order.filter(k=>k!=="feedback"):[];
      if(next)order.push("feedback");postFx.order=order;
    }
    refresh();
  });
  if(master)master.addEventListener("click",()=>setTimeout(refresh,0));
  refresh();
});
