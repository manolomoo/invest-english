/* 單課頁（lesson.html?id=01）：讀 lessons/lesson-NN.json，三步驟＝盲聽／精讀／回想。
   精讀的單字、課文、文法、小測驗沿用舊單元引擎；play1 / quiz / render 必須是「全域 function 宣告」，js/rw.js 會包裝它們來發 XP。
   play1 的 tag 慣例：c:i 單字卡、e:i 回音法、s:j 課文句、g:k 文法原句。 */
const $=id=>document.getElementById(id);
const R=[0.7,0.85,1.0];
let LJ=null,LID="",C=[],S=[],SENT=[],GR=[],N=0;
let i=0,rate=0.85,run=0,playing=false;
const esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const plain=s=>s.replace(/\s+/g," ").trim();
const key=c=>c.say||c.w;
const startIdx=()=>0;
const STEPS=[["listen","步驟一","盲聽"],["study","步驟二","精讀"],["recall","步驟三","回想"]];

/* ===== 播放核心（全域函式）===== */
function play1(k,tag){const p=TTS.play(k,rate);
 if(typeof tag==="string"&&tag.slice(0,2)==="s:"){const j=+tag.slice(2);p.then(d=>{if(d!=null)markHeard(j)})}
 return p}
const wait=s=>{const t=TTS.sess();return new Promise(r=>setTimeout(()=>r(TTS.sess()===t),s*1000))};
async function seq(keys,tag){let t=0,n=0;for(const k of keys){const d=await play1(k,n++?undefined:tag);if(d==null)return t;t+=d}return t}
function seg(el,opts,sel,on){el.innerHTML="";opts.forEach((o,k)=>{const b=document.createElement("button");b.type="button";b.textContent=o;if(k===sel)b.className="on";b.onclick=()=>{on(k);seg(el,opts,k,on)};el.appendChild(b)})}
function cueEl(el,p,lb){if(!el)return;el.textContent=(p?lb||"":"")+({listen:"聽",echo:"回音・心裡默念",shadow:"跟讀・大聲說出來"}[p]||"");el.style.color=p==="shadow"?"var(--ac)":""}
const setCue=(p,lb)=>cueEl($("cue"),p,lb);
function clearHl(){document.querySelectorAll(".sn.hl,.gq.hl").forEach(e=>e.classList.remove("hl"));const t=$("tcue");if(t)t.textContent=""}
/* 回音法節奏：聽 → echoGap（心裡默念）→ shadowGap（大聲跟讀） */
const echoGap=d=>Math.max(1,d+.3),shadowGap=d=>Math.max(1.5,d*1.25+.6);
function stop(){TTS.cancel();run++;playing=false;lrun++;lon=false;setCue("");clearHl();render();lDraw()}
window.__stopAll=stop;
async function once(keys,tag){if(window.TTS&&TTS.unlock)TTS.unlock();stop();await seq(keys,tag)}
const unlockOn=el=>{if(el&&window.TTS&&TTS.unlock)el.addEventListener("pointerdown",()=>{TTS.unlock()},{passive:true})};

/* ===== 步驟一：盲聽（畫面不顯示英文或中文）===== */
let li=0,lon=false,lrun=0,lfin=false;
function lDraw(){const el=$("lpanel");if(!el||!S.length)return;
 $("lpos").textContent=(li+1)+" / "+N;$("lbar").style.width=((li+(lfin?1:0))/N*100)+"%";
 $("lpl").textContent=lon?"⏸ 暫停":(lfin?"▶ 再聽一遍":"▶ 播放");
 $("lcue").textContent=lon?"聽…（第 "+(li+1)+" 句）":(lfin?"✔ 整課播完了，盲聽已完成":(li>0?"已暫停，按播放繼續":"按播放開始，閉上眼睛專心聽"))}
async function lStart(){if(window.TTS&&TTS.unlock)TTS.unlock();TTS.cancel();run++;playing=false;clearHl();
 if(lfin){lfin=false;li=0}
 const r=++lrun,s0=TTS.sess();lon=true;lDraw();const ok=()=>lrun===r&&TTS.sess()===s0;
 while(ok()&&li<N){lDraw();const d=await TTS.play(SENT[li],1);if(d==null||!ok())return;
  if(li>=N-1){lon=false;lfin=true;lDraw();listenDone();return}
  if(!await wait(.6)||!ok())return;li++}}
function lPause(){lrun++;TTS.cancel();lon=false;lDraw()}
function lGo(d){const was=lon;li=Math.max(0,Math.min(N-1,li+d));lfin=false;if(was)lStart();else{lrun++;TTS.cancel();lDraw()}}
function listenDone(){Store.Prog.patch(LID,x=>{x.listen=1});drawSteps()}

/* ===== 步驟二：精讀｜單字 ===== */
const posShort=c=>c.pos.split(/[,，（(\[]/)[0].trim();
function grid(){$("ga").innerHTML=C.map((c,k)=>`<div class="ca${k===i?" cur":""}" data-k="${k}"><span class="sp">🔊</span><div class="en">${esc(c.w)}</div><div class="zh">${esc(c.zh)}</div><div class="tg">${esc(posShort(c))}</div></div>`).join("");
 $("ga").querySelectorAll(".ca").forEach(el=>el.onclick=()=>{if(TTS.unlock)TTS.unlock();stop();i=+el.dataset.k;render();once(cardKeys(C[i]),"c:"+i)})}
function cardKeys(c){return c.ex?[key(c),c.ex]:[key(c)]}
function srsDraw(){const c=C[i];if(!c||!$("srst"))return;const it=SRS.get(SRS.id(LID,key(c)));
 const t=!it?"還沒加入單字複習。":it.m?"🎓 已熟（30 天那一檔答對了），不會再出現在待複習。":"✔ 已加入複習・下次複習："+it.due;
 $("srst").textContent=t;const a=$("sradd");a.textContent=it?"✓ 已加入複習":"＋ 加入複習";a.disabled=!!it;
 $("srk").classList.toggle("on",!!it&&it.self===1);$("srn").classList.toggle("on",!!it&&it.self===0)}
function selfRate(v){const c=C[i];if(!c)return;SRS.setSelf(LID,key(c),v);srsDraw()}
function render(){if(!C.length)return;if(i>=C.length)i=0;const c=C[i];$("pl").textContent=playing?"⏸ 暫停":"▶ 回音法播放";
 $("pos").textContent=(i+1)+" / "+C.length;$("w").textContent=c.w;$("zh").textContent=c.zh;$("ipa").textContent=c.ipa||"";$("tag").textContent=c.pos;
 $("def").textContent=c.def||"";$("def").style.display=c.def?"":"none";
 $("ex").innerHTML=c.ex?`<div>${esc(c.ex)}</div><div class="mu">${esc(c.exzh||"")}</div>`:"";grid();srsDraw()}
async function play(){if(window.TTS&&TTS.unlock)TTS.unlock();TTS.cancel();lrun++;lon=false;lDraw();const r=++run,s0=TTS.sess();playing=true;render();const ok=()=>run===r&&TTS.sess()===s0;
 while(ok()&&i<C.length){render();const c=C[i],parts=cardKeys(c);
  for(let j=0;j<parts.length;j++){const rounds=j===0?2:1;for(let k=0;k<rounds;k++){setCue("listen",(j?"例句":"單字")+"｜");$("w").classList.add("hl");const d=await play1(parts[j],j===0&&k===0?"e:"+i:undefined);$("w").classList.remove("hl");if(d==null||!ok())return;
   setCue("echo");if(!await wait(echoGap(d))||!ok())return;setCue("shadow");if(!await wait(shadowGap(d))||!ok())return}}
  if(window.RW&&RW.speak)RW.speak(i);
  if(!await wait(.5)||!ok())return;if(i+1<C.length)i++;else break}
 if(ok()){playing=false;i=startIdx();setCue("");render()}}

/* ===== 步驟二：精讀｜課文（段落、meta、每句「譯」）===== */
function textHTML(){let body="",j=0;
 while(j<S.length){const pi=S[j].para,m=S[j].meta||{};let inner="";
  while(j<S.length&&S[j].para===pi){inner+=`<div class="sn" id="s${j}" data-j="${j}"><span class="st">${esc(S[j].en)}</span><button type="button" class="tr" data-j="${j}" aria-label="顯示這句中文">譯</button><div class="zhs">${esc(S[j].zh)}</div></div>`;j++}
  body+=`<div class="pa${m.k?" "+m.k:""}">${inner}${m.cite?`<div class="cite">${esc(m.cite)}</div>`:""}</div>${m.src?`<div class="src">${esc(m.src)}</div>`:""}`}
 return `<div class="row"><button class="b p" data-a="all">▶ 全文連播</button><button class="b" data-a="echo">回音法逐句</button><button class="b" data-a="stop">⏹ 停止</button></div><div class="cue" id="tcue"></div>
  <div class="story">${body}</div><div class="tip">點任一句可單獨聽；右邊「譯」只展開那一句的中文。</div>`}
function bindText(){const box=$("tx"),cue=$("tcue");
 box.querySelectorAll(".sn").forEach(e=>e.onclick=()=>{if(TTS.unlock)TTS.unlock();stop();e.classList.add("hl");play1(SENT[+e.dataset.j],"s:"+e.dataset.j).then(()=>e.classList.remove("hl"))});
 box.querySelectorAll(".tr").forEach(b=>{b.addEventListener("pointerdown",ev=>ev.stopPropagation());b.onclick=ev=>{ev.stopPropagation();const sn=b.closest(".sn"),on=sn.classList.toggle("zon");b.textContent=on?"收":"譯"}});
 box.querySelectorAll("[data-a]").forEach(b=>unlockOn(b));
 box.querySelector('[data-a="stop"]').onclick=stop;
 box.querySelector('[data-a="all"]').onclick=async()=>{stop();const r=run,s0=TTS.sess();const ok=()=>run===r&&TTS.sess()===s0;
  for(let j=0;j<N&&ok();j++){const e=$("s"+j);e.classList.add("hl");cueEl(cue,"listen","【"+(j+1)+"/"+N+"】");const d=await play1(SENT[j],"s:"+j);e.classList.remove("hl");if(d==null||!ok())return;if(!await wait(.35))return}if(ok())cue.textContent=""};
 box.querySelector('[data-a="echo"]').onclick=async()=>{stop();const r=run,s0=TTS.sess();const ok=()=>run===r&&TTS.sess()===s0;
  for(let j=0;j<N&&ok();j++){const e=$("s"+j),lb="【"+(j+1)+"/"+N+"】";e.classList.add("hl");cueEl(cue,"listen",lb);const d=await play1(SENT[j],"s:"+j);if(d==null||!ok()){e.classList.remove("hl");return}
   cueEl(cue,"echo",lb);if(!await wait(echoGap(d))||!ok()){e.classList.remove("hl");return}cueEl(cue,"shadow",lb);if(!await wait(shadowGap(d))||!ok()){e.classList.remove("hl");return}e.classList.remove("hl")}if(ok())cue.textContent="完成 ✔"}}
/* 每一句都聽過至少一次 → 精讀完成 */
function markHeard(j){let fin=false;Store.Prog.patch(LID,x=>{x.sh=x.sh||[];if(!x.sh.includes(j))x.sh.push(j);if(x.sh.length>=N&&!x.study){x.study=1;fin=true}});if(fin)drawSteps();studyNote()}
function studyNote(){const el=$("snote");if(!el)return;const x=Store.Prog.get(LID),n=Math.min((x.sh||[]).length,N);el.textContent=x.study?"✔ 精讀完成（每一句都聽過了）":"課文已聽過 "+n+" / "+N+" 句；每一句都聽過一次就算精讀完成（全文連播一遍即可）。"}

/* ===== 步驟二：精讀｜文法 ===== */
function grammarHTML(){if(!GR.length)return `<div class="box mu">這一課沒有特別需要講的文法。</div>`;
 return GR.map((g,k)=>`<div class="box gm"><h3>${k+1}. ${esc(g.point)}</h3><div class="gq" data-q="${k}">${esc(g.quote)} 🔊</div><div class="gn">${String(g.explain||"").split("\n").map(p=>`<p>${esc(p)}</p>`).join("")}</div></div>`).join("")}
function bindGrammar(){document.querySelectorAll(".gq").forEach(e=>e.onclick=()=>{if(TTS.unlock)TTS.unlock();stop();e.classList.add("hl");play1(plain(GR[+e.dataset.q].quote),"g:"+e.dataset.q).then(()=>e.classList.remove("hl"))})}

/* ===== 步驟二：小測驗（單字：看英文選中文；每輪最多 8 題，80% 達標）===== */
let QN=0,Q=null;
const shuf=a=>{a=a.slice();for(let n=a.length-1;n>0;n--){const m=Math.floor(Math.random()*(n+1));[a[n],a[m]]=[a[m],a[n]]}return a};
function newRound(){const uid="l"+LJ.n,pm=k=>(window.RW&&RW.pget)?RW.pget(uid+"|quiz|"+key(k)):0;
 const deck=shuf(C).sort((a,b)=>pm(a)-pm(b)).slice(0,QN);
 Q={items:shuf(deck).map(c=>{const wr=shuf(C.filter(x=>x!==c&&x.zh!==c.zh).map(x=>x.zh).filter((z,n,ar)=>ar.indexOf(z)===n)).slice(0,3);return{c,k:key(c),zh:c.zh,opts:shuf([c.zh].concat(wr))}}),n:0,score:0,done:0,pick:-1}}
/* 作答：回傳這題結果給 rw.js；已作答過就回傳 null */
function quiz(k){if(!Q||Q.pick>=0||Q.n>=Q.items.length)return null;const q=Q.items[Q.n];Q.pick=k;const ok=q.opts[k]===q.zh;if(ok)Q.score++;Q.done++;qdraw();return{k:q.k,ok,score:Q.score,done:Q.done,total:Q.items.length}}
const qstate=()=>{const q=Q&&Q.items[Q.n];return q?{ans:q.zh,answered:Q.pick>=0}:{ans:"",answered:true}};
function qdraw(){const el=$("qz");if(!el||!Q)return;
 if(Q.n>=Q.items.length){const p=Math.round(Q.score/Q.items.length*100);el.innerHTML=`<b>小測驗</b><div class="qres">本輪 ${Q.score} / ${Q.items.length}（${p}%）</div><div class="mu" style="font-size:14px">${p>=80?"達標！這一輪的完成標記已記下。":"正確率 80% 以上才算達標，再來一輪試試。"}</div><button class="b p" id="qagain">再來一輪</button>`;$("qagain").onclick=()=>{newRound();qdraw()};return}
 const q=Q.items[Q.n],an=Q.pick>=0;
 el.innerHTML=`<b>小測驗</b><div class="mu" style="font-size:14px">第 ${Q.n+1} / ${Q.items.length} 題・答對 ${Q.score}　看英文，選出中文意思。</div><div class="qw">${esc(q.c.w)}</div><div class="mu" style="text-align:center;font-size:14px">${esc(q.c.ipa||"")}</div>
 <div class="qo" id="qo">${q.opts.map((o,k)=>`<button type="button" data-k="${k}"${an?" disabled":""} class="${an?(o===q.zh?"ok":k===Q.pick?"no":""):""}">${esc(o)}</button>`).join("")}</div>
 ${an?`<div class="mu" style="font-size:14px">${q.opts[Q.pick]===q.zh?"✔ 答對了":"✘ 正確答案：<b>"+esc(q.zh)+"</b>"}　${esc(posShort(q.c))}</div><button class="b p" id="qnx">${Q.n+1>=Q.items.length?"看結果":"下一題 ›"}</button>`:""}`;
 el.querySelectorAll("#qo button").forEach(b=>b.onclick=()=>window.quiz(+b.dataset.k));
 if(an)$("qnx").onclick=()=>{Q.n++;Q.pick=-1;qdraw()};
 if(window.RW&&RW.deco)RW.deco();if(window.RPG&&RPG.hintUI)RPG.hintUI()}

/* ===== 步驟三：回想（只顯示中文；點開對答案後自評記得／不記得）===== */
const rcShown=new Set();
function rcCard(j){const x=Store.Prog.get(LID),v=(x.rc||{})[j],sh=rcShown.has(j);
 return `<div class="box rcc${v===1?" rok":v===0?" rno":""}" id="rc${j}" data-j="${j}"><div class="rn">${j+1} / ${N}</div><div class="rzh">${esc(S[j].zh)}</div>
 ${sh?`<div class="ren">${esc(S[j].en)}</div><div class="row"><button type="button" class="b" data-r="say">🔊 再聽一次</button></div><div class="row"><button type="button" class="b${v===0?" on":""}" data-r="0">✘ 不記得</button><button type="button" class="b${v===1?" on":""}" data-r="1">✔ 記得</button></div>`
 :`<div class="row"><button type="button" class="b p" data-r="show">顯示英文對答案</button></div>`}</div>`}
function rcBind(el){if(!el)return;const j=+el.dataset.j;el.querySelectorAll("[data-r]").forEach(b=>{unlockOn(b);b.onclick=()=>{const r=b.dataset.r;
  if(r==="show"){rcShown.add(j);rcRedraw(j)}
  else if(r==="say"){if(TTS.unlock)TTS.unlock();stop();play1(SENT[j])}
  else{rcRate(j,+r)}}})}
function rcRedraw(j){const old=$("rc"+j);if(!old)return;old.outerHTML=rcCard(j);rcBind($("rc"+j))}
function rcRate(j,v){let fin=false;Store.Prog.patch(LID,x=>{x.rc=x.rc||{};x.rc[j]=v;if(Object.keys(x.rc).length>=N&&!x.recall){x.recall=1;fin=true}});rcRedraw(j);rcSummary();if(fin)drawSteps()}
function rcSummary(){const x=Store.Prog.get(LID),rc=x.rc||{},ks=Object.keys(rc),ok=ks.filter(k=>rc[k]===1).length;
 $("rcsum").textContent=(x.recall?"✔ 回想完成。":"")+"已自評 "+ks.length+" / "+N+" 句（記得 "+ok+"、不記得 "+(ks.length-ok)+"）"}
function rcBuild(){$("rclist").innerHTML=S.map((s,j)=>rcCard(j)).join("");document.querySelectorAll("#rclist .rcc").forEach(rcBind);rcSummary()}

/* ===== 步驟條與切換 ===== */
function drawSteps(){const x=Store.Prog.get(LID);
 document.querySelectorAll("#jump button").forEach(b=>{const s=b.dataset.sec,d=!!x[s];b.classList.toggle("done",d);const m=b.querySelector(".mk");if(m)m.textContent=d?"✓":""});
 const all=Store.Prog.done(LID);$("fin").hidden=!all}
let curStep="";
function show(id,scroll){if(!STEPS.some(s=>s[0]===id))id="listen";curStep=id;
 STEPS.forEach(s=>{const el=$("sec-"+s[0]);if(el)el.hidden=s[0]!==id});
 document.querySelectorAll("#jump button").forEach(b=>{b.classList.toggle("on",b.dataset.sec===id);b.setAttribute("aria-selected",b.dataset.sec===id)});
 try{window.__stopAll()}catch(e){try{TTS.cancel()}catch(e2){}}
 if(scroll)window.scrollTo(0,0)}
const HASHMAP={v:"study",t:"study",g:"study",listen:"listen",study:"study",recall:"recall"};

/* ===== 啟動 ===== */
function fail(msg){document.body.innerHTML=`<div class="w"><div class="box"><b>${esc(msg)}</b><div class="mu">請確認網址正確，並用網站網址或本機靜態伺服器開啟（不能直接雙擊 HTML 檔）。</div><a class="b p" href="index.html" style="text-align:center;text-decoration:none">回首頁</a></div></div>`}
async function init(){
 const m=/[?&]id=(\d{1,2})(?:&|$)/.exec(location.search);
 if(!m){fail("沒有指定要開哪一課。");return}
 LID=m[1].padStart(2,"0");
 let J;try{const r=await fetch("lessons/lesson-"+LID+".json",{cache:"no-cache"});if(!r.ok)throw new Error(r.status);J=await r.json()}catch(e){console.error(e);fail("找不到第 "+(+LID)+" 課，或課程資料讀取失敗。");return}
 try{
  LJ=J;
  C=J.vocab.map(v=>({w:v.word,ipa:v.ipa,pos:v.pos||"",zh:v.meaning,def:v.def,ex:v.example,exzh:v.exzh,say:v.say}));
  S=J.sentences;SENT=S.map(s=>plain(s.en));N=S.length;GR=J.grammar||[];QN=Math.min(8,C.length);
  /* 組出 window.UNIT_C（字串→音檔路徑），speech.js 以文字查表 */
  const U=window.UNIT_C=window.UNIT_C||{};
  J.vocab.forEach(v=>{if(v.audio)U[v.say||v.word]=v.audio;if(v.example&&v.exampleAudio)U[v.example]=v.exampleAudio});
  S.forEach((s,j)=>{if(s.audio)U[SENT[j]]=s.audio});
  GR.forEach(g=>{if(g.quoteAudio)U[plain(g.quote)]=g.quoteAudio});
  document.title="第 "+J.n+" 課｜"+J.title+"｜投資最重要的事｜學英文";
  $("ttl").textContent="第 "+J.n+" 課｜"+J.title;$("ten").textContent=J.en+"　・　"+J.chapter;
  $("tx").innerHTML=textHTML();bindText();
  $("gram").innerHTML=grammarHTML();bindGrammar();
  seg($("rate"),R.map(r=>r+"x"),R.indexOf(rate),k=>{rate=R[k]});
  if(!TTS.supported())$("nov").style.display="";
  /* 盲聽 */
  $("lpl").onclick=()=>lon?lPause():lStart();$("lpv").onclick=()=>lGo(-1);$("lnx").onclick=()=>lGo(1);["lpl","lpv","lnx"].forEach(id=>unlockOn($(id)));
  lDraw();
  /* 單字按鈕 */
  $("o1").onclick=()=>once([key(C[i])],"c:"+i);$("o2").onclick=()=>{const e=C[i].ex;if(e)once([e],"c:"+i)};
  $("pv").onclick=()=>{stop();i=(i-1+C.length)%C.length;render()};$("nx").onclick=()=>{stop();i=(i+1)%C.length;render()};$("pl").onclick=()=>playing?stop():play();
  ["pl","o1","o2"].forEach(id=>unlockOn($(id)));
  $("sradd").onclick=()=>{const c=C[i];SRS.add(LID,key(c));srsDraw()};$("srk").onclick=()=>selfRate(1);$("srn").onclick=()=>selfRate(0);
  $("zhall").onclick=()=>{const on=$("sec-study").classList.toggle("showzh");$("zhall").textContent=on?"全部隱藏中文":"全部顯示中文"};
  $("rcreset").onclick=()=>{if(!confirm("確定清除本課的回想自評，重新來一遍？"))return;Store.Prog.patch(LID,x=>{x.rc={};x.recall=0});rcShown.clear();rcBuild();drawSteps()};
  $("jump").addEventListener("click",e=>{const b=e.target.closest("button[data-sec]");if(!b)return;history.replaceState(null,"","#"+b.dataset.sec);show(b.dataset.sec,true)});
  window.addEventListener("hashchange",()=>{const h=HASHMAP[location.hash.replace("#","")];if(h&&h!==curStep)show(h,true)});
  newRound();qdraw();rcBuild();studyNote();drawSteps();
  i=startIdx();render();
  const h0=HASHMAP[location.hash.replace("#","")],x0=Store.Prog.get(LID);
  show(h0||(!x0.listen?"listen":!x0.study?"study":!x0.recall?"recall":"listen"),false);
  if(window.RW&&RW.page)RW.page("l"+J.n,{cardKeys:C.map(key),nStory:SENT.length,nGram:GR.length,idx:()=>i,quizTotal:QN,qkey:()=>{const q=Q&&Q.items[Q.n];return q?q.k:""},qstate});
  if(window.RPG&&RPG.page)RPG.page();
  window.__unitReady=1;
 }catch(e){console.error(e);document.body.insertAdjacentHTML("afterbegin","<div style='padding:12px;color:#d64545'>載入失敗："+esc(e)+"</div>")}
}
init();
