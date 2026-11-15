#!/usr/bin/env python3
"""產生 dict/en-zh.json：只含 10 課課文與單字卡會用到的詞（含詞形還原後的原形）。

用法：
  1. 另開一個空資料夾下載 ECDICT（MIT License, Copyright (c) Linwei / skywind3000）：
       https://github.com/skywind3000/ECDICT/releases  → ecdict-sqlite-28.zip（內含 stardict.db），解壓縮。
     不要把原始資料放進網站目錄。
  2. 在 repo 根目錄執行（需要 node 與 python 的 opencc）：
       python3 -I tools/build_dict.py /path/to/stardict.db dict/en-zh.json
  輸出：{"provide":"提供、供應、規定", ...}（台灣繁體，s2twp）。

規則：
  - 詞來源：lessonNN-data.js 所有課文句、cards[].w / ex 的英文 token（含連字號整詞與拆開的單詞）、
    cards[].w 的整組片語。
  - 詞形還原：ECDICT exchange 的 0:原形；複數／過去式／分詞（s d p 3）導向原形的詞義，
    比較級／最高級與 -ing 若本身有完整詞條則用本身的。原形也一併收錄。
  - 詞義：取前 1~2 個常用義，去掉詞性、標籤與括號註解，並限制長度。
"""
import json, re, sqlite3, subprocess, sys, os

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
db_path, out_path = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else os.path.join(root, "dict", "en-zh.json")

from opencc import OpenCC
cc = OpenCC("s2twp")

NODE = r"""
const fs=require("fs"),path=require("path");global.window=global;
const root=process.argv[1],out={cards:[],sents:[]};
for(let n=1;n<=10;n++){
  global.WEEK=undefined;
  eval(fs.readFileSync(path.join(root,"lesson"+String(n).padStart(2,"0")+"-data.js"),"utf8"));
  const W=window.WEEK;
  W.cards.forEach(c=>{out.cards.push(c.w);if(c.say)out.cards.push(c.say);if(c.ex)out.sents.push(c.ex)});
  W.texts.forEach(t=>t.paras.forEach(p=>p.forEach(s=>out.sents.push(s))));
}
console.log(JSON.stringify(out));
"""
data = json.loads(subprocess.check_output(["node", "-e", NODE, root]))

TOK = re.compile(r"[A-Za-z]+(?:[-'’][A-Za-z]+)*")
toks = set()
def add_tok(t):
    t = t.lower().replace("’", "'")
    toks.add(t)
    if "'" not in t:
        for p in t.split("-"):
            if p: toks.add(p)
    if t.endswith("'s"): toks.add(t[:-2])
    if t.endswith("n't"): toks.add(t[:-3])
for s in data["sents"] + data["cards"]:
    for m in TOK.findall(s):
        add_tok(m)
for w in data["cards"]:
    w = w.strip().lower()
    if w: toks.add(w)

con = sqlite3.connect(db_path)
def row(w):
    return con.execute("select translation,exchange,frq from stardict where word=? collate nocase", (w,)).fetchone()

def clean(tr):
    """ECDICT 簡中多行釋義 → 簡短學習用義（簡體，之後再轉繁體）"""
    senses = []
    for line in tr.split("\n"):
        line = line.strip()
        if not line or line.startswith("[") and "]" in line[:12] and len(line) < 14: continue
        line = re.sub(r"^[a-z]+\.\s*", "", line)            # 詞性
        line = re.sub(r"^(\[[^\]]*\]|<[^>]*>)\s*", "", line)  # [計] <美> 標籤
        line = re.sub(r"[（(][^）)]*[）)]", "", line)
        line = re.sub(r"\[[^\]]*\]", "", line)
        for s in re.split(r"[,，;；、]", line):
            s = s.strip()
            if s and s not in senses and len(s) <= 10 and not s.startswith("="):
                senses.append(s)
        if len(senses) >= 2: break
    out = []
    n = 0
    for s in senses[:2]:
        if n + len(s) > 14 and out: break
        out.append(s); n += len(s)
    return "、".join(out)

def reverse_lemma(w):
    """詞條沒標 0: 時，用簡單詞形規則找候選原形，並確認候選的 exchange 真的列出此詞形"""
    c = []
    if w.endswith("ies"): c.append(w[:-3] + "y")
    if w.endswith("es"): c.append(w[:-2])
    if w.endswith("s"): c.append(w[:-1])
    if w.endswith("ied"): c.append(w[:-3] + "y")
    if w.endswith("ed"): c += [w[:-2], w[:-1]]
    if w.endswith("ing"): c += [w[:-3], w[:-3] + "e"]
    for x in list(c):
        if len(x) > 2 and len(w) > 3 and w[-4:-3] == w[-5:-4] and w.endswith(("ed", "ing")): c.append(x[:-1])
    for x in c:
        r = row(x)
        if r and w in [kv.split(":", 1)[1].lower() for kv in (r[1] or "").split("/") if ":" in kv and kv[0] in "pd3si"]:
            return x
    return None

INFL = re.compile(r"(过去式|过去分词|现在分词|第三人称|复数|比较级|最高级)")
def meaning(w, depth=0):
    r = row(w)
    if not r: return ""
    tr, ex, frq = r
    kinds = {}
    for kv in (ex or "").split("/"):
        if ":" in kv:
            k, v = kv.split(":", 1); kinds[k] = v
    lemma = kinds.get("0")
    rev = False
    if not lemma:
        lemma = reverse_lemma(w); rev = bool(lemma)
    own = clean(tr or "")
    if lemma and depth < 2:
        f = kinds.get("1", "")
        redirect = rev or (not own) or INFL.search(tr or "") or any(c in f for c in "pd3s") and "i" not in f and "r" not in f and "t" not in f
        if redirect:
            lm = meaning(lemma, depth + 1)
            if lm: return lm
    return own

res = {}
lemmas = set()
for w in sorted(toks):
    m = meaning(w)
    if m: res[w] = m
    r = row(w)
    if r:
        for kv in (r[1] or "").split("/"):
            if kv.startswith("0:"): lemmas.add(kv[2:].lower())
for l in sorted(lemmas):
    if l not in res:
        m = meaning(l)
        if m: res[l] = m

out = {k: cc.convert(v) for k, v in sorted(res.items())}
os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print("tokens", len(toks), "entries", len(out), "bytes", os.path.getsize(out_path))
