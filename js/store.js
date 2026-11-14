/* 本站專用的 localStorage 讀寫。所有存取包 try/catch；先探測是否可用，不可用（私密瀏覽等）就退回記憶體，不丟未捕捉例外。
   只使用本檔管的鍵：invSRS1（單字間隔重複）、invProg1（三步驟進度）。invRPG1／invRW1 由 rpg.js／rw.js 各自管，這裡不碰。 */
(function(){
let ok=true;const mem={};
try{localStorage.setItem("__t","1");localStorage.removeItem("__t")}catch(e){ok=false}
function get(key,def){
  if(ok){try{const v=localStorage.getItem(key);if(v!==null)return JSON.parse(v)}catch(e){}}
  return key in mem?mem[key]:def;
}
function set(key,val){
  mem[key]=val;
  if(ok){try{localStorage.setItem(key,JSON.stringify(val));return true}catch(e){ok=false}}
  return false;
}
/* 三步驟進度 invProg1：{ "01":{listen:1,study:1,recall:1,sh:[已聽過的句索引],rc:{"句索引":1記得|0不記得}} } */
const PK="invProg1";
const Prog={
  all(){const d=get(PK,{});return d&&typeof d==="object"?d:{}},
  get(id){return this.all()[id]||{}},
  patch(id,fn){const d=this.all();const x=d[id]=d[id]||{};fn(x);set(PK,d);return x},
  steps:["listen","study","recall"],
  done(id){const x=this.get(id);return !!(x.listen&&x.study&&x.recall)},
  /* 0 未開始／1 進行中／2 完成 */
  state(id){const x=this.get(id);const n=this.steps.filter(s=>x[s]).length;return n===3?2:(n>0||(x.sh&&x.sh.length)||(x.rc&&Object.keys(x.rc).length))?1:0}
};
window.Store={ok:()=>ok,get,set,Prog};
})();
