(function(){
  var pv=window.PAGEVER;
  if(!pv)return;
  var css=document.createElement("style");
  css.textContent=".rw-ban{position:sticky;top:0;z-index:99;background:#f5b301;color:#111;padding:10px;text-align:center;font-weight:700}.rw-ban button{margin-left:8px;padding:6px 12px;border-radius:8px;border:0;background:#111;color:#fff}";
  document.head.appendChild(css);
  fetch("version.txt?"+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.text():""}).then(function(v){
    v=(v||"").trim();
    if(v&&v!==pv){
      var b=document.createElement("div");
      b.className="rw-ban";
      b.innerHTML="有新版本 ✨ <button>點我更新</button>";
      b.querySelector("button").onclick=function(){location.replace(location.pathname+"?v="+v)};
      document.body.prepend(b);
    }
  }).catch(function(){});
})();
