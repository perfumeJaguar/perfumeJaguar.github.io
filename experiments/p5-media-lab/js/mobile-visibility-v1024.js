/** DODREI — MOBILE VISIBILITY v1.0.24
 * Mobile only: pause visual/audio when the document is hidden and resume only
 * when this module itself caused the pause. A user-initiated PAU state remains paused.
 */
(()=>{
  const ua=String(navigator.userAgent||"");
  const touchPoints=Number(navigator.maxTouchPoints)||0;
  const mobileUa=/Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const ipadDesktopUa=/Macintosh/i.test(ua)&&touchPoints>1;
  const mobile=mobileUa||ipadDesktopUa;
  if(!mobile)return;

  let autoPaused=false;
  const sync=()=>{
    if(document.hidden){
      if(window.DODREI_RUNTIME_PAUSED){autoPaused=false;return;}
      if(typeof window.DODREI_SET_PAUSED==="function"){
        window.DODREI_SET_PAUSED(true);
        autoPaused=true;
      }
      return;
    }
    if(autoPaused){
      autoPaused=false;
      if(typeof window.DODREI_SET_PAUSED==="function"&&window.DODREI_RUNTIME_PAUSED){
        window.DODREI_SET_PAUSED(false);
      }
    }
  };
  document.addEventListener("visibilitychange",sync);
})();
