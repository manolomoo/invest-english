// node tools/collect.js 11 > /tmp/lesson-11.json → 列出該課所有要唸的字串（單字 say||word、例句、每一句課文、文法原句；已去重）
// 讀 lessons/lesson-NN.json。接著 python3 tools/build_audio.py 11 產音檔並回寫 JSON 的 audio 欄位。
const fs=require("fs"),path=require("path");
const id=String(process.argv[2]||"").padStart(2,"0");
if(!/^\d\d$/.test(id)){console.error("用法：node tools/collect.js 11");process.exit(1)}
const J=JSON.parse(fs.readFileSync(path.join(__dirname,"..","lessons",`lesson-${id}.json`),"utf8"));
const plain=s=>s.replace(/\s+/g," ").trim(); // 必須與 js/lesson.js 的 plain 相同
const S=new Set(),add=s=>{if(s&&typeof s==="string")S.add(s)};
J.vocab.forEach(v=>{add(v.say||v.word);add(v.example)});
J.sentences.forEach(s=>add(plain(s.en)));
(J.grammar||[]).forEach(g=>add(plain(g.quote)));
console.log(JSON.stringify([...S]));
