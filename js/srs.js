/* 單字間隔重複。鍵：invSRS1（本站專用）。間隔 1、3、7、14、30 天；答錯回到第 1 天；在 30 天那一檔答對 → 已熟，不再出現在待複習。
   單字穩定 id："01:cofound"（課號:(say||word)），上線後不要改。日期一律用使用者本地曆日（YYYY-MM-DD），不用 24 小時浮動。
   資料：{ "01:cofound":{lesson:"01",key:"cofound",s:階段0-4,due:"YYYY-MM-DD",m:是否已熟,added:"YYYY-MM-DD",self:最近一次自評1/0} } */
(function(){
const KEY="invSRS1",INT=[1,3,7,14,30];
const pad=n=>String(n).padStart(2,"0");
const fmt=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>fmt(new Date());
function plus(days,from){const d=from?new Date(from+"T00:00:00"):new Date();d.setDate(d.getDate()+days);return fmt(d)}
const all=()=>{const d=Store.get(KEY,{});return d&&typeof d==="object"?d:{}};
const id=(lesson,key)=>lesson+":"+key;
const get=i=>all()[i]||null;
function add(lesson,key,self){const d=all(),i=id(lesson,key);if(!d[i])d[i]={lesson,key,s:0,due:plus(1),m:false,added:today()};if(self!==undefined)d[i].self=self;Store.set(KEY,d);return d[i]}
function setSelf(lesson,key,self){const d=all(),i=id(lesson,key);if(!d[i])return add(lesson,key,self);d[i].self=self;Store.set(KEY,d);return d[i]}
/* 複習結果：ok → 進下一間隔（30 天那檔答對＝已熟）；!ok → 回到第 1 天 */
function grade(i,ok){const d=all(),x=d[i];if(!x)return null;
  if(ok){if(x.s>=INT.length-1){x.m=true;x.due=""}else{x.s++;x.due=plus(INT[x.s])}}
  else{x.s=0;x.m=false;x.due=plus(INT[0])}
  x.last=today();Store.set(KEY,d);return x}
/* 今日到期（含過期）且未熟，依到期日排序 */
function due(){const t=today();return Object.keys(all()).map(i=>Object.assign({id:i},all()[i])).filter(x=>!x.m&&x.due&&x.due<=t).sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:0)}
const count=()=>Object.keys(all()).length;
window.SRS={INT,today,plus,id,get,add,setSelf,grade,due,count,all};
})();
