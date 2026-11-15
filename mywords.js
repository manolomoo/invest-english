/* 我的單字（投資最重要的事｜學英文）
   在課文裡長按／雙擊單字，或拖選片語 → 彈窗 → 加入我的單字。單擊句子仍是播放整句。
   localStorage 鍵：invMyWords1（只讀寫這一個；不碰 invRPG1／invRW1／invAssetsOpen）。
   每筆：{w 詞或片語, zh 中文意思, s 出處英文句, l 課 id（lesson01）, n 課號, t 加入時間(ms)}。
   中文意思離線自動填入：本課 WEEK.cards → dict/en-zh.json（ECDICT, MIT License）→ 都沒有就讓使用者自己打。
   首頁：MW.home(el) 渲染列表區塊；單元頁：MW.bindSn(box, playFn) 綁課文句，#mwo 按鈕開面板。 */
(function(){
const K="invMyWords1",VER=String(window.PAGEVER||"6");
let MEM=null;
const load=()=>{try{const v=localStorage.getItem(K);if(v){const a=JSON.parse(v);if(Array.isArray(a))return a.filter(x=>x&&typeof x.w==="string")}}catch(e){}return MEM||[]};
const save=a=>{MEM=a;try{localStorage.setItem(K,JSON.stringify(a))}catch(e){}};
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const nkey=s=>String(s).toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g," ").trim();
const plain=s=>String(s).replace(/\s+/g," ").trim();
const LTR=/[\p{L}\p{N}]/u,HASL=/\p{L}/u;
const sorted=()=>load().slice().sort((a,b)=>(b.t||0)-(a.t||0));
const find=w=>{const k=nkey(w);return load().find(x=>nkey(x.w)===k)};
function add(it){const a=load(),k=nkey(it.w),i=a.findIndex(x=>nkey(x.w)===k);if(i>=0)a[i]=it;else a.push(it);save(a);refresh()}
function del(w){const k=nkey(w);save(load().filter(x=>nkey(x.w)!==k));refresh()}

/* ===== 離線詞典 ===== */
let dictP=null;
function dict(){if(!dictP)dictP=fetch("dict/en-zh.json?v="+VER).then(r=>r.ok?r.json():Promise.reject()).catch(()=>{dictP=null;return {}});return dictP}
function cands(w){w=nkey(w);const o=[w],b=w.replace(/'s$/,""),p=x=>{if(x&&x.length>1&&o.indexOf(x)<0)o.push(x)};
 p(b);
 if(/ies$/.test(b))p(b.slice(0,-3)+"y");if(/ied$/.test(b))p(b.slice(0,-3)+"y");
 if(/es$/.test(b))p(b.slice(0,-2));if(/s$/.test(b))p(b.slice(0,-1));
 if(/ed$/.test(b)){p(b.slice(0,-2));p(b.slice(0,-1));if(/(.)\1ed$/.test(b))p(b.slice(0,-3))}
 if(/ing$/.test(b)){p(b.slice(0,-3));p(b.slice(0,-3)+"e");if(/(.)\1ing$/.test(b))p(b.slice(0,-4))}
 if(/ier$/.test(b))p(b.slice(0,-3)+"y");if(/er$/.test(b)){p(b.slice(0,-2));p(b.slice(0,-1))}
 if(/iest$/.test(b))p(b.slice(0,-4)+"y");if(/est$/.test(b)){p(b.slice(0,-3));p(b.slice(0,-2))}
 if(/ly$/.test(b))p(b.slice(0,-2));
 return o}
/* → Promise<{zh,src:"card"|"dict"|""}> */
async function lookup(text){
 const cs=cands(text),single=!/\s/.test(text.trim()),W=window.WEEK;
 if(W&&W.cards)for(const c of (single?cs:[cs[0]])){const h=W.cards.find(x=>nkey(x.w)===c);if(h&&h.zh)return{zh:h.zh,src:"card"}}
 const d=await dict();
 for(const c of (single?cs:[cs[0]]))if(d[c])return{zh:d[c],src:"dict"};
 return{zh:"",src:""}}

/* ===== 發音：有預錄 mp3 用 TTS.play，否則 speechSynthesis（en-US） ===== */
function speak(text){
 try{if(window.__stopAll)window.__stopAll()}catch(e){}
 try{const C=window.UNIT_C||{},lo=text.toLowerCase();let k=C[text]?text:C[lo]?lo:null;
  const W=window.WEEK;if(!k&&W&&W.cards){const c=W.cards.find(x=>nkey(x.w)===nkey(text));if(c){const kk=c.say||c.w;if(C[kk])k=kk}}
  if(k&&window.TTS&&TTS.play){if(TTS.unlock)TTS.unlock();TTS.play(k,1);return}}catch(e){}
 try{if(window.TTS&&TTS.cancel)TTS.cancel();const s=window.speechSynthesis;if(!s||typeof SpeechSynthesisUtterance==="undefined")return;s.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=.9;s.speak(u)}catch(e){}}

/* ===== 列表（首頁區塊、單元頁面板共用） ===== */
const mounts=[];
const lessonNo=it=>it.n||(String(it.l||"").match(/\d+/)||[""])[0];
function hiSent(s,w){s=String(s||"");const i=s.toLowerCase().indexOf(String(w).toLowerCase());if(i<0||!w)return esc(s);return esc(s.slice(0,i))+"<b>"+esc(s.slice(i,i+w.length))+"</b>"+esc(s.slice(i+w.length))}
function itemHTML(it){const n=lessonNo(it),cur=window.WEEK&&window.WEEK.id===it.l;
 const ls=n?(cur?`<span class="mw-ls">第 ${esc(n)} 課</span>`:`<a class="mw-ls" href="${esc(it.l||("lesson"+String(n).padStart(2,"0")))}.html">第 ${esc(n)} 課</a>`):"";
 return `<div class="mw-it" data-w="${esc(it.w)}"><div class="mw-r1"><span class="mw-iw">${esc(it.w)}</span><button type="button" class="mw-sp" data-a="sp" aria-label="發音">🔊</button></div>
 <div class="mw-zh${it.zh?"":" mu"}">${it.zh?esc(it.zh):"（還沒填意思）"}</div>${it.s?`<div class="mw-is">${hiSent(it.s,it.w)}</div>`:""}
 <div class="mw-r3">${ls}<button type="button" class="mw-del" data-a="del">刪除</button></div></div>`}
function mount(el,opt){opt=opt||{};const m={el,limit:opt.limit||0,all:false,head:opt.head,draw:null};
 m.draw=()=>{const a=sorted(),shown=(m.limit&&!m.all)?a.slice(0,m.limit):a;
  const hd=m.head?`<div class="mw-hd2"><b>⭐ 我的單字</b><span class="mu">${a.length?a.length+" 個":""}</span></div>`:"";
  el.innerHTML=hd+(a.length?`<div class="mw-list">${shown.map(itemHTML).join("")}</div>${shown.length<a.length?`<button type="button" class="b" data-a="more">顯示全部（${a.length}）</button>`:""}`
   :`<div class="mu mw-empty">在課文裡長按、雙擊單字，或拖選片語即可加入。</div>`)+`<div class="mw-cr">中文詞義離線字典取自 ECDICT（MIT License）。</div>`};
 el.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-a]");if(!b||!el.contains(b))return;const a=b.getAttribute("data-a"),it=b.closest(".mw-it");
  if(a==="more"){m.all=true;m.draw();return}
  const w=it&&it.getAttribute("data-w");if(!w)return;
  if(a==="sp")speak(w);else if(a==="del")del(w)});
 mounts.push(m);m.draw();return m}
function refresh(){for(let i=mounts.length-1;i>=0;i--){const m=mounts[i];if(!document.body.contains(m.el)){mounts.splice(i,1);continue}try{m.draw()}catch(e){}}}
window.addEventListener("storage",e=>{if(e.key===K||e.key===null){MEM=null;refresh()}});

function home(el){if(!el)return;el.className="box mw-box";el.id=el.id||"mywc";mount(el,{limit:10,head:true})}

/* 單元頁：⭐ 我的單字 面板 */
let panel=null;
function openPanel(){if(panel)return;const d=document.createElement("div");d.className="mw-panel";d.innerHTML=`<div class="mw-pin"><div class="mw-pb"><b>⭐ 我的單字</b><button type="button" class="b" data-a="x">關閉</button></div><div class="box mw-box" id="mwpl"></div></div>`;
 document.body.appendChild(d);panel=d;document.body.style.overflow="hidden";mount(d.querySelector("#mwpl"),{head:false});
 d.querySelector("[data-a=x]").onclick=closePanel}
function closePanel(){if(!panel)return;panel.remove();panel=null;document.body.style.overflow=""}
document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(pop)closePop();else closePanel()}});

/* ===== 課文文字／選取 ===== */
const isW=(s,i)=>{const c=s[i];if(!c)return false;if(LTR.test(c))return true;if("-'’".indexOf(c)>=0)return i>0&&i<s.length-1&&LTR.test(s[i-1])&&LTR.test(s[i+1]);return false};
const enNode=sn=>{for(let n=sn.firstChild;n;n=n.nextSibling)if(n.nodeType===3&&n.data.trim())return n;return null};
const snOf=n=>{const e=n&&(n.nodeType===3?n.parentElement:n);const s=e&&e.closest?e.closest(".sn"):null;return s&&s.closest(".tx")?s:null};
function trimR(s,a,b){while(a<b&&!isW(s,a))a++;while(b>a&&!isW(s,b-1))b--;return[a,b]}
function caretAt(x,y){try{if(document.caretPositionFromPoint){const p=document.caretPositionFromPoint(x,y);if(p)return{n:p.offsetNode,o:p.offset}}
 if(document.caretRangeFromPoint){const r=document.caretRangeFromPoint(x,y);if(r)return{n:r.startContainer,o:r.startOffset}}}catch(e){}return null}
function rectHit(en,a,b,x,y,slack){try{const r=document.createRange();r.setStart(en,a);r.setEnd(en,b);return[...r.getClientRects()].some(q=>x>=q.left-slack&&x<=q.right+slack&&y>=q.top-slack&&y<=q.bottom+slack)}catch(e){return true}}
/* 座標 → 詞（整個連字號詞） */
function wordAtPoint(x,y,sn){const en=enNode(sn),c=caretAt(x,y);if(!en||!c||c.n!==en)return null;const s=en.data;let i=c.o;
 if(!isW(s,i)&&isW(s,i-1))i--;if(!isW(s,i))return null;let a=i,b=i+1;while(a>0&&isW(s,a-1))a--;while(b<s.length&&isW(s,b))b++;
 if(!rectHit(en,a,b,x,y,10))return null;return{sn,en,a,b}}
/* 目前選取 → {sn,en,a,b}（限本句英文、吸附到整詞）；不合格回 null */
function selInfo(){const s=window.getSelection&&getSelection();if(!s||!s.rangeCount||s.isCollapsed)return null;const r=s.getRangeAt(0);
 const sn=snOf(r.startContainer);if(!sn)return null;const en=enNode(sn);if(!en)return null;
 let a,b;const sc=r.startContainer,ec=r.endContainer;
 if(sc===en)a=r.startOffset;else if(sc===sn&&r.startOffset===0)a=0;else return null;
 if(ec===en)b=r.endOffset;else if(snOf(ec)===sn)b=en.data.length;else return null;
 const t=en.data;if(a>=b)return null;
 while(a>0&&isW(t,a-1)&&isW(t,a))a--;while(b<t.length&&isW(t,b)&&isW(t,b-1))b++;
 [a,b]=trimR(t,a,b);if(b<=a)return null;
 const txt=t.slice(a,b);if(!HASL.test(txt)||txt.length>80||txt.split(/\s+/).length>8)return null;return{sn,en,a,b}}

/* ===== 彈窗 ===== */
let pop=null,cur=null,toastT=0;
function toast(m){let t=document.getElementById("mwtoast");if(!t){t=document.createElement("div");t.id="mwtoast";t.className="mw-toast";document.body.appendChild(t)}t.textContent=m;t.style.display="block";clearTimeout(toastT);toastT=setTimeout(()=>{t.style.display="none"},1600)}
function closePop(){if(pop){pop.remove();pop=null;cur=null}try{const s=getSelection();if(s&&s.removeAllRanges)s.removeAllRanges()}catch(e){}}
async function openPop(h){
 const t=h.en.data,text=t.slice(h.a,h.b).replace(/\s+/g," "),sent=plain(t),key=nkey(text);
 if(pop&&cur&&cur.key===key&&cur.sent===sent)return;
 const ex=find(text);cur={key,sent,dirty:false,text};
 const first=h.a===0&&/^\p{Lu}\p{Ll}+$/u.test(text);
 if(!pop){pop=document.createElement("div");pop.className="mw-pop";pop.setAttribute("role","dialog");document.body.appendChild(pop)}
 const mine=cur;
 pop.innerHTML=`<div class="mw-ph"><div class="mw-w" id="mwW"></div><button type="button" class="mw-sp" data-a="sp" aria-label="發音">🔊</button><button type="button" class="mw-x" data-a="x" aria-label="關閉">✕</button></div>
 <div class="mw-sub" id="mwSub"></div><input class="mw-in" id="mwZh" type="text" placeholder="中文意思（可自己輸入）" enterkeyhint="done" autocomplete="off" autocapitalize="off">
 <div class="mw-ps">${hiSent(sent,text)}</div><button type="button" class="b p mw-ok" data-a="ok"></button>`;
 const $=s=>pop.querySelector(s),inp=$("#mwZh");
 const setText=x=>{mine.text=x;$("#mwW").textContent=x;$("[data-a=ok]").textContent=find(x)?"更新":"加入我的單字"};
 setText(text);inp.addEventListener("input",()=>{mine.dirty=true});
 if(ex){$("#mwSub").textContent="⭐ 已在我的單字，可改意思後按「更新」";inp.value=ex.zh||""}else $("#mwSub").textContent="查詢中…";
 const hit=await lookup(text);if(cur!==mine||!pop)return;
 let shown=text;
 if(first&&hit.src==="dict"){shown=text.toLowerCase();setText(shown)}   // 句首大寫的普通字 → 小寫
 else if(first){const lo=text.toLowerCase(),h2=await lookup(lo);if(cur!==mine||!pop)return;if(h2.zh&&h2.src==="dict"&&h2.zh===hit.zh){shown=lo;setText(lo)}}
 if(!mine.dirty&&(!ex||!ex.zh)&&hit.zh)inp.value=hit.zh;
 if(!ex)$("#mwSub").textContent=hit.zh?(hit.src==="card"?"自動填入：本課單字卡":"自動填入：離線字典（可修改）"):"查不到這個字，請自己輸入意思";
 else if(!ex.zh&&hit.zh)$("#mwSub").textContent="已自動填入意思";
 mine.final=shown;
 /* 避免彈窗蓋住被選的字 */
 try{const r=document.createRange();r.setStart(h.en,h.a);r.setEnd(h.en,h.b);const q=r.getBoundingClientRect(),ph=pop.offsetHeight;if(q.bottom>innerHeight-ph-12)window.scrollBy(0,q.bottom-(innerHeight-ph-12)+12)}catch(e){}
 pop.onclick=e=>{const b=e.target.closest&&e.target.closest("[data-a]");if(!b)return;const a=b.getAttribute("data-a");
  if(a==="x")closePop();else if(a==="sp")speak(mine.text);
  else if(a==="ok")commit(mine,h,inp.value)};
 inp.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();commit(mine,h,inp.value)}};
}
function commit(mine,h,zh){const W=window.WEEK||{};const w=mine.text.replace(/\s+/g," ").trim();if(!w)return;
 const upd=!!find(w);add({w,zh:String(zh||"").trim(),s:mine.sent,l:W.id||"",n:W.n||0,t:Date.now()});closePop();toast(upd?"已更新「"+w+"」":"已加入「"+w+"」")}

/* ===== 課文綁定：單擊播放整句；長按／雙擊／選字 → 彈窗 ===== */
function bindSn(box,playFn){
 let down=null,lpT=0,lpFired=false,moved=false,playT=0,mouse=false,selT=0,last={t:0,x:0,y:0};
 const clearPlay=()=>{clearTimeout(playT);playT=0};
 const check=()=>{const h=selInfo();if(h){clearPlay();openPop(h)}};
 box.addEventListener("pointerdown",e=>{const sn=e.target.closest&&e.target.closest(".sn");if(!sn)return;if(e.pointerType==="mouse"&&e.button!==0)return;
  down={x:e.clientX,y:e.clientY};lpFired=false;moved=false;mouse=e.pointerType==="mouse";clearTimeout(lpT);
  lpT=setTimeout(()=>{if(!down)return;const h=wordAtPoint(down.x,down.y,sn);if(h){lpFired=true;clearPlay();openPop(h)}},500)},{passive:true});
 box.addEventListener("pointermove",e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>10){moved=true;clearTimeout(lpT)}},{passive:true});
 const up=()=>{clearTimeout(lpT);down=null;mouse=false;setTimeout(check,60)};
 box.addEventListener("pointerup",up,{passive:true});box.addEventListener("pointercancel",up,{passive:true});
 /* 手機長按進入系統選字、拖把手：選取穩定後再彈窗 */
 document.addEventListener("selectionchange",()=>{clearTimeout(selT);selT=setTimeout(()=>{if(!mouse)check()},400)});
 box.addEventListener("click",e=>{const sn=e.target.closest&&e.target.closest(".sn");if(!sn)return;
  if(lpFired){lpFired=false;return}
  if(moved){moved=false;return}
  const now=Date.now();
  if(now-last.t<400&&Math.hypot(e.clientX-last.x,e.clientY-last.y)<30){last.t=0;clearPlay();const h=wordAtPoint(e.clientX,e.clientY,sn);if(h)openPop(h);return}
  last={t:now,x:e.clientX,y:e.clientY};clearPlay();
  if(selInfo())return;
  if(window.TTS&&TTS.unlock)TTS.unlock();   // 在使用者點擊當下解鎖音訊，延遲播放才不會被擋
  playT=setTimeout(()=>{playT=0;if(lpFired||selInfo())return;playFn(sn)},300)});
 box.addEventListener("dblclick",e=>{const sn=e.target.closest&&e.target.closest(".sn");if(!sn)return;clearPlay();const h=wordAtPoint(e.clientX,e.clientY,sn);if(h)openPop(h)});
}

function init(){const o=document.getElementById("mwo");if(o)o.onclick=openPanel;if(window.WEEK)dict()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.MW={home,bindSn,openPanel,closePanel,list:sorted,add,del,find,lookup,speak,dict,key:K};
})();
