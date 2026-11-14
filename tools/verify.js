// node tools/verify.js → 逐課比對 tools/legacy 的舊資料與 lessons/*.json（文字 byte-identical、句數、單字數、文法、meta、音檔存在）。失敗以非 0 結束。
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,".."),leg=path.join(__dirname,"legacy");
const plain=s=>s.replace(/\s+/g," ").trim();
function load(file){const ctx={window:{}};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(leg,file),"utf8"),ctx);return ctx.window}
let bad=0,first=null;
const err=m=>{bad++;if(!first)first=m;if(bad<=30)console.log("✗",m)};
const eq=(where,a,b)=>{if(a!==b)err(`${where}\n    舊：${JSON.stringify(a)}\n    新：${JSON.stringify(b)}`)};
const refs=new Set();let nAudioChecked=0;
const chkAudio=(where,p,id,expectOld)=>{
  if(typeof p!=="string"){err(where+" 缺 audio");return}
  if(!p.startsWith(`audio/${id}/en_`)||!p.endsWith(".mp3"))err(where+" 路徑格式錯："+p);
  if(expectOld!==undefined)eq(where+" 音檔對照",expectOld.replace(`lesson${id}-audio/`,`audio/${id}/`),p);
  if(!fs.existsSync(path.join(root,p)))err(where+" 檔案不存在："+p);
  refs.add(p);nAudioChecked++};
const index=JSON.parse(fs.readFileSync(path.join(root,"lessons","index.json"),"utf8"));
const oldIdx=fs.readFileSync(path.join(leg,"index.html"),"utf8").match(/const L=(\[\s*\[[\s\S]*?\]\s*\]);/);const OL=vm.runInNewContext(oldIdx[1]);
eq("index 課數",String(index.length),"10");
let tv=0,ts=0,tg=0;
for(let n=1;n<=10;n++){
  const id=String(n).padStart(2,"0"),tag=`第${n}課`;
  const W=load(`lesson${id}-data.js`).WEEK,C=load(`lesson${id}-audio.js`).UNIT_C;
  const J=JSON.parse(fs.readFileSync(path.join(root,"lessons",`lesson-${id}.json`),"utf8"));
  const I=index[n-1];
  eq(tag+" index.id",I.id,id);eq(tag+" index.summary",I.summary,OL[n-1][3]);eq(tag+" index.title",I.title,OL[n-1][0]);eq(tag+" index.en",I.en,OL[n-1][1]);
  eq(tag+" id",J.id,id);eq(tag+" title",J.title,W.title);eq(tag+" n",String(J.n),String(W.n));eq(tag+" en",J.en,W.en);eq(tag+" chapter",J.chapter,W.chapter);eq(tag+" pdf",J.pdf,W.pdf);
  eq(tag+" index.chapter",I.chapter,W.chapter);eq(tag+" index.pdf",I.pdf,W.pdf);
  // 單字
  eq(tag+" 單字數",String(J.vocab.length),String(W.cards.length));
  W.cards.forEach((c,k)=>{const v=J.vocab[k]||{},w=`${tag} 單字${k+1}(${c.w})`;
    eq(w+" word",v.word,c.w);eq(w+" ipa",v.ipa,c.ipa);eq(w+" meaning",v.meaning,c.zh);eq(w+" example",v.example,c.ex);eq(w+" pos",v.pos,c.pos);eq(w+" def",v.def,c.def);eq(w+" exzh",v.exzh,c.exzh);eq(w+" say",v.say,c.say);
    chkAudio(w+" audio",v.audio,id,C[c.say||c.w]);if(c.ex)chkAudio(w+" exampleAudio",v.exampleAudio,id,C[c.ex])});
  // 句子
  const old=[];W.texts.forEach(t=>t.paras.forEach((p,pi)=>p.forEach((s,si)=>old.push({en:s,zh:t.zh[pi][si],pi,m:(t.meta||[])[pi]||{}}))));
  eq(tag+" 句數",String(J.sentences.length),String(old.length));
  old.forEach((o,k)=>{const s=J.sentences[k]||{},w=`${tag} 句${k+1}`;
    eq(w+" en",s.en,o.en);eq(w+" zh",s.zh,o.zh);eq(w+" para",String(s.para),String(o.pi));
    const m=s.meta||{};["k","cite","src"].forEach(f=>eq(w+" meta."+f,m[f],o.m[f]));
    chkAudio(w+" audio",s.audio,id,C[plain(o.en)])});
  // 文法
  const G=W.grammar||[];eq(tag+" 文法數",String(J.grammar.length),String(G.length));
  G.forEach((g,k)=>{const x=J.grammar[k]||{},w=`${tag} 文法${k+1}`;eq(w+" point",x.point,g.title);eq(w+" quote",x.quote,g.quote);eq(w+" explain",x.explain,g.note);chkAudio(w+" quoteAudio",x.quoteAudio,id,C[plain(g.quote)])});
  tv+=J.vocab.length;ts+=J.sentences.length;tg+=J.grammar.length;
  console.log(`第 ${id} 課：單字 ${J.vocab.length}／句 ${J.sentences.length}／文法 ${J.grammar.length}`);
}
// 音檔總數：audio/NN/ 共 343 個，且每個檔都被 JSON 用到
let files=[];for(const d of fs.readdirSync(path.join(root,"audio")))for(const f of fs.readdirSync(path.join(root,"audio",d)))if(f.endsWith(".mp3"))files.push(`audio/${d}/${f}`);
eq("audio/ 內 mp3 總數",String(files.length),"343");
files.forEach(f=>{if(!refs.has(f))err("音檔未被任何 JSON 引用："+f)});
eq("總單字 / 句 / 文法",`${tv}/${ts}/${tg}`,"119/171/29");
console.log(`音檔：磁碟 ${files.length} 個，JSON 引用 ${refs.size} 個不重複（共檢查 ${nAudioChecked} 個欄位）`);
console.log(bad?`\n失敗：${bad} 個不同處，第一個：${first}`:"\n全部通過 ✔");process.exit(bad?1:0);
