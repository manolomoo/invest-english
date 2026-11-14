# 投資最重要的事｜學英文

純 HTML／CSS／JS 的靜態站（沒有框架、沒有建置步驟）。內容放在 `lessons/*.json`，版面放在 `lesson.html`、`index.html`、`review.html`，兩邊分開。

**一定要用網站網址或本機靜態伺服器開啟，不能直接雙擊 HTML 檔**（課程 JSON 是用 `fetch` 讀的，`file://` 讀不到）。本機測試：

```
cd invest-english
python3 -m http.server 8000     # 然後開 http://localhost:8000/
```

## 目錄

- `index.html` 課程目錄、整體進度、今日待複習、股神 RPG
- `lesson.html?id=01` 單課（步驟一盲聽、步驟二精讀、步驟三回想）
- `review.html` 單字卡間隔重複（1、3、7、14、30 天）
- `lesson01.html`…`lesson10.html` 舊網址的轉址頁
- `lessons/index.json`、`lessons/lesson-NN.json` 課程內容
- `audio/NN/` 預錄 mp3（檔名是文字 sha1 前 16 碼，不要改）
- `js/` 各頁邏輯；`tools/` 轉檔、驗證與產音檔工具；`tools/legacy/` 舊版資料，供 `tools/verify.js` 對照

## localStorage 鍵（上線後不要改）

`invRPG1`、`invAssetsOpen`（股神 RPG）、`invRW1`（練習紀錄）、`invSRS1`（單字排程）、`invProg1`（三步驟進度）。單元 id 是 `l`＋課號（`l1`…`l10`）。

## 新增第 11 課

1. 新增 `lessons/lesson-11.json`，欄位與現有課相同（可複製 `lesson-10.json` 改）：`id`（兩位數字串）、`n`、`title`、`en`、`chapter`、`pdf`、`vocab[]`（`word, ipa, meaning, example, pos, def, exzh`，必要時 `say`）、`sentences[]`（`en, zh, para`，引文／標題／對照／列表段落要加 `meta:{k:"q"|"h"|"pair"|"list", cite, src}`，同一段的句子寫一樣的 meta）、`grammar[]`（`point, quote, explain`）。英文、中譯、文法自己準備；`audio` 欄位下一步會產生。
2. 在 `lessons/index.json` 加一筆（`id, n, title, en, chapter, pdf, summary`）。首頁會自動多出第 11 課。
3. 準備 mp3 放到 `audio/11/`：
   ```
   node tools/collect.js 11 > /tmp/lesson-11.json
   python3 tools/build_audio.py 11      # 需要 edge-tts 與 ffmpeg；已存在的 mp3 不會重產，並自動回寫 JSON 的 audio／exampleAudio／quoteAudio
   ```
   也可以手動放檔，再自己填 `audio`、`exampleAudio`、`quoteAudio`（路徑如 `audio/11/en_xxxx.mp3`）。沒有音檔的句子會退回瀏覽器內建語音，並在 console 警告。
4. 股神練習紀錄不用改：`js/rw.js` 會依網址的 `id` 自動產生單元 `l11`。
5. 把所有 `?v=3`、`window.PAGEVER="3"` 與 `version.txt` 一起加一（例如改成 4），否則使用者看不到「有新版本」。
6. `git commit`、`git push` 到 `main`，等 GitHub Pages 部署。

## 驗證

`node tools/verify.js` 會逐課比對 `tools/legacy/` 的舊資料與 JSON（文字逐字相同、句數、單字數、文法、meta、mp3 都在 `audio/NN/`）。新增的第 11 課不在舊資料裡，驗證只涵蓋原本的 10 課。
