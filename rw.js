/* 練習紀錄與💵（投資最重要的事｜學英文）。localStorage 鍵：invRW1（獨立，不與其他站共用）。
   動作 → 事件：包裝全域 play1 / quiz / render，再用 rwx CustomEvent 把「練習了什麼」交給 rpg.js 算 XP。
   版本橫幅由 version.js 負責，這裡不重複。 */
(function(){
/* 每加一課：在 UNITS 加一行（id 一旦上線就不要改，練習紀錄靠它） */
const TYPES=["cards","story","gram","speak","quiz"];
const UNITS=[1,2,3,4,5,6,7,8,9,10].map(n=>({id:"l"+n,n,file:"lesson"+String(n).padStart(2,"0")+".html",name:"第 "+n+" 課",types:TYPES}));
const TN={cards:"單字卡",story:"課文",gram:"文法",speak:"口說（回音法）",quiz:"小測驗"};
const SPEAK_N=5,QUIZ_N=8;
const RULE={cards:"每張單字卡都聽過一次（點卡、念單字、念例句或回音法都算）",story:"課文每一句都聽過（全文連播一遍即可）",gram:"每一則文法原句都點過、聽過",speak:"在 "+SPEAK_N+" 個不同的單字上完整做完回音法（單字兩輪＋例句一輪，聽、回音、跟讀）",quiz:"同一輪 "+QUIZ_N+" 題全部作答，且正確率 ≥ 80%（8 題至少答對 7 題）"};
const KEY="invRW1";let MEM=null,LSOK=true;try{localStorage.setItem("__t","1");localStorage.removeItem("__t")}catch(e){LSOK=false}
const ld=()=>{if(!LSOK)return MEM||(MEM={});try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return MEM||{}}};
const sv=d=>{MEM=d;if(LSOK)try{localStorage.setItem(KEY,JSON.stringify(d))}catch(e){LSOK=false}};
const POO=n=>n?"💵".repeat(Math.min(n,4)):"";const pget=k=>((ld().pm||{})[k])||0;
const last={};function emit(o){try{window.dispatchEvent(new CustomEvent("rwx",{detail:o}))}catch(e){}}
/* 💵＋1（最多 4 張）。回傳 0＝2.5 秒內重複（不計）、1＝第一次、2＝重練 */
function pinc(k,force){const t=Date.now();if(!force&&last[k]&&t-last[k]<2500)return 0;last[k]=t;const d=ld();d.pm=d.pm||{};const was=d.pm[k]||0;d.pm[k]=Math.min(was+1,4);sv(d);return was?2:1}
function tst(u,t){const x=((ld()[u]||{})[t])||{};return x.c?2:x.s?1:0}
function ust(U){const a=U.types.map(t=>tst(U.id,t));return a.every(v=>v===2)?2:a.some(v=>v)?1:0}
const css=document.createElement("style");css.textContent=`.rw-cf{position:fixed;top:-30px;font-size:24px;z-index:98;animation:rwf 2.4s linear forwards;pointer-events:none}@keyframes rwf{to{transform:translateY(105vh) rotate(540deg)}}
.pm{font-size:15px;min-height:18px;letter-spacing:1px}.pm:empty{display:none}.ca .pm{position:absolute;left:8px;top:6px;font-size:13px;min-height:0}.sn .pm,.gq .pm{font-size:13px;line-height:1.3;min-height:0;letter-spacing:0}
.rwr{font-size:13px;color:var(--mu);line-height:1.7}.rwr summary{cursor:pointer;padding:6px 0}
.rwb{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:6px;font-size:12px;color:var(--mu)}.rwb .ok{color:var(--ok);font-weight:700}`;document.head.appendChild(css);
window.RW={LSOK:()=>LSOK,emit,UNITS,TYPES,ust,tst,TN,RULE,pget,ld,
page(uid,cfg){
const U=UNITS.find(x=>x.id===uid)||{id:uid,types:TYPES};const box=document.getElementById("rw");
const sess={};RW.cfg=cfg;RW.uid=uid;
const nSpeak=Math.min(SPEAK_N,cfg.cardKeys.length),nQuiz=cfg.quizTotal;
const TOT={cards:cfg.cardKeys.length,story:cfg.nStory,gram:cfg.nGram,speak:nSpeak};
function upd(t,fn){const d=ld();d[uid]=d[uid]||{};const x=d[uid][t]=d[uid][t]||{};const before=ust(U),bt=x.c?2:x.s?1:0;fn(x);x.s=1;sv(d);const at=x.c?2:1,after=ust(U);if(at===2&&bt!==2)emit({uid,t:"crown",ty:t});if(after===2&&before!==2)emit({uid,t:"king"});draw()}
function draw(){if(!box)return;const x=t=>((ld()[uid]||{})[t])||{};
 box.innerHTML=`${LSOK?"":'<div style="color:#d64545;font-size:13px">⚠️ 這個瀏覽器無法儲存進度（可能是私密瀏覽），離開頁面後練習紀錄和💵會消失。</div>'}<div class="rwr">💵＝這張卡、這一句或這一題練過幾次（最多 4 張）。</div><details class="rwr" open><summary>本課完成進度</summary>${U.types.map(t=>{const v=x(t),n=t==="quiz"?(v.b?"　最佳 "+v.b:""):"　"+Math.min((v.h||[]).length,TOT[t])+" / "+TOT[t];return"<div>"+(v.c?"✔ ":"・ ")+"<b>"+TN[t]+"</b>："+RULE[t].replace("8 題","<b>"+nQuiz+" 題</b>")+n+"</div>"}).join("")}<a href="#" id="rwreset" style="color:var(--mu)">重設本課完成標記</a>（已拿過的獎勵不會重複計算）</details>`;
 const r=document.getElementById("rwreset");if(r)r.onclick=e=>{e.preventDefault();if(confirm("確定重設本課的完成標記？")){const d=ld();delete d[uid];sv(d);draw()}}}
const P=t=>uid+"|"+t+"|";
/* 聽過／練過一個項目：先發基本 XP 事件，再記完成進度（可能接著發 crown／king） */
function hear(t,k){const r=pinc(P(t)+k);if(r)emit({uid,t,isNew:r===1});upd(t,x=>{x.h=x.h||[];if(!x.h.includes(k))x.h.push(k);if(x.h.length>=TOT[t])x.c=1});deco()}
/* 包裝全域 play1(text, tag)：tag 由 unit.js 傳入，c:i 單字卡／e:i 回音法起點／s:j 課文句／g:k 文法原句；沒有 tag（測驗發音、回音法其他輪）不算。 */
const _p=window.play1;window.play1=function(k,tag){if(tag){const a=String(tag).split(":"),t=a[0],n=+a[1];
 if((t==="c"||t==="e")&&cfg.cardKeys[n]!=null)hear("cards",cfg.cardKeys[n]);else if(t==="s")hear("story","s"+n);else if(t==="g")hear("gram","g"+n)}
 return _p.apply(this,arguments)};
/* 回音法整張卡走完（單字兩輪＋例句一輪）→ 口說 */
RW.speak=function(i){const k=cfg.cardKeys[i];if(k==null)return;const r=pinc(P("speak")+k,1);emit({uid,t:"speak",isNew:r===1});upd("speak",x=>{x.h=x.h||[];if(!x.h.includes(k))x.h.push(k);if(x.h.length>=nSpeak)x.c=1});deco()};
/* 包裝全域 quiz(k)：unit.js 的作答處理，回傳這題結果（已作答過回傳 null） */
const _q=window.quiz;window.quiz=function(){const r=_q.apply(this,arguments);if(r){const p=pinc(P("quiz")+r.k,1);emit({uid,t:"quiz",isNew:p===1,ok:r.ok});
 upd("quiz",x=>{if(r.done>=r.total){const pct=Math.round(r.score/r.done*100);if(!x.bp||pct>x.bp){x.bp=pct;x.b=r.score+"/"+r.done+"（"+pct+"%）"}if(r.score/r.done>=.8)x.c=1}});deco()}return r};
function mark(el,key){if(!el)return;let m=el.querySelector(":scope>.pm");if(!m){m=document.createElement("div");m.className="pm";el.appendChild(m)}m.textContent=POO(pget(key))}
function deco(){const keys=cfg.cardKeys;
 document.querySelectorAll("#ga .ca").forEach(el=>{const k=keys[+el.dataset.k];if(k!=null)mark(el,P("cards")+k)});
 const k=keys[cfg.idx()];let m=document.getElementById("pmw");if(!m){const w=document.getElementById("w");if(w){m=document.createElement("div");m.id="pmw";m.className="pm";w.after(m)}}if(m&&k!=null)m.textContent=POO(pget(P("cards")+k));
 for(let j=0;j<cfg.nStory;j++)mark(document.getElementById("s"+j),P("story")+"s"+j);
 document.querySelectorAll(".gq[data-q]").forEach(el=>mark(el,P("gram")+"g"+el.dataset.q));
 const qk=cfg.qkey();let q=document.getElementById("pmq");const qo=document.getElementById("qo");if(qk&&qo){if(!q){q=document.createElement("div");q.id="pmq";q.className="pm";qo.before(q)}q.textContent=POO(pget(P("quiz")+qk))}}
RW.deco=deco;const _r=window.render;window.render=function(){const r=_r.apply(this,arguments);deco();return r};
draw();deco()},
/* 首頁：在每課卡片下補上完成狀態 */
home(el){if(!el)return;el.querySelectorAll("a.lc").forEach(a=>{const U=UNITS.find(u=>a.getAttribute("href")===u.file);if(!U)return;const s=ust(U);
 a.insertAdjacentHTML("beforeend",`<div class="rwb">${U.types.map(t=>`<span class="${tst(U.id,t)===2?"ok":""}">${tst(U.id,t)===2?"✔ ":""}${TN[t]}</span>`).join("")}</div>${s===2?'<div class="rwb"><span class="ok">👑 本課全部完成</span></div>':""}`)})}};
})();
