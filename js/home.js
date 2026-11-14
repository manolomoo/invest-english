/* 首頁：課程目錄（讀 lessons/index.json）、整體進度條（以 invProg1 三步驟為準）、今日待複習、股神 RPG 面板。 */
(function(){
const $=id=>document.getElementById(id),esc=s=>String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
RPG.home($("rpgc"));
function dueBox(){const n=SRS.due().length,el=$("due");
 if(n>0)el.innerHTML=`<a class="b p duebtn" href="review.html">今日待複習 ${n} 個單字　開始複習 ›</a>`;
 else el.innerHTML=SRS.count()?`<div class="duez">✔ 今日待複習 0 個，今天已經複習完了。</div>`:`<div class="duez mu">今日待複習 0 個。還沒有加入複習的單字，到任一課的「精讀」按「加入複習」或「記得／不記得」就會開始。</div>`}
dueBox();
function go(L){
 const list=$("list");
 list.innerHTML=L.map(x=>{const st=Store.Prog.state(x.id),p=Store.Prog.get(x.id);
  const chip=st===2?'<span class="chip ok">✓ 完成</span>':st===1?'<span class="chip run">進行中</span>':'<span class="chip">未開始</span>';
  const steps=[["listen","盲聽"],["study","精讀"],["recall","回想"]].map(s=>`<span class="${p[s[0]]?"ok":""}">${p[s[0]]?"✔ ":""}${s[1]}</span>`).join("");
  return `<a class="box lc" href="lesson.html?id=${esc(x.id)}"><div class="no">第 ${esc(x.n)} 課　・　${esc(x.chapter.split(" ")[0])}${chip}</div><div class="t">${esc(x.title)}</div><div class="e">${esc(x.en)}</div><div class="s">${esc(x.summary)}</div><div class="rwb stp">${steps}</div></a>`}).join("");
 const done=L.filter(x=>Store.Prog.done(x.id)).length;
 $("prog").innerHTML=`<b>整體進度：已完成 ${done} / ${L.length} 課</b><div class="pbar"><i style="width:${L.length?done/L.length*100:0}%"></i></div><div class="mu" style="font-size:13px">一課要「盲聽、精讀、回想」三個步驟都完成才算完成。</div>`;
 RW.home(list);
 if(location.hash==="#rpg"||location.hash==="#assets"){const e=$(location.hash.slice(1));if(e)e.scrollIntoView()}
}
fetch("lessons/index.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json()}).then(go).catch(e=>{console.error(e);$("list").innerHTML='<div class="box">課程清單讀取失敗。請用網站網址或本機靜態伺服器開啟（不能直接雙擊 HTML 檔）。</div>'});
})();
