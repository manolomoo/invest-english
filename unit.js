/* 單元頁引擎：單字（回音法）／課文逐句播放／文法。資料來自 window.WEEK。 */
const W=window.WEEK,$=id=>document.getElementById(id);
const C=W.cards,R=[0.7,0.85,1.0];
let i=0,rate=0.85,run=0,playing=false;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const plain=s=>s.replace(/\s+/g," ").trim();
const key=c=>c.say||c.w;
const startIdx=()=>0;
const play1=k=>TTS.play(k,rate);
const wait=s=>{const t=TTS.sess();return new Promise(r=>setTimeout(()=>r(TTS.sess()===t),s*1000))};
async function seq(keys){let t=0;for(const k of keys){const d=await play1(k);if(d==null)return t;t+=d}return t}
function seg(el,opts,sel,on){el.innerHTML="";opts.forEach((o,k)=>{const b=document.createElement("button");b.textContent=o;if(k===sel)b.className="on";b.onclick=()=>{on(k);seg(el,opts,k,on)};el.appendChild(b)})}
function cueEl(el,p,lb){el.textContent=(p?lb||"":"")+({listen:"聽",echo:"回音・心裡默念",shadow:"跟讀・大聲說出來"}[p]||"");el.style.color=p==="shadow"?"var(--ac)":""}
const setCue=(p,lb)=>cueEl($("cue"),p,lb);
function clearHl(){document.querySelectorAll(".sn.hl,.gq.hl").forEach(e=>e.classList.remove("hl"));document.querySelectorAll(".tx .cue").forEach(e=>{e.textContent=""})}
/* 回音法節奏：聽 → echoGap（心裡默念）→ shadowGap（大聲跟讀） */
const echoGap=d=>Math.max(1,d+.3),shadowGap=d=>Math.max(1.5,d*1.25+.6);
function stop(){TTS.cancel();run++;playing=false;setCue("");clearHl();render()}
window.__stopAll=stop;
async function once(keys){if(window.TTS&&TTS.unlock)TTS.unlock();stop();await seq(keys)}
/* ===== 單字 ===== */
const posShort=c=>c.pos.split(/[,，（(\[]/)[0].trim();
function grid(){$("ga").innerHTML=C.map((c,k)=>`<div class="ca${k===i?" cur":""}" data-k="${k}"><span class="sp">🔊</span><div class="en">${esc(c.w)}</div><div class="zh">${esc(c.zh)}</div><div class="tg">${esc(posShort(c))}</div></div>`).join("");
 $("ga").querySelectorAll(".ca").forEach(el=>el.onclick=()=>{stop();i=+el.dataset.k;render();once(cardKeys(C[i]))})}
function cardKeys(c){return c.ex?[key(c),c.ex]:[key(c)]}
function render(){if(i>=C.length)i=0;const c=C[i];$("pl").textContent=playing?"⏸ 暫停":"▶ 回音法播放";
 $("pos").textContent=(i+1)+" / "+C.length;$("w").textContent=c.w;$("zh").textContent=c.zh;$("ipa").textContent=c.ipa||"";$("tag").textContent=c.pos;
 $("def").textContent=c.def||"";$("def").style.display=c.def?"":"none";
 $("ex").innerHTML=c.ex?`<div>${esc(c.ex)}</div><div class="mu">${esc(c.exzh||"")}</div>`:"";grid()}
async function play(){if(window.TTS&&TTS.unlock)TTS.unlock();TTS.cancel();const r=++run,s0=TTS.sess();playing=true;render();const ok=()=>run===r&&TTS.sess()===s0;
 while(ok()&&i<C.length){render();const c=C[i],parts=cardKeys(c);
  for(let j=0;j<parts.length;j++){const rounds=j===0?2:1;for(let k=0;k<rounds;k++){setCue("listen",(j?"例句":"單字")+"｜");$("w").classList.add("hl");const d=await play1(parts[j]);$("w").classList.remove("hl");if(d==null||!ok())return;
   setCue("echo");if(!await wait(echoGap(d))||!ok())return;setCue("shadow");if(!await wait(shadowGap(d))||!ok())return}}
  if(!await wait(.5)||!ok())return;if(i+1<C.length)i++;else break}
 if(ok()){playing=false;i=startIdx();setCue("");render()}}
/* ===== 課文 ===== */
const SENT=[];
const zhOf=(t,pi,si)=>{const z=t.zh&&t.zh[pi]&&t.zh[pi][si];return z?`<div class="zhs">${esc(z)}</div>`:""};
function textsHTML(){return W.texts.map(t=>{const ids=[];const meta=t.meta||[];
 const body=t.paras.map((p,pi)=>{const m=meta[pi]||{};
  const inner=p.map((s,si)=>{const j=SENT.length;SENT.push(plain(s));ids.push(j);return `<div class="sn" id="s${j}" data-j="${j}">${esc(s)}${zhOf(t,pi,si)}</div>`}).join("");
  return `<div class="pa${m.k?" "+m.k:""}">${inner}${m.cite?`<div class="cite">${esc(m.cite)}</div>`:""}</div>${m.src?`<div class="src">${esc(m.src)}</div>`:""}`}).join("");
 t.ids=ids;
 return `<div class="box tx" id="tx-${t.id}">${t.title?`<b style="font-size:18px">${esc(t.title)}</b>`:""}
  <div class="row"><button class="b p" data-a="all">▶ 全文連播</button><button class="b" data-a="echo">回音法逐句</button></div>
  <div class="row"><button class="b" data-a="stop">⏹ 停止</button><button class="b" data-a="zh">顯示中文</button></div><div class="cue"></div>
  <div class="story">${body}</div><div class="tip">點任一句可單獨聽。</div></div>`}).join("")}
function bindTexts(){W.texts.forEach(t=>{const box=$("tx-"+t.id),cue=box.querySelector(".cue");
 box.querySelectorAll(".sn").forEach(e=>e.onclick=()=>{if(window.TTS&&TTS.unlock)TTS.unlock();stop();e.classList.add("hl");play1(SENT[+e.dataset.j]).then(()=>e.classList.remove("hl"))});
 box.querySelectorAll("[data-a]").forEach(b=>b.addEventListener("pointerdown",()=>{if(TTS.unlock)TTS.unlock()},{passive:true}));
 box.querySelector('[data-a="stop"]').onclick=stop;
 const zb=box.querySelector('[data-a="zh"]');zb.onclick=()=>{const on=box.classList.toggle("showzh");zb.textContent=on?"隱藏中文":"顯示中文"};
 box.querySelector('[data-a="all"]').onclick=async()=>{stop();const r=run,s0=TTS.sess();const ok=()=>run===r&&TTS.sess()===s0;
  for(let n=0;n<t.ids.length&&ok();n++){const j=t.ids[n];const e=$("s"+j);e.classList.add("hl");cueEl(cue,"listen","【"+(n+1)+"/"+t.ids.length+"】");const d=await play1(SENT[j]);e.classList.remove("hl");if(d==null||!ok())return;if(!await wait(.35))return}if(ok())cue.textContent=""};
 box.querySelector('[data-a="echo"]').onclick=async()=>{stop();const r=run,s0=TTS.sess();const ok=()=>run===r&&TTS.sess()===s0;
  for(let n=0;n<t.ids.length&&ok();n++){const j=t.ids[n],e=$("s"+j),lb="【"+(n+1)+"/"+t.ids.length+"】";e.classList.add("hl");cueEl(cue,"listen",lb);const d=await play1(SENT[j]);if(d==null||!ok()){e.classList.remove("hl");return}
   cueEl(cue,"echo",lb);if(!await wait(echoGap(d))||!ok()){e.classList.remove("hl");return}cueEl(cue,"shadow",lb);if(!await wait(shadowGap(d))||!ok()){e.classList.remove("hl");return}e.classList.remove("hl")}if(ok())cue.textContent="完成 ✔"}})}
/* ===== 文法 ===== */
function grammarHTML(){const G=W.grammar||[];if(!G.length)return `<div class="box mu">這一課沒有特別需要講的文法。</div>`;
 return G.map((g,k)=>`<div class="box gm"><h3>${k+1}. ${esc(g.title)}</h3><div class="gq" data-q="${k}">${esc(g.quote)} 🔊</div><div class="gn">${g.note.split("\n").map(p=>`<p>${esc(p)}</p>`).join("")}</div></div>`).join("")}
function bindGrammar(){document.querySelectorAll(".gq").forEach(e=>e.onclick=()=>{if(TTS.unlock)TTS.unlock();stop();e.classList.add("hl");play1(plain(W.grammar[+e.dataset.q].quote)).then(()=>e.classList.remove("hl"))})}
/* ===== 綁定 ===== */
$("o1").onclick=()=>once([key(C[i])]);$("o2").onclick=()=>{const e=C[i].ex;if(e)once([e])};
$("pv").onclick=()=>{stop();i=(i-1+C.length)%C.length;render()};$("nx").onclick=()=>{stop();i=(i+1)%C.length;render()};$("pl").onclick=()=>playing?stop():play();
["pl","o1","o2"].forEach(id=>{const el=$(id);if(el&&TTS.unlock)el.addEventListener("pointerdown",()=>{TTS.unlock()},{passive:true})});
try{
 $("texts").innerHTML=textsHTML();bindTexts();
 $("gram").innerHTML=grammarHTML();bindGrammar();
 seg($("rate"),R.map(r=>r+"x"),R.indexOf(rate),k=>{rate=R[k]});
 if(!TTS.supported())$("nov").style.display="";
 setCue("");i=startIdx();render();window.__unitReady=1;
}catch(e){console.error(e);document.body.insertAdjacentHTML("afterbegin","<div style='padding:12px;color:#d64545'>載入失敗："+esc(e)+"</div>")}
