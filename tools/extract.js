// node tools/extract.js → 從 tools/legacy/lessonNN-data.js 與 lessonNN-audio.js 產出 lessons/index.json 與 lessons/lesson-NN.json（一次轉檔，不改任何文字）
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,".."),leg=path.join(__dirname,"legacy");
const plain=s=>s.replace(/\s+/g," ").trim(); // 與舊 unit.js 的 plain 相同
// 首頁簡介句從舊 index.html 的陣列 L 取出（第 4 欄），一字不改
const SUMMARY=(()=>{const h=fs.readFileSync(path.join(leg,"index.html"),"utf8");const m=h.match(/const L=(\[\s*\[[\s\S]*?\]\s*\]);/);return vm.runInNewContext(m[1]).map(x=>x[3])})();
function load(file){const ctx={window:{}};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(leg,file),"utf8"),ctx);return ctx.window}
fs.mkdirSync(path.join(root,"lessons"),{recursive:true});
const index=[];let warn=0;
for(let n=1;n<=10;n++){
  const id=String(n).padStart(2,"0");
  const W=load(`lesson${id}-data.js`).WEEK,C=load(`lesson${id}-audio.js`).UNIT_C||{};
  const au=t=>{const f=C[t];if(!f){warn++;console.warn("⚠ 缺音檔：",id,JSON.stringify(t.slice(0,50)));return undefined}return f.replace(`lesson${id}-audio/`,`audio/${id}/`)};
  const vocab=W.cards.map(c=>{const o={word:c.w,ipa:c.ipa,meaning:c.zh,example:c.ex,pos:c.pos,def:c.def,exzh:c.exzh};
    if(c.say!==undefined)o.say=c.say;
    o.audio=au(c.say||c.w);if(c.ex)o.exampleAudio=au(c.ex);return o});
  const sentences=[];
  W.texts.forEach(t=>{const meta=t.meta||[];t.paras.forEach((p,pi)=>{const m=meta[pi];p.forEach((s,si)=>{
    const o={en:s,zh:t.zh[pi][si],audio:au(plain(s)),para:pi};
    if(m&&Object.keys(m).length)o.meta=m;sentences.push(o)})})});
  const grammar=(W.grammar||[]).map(g=>({point:g.title,quote:g.quote,explain:g.note,quoteAudio:au(plain(g.quote))}));
  const out={id,title:W.title,n:W.n,en:W.en,chapter:W.chapter,pdf:W.pdf,vocab,sentences,grammar};
  fs.writeFileSync(path.join(root,"lessons",`lesson-${id}.json`),JSON.stringify(out,null,1)+"\n");
  index.push({id,n:W.n,title:W.title,en:W.en,chapter:W.chapter,pdf:W.pdf,summary:SUMMARY[n-1]});
  console.log(id,"單字",vocab.length,"句",sentences.length,"文法",grammar.length);
}
fs.writeFileSync(path.join(root,"lessons","index.json"),JSON.stringify(index,null,1)+"\n");
console.log(warn?warn+" 個缺檔警告":"extract 完成，無缺檔");
