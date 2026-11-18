// node tools/collect_memo_vocab_audio.js > /tmp/memo-vocab.json && python3 tools/build_audio.py memo-vocab
// 產生 memo-vocab-audio/*.mp3 與 memo-vocab-audio.js（單字 w 與例句 ex）。
const fs=require("fs"),path=require("path");global.window=global;
eval(fs.readFileSync(path.join(__dirname,"..","memo-ai-data.js"),"utf8"));
const M=window.MEMO,S=new Set();
(M.vocab||[]).forEach(v=>{[v.w,v.ex].forEach(s=>{if(s&&typeof s==="string")S.add(s)})});
console.log(JSON.stringify([...S]));
