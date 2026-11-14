/* 股神 RPG（投資最重要的事｜學英文）— 需先載入 rw.js。練習紀錄與💵由 rw.js 負責，這裡算 XP、等級、頭像、投資組合。
   localStorage 鍵：invRPG1（RPG）、invAssetsOpen（投資組合展開狀態）。不讀寫任何其他站的鍵。 */
(function(){
const K="invRPG1";let MEM=null;
const ld=()=>{try{const v=localStorage.getItem(K);if(v)return JSON.parse(v)}catch(e){}return MEM||{}};
const sv=d=>{MEM=d;try{localStorage.setItem(K,JSON.stringify(d))}catch(e){}};
const TITLES=[["Rookie Investor","散戶小白"],["Bag Holder","韭菜"],["Chart Watcher","看盤新手"],["Dollar-Cost Averager","存股族"],["Index Investor","指數投資人"],["Value Seeker","價值學徒"],["Risk Aware","風險意識者"],["Contrarian","逆向思考者"],["Value Investor","價值投資者"],["Second-Level Thinker","第二層思考者"],["Cycle Watcher","週期觀察者"],["Patient Capital","耐心資本"],["Portfolio Manager","投資組合經理"],["Fund Manager","基金經理人"],["Risk Master","風險大師"],["Oaktree Associate","橡樹資本研究員"],["Market Sage","市場智者"],["Investment Master","投資大師"],["Legendary Investor","傳奇投資人"],["Grandmaster","投資宗師"],["Market Whisperer","市場先知"],["Capital Legend","資本傳奇"],["Immortal Investor","不朽投資人"],["Stock God","股神"]];
const MAXLV=24;
const need=L=>Math.round(190*Math.pow(L,0.60));            // Lv L → L+1 所需 XP
function lvOf(xp){let L=1,r=xp;while(L<MAXLV&&r>=need(L)){r-=need(L);L++}return L>=MAXLV?{L,cur:1,nx:1,max:true}:{L,cur:r,nx:need(L)}}   // 24 級滿級：經驗條 100%
const title=L=>TITLES[Math.min(L,TITLES.length)-1];
const ABIL=[
 {lv:2,id:"daily",name:"開盤加倍",desc:"每天前 10 次練習 XP ×2"},
 {lv:3,id:"hint1",name:"分析師提示 ×1",desc:"小測驗每天可用 1 次「💡 提示」刪掉一個錯誤選項"},
 {lv:4,id:"combo1",name:"連勝操作 I",desc:"連續答對 3 題起，答題 XP ×1.2"},
 {lv:4,id:"suit",name:"西裝上身",desc:"頭像造型解鎖：脫掉帽 T，換上西裝"},
 {lv:5,id:"bronze",name:"銅色領帶",desc:"領帶與頭像框解鎖：銅"},
 {lv:6,id:"hint2",name:"分析師提示 ×2",desc:"每天提示增為 2 次"},
 {lv:6,id:"xp10",name:"複利加成 +10%",desc:"所有 XP +10%"},
 {lv:7,id:"glasses",name:"研究員眼鏡",desc:"頭像造型解鎖：金框眼鏡"},
 {lv:8,id:"combo2",name:"連勝操作 II",desc:"連續答對 5 題起，答題 XP ×1.5"},
 {lv:8,id:"silver",name:"銀色領帶",desc:"領帶與頭像框解鎖：銀"},
 {lv:9,id:"case",name:"公事包",desc:"頭像造型解鎖：公事包"},
 {lv:10,id:"hint3",name:"分析師提示 ×3",desc:"每天提示增為 3 次"},
 {lv:10,id:"xp20",name:"複利加成 +20%",desc:"所有 XP +20%（取代 +10%）"},
 {lv:10,id:"gold",name:"金色領帶",desc:"領帶與頭像框解鎖：金"},
 {lv:11,id:"chart",name:"向上走勢圖",desc:"頭像背景解鎖：一路向右上的走勢圖"},
 {lv:12,id:"combo3",name:"連勝操作 III",desc:"連續答對 10 題起，答題 XP ×2"},
 {lv:12,id:"pocket",name:"口袋巾",desc:"頭像造型解鎖：西裝口袋巾"},
 {lv:15,id:"sage",name:"銀髮智者",desc:"頭像造型解鎖：兩鬢斑白，看過幾輪週期"},
 {lv:16,id:"oak",name:"橡樹徽章",desc:"頭像造型解鎖：翻領上的橡樹別針"},
 {lv:18,id:"goldsuit",name:"金線西裝",desc:"頭像造型解鎖：西裝翻領鑲金邊、金釦子"},
 {lv:20,id:"halo",name:"智慧光環",desc:"頭像造型解鎖：頭上金色光環、紫金頭像框"},
 {lv:22,id:"rays",name:"萬丈光芒",desc:"頭像造型解鎖：背後放射狀金光與星光"},
 {lv:24,id:"god",name:"股神桂冠與極光框",desc:"頭像造型解鎖：金色桂冠、虹彩領帶、極光頭像框（滿級）"}];
const has=(L,id)=>ABIL.some(a=>a.id===id&&L>=a.lv);
const ATTR={lis:"聽力",spk:"口說",voc:"詞彙"};
const attrOf=t=>t==="story"||t==="gram"?"lis":t==="speak"?"spk":t==="cards"||t==="quiz"?"voc":null;
/* [第一次, 重複]。crown＝每課每種題型第一次完成；king＝每課全部題型完成（兩者各只算一次）。 */
const BASE={cards:[10,3],story:[8,3],gram:[6,2],speak:[12,5],quizOk:[15,8],quizBad:[3,3],crown:[8,8],king:[60,60]};
const today=()=>new Date().toLocaleDateString("sv");
const attrLv=p=>Math.floor(Math.sqrt((p||0)/10));          // 屬性等級
const attrBonus=p=>Math.min(attrLv(p)*2,30);                 // 每屬性等級 +2% 該類 XP，上限 30%
function st(){const d=ld();d.xp=d.xp||0;d.at=d.at||{};d.day=d.day||{};if(d.day.d!==today())d.day={d:today(),n:0,h:0};d.combo=d.combo||0;d.best=d.best||0;d.cr=d.cr||{};return d}
/* ===== 我的投資組合：累計 XP 到了就自動解鎖（沒有商店、XP 不會被花掉）===== */
const CATS=[["cash","現金／定存","🏦"],["etf","ETF","📊"],["stock","股票","📈"],["bond","債券","📜"],["reit","REITs","🏢"],["alt","另類投資","🪙"],["icon","指標持股","🏆"]];
const W=1e4,Y=1e8;                                         // 萬、億（新台幣）
// 依 xp 由小到大排列；id 一旦上線就不要改。grow:1 = 股票／基金，身價會隨累計 XP 增值（value 為基準價）
const TREASURES=[
 {id:"cash-savings",xp:60,cat:"cash",name:"活存帳戶（第一桶金）",value:3*W,ico:"🐷"},
 {id:"cash-td1",xp:140,cat:"cash",name:"一年期定存單",value:10*W,ico:"🏦"},
 {id:"cash-mmf",xp:260,cat:"cash",name:"貨幣市場基金",value:25*W,ico:"💵"},
 {id:"etf-0050",xp:380,cat:"etf",name:"台灣 50 ETF 5 張",value:30*W,ico:"📊"},
 {id:"bond-tbill",xp:480,cat:"bond",name:"美國國庫券 T-Bill",value:40*W,ico:"📜"},
 {id:"etf-world",xp:580,cat:"etf",name:"全球股市 ETF",value:50*W,ico:"🌍"},
 {id:"stock-bluechip",xp:700,cat:"stock",name:"台灣藍籌股組合",value:80*W,ico:"🏭",grow:1},
 {id:"bond-gov",xp:820,cat:"bond",name:"美國公債 ETF",value:70*W,ico:"🏛️"},
 {id:"etf-div",xp:930,cat:"etf",name:"高股息 ETF",value:60*W,ico:"💰"},
 {id:"reit-tw",xp:1030,cat:"reit",name:"台灣 REITs 基金",value:40*W,ico:"🏬"},
 {id:"stock-tsmc",xp:1130,cat:"stock",name:"台積電 1 張",value:110*W,ico:"🔬",grow:1},
 {id:"bond-corp",xp:1260,cat:"bond",name:"投資等級公司債",value:120*W,ico:"🧾"},
 {id:"etf-sp500",xp:1390,cat:"etf",name:"S&P 500 ETF",value:100*W,ico:"🗽"},
 {id:"alt-gold1",xp:1520,cat:"alt",name:"黃金條塊 1 公斤",value:400*W,ico:"🥇"},
 {id:"stock-apple",xp:1660,cat:"stock",name:"Apple 蘋果 100 股",value:150*W,ico:"🍎",grow:1},
 {id:"reit-us",xp:1800,cat:"reit",name:"美國 REITs ETF",value:150*W,ico:"🏘️"},
 {id:"alt-commod",xp:1950,cat:"alt",name:"原物料 ETF",value:90*W,ico:"🛢️"},
 {id:"etf-semi",xp:2100,cat:"etf",name:"半導體 ETF",value:120*W,ico:"💾"},
 {id:"stock-nvda",xp:2260,cat:"stock",name:"NVIDIA 輝達 100 股",value:200*W,ico:"🎮",grow:1},
 {id:"bond-hy",xp:2430,cat:"bond",name:"高收益債 ETF",value:250*W,ico:"🎢"},
 {id:"stock-msft",xp:2600,cat:"stock",name:"Microsoft 微軟 100 股",value:350*W,ico:"🪟",grow:1},
 {id:"cash-usd",xp:2780,cat:"cash",name:"美元定存單",value:300*W,ico:"💲"},
 {id:"reit-office",xp:2960,cat:"reit",name:"商辦大樓 REIT",value:800*W,ico:"🏙️"},
 {id:"bond-em",xp:3150,cat:"bond",name:"新興市場債券基金",value:400*W,ico:"🌏"},
 {id:"alt-hedge",xp:3350,cat:"alt",name:"避險基金份額",value:2500*W,ico:"🛡️",grow:1},
 {id:"stock-tsmc10",xp:3560,cat:"stock",name:"台積電 10 張",value:1100*W,ico:"💎",grow:1},
 {id:"etf-bluechip",xp:3780,cat:"etf",name:"全球藍籌成長 ETF 組合",value:1500*W,ico:"🧭"},
 {id:"reit-data",xp:4010,cat:"reit",name:"資料中心 REIT",value:1500*W,ico:"🖥️"},
 {id:"icon-berkb",xp:4250,cat:"icon",name:"波克夏 B 股 500 股",value:750*W,ico:"🐝",grow:1},
 {id:"alt-pe",xp:4500,cat:"alt",name:"私募股權基金",value:5000*W,ico:"🔒",grow:1},
 {id:"bond-distress",xp:4760,cat:"bond",name:"不良債權基金",value:2000*W,ico:"🧯",grow:1},
 {id:"icon-oaktree-share",xp:5040,cat:"icon",name:"橡樹資本股份",value:3000*W,ico:"🌳",grow:1},
 {id:"alt-vc",xp:5330,cat:"alt",name:"創投基金",value:8000*W,ico:"🚀",grow:1},
 {id:"stock-bluechip-us",xp:5640,cat:"stock",name:"美股藍籌股大組合",value:4000*W,ico:"🏦",grow:1},
 {id:"reit-global",xp:5960,cat:"reit",name:"全球商用不動產組合",value:2*Y,ico:"🌆"},
 {id:"icon-berka",xp:6300,cat:"icon",name:"波克夏 A 股 1 股",value:2000*W,ico:"🏆",grow:1},
 {id:"alt-infra",xp:6700,cat:"alt",name:"基礎建設基金",value:1.5*Y,ico:"🌉"},
 {id:"cash-tbill-big",xp:7100,cat:"cash",name:"美國短債大額部位",value:3*Y,ico:"🇺🇸"},
 {id:"alt-credit",xp:7600,cat:"alt",name:"私人信貸基金",value:2*Y,ico:"🪙",grow:1},
 {id:"etf-allw",xp:8100,cat:"etf",name:"全天候資產配置組合",value:3.5*Y,ico:"☂️"},
 {id:"icon-tsmc100",xp:8700,cat:"icon",name:"台積電 100 張",value:1.1*Y,ico:"🏅",grow:1},
 {id:"stock-global",xp:9400,cat:"stock",name:"全球龍頭股大組合",value:6*Y,ico:"🌐",grow:1},
 {id:"bond-gov-big",xp:10100,cat:"bond",name:"各國公債大組合",value:8*Y,ico:"🗂️"},
 {id:"alt-distress-fund",xp:10900,cat:"alt",name:"困境債權旗艦基金份額",value:10*Y,ico:"🩹",grow:1},
 {id:"reit-landmark",xp:11700,cat:"reit",name:"地標大樓整棟持有",value:15*Y,ico:"🗼"},
 {id:"icon-fund-lp",xp:12600,cat:"icon",name:"橡樹旗艦基金 LP 權益",value:20*Y,ico:"🌲",grow:1},
 {id:"alt-family",xp:13800,cat:"alt",name:"家族辦公室",value:30*Y,ico:"🏰"},
 {id:"icon-sovereign",xp:15200,cat:"icon",name:"主權級資產配置部位",value:50*Y,ico:"🧿"},
 {id:"icon-stockgod",xp:17000,cat:"icon",name:"股神的投資帝國",value:100*Y,ico:"👑",grow:1}];
const catName=c=>(CATS.find(x=>x[0]===c)||[,""])[1];
const growPct=xp=>Math.round(Math.min(Math.max(xp,0),50000)/50000*80);       // 增值：每 625 XP +1%，上限 +80%
const trValue=(t,xp)=>t.grow?Math.round(t.value*(1+growPct(xp)/100)/1000)*1000:t.value;
const num=n=>Math.round(n).toLocaleString("en-US");
function money(n){const w=Math.round(n/W);if(w<1)return num(n)+" 元";const y=Math.floor(w/1e4),r=w%1e4;return y?num(y)+" 億"+(r?" "+num(r)+" 萬":""):num(w)+" 萬"}
const owned=xp=>TREASURES.filter(t=>xp>=t.xp);
const worth=xp=>owned(xp).reduce((a,t)=>a+trValue(t,xp),0);
const SAYINGS=["第二層思考：別人都這麼想的時候，先問自己，這件事還便宜嗎？","每天多念一句英文，就像定期定額，時間會幫你複利。","風險不是波動，風險是永久損失本金的可能。","Howard Marks 提醒：週期一定會回頭，只是不知道什麼時候。","想要勝過市場，得先想得和大家不一樣，而且要想對。","You can't predict, you can prepare. 預測不了，但可以先準備。","耐心也是一種資本，英文和部位都一樣，慢慢滾大。","今天的單字，是明天讀懂原文備忘錄的本錢。","好日子只會教壞功課：順風時更要保持警覺。","最重要的事不只一件，但每天練一點，就是其中一件。","便宜的好東西，往往在大家最悲觀的時候出現。","回音法跟讀三十秒，勝過滑三十分鐘財經新聞。"];
function saying(){const d=new Date(),n=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()))/864e5);return SAYINGS[n%SAYINGS.length]}
/* ===== 頭像：投資人。Lv1 帽 T 散戶 → Lv4 西裝 → 領帶 → 眼鏡 → 公事包 → 走勢圖 → 銀髮 → 橡樹徽章 → 金線西裝 → 光環 → 光芒 → 桂冠（共 12 種外觀變化）===== */
let AVN=0;
function avatar(L,sz){sz=sz||56;const Lh=id=>has(L,id),u="iv"+(++AVN)+"_";
 const SK="#f2c9a5",HR=Lh("sage")?"#b9bcc6":"#3b2a20";
 const tie=Lh("god")?`url(#${u}t)`:Lh("gold")?"#f5b301":Lh("silver")?"#cfd6e0":Lh("bronze")?"#c77d4a":null;
 let defs="",back="",front="";
 if(Lh("god"))defs+=`<linearGradient id="${u}t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9ad5"/><stop offset=".4" stop-color="#7fe3ff"/><stop offset=".75" stop-color="#ffe08a"/><stop offset="1" stop-color="#8ff0d0"/></linearGradient>`;
 if(Lh("rays")){defs+=`<radialGradient id="${u}a"><stop offset=".3" stop-color="#fff3b8" stop-opacity=".9"/><stop offset=".75" stop-color="#ffd25a" stop-opacity=".4"/><stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></radialGradient>`;
  back+=`<circle cx="32" cy="32" r="31.5" fill="url(#${u}a)"/>`;const n=Lh("god")?16:12;for(let k=0;k<n;k++){const a=k/n*6.2832,c=Math.cos(a),s=Math.sin(a);back+=`<path d="M${(32+c*22).toFixed(1)} ${(32+s*22).toFixed(1)}L${(32+c*31).toFixed(1)} ${(32+s*31).toFixed(1)}" stroke="${Lh("god")&&k%2?"#7fe3ff":"#f5b301"}" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>`}}
 if(Lh("chart"))back+=`<path d="M3 52L16 44 24 48 36 34 44 38 61 14" fill="none" stroke="#1fb36b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/><path d="M52 13.500l9 .5-.5 9z" fill="#1fb36b" opacity=".6"/>`;
 // 身體：Lv1–3 帽 T；Lv4 起西裝
 let body;
 if(!Lh("suit"))body=`<path d="M10 64c0-11 7-17 22-17s22 6 22 17z" fill="#7a8aa8"/><path d="M23 47q9 7 18 0" fill="none" stroke="#5c6a86" stroke-width="2.200"/><path d="M29 52v6M35 52v6" stroke="#e8ecf4" stroke-width="1.200" stroke-linecap="round"/><path d="M22 60h20" stroke="#5c6a86" stroke-width="1" opacity=".6"/>`;
 else{const sc=Lh("goldsuit")?"#1b2744":"#2a3f6e";
  body=`<path d="M10 64c0-11 7-17 22-17s22 6 22 17z" fill="${sc}"/><path d="M26.500 47L32 58l5.500-11z" fill="#fff"/>`+
   (tie?`<path d="M32 49.500l-2.200 2.300 1.700 9.700h1l1.700-9.700z" fill="${tie}" stroke="#0004" stroke-width=".4" stroke-linejoin="round"/><path d="M29.800 48.200h4.400l-.6 2.300h-3.200z" fill="${tie}" stroke="#0004" stroke-width=".4"/>`:"")+
   `<path d="M24 47.500L32 62.500M40 47.500L32 62.500" fill="none" stroke="${Lh("goldsuit")?"#f5b301":"#0005"}" stroke-width="${Lh("goldsuit")?1.5:1}" stroke-linecap="round"/>`+
   (Lh("goldsuit")?'<circle cx="32" cy="60" r="1.100" fill="#f5b301"/><circle cx="32" cy="63" r="1.100" fill="#f5b301"/>':"")+
   (Lh("pocket")?'<path d="M38 55.500l1.600-2.800 3 .4-.8 2.400z" fill="#fff" stroke="#c9ccd6" stroke-width=".5"/><path d="M39.600 54l.5 1.500" stroke="#e8463a" stroke-width=".7"/>':"")+
   (Lh("oak")?'<circle cx="25.800" cy="53" r="2.300" fill="#2f9e5b" stroke="#16703d" stroke-width=".6"/><path d="M25.800 55v2" stroke="#7a4a21" stroke-width="1" stroke-linecap="round"/>':"")}
 // 臉
 const glasses=Lh("glasses")?`<circle cx="27.500" cy="26" r="3.600" fill="#fff3" stroke="#d9a400" stroke-width="1"/><circle cx="36.500" cy="26" r="3.600" fill="#fff3" stroke="#d9a400" stroke-width="1"/><path d="M31.100 25.800h1.800M23.900 25.500L22.800 24.800M40.100 25.500l1.100-.7" stroke="#d9a400" stroke-width="1" stroke-linecap="round"/>`:"";
 const face=`<path d="M28.500 34h7v13h-7z" fill="${SK}"/><ellipse cx="32" cy="25.500" rx="9.500" ry="10.500" fill="${SK}"/><path d="M22 25c-.5-9 5-13.500 10-13.500S42.500 16 42 25c-3-1-7-4-10-8-3 4-7 7-10 8z" fill="${HR}"/><circle cx="27.500" cy="26" r="1.200" fill="#2b2b33"/><circle cx="36.500" cy="26" r="1.200" fill="#2b2b33"/><path d="M26 22.800q1.700-1 3.600-.3M34.400 22.500q1.900-.7 3.600.3" fill="none" stroke="${HR}" stroke-width=".9" stroke-linecap="round"/><path d="M28.500 31q3.500 3 7 0" fill="none" stroke="#b5533c" stroke-width="1.100" stroke-linecap="round"/><circle cx="22.500" cy="26.500" r="1.300" fill="${SK}"/><circle cx="41.500" cy="26.500" r="1.300" fill="${SK}"/>${glasses}`;
 if(Lh("case"))front+=`<path d="M47 50.500c0-4.500 9-4.500 9 0" fill="none" stroke="#5b3a1e" stroke-width="1.600"/><rect x="43" y="50" width="17" height="11.500" rx="2.200" fill="#8a5a2b" stroke="#5b3a1e" stroke-width="1"/><path d="M43.300 54.500h16.400" stroke="#5b3a1e" stroke-width=".9"/><rect x="49.200" y="53" width="3.600" height="3.200" rx=".7" fill="#f5b301" stroke="#c78a00" stroke-width=".5"/>`;
 if(Lh("halo"))front+=`<ellipse cx="32" cy="6.500" rx="11" ry="3.200" fill="none" stroke="#f5b301" stroke-width="2.200"/><ellipse cx="32" cy="6.500" rx="11" ry="3.200" fill="none" stroke="#fff3b8" stroke-width=".8"/>`;
 if(Lh("god")){const lf=[];for(let k=0;k<7;k++){const a=2.35+k*.2,x=32+Math.cos(a)*17,y=22+Math.sin(a)*17,x2=32-Math.cos(a)*17+Math.cos(a)*0;lf.push([x,y,32+(32-x),y])}
  front+=lf.map(p=>`<ellipse cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" rx="1.200" ry="2.600" fill="#f5b301" stroke="#c78a00" stroke-width=".4" transform="rotate(${(-20-(p[1]-22)*3).toFixed(0)} ${p[0].toFixed(1)} ${p[1].toFixed(1)})"/><ellipse cx="${p[2].toFixed(1)}" cy="${p[3].toFixed(1)}" rx="1.200" ry="2.600" fill="#f5b301" stroke="#c78a00" stroke-width=".4" transform="rotate(${(20+(p[1]-22)*3).toFixed(0)} ${p[2].toFixed(1)} ${p[3].toFixed(1)})"/>`).join("")+
   `<path d="M23 12.500l2-8 5 4.500 2-7 2 7 5-4.500 2 8z" fill="#f5b301" stroke="#c78a00" stroke-width=".9" stroke-linejoin="round"/><circle cx="32" cy="3" r="1.300" fill="#e8463a"/>`+[[8,12,2.8],[56,10,3.2],[6,36,2.2],[58,34,2.6]].map(p=>`<path d="M${p[0]} ${p[2]*-1+p[1]}Q${p[0]} ${p[1]} ${p[0]+p[2]} ${p[1]}Q${p[0]} ${p[1]} ${p[0]} ${p[1]+p[2]}Q${p[0]} ${p[1]} ${p[0]-p[2]} ${p[1]}Q${p[0]} ${p[1]} ${p[0]} ${p[1]-p[2]}z" fill="#fff3b8" stroke="#d9a400" stroke-width=".4"/>`).join("")}
 const svg=`<svg viewBox="0 0 64 64" width="${sz}" height="${sz}" aria-hidden="true">${defs?"<defs>"+defs+"</defs>":""}${back}${body}${face}${front}</svg>`;
 // 頭像框：Lv5 銅、Lv8 銀、Lv10 金；Lv20 紫金；Lv24 極光
 const fr=Lh("gold")?"#f5b301":Lh("silver")?"#b8c0cc":Lh("bronze")?"#c77d4a":"var(--ln)";
 const gb=g=>`border-color:transparent;background:linear-gradient(var(--cd,#fff),var(--cd,#fff)) padding-box,${g} border-box;`;
 const fs=Lh("god")?gb("conic-gradient(#5ef0d0,#7c9cff,#e66bff,#ff9ad5,#ffd36b,#5ef0d0)")+`box-shadow:0 0 ${Math.round(sz/4)}px #7fe3ffaa,0 0 ${Math.round(sz/8)}px #ff9ad5aa;`:Lh("halo")?gb("conic-gradient(#f5b301,#7c3fd1,#fff1b0,#f5b301,#7c3fd1,#f5b301)")+`box-shadow:0 0 ${Math.round(sz/5)}px #f5b301bb;`:`border-color:${fr};`;
 return `<span class="rp-av" style="width:${sz+10}px;height:${sz+10}px;${fs}">${svg}</span>`}
const css=document.createElement("style");css.textContent=`
:root{--rp:#168a52;--rp2:#d9a400;--rpt:#fff}@media(prefers-color-scheme:dark){:root{--rp:#3ecf8e;--rp2:#f5c542;--rpt:#0b1a12}}
.rp-av{display:inline-flex;align-items:center;justify-content:center;border:4px solid;border-radius:50%;background:var(--cd,#fff);flex:0 0 auto;overflow:hidden}
.rp-bar{height:10px;border-radius:99px;background:var(--ln);overflow:hidden}.rp-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--rp),var(--rp2));border-radius:99px;transition:width .6s}
.rp-mini{position:fixed;right:12px;top:12px;z-index:96;background:var(--cd,#fff);border:1px solid var(--ln);border-radius:16px;padding:5px 6px;display:flex;align-items:center;gap:6px;box-shadow:0 4px 14px #0003;color:var(--fg);width:176px}
body:has(.rp-mini) .wk-top{padding-right:188px;align-items:flex-start}body:has(.rp-mini) .wk-top h1,body:has(.rp-mini) .wk-top .en{margin-right:-188px}body:has(.rp-mini) .wk-top h1{padding-top:40px;white-space:normal}
/* 迷你 HUD 是 fixed：頁頂時標題區留白、分頁列在 HUD 下方；往下捲後 HUD 變半透明並讓點擊穿透，不擋任何按鈕 */
.rp-mini{transition:opacity .2s}.rp-mini.fade{opacity:.35;pointer-events:none}
.rp-go{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;color:inherit;text-decoration:none}
.rp-mini .rp-av{border-width:3px}.rp-mini b{font-size:13px}.rp-mini .rp-bar{height:7px;margin-top:3px}
.rp-xp{position:fixed;right:40px;top:64px;z-index:97;font-weight:900;font-size:20px;color:var(--rp);pointer-events:none;animation:rpx 1.3s ease forwards;text-shadow:0 1px 0 var(--cd,#fff)}
@keyframes rpx{0%{opacity:0;transform:translateY(-8px) scale(.7)}20%{opacity:1;transform:translateY(0) scale(1.15)}100%{opacity:0;transform:translateY(40px)}}
.rp-up{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:#0008;animation:rpf 3.2s ease forwards}
.rp-up>div{background:var(--cd,#fff);color:var(--fg);border-radius:22px;padding:22px 26px;text-align:center;border:3px solid var(--rp2);max-width:86vw;animation:rpz .5s cubic-bezier(.2,1.6,.4,1)}
.rp-up h2{margin:6px 0;font-size:30px;background:linear-gradient(90deg,var(--rp),var(--rp2));-webkit-background-clip:text;background-clip:text;color:transparent}
@keyframes rpz{from{transform:scale(.2) rotate(-8deg)}to{transform:scale(1)}}@keyframes rpf{0%,85%{opacity:1}100%{opacity:0;visibility:hidden}}
.rp-card{background:var(--cd);border:1px solid var(--ln);border-radius:18px;padding:16px}
.rp-row{display:flex;gap:12px;align-items:center}.rp-at{display:grid;grid-template-columns:44px 1fr 64px;gap:6px 8px;align-items:center;font-size:14px;margin-top:12px}
.rp-hint{margin:4px auto 0;padding:6px 12px;border-radius:99px;border:1px dashed var(--rp);background:transparent;color:var(--rp);font-weight:700;font-size:14px}.rp-hint:disabled{opacity:.5}
.rp-ab{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.rp-as-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.rp-as-h b{font-size:18px}.rp-as-h span{font-size:13px;color:var(--mu);white-space:nowrap}
.rp-as-v{font-size:22px;font-weight:900;line-height:1.3;min-width:0;overflow-wrap:anywhere;background:linear-gradient(90deg,var(--rp),var(--rp2));-webkit-background-clip:text;background-clip:text;color:transparent}
.rp-as-v small{font-size:13px;font-weight:700;color:var(--mu);margin-right:6px}
.rp-as-n{font-size:13px;color:var(--mu);margin-top:6px;overflow-wrap:anywhere}.rp-as-q{font-size:13px;margin-top:8px;padding:8px 10px;border-radius:12px;border:1px dashed var(--ln);color:var(--fg);line-height:1.6}
.rp-card.rp-as{padding:0;overflow:hidden}
#rpg #assets{margin-top:12px;padding-top:10px;border-top:1px solid var(--ln)}
#rpg #assets .rp-as-t{padding:6px 2px;min-height:40px;border-radius:10px}
#rpg #assets .rp-as-h b{font-size:15px}#rpg #assets .rp-as-v{font-size:20px}#rpg #assets .rp-as-p{padding:0 0 4px}
.rp-as-t{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;margin:0;padding:12px 16px;border:0;border-radius:17px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.rp-as-t:active{background:#16a05d1f}.rp-as-t:focus{outline:none}.rp-as-t:focus-visible{outline:3px solid var(--rp);outline-offset:-3px}
@media(hover:hover){.rp-as-t:hover{background:#16a05d12}}
.rp-as-x{display:block;flex:1 1 auto;min-width:0}.rp-as-h{flex-wrap:wrap}.rp-as-h b{overflow-wrap:anywhere}
.rp-as-l{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:0 10px;margin-top:2px}
.rp-as-s{font-size:12px;color:var(--mu);overflow-wrap:anywhere}.rp-as.open .rp-as-s{display:none}
.rp-as-c{flex:0 0 auto;width:32px;height:32px;border-radius:50%;border:1px solid var(--ln);display:flex;align-items:center;justify-content:center;font-style:normal;font-size:16px;line-height:1;color:var(--rp)}
.rp-as-c::before{content:"▸"}.rp-as.open .rp-as-c::before{content:"▾"}
.rp-as-b{display:grid;grid-template-rows:0fr;opacity:0;visibility:hidden;transition:grid-template-rows .25s ease,opacity .25s ease,visibility 0s .25s}
.rp-as.open .rp-as-b{grid-template-rows:1fr;opacity:1;visibility:visible;transition:grid-template-rows .25s ease,opacity .25s ease,visibility 0s}
.rp-as-bi{min-height:0;min-width:0;overflow:hidden}.rp-as-p{padding:0 16px 16px}
@media(prefers-reduced-motion:reduce){.rp-as-b,.rp-as.open .rp-as-b{transition:none}}
.rp-tabs{display:flex;gap:6px;overflow-x:auto;margin:12px -4px 10px;padding:0 4px 4px;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.rp-tabs button{flex:0 0 auto;min-height:44px;min-width:44px;padding:0 12px;border-radius:99px;border:1px solid var(--ln);background:var(--cd);color:var(--fg);font:inherit;font-size:13px;font-weight:700;white-space:nowrap;cursor:pointer}
.rp-tabs button i{font-style:normal;font-weight:400;color:var(--mu);margin-left:4px;font-size:12px}.rp-tabs button.on{background:var(--rp);border-color:var(--rp);color:var(--rpt)}.rp-tabs button.on i{color:inherit;opacity:.8}
.rp-tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
.rp-ti{border:1px solid var(--ln);border-radius:14px;padding:10px 6px 8px;text-align:center;min-width:0;position:relative}
.rp-ti .e{font-size:30px;line-height:1.2}.rp-ti .n{font-size:12px;font-weight:700;line-height:1.35;margin-top:4px;overflow-wrap:anywhere}.rp-ti .v{font-size:12px;color:#b07d00;font-weight:800;margin-top:3px}
.rp-ti .c{font-size:11px;color:var(--mu);margin-top:2px}.rp-ti .g{font-size:11px;color:var(--rp);font-weight:700}
.rp-ti.on{border-color:#f5b30188;background:linear-gradient(180deg,#f5b30114,transparent)}
.rp-ti.off{border-style:dashed}.rp-ti.off .e{filter:grayscale(1) contrast(0);opacity:.45}.rp-ti.off .n,.rp-ti.off .v{color:var(--mu);font-weight:600}
.rp-ti.nx{border-color:var(--rp);border-style:solid}.rp-ti.nx .v{color:var(--rp);font-weight:800}
@media(prefers-color-scheme:dark){.rp-ti .v{color:#f5c542}}
.rp-box{position:fixed;inset:0;z-index:102;display:flex;align-items:center;justify-content:center;background:#0009;padding:16px;animation:rpbf .25s ease}
.rp-box>div{background:var(--cd,#fff);color:var(--fg);border-radius:22px;padding:20px 22px 16px;text-align:center;border:3px solid var(--rp2);box-shadow:0 0 0 4px #16a05d55,0 12px 40px #0006;width:min(340px,100%);max-height:90vh;overflow:auto;animation:rpz .5s cubic-bezier(.2,1.6,.4,1)}
.rp-box .k{font-weight:900;font-size:22px;background:linear-gradient(90deg,var(--rp),var(--rp2));-webkit-background-clip:text;background-clip:text;color:transparent}
.rp-box .e{font-size:64px;line-height:1.2;margin:6px 0 2px}.rp-box .es{font-size:34px;line-height:1.3;margin:8px 0 4px;letter-spacing:2px}
.rp-box .n{font-size:19px;font-weight:900;line-height:1.35}.rp-box .c{font-size:13px;color:var(--mu);margin-top:4px}.rp-box .v{font-size:17px;font-weight:800;color:#b07d00;margin-top:6px}
.rp-box .l{font-size:13px;line-height:1.6;margin-top:6px;text-align:left}
.rp-box .bt{display:flex;gap:8px;justify-content:center;margin-top:14px}.rp-box button{min-height:44px;padding:0 18px;border-radius:99px;border:1px solid var(--ln);background:transparent;color:var(--fg);font:inherit;font-size:15px;font-weight:700;cursor:pointer}
.rp-box button.go{background:var(--rp);border-color:var(--rp);color:var(--rpt)}
@media(prefers-color-scheme:dark){.rp-box .v{color:#f5c542}}
@keyframes rpbf{from{opacity:0}to{opacity:1}}
.rp-toast{position:fixed;right:12px;top:74px;z-index:101;display:flex;align-items:center;gap:8px;min-height:48px;max-width:min(300px,calc(100vw - 24px));padding:7px 14px 7px 10px;border-radius:16px;background:var(--cd,#fff);color:var(--fg);border:2px solid var(--rp2);box-shadow:0 4px 16px #0004;pointer-events:none;animation:rptn .35s cubic-bezier(.2,1.5,.4,1)}
.rp-toast .e{font-size:28px;line-height:1;flex:0 0 auto}.rp-toast .x{min-width:0}.rp-toast small{display:block;font-size:11px;font-weight:800;color:var(--rp)}.rp-toast b{display:block;font-size:14px;line-height:1.3}.rp-toast em{display:block;font-style:normal;font-size:11px;color:var(--mu)}
.rp-toast.out{opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s}
@keyframes rptn{from{opacity:0;transform:translateY(14px) scale(.8)}to{opacity:1;transform:none}}
.rp-dt{font-size:13px;line-height:1.7}.rp-dt p{margin:0 0 6px}`;
document.head.appendChild(css);
function beep(){try{const A=window.AudioContext||window.webkitAudioContext;const c=new A();[523,659,784,1047].forEach((f,i)=>{const o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.value=f;g.gain.setValueAtTime(.0001,c.currentTime+i*.12);g.gain.exponentialRampToValueAtTime(.18,c.currentTime+i*.12+.02);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+i*.12+.3);o.connect(g).connect(c.destination);o.start(c.currentTime+i*.12);o.stop(c.currentTime+i*.12+.32)});setTimeout(()=>c.close(),1500)}catch(e){}}
const EMO=["📈","💰","✨","💎","🏆"];
function levelUp(L){const t=title(L),nw=ABIL.filter(a=>a.lv===L);const d=document.createElement("div");d.className="rp-up";
 d.innerHTML=`<div>${avatar(L,L>12?96:80)}<div style="font-weight:800;color:var(--rp);margin-top:6px">晉級！</div><h2>Lv ${L}</h2><div style="font-size:20px;font-weight:800">${t[0]}｜${t[1]}</div>${nw.length?'<div style="margin-top:8px">解鎖：'+nw.map(a=>"<b>"+a.name+"</b>").join("、")+"</div>":""}</div>`;
 d.onclick=()=>d.remove();document.body.appendChild(d);setTimeout(()=>d.remove(),3300);beep();
 for(let k=0;k<20;k++){const c=document.createElement("span");c.className="rw-cf";c.textContent=EMO[k%5];c.style.left=Math.random()*100+"vw";c.style.animationDelay=Math.random()*.5+"s";document.body.appendChild(c);setTimeout(()=>c.remove(),2600)}}
function pop(txt){const e=document.createElement("div");e.className="rp-xp";e.textContent=txt;document.body.appendChild(e);setTimeout(()=>e.remove(),1300)}
let homeEl=null;                                           // 首頁才有；單元頁用 mini
function confetti(n,z){for(let k=0;k<n;k++){const c=document.createElement("span");c.className="rw-cf";c.textContent=EMO[k%5];c.style.left=Math.random()*100+"vw";c.style.animationDelay=Math.random()*.5+"s";if(z)c.style.zIndex=z;document.body.appendChild(c);setTimeout(()=>c.remove(),3000)}}
function seeAll(){asSet(true);if(homeEl){const a=document.getElementById("assets");asApply(a,true);if(a&&a.scrollIntoView)a.scrollIntoView({behavior:"smooth",block:"start"})}else location.href="index.html#assets"}
// 解鎖視窗（首頁、補開摘要）：點任何地方或「關閉」都會關，時間到自動關
function openBox(items,sum){document.querySelectorAll(".rp-box").forEach(x=>x.remove());if(!items.length)return;const xp=st().xp,d=document.createElement("div");d.className="rp-box";d.setAttribute("role","dialog");let h;
 if(items.length===1&&!sum){const t=items[0];h=`<div class="k">🎁 新資產入袋！</div><div class="e">${t.ico}</div><div class="n">${t.name}</div><div class="c">${catName(t.cat)}${t.grow?"・會隨 XP 增值":""}</div><div class="v">市值 ${money(trValue(t,xp))}</div><div class="bt"><button type="button">關閉</button></div>`}
 else{const top=items.slice(-6),tot=items.reduce((a,t)=>a+trValue(t,xp),0);
  h=`<div class="k">🎁 新資產入袋！</div><div class="n" style="margin-top:6px">${sum?"一次補上 "+items.length+" 項投資組合":"一次入袋 "+items.length+" 項資產"}</div><div class="es">${top.map(t=>t.ico).join("")}${items.length>top.length?"…":""}</div>${items.length<=4?'<div class="l">'+items.map(t=>t.ico+" "+t.name+"（"+money(trValue(t,xp))+"）").join("<br>")+"</div>":sum?'<div class="c">之前累積的 XP 已自動換成資產，經驗值不會被花掉</div>':""}<div class="v">合計市值 ${money(tot)}</div><div class="bt"><button type="button" class="go">查看全部</button><button type="button">關閉</button></div>`}
 d.innerHTML="<div>"+h+"</div>";let tm=0;const close=()=>{clearTimeout(tm);d.remove()};d.onclick=close;
 const go=d.querySelector("button.go");if(go)go.onclick=e=>{e.stopPropagation();close();seeAll()};
 document.body.appendChild(d);tm=setTimeout(close,sum?(homeEl?6000:4000):3800);confetti(sum||items.length>1?18:14,103)}
// 單元頁：mini-HUD 下方的小吐司（右上角，不接收點擊），不擋回音法按鈕，約 2.5 秒自動消失
function toast(items){document.querySelectorAll(".rp-toast").forEach(x=>x.remove());if(!items.length)return;const xp=st().xp,t=items[items.length-1],n=items.length,d=document.createElement("div");d.className="rp-toast";d.setAttribute("role","status");
 d.innerHTML=`<span class="e">${t.ico}</span><span class="x"><small>🎁 新資產入袋！${n>1?"一次 "+n+" 項":catName(t.cat)}</small><b>${n>1?t.name+" 等 "+n+" 項":t.name}</b><em>市值 ${money(n>1?items.reduce((a,i)=>a+trValue(i,xp),0):trValue(t,xp))}</em></span>`;
 document.body.appendChild(d);setTimeout(()=>d.classList.add("out"),2300);setTimeout(()=>d.remove(),2600);confetti(6)}
// 檢查新解鎖：第一次執行把已達標的全部記為看過（只跳一次摘要）；之後只對真正新的 id 動畫
function trCheck(delay){const s=st(),got=owned(s.xp);
 if(!s.trInit){s.trInit=1;s.trSeen=got.map(t=>t.id);sv(s);if(got.length)openBox(got,true);return got}
 const seen=Array.isArray(s.trSeen)?s.trSeen:[],nw=got.filter(t=>seen.indexOf(t.id)<0);if(!nw.length)return nw;
 s.trSeen=seen.concat(nw.map(t=>t.id));sv(s);const show=()=>mini?toast(nw):openBox(nw,false);if(delay)setTimeout(show,delay);else show();return nw}
function gain(o){const s=st();const L0=lvOf(s.xp).L;let b,lab=[];
 if(o.t==="crown"||o.t==="king"){const ck=o.t==="king"?o.uid+":king":o.uid+":"+o.ty;if(s.cr[ck])return;s.cr[ck]=1}   // 完成獎勵每課每項只算一次
 if(o.t==="quiz")b=o.ok?BASE.quizOk:BASE.quizBad;else b=BASE[o.t];if(!b)return;let x=o.isNew===false?b[1]:b[0];
 if(o.t==="quiz"){if(o.ok){s.combo++;s.best=Math.max(s.best,s.combo);const m=has(L0,"combo3")&&s.combo>=10?2:has(L0,"combo2")&&s.combo>=5?1.5:has(L0,"combo1")&&s.combo>=3?1.2:1;if(m>1){x*=m;lab.push("連勝 "+s.combo+" ×"+m)}}else s.combo=0}
 const a=attrOf(o.t);if(a){const ab=attrBonus(s.at[a]);if(ab)x*=1+ab/100}
 const xb=has(L0,"xp20")?20:has(L0,"xp10")?10:0;if(xb)x*=1+xb/100;
 const cr=o.t==="crown"||o.t==="king";
 if(has(L0,"daily")&&s.day.n<10&&!cr){x*=2;lab.push("開盤×2")}if(!cr)s.day.n++;
 x=Math.max(1,Math.round(x));s.xp+=x;if(a)s.at[a]=(s.at[a]||0)+x;sv(s);
 pop("+"+x+" XP"+(o.t==="crown"?" 👑 題型完成":o.t==="king"?" 🏆 全課完成":"")+(lab.length?" "+lab.join(" "):""));const L1=lvOf(s.xp).L;if(L1>L0)setTimeout(()=>levelUp(L1),400);trCheck(L1>L0&&!mini?3600:0);drawMini();if(RPG.onChange)RPG.onChange()}
let mini=null;function drawMini(){if(!mini)return;const s=st(),v=lvOf(s.xp),t=title(v.L);mini.innerHTML=`<a class="rp-go" href="index.html#rpg" aria-label="股神 RPG：回首頁看完整面板">${avatar(v.L,30)}<div style="flex:1;min-width:0"><b>Lv ${v.L}</b> <span style="font-size:11px;color:var(--mu)">${t[1]}</span><div class="rp-bar"><i style="width:${Math.round(v.cur/v.nx*100)}%"></i></div></div></a>`}
function hints(){const s=st(),L=lvOf(s.xp).L;const max=has(L,"hint3")?3:has(L,"hint2")?2:has(L,"hint1")?1:0;return[max,Math.max(0,max-(s.day.h||0))]}
/* 測驗提示：unit.js 每次畫完題目都會呼叫。選項容器是 #qo，答案由 RW.cfg.qstate() 提供 */
function hintUI(){const cfg=window.RW&&RW.cfg;if(!cfg||!cfg.qstate)return;const qo=document.getElementById("qo");if(!qo)return;let b=document.getElementById("rphint");
 if(!b){b=document.createElement("button");b.id="rphint";b.type="button";b.className="rp-hint";qo.after(b);b.onclick=()=>{const[mx,left]=hints();if(!left)return;const s=st();const ans=cfg.qstate().ans;const bs=[...qo.querySelectorAll("button")].filter(x=>!x.disabled&&x.textContent!==ans);if(bs.length<2)return;const x=bs[Math.floor(Math.random()*bs.length)];x.disabled=true;x.style.opacity=.25;x.style.textDecoration="line-through";s.day.h=(s.day.h||0)+1;sv(s);hintUI()}}
 const[mx,left]=hints();const answered=cfg.qstate().answered;
 b.style.display=mx&&!answered?"":"none";b.disabled=!left;b.textContent="💡 提示（今天剩 "+left+"/"+mx+"）"}
function page(){mini=document.createElement("div");mini.className="rp-mini";document.body.appendChild(mini);drawMini();trCheck();
 const fd=()=>mini.classList.toggle("fade",(window.pageYOffset||0)>70);window.addEventListener("scroll",fd,{passive:true});fd();
 window.addEventListener("rwx",e=>gain(e.detail));hintUI()}
let trTab="all";
const AK="invAssetsOpen";let asMem=false;               // 投資組合展開狀態：獨立的 key，不放進 invRPG1；沒有 key ＝ 收合
function asOpen(){try{const v=localStorage.getItem(AK);if(v!==null)return v==="1"}catch(e){}return asMem}
function asSet(o){asMem=!!o;try{localStorage.setItem(AK,o?"1":"0")}catch(e){}}
function asApply(a,o){if(!a)return;a.classList.toggle("open",!!o);const t=a.querySelector(".rp-as-t");if(t)t.setAttribute("aria-expanded",o?"true":"false")}
function assetsHTML(s,op){const xp=s.xp,got=owned(xp),nx=TREASURES.find(t=>xp<t.xp),list=trTab==="all"?TREASURES:TREASURES.filter(t=>t.cat===trTab);
 const tabs=[["all","全部"]].concat(CATS).map(c=>{const a=c[0]==="all"?TREASURES:TREASURES.filter(t=>t.cat===c[0]);return `<button type="button" data-c="${c[0]}" class="${trTab===c[0]?"on":""}" aria-pressed="${trTab===c[0]}">${c[2]?c[2]+" ":""}${c[1]}<i>${a.filter(t=>xp>=t.xp).length}/${a.length}</i></button>`}).join("");
 const tiles=list.map(t=>xp>=t.xp?`<div class="rp-ti on"><div class="e">${t.ico}</div><div class="n">${t.name}</div><div class="v">${money(trValue(t,xp))}</div>${t.grow&&growPct(xp)?'<div class="g">📈 增值 +'+growPct(xp)+"%</div>":""}</div>`
  :`<div class="rp-ti off${t===nx?" nx":""}"><div class="e">${t.ico}</div><div class="n">？？？</div><div class="v">${t===nx?"還差 "+num(t.xp-xp)+" XP":"需 "+num(t.xp)+" XP"}</div><div class="c">${catName(t.cat)}</div></div>`).join("");
 return `<button type="button" class="rp-as-t" aria-expanded="${op?"true":"false"}" aria-controls="rp-as-b"><span class="rp-as-x"><span class="rp-as-h"><b>📈 我的投資組合</b><span>已持有 ${got.length}/${TREASURES.length}</span></span>
 <span class="rp-as-l"><span class="rp-as-v"><small>總資產</small>${got.length?money(worth(xp)):"0 元"}</span><span class="rp-as-s">${nx?"下一項還差 "+num(nx.xp-xp)+" XP":"全部持有了 🎉"}</span></span></span><i class="rp-as-c" aria-hidden="true"></i></button>
 <div class="rp-as-b" id="rp-as-b"><div class="rp-as-bi"><div class="rp-as-p"><div class="rp-bar"><i style="width:${Math.round(got.length/TREASURES.length*100)}%"></i></div>
 <div class="rp-as-n">${nx?"下一項資產："+catName(nx.cat)+"・還差 "+num(nx.xp-xp)+" XP 自動入袋":"全部資產都入袋了，你就是股神！"}</div>
 <div class="rp-as-q">💬 今日股神小語：${saying()}</div>
 <div class="rp-tabs" role="group" aria-label="資產分類">${tabs}</div><div class="rp-tg">${tiles}</div></div></div></div>`}
function drawAssets(){const a=document.getElementById("assets");if(!a)return;const o=a.querySelector(".rp-tabs"),sl=o?o.scrollLeft:0;const op=asOpen();a.classList.add("rp-as");a.classList.toggle("open",op);a.innerHTML=assetsHTML(st(),op);
 const n=a.querySelector(".rp-tabs");if(n){n.scrollLeft=sl;n.onclick=e=>{const b=e.target.closest?e.target.closest("button[data-c]"):null;if(!b)return;trTab=b.getAttribute("data-c");drawAssets()}}
 const t=a.querySelector(".rp-as-t");if(t)t.onclick=()=>{const o=!asOpen();asSet(o);asApply(a,o)}}
function home(el){homeEl=el;const draw=()=>{const s=st(),v=lvOf(s.xp),t=title(v.L);const[mx,left]=hints();const mxA=Math.max(1,...Object.keys(ATTR).map(a=>s.at[a]||0));
 el.innerHTML=`<div class="rp-card" id="rpg"><div class="rp-row">${avatar(v.L,64)}<div style="flex:1;min-width:0"><div style="font-size:13px;color:var(--mu)">📈 股神 RPG</div><div style="font-size:22px;font-weight:900;overflow-wrap:anywhere">Lv ${v.L}　${t[0]}</div><div style="font-weight:700">${t[1]}</div></div></div>
 <div id="assets"></div>
 <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:10px;color:var(--mu)"><span>${v.max?"經驗值 👑 滿級 Lv "+MAXLV:"經驗值 "+v.cur+" / "+v.nx}</span><span>總 XP ${s.xp}</span></div><div class="rp-bar"><i style="width:${Math.round(v.cur/v.nx*100)}%"></i></div>
 <div class="rp-at">${Object.entries(ATTR).map(([a,n])=>`<span>${n}</span><div class="rp-bar"><i style="width:${Math.round((s.at[a]||0)/mxA*100)}%;background:linear-gradient(90deg,#1a9a5a,#7ad38f)"></i></div><span style="font-size:12px">Lv${attrLv(s.at[a])} +${attrBonus(s.at[a])}%</span>`).join("")}</div>
 <div style="font-size:13px;margin-top:10px;line-height:1.7">今日：練習 ${s.day.n} 次${has(v.L,"daily")?"（開盤加倍剩 "+Math.max(0,10-s.day.n)+" 次）":""}・提示 ${left}/${mx}・目前連續答對 ${s.combo}（最佳 ${s.best}）</div>
 <details class="rwr rp-dt" style="margin-top:8px"><summary>升級規則</summary>
 <p>XP：聽新單字卡 ${BASE.cards[0]}（重聽 ${BASE.cards[1]}）・課文新句 ${BASE.story[0]}（重聽 ${BASE.story[1]}）・文法原句 ${BASE.gram[0]}（重聽 ${BASE.gram[1]}）・回音法做完一張卡 ${BASE.speak[0]}（重複 ${BASE.speak[1]}）・測驗答對 ${BASE.quizOk[0]}（同題再答 ${BASE.quizOk[1]}）、答錯 ${BASE.quizBad[0]}・題型完成 +${BASE.crown[0]}・整課全部完成 +${BASE.king[0]}（完成獎勵每項只算一次）。</p>
 <p>屬性：課文與文法原句→聽力、回音法→口說、單字卡與測驗→詞彙。屬性每升 1 級，該類 XP +2%（上限 30%）。</p>
 <p>能力：${ABIL.map(a=>"Lv"+a.lv+" "+a.name+"："+a.desc).join("；")}。</p><p>投資組合會依累計 XP 自動入袋，經驗值不會被花掉。</p></details></div>`;drawAssets()};draw();RPG.onChange=draw;trCheck()}
window.RPG={page,home,st,lvOf,need,gain,hints,hintUI,avatar,TITLES,ABIL,TREASURES,CATS,BASE,MAXLV,trValue,money,worth};
})();
