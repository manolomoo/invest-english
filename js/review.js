/* 單字複習頁：今日到期（含過期）的單字卡，記得→下一間隔、不記得→回到第 1 天。 */
(function(){
const $=id=>document.getElementById(id),esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
let Q=[],k=0,flip=false,total=0,got=0,miss=0,LJ={};
window.__stopAll=()=>{try{TTS.cancel()}catch(e){}};
function vocabOf(it){const J=LJ[it.lesson];return J&&J.vocab.find(v=>(v.say||v.word)===it.key)}
function finish(){const rv=$("rv");$("rvprog").textContent="";
 rv.innerHTML=total?`<div class="box c"><div class="big">🎉</div><b style="font-size:20px">今天的複習完成了！</b><div class="mu">共 ${total} 個：記得 ${got}、不記得 ${miss}。不記得的會明天再出現。</div><a class="b p" href="index.html" style="text-align:center;text-decoration:none">回首頁</a></div>`
 :`<div class="box c"><b style="font-size:20px">目前沒有待複習的單字</b><div class="mu">到任一課的「精讀」加入單字，之後會依 1、3、7、14、30 天排程出現在這裡。</div><a class="b p" href="index.html" style="text-align:center;text-decoration:none">回首頁</a></div>`}
function draw(){if(k>=Q.length)return finish();
 const it=Q[k],v=vocabOf(it);
 if(!v){k++;return draw()} // 找不到單字資料（課程被刪等）就跳過
 $("rvprog").textContent="第 "+(k+1)+" / "+Q.length+" 個";
 const front=`<div class="big" id="rvw">${esc(v.word)}</div><div class="ipa" style="color:var(--mu);font-size:18px">${esc(v.ipa||"")}</div><button type="button" class="b" id="rvsay" style="max-width:220px;align-self:center">🔊 聽發音</button>`;
 const back=`<div class="zhw" style="font-size:24px;font-weight:700;color:var(--ac)">${esc(v.meaning)}</div>${v.def?`<div class="def" style="text-align:left;background:var(--tint);border-radius:10px;padding:8px 10px;line-height:1.55">${esc(v.def)}</div>`:""}${v.example?`<div style="text-align:left;line-height:1.55;font-size:17px">${esc(v.example)}<div class="mu" style="font-size:15px">${esc(v.exzh||"")}</div></div>`:""}`;
 $("rv").innerHTML=`<div class="box c fcard" id="fc" tabindex="0">${front}${flip?`<hr style="width:100%;border:0;border-top:1px solid var(--ln)">${back}`:`<div class="mu" style="font-size:14px">點卡片或按下方按鈕看答案</div>`}</div>
 ${flip?`<div class="row"><button type="button" class="b bad" id="rvn">✘ 不記得</button><button type="button" class="b ok" id="rvk">✔ 記得</button></div><button type="button" class="b" id="rvsay2">🔊 聽例句</button>`:`<button type="button" class="b p" id="rvshow">顯示答案</button>`}`;
 const say=()=>{if(TTS.unlock)TTS.unlock();TTS.play(v.say||v.word,.85)};
 $("rvsay").onclick=ev=>{ev.stopPropagation();say()};$("rvsay").addEventListener("pointerdown",ev=>{ev.stopPropagation();TTS.unlock()},{passive:true});
 $("fc").onclick=()=>{if(!flip){flip=true;draw()}};
 if(!flip){$("rvshow").onclick=()=>{flip=true;draw()};$("rvshow").addEventListener("pointerdown",()=>TTS.unlock(),{passive:true})}
 else{$("rvk").onclick=()=>rate(it,true);$("rvn").onclick=()=>rate(it,false);
  $("rvsay2").onclick=()=>{if(TTS.unlock)TTS.unlock();if(v.example)TTS.play(v.example,.85)};$("rvsay2").addEventListener("pointerdown",()=>TTS.unlock(),{passive:true})}}
function rate(it,ok){TTS.cancel();SRS.grade(it.id,ok);if(ok)got++;else miss++;k++;flip=false;draw();window.scrollTo(0,0)}
async function init(){
 Q=SRS.due();
 const ls=[...new Set(Q.map(x=>x.lesson))];
 try{await Promise.all(ls.map(async l=>{const r=await fetch("lessons/lesson-"+l+".json",{cache:"no-cache"});if(!r.ok)throw new Error(l);const J=await r.json();LJ[l]=J;const U=window.UNIT_C=window.UNIT_C||{};J.vocab.forEach(v=>{if(v.audio)U[v.say||v.word]=v.audio;if(v.example&&v.exampleAudio)U[v.example]=v.exampleAudio})}))}
 catch(e){console.error(e);$("rv").innerHTML='<div class="box">課程資料讀取失敗。請用網站網址或本機靜態伺服器開啟（不能直接雙擊 HTML 檔）。<a class="b p" href="index.html" style="text-align:center;text-decoration:none">回首頁</a></div>';return}
 Q=Q.filter(it=>vocabOf(it));total=Q.length;draw();
 if(window.RPG&&RPG.page)RPG.page();
}
init();
})();
