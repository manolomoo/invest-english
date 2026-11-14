// node tools/collect.js lesson01 > /tmp/lesson01.json → 所有會被唸出來的字串（單字 say/w、例句 ex、課文每一句、文法引句）
const fs=require("fs"),path=require("path");global.window=global;
const root=path.join(__dirname,"..");
eval(fs.readFileSync(path.join(root,process.argv[2]+"-data.js"),"utf8"));
const W=window.WEEK,S=new Set();const add=s=>{if(s&&typeof s==="string")S.add(s)};
const plain=s=>s.replace(/\s+/g," ").trim(); // 必須與 unit.js 的 plain 相同
W.cards.forEach(c=>{add(c.say||c.w);add(c.ex)});
W.texts.forEach(t=>t.paras.forEach(p=>p.forEach(s=>add(plain(s)))));
(W.grammar||[]).forEach(g=>add(plain(g.quote)));
console.log(JSON.stringify([...S]));
