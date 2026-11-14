# 用法：node tools/collect.js 11 > /tmp/lesson-11.json && python3 tools/build_audio.py 11
# 讀 /tmp/lesson-NN.json（要唸的字串），產生 audio/NN/en_<sha1前16碼>.mp3（已存在的不重產；需 edge-tts 與 ffmpeg），
# 並把路徑回寫到 lessons/lesson-NN.json 的 audio／exampleAudio／quoteAudio 欄位。
import asyncio,hashlib,json,os,re,subprocess,sys
nn=str(sys.argv[1]).zfill(2);root=os.path.join(os.path.dirname(os.path.abspath(__file__)),"..");os.chdir(root)
VOICE="en-US-JennyNeural";RATE="-5%"
plain=lambda s:re.sub(r"\s+"," ",s).strip()
def fn(t):return f"audio/{nn}/en_"+hashlib.sha1(t.encode()).hexdigest()[:16]+".mp3"
async def one(t,sem):
    import edge_tts
    out=fn(t)
    if os.path.exists(out):return
    async with sem:
        for n in range(4):
            try:
                await edge_tts.Communicate(t,VOICE,rate=RATE).save(out+".raw");break
            except Exception as e:
                if n==3:raise
                await asyncio.sleep(2)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",out+".raw","-ac","1","-ar","24000","-b:a","96k","-f","mp3",out],check=True);os.remove(out+".raw")
async def main(texts):
    sem=asyncio.Semaphore(4);await asyncio.gather(*[one(t,sem) for t in texts])
def writeback():
    p=f"lessons/lesson-{nn}.json";J=json.load(open(p,encoding="utf8"))
    for v in J["vocab"]:
        v["audio"]=fn(v.get("say") or v["word"])
        if v.get("example"):v["exampleAudio"]=fn(v["example"])
    for s in J["sentences"]:s["audio"]=fn(plain(s["en"]))
    for g in J.get("grammar",[]):g["quoteAudio"]=fn(plain(g["quote"]))
    json.dump(J,open(p,"w",encoding="utf8"),ensure_ascii=False,indent=1);open(p,"a").write("\n")
if __name__=="__main__":
    texts=json.load(open(f"/tmp/lesson-{nn}.json",encoding="utf8"))
    os.makedirs(f"audio/{nn}",exist_ok=True)
    asyncio.run(main(texts));writeback();print(nn,len(texts),"個字串；已回寫 lessons/lesson-%s.json"%nn)
