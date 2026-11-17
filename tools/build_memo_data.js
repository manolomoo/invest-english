// node tools/build_memo_data.js → 產生 memo-ai-data.js（需要 memo-src/blocks.json）
const fs=require("fs");
const blocks=JSON.parse(fs.readFileSync("memo-src/blocks.json","utf8")).map(b=>b.kind==="table"?{kind:"table",head:["AI 子產業","可預測性評分","可預測性相當的傳統產業（分數）"],headEn:b.head,rows:[
["Regulated power utilities serving AI load","6-7","Regulated utilities (6)"],
["Data centers leased long-term to big tech companies","5-6","Large industrials (5-6)"],
["Hyperscalers","5","N/A"],
["Chips","4","Airlines, shipping (3-4)"],
["Speculative or “neocloud” data centers","2-3","Telecom/fiber ’98-’01 (2-3)"],
["Frontier labs (OpenAI, Anthropic, xAI, etc.)","2","—"],
["Early-stage VC","1-2","—"]]}:{kind:b.kind,text:b.text});
const S=require("./memo_content_summary.js"),Z=require("./memo_content_zh.js"),V=require("./memo_content_vocab.js");
const M={title:"門外漢談 AI",en:"A Layman Thinks About AI",date:"2026-11-11",author:"Howard Marks",
summary:{intro:S.intro,qs:S.qs.map(a=>({q:a[0],qzh:a[1],pt:a[2]})),end:{t:S.end[0],pt:S.end[1]}},
blocks,zh:Z.zh,notes:Z.notes,vocab:V};
fs.writeFileSync("memo-ai-data.js","window.MEMO="+JSON.stringify(M)+";\n");
console.log("ok",blocks.length,V.length);
