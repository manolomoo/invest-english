// node tools/check.js → 對照 SOURCE_LESSONS.md 檢查 10 課資料
const fs=require("fs");global.window=global;
const src=fs.readFileSync("SOURCE_LESSONS.md","utf8").split(/\n(?=## 第 \d+ 課)/).slice(1);
const norm=s=>s.replace(/\s+/g," ").trim();let bad=0;const err=m=>{bad++;console.log("✗",m)};
for(let n=1;n<=10;n++){
 const id="lesson"+String(n).padStart(2,"0");delete global.WEEK;
 eval(fs.readFileSync(id+"-data.js","utf8"));const W=global.WEEK||window.WEEK;
 const lines=src[n-1].split("\n").slice(1);const out=[];
 for(let l of lines){l=l.trim();if(!l||/^- (中英標題|所屬|對應)/.test(l)||l.startsWith("（本課"))continue;
  if(l.startsWith("###")){if(/^### What is/.test(l))out.push(l.slice(4));continue}
  if(l===">")continue;if(l.startsWith("> —"))continue;l=l.replace(/^> /,"").replace(/^- /,"");out.push(l)}
 const want=norm(out.join(" "));
 const sents=W.texts.flatMap(t=>t.paras.flat());const got=norm(sents.join(" "));
 if(want!==got){err(id+" 課文與 SOURCE 不同");const a=want.split(" "),b=got.split(" ");let k=0;while(k<a.length&&a[k]===b[k])k++;console.log("   第",k,"字：SOURCE=",a.slice(k,k+6).join(" ")," | 本站=",b.slice(k,k+6).join(" "))}
 W.texts.forEach(t=>{t.paras.forEach((p,pi)=>{if(!t.zh[pi]||t.zh[pi].length!==p.length)err(id+" zh 段 "+pi+" 句數不符");p.forEach((s,si)=>{if(!(t.zh[pi]&&t.zh[pi][si]))err(id+" 缺中譯 "+s.slice(0,30));if(/["']/.test(s))err(id+" 含直引號："+s.slice(0,30));if(/\s\s/.test(s)||s!==s.trim())err(id+" 空白："+s.slice(0,30))})});if(t.zh.length!==t.paras.length)err(id+" zh 段數不符")});
 if(W.cards.length<10||W.cards.length>15)err(id+" 單字數 "+W.cards.length);
 W.cards.forEach(c=>{["w","ipa","pos","zh","def","ex","exzh"].forEach(f=>{if(!c[f])err(id+" "+c.w+" 缺 "+f)});if(c.ex&&!got.includes(c.ex))err(id+" 例句不在課文："+c.w);if(c.ipa&&!/^\//.test(c.ipa))err(id+" ipa 格式 "+c.w)});
 const g=W.grammar||[];if(g.length<1||g.length>3)err(id+" 文法數 "+g.length);g.forEach(x=>{if(!got.includes(x.quote))err(id+" 文法引句不在課文："+x.title);if(!x.note||!x.title)err(id+" 文法缺欄位")});
 console.log(id,"單字",W.cards.length,"句",sents.length,"文法",g.length)}
const all=fs.readdirSync(".").filter(f=>/^lesson\d+-data\.js$/.test(f)).map(f=>fs.readFileSync(f,"utf8")).join("");
if(/secondlevel/i.test(all))err("出現 secondlevel");
if(/里面|程序|視頻|軟件|信息/.test(all))err("疑似大陸用語");
console.log(bad?bad+" 個問題":"全部通過");process.exit(bad?1:0);
