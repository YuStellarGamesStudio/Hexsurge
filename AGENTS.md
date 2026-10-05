# Hexsurge（魔潮圍城）執行規範

執行 Agent 工作說明。本檔是實作契約：模組邊界、介面、指令與提交紀律全部以此為準。

## 1. 權威文件與優先序

1. 企劃書《魔潮圍城 Hexsurge 企劃書 v1.0》（決議 R1–R22）：機制衝突以企劃正文為準。
2. `DESIGN.md`：數值唯一來源；數值衝突以此為準（與 `src/data/` 同步）。
3. 本檔：架構與介面契約。
4. `PLAN.md`：里程碑、驗收硬指標、交付前自檢。

使用者明確核准的調整優先於以上；其他衝突須回報使用者，不自行改設計。

## 2. 硬性限制（逐條來自企劃書）

- 純前端 HTML/CSS/JS（ES modules），無框架、無 CDN、無 bundler、無建置步驟。引擎為 XYZ.js v1.14.0，整包 vendor 於 `vendor/xyz/dist/`，以相對 URL import `./vendor/xyz/dist/src/index.js`。
- 數值集中於 `src/data/`；其他程式碼不寫死數字（UI 版面像素除外）。
- 可讀性 > 華麗：敵群啞光材質（`matte()`）；法術／特效高飽和發光（`glow()`）；拾取物脈動閃光；傷害數字固定字體層。
- 單手可玩：一切操作可單指完成（虛擬搖桿）；桌面 WASD／方向鍵。觸控目標 ≥ 44px；拖放必有點選替代。
- 音樂與音效一律 OPM.js（`game.audio`）即時 FM 合成，**禁止錄音檔**。
- 圖鑑插畫：精緻 SVG 分層繪製（漸層、光影、細節），禁止像素風與簡單色塊；下載卡 ≥ 2x 高解析匯出。
- 全部 UI 保持在瀏覽器視窗內：html/body/面板無捲軸（清單用分頁或網格，不用捲動）。
- 全網頁右鍵封鎖（已在 `app.js` 實作）；開頭畫面（不直接進遊戲）；BGM 與音效獨立開關＋音量滑桿；暫停鍵＋暫停鈕。
- 語系 zh／en／ja（預設 en），內容資料一律 `{zh, en, ja}`；缺 key 回落 en，不得顯示空白或 key 名。不加 ko。
- 所有資源放 `assets/`；根目錄只放入口、設定、文件；`favicon.ico` 在根目錄；主入口 `app.js`。
- 文件內以「執行 Agent」泛稱 AI，不綁定特定工具名。

## 3. 目錄結構

```
index.html  app.js  sw.js  manifest.webmanifest  favicon.ico  CNAME  LICENSE  *.md
vendor/xyz/dist/          XYZ.js 1.14.0 官方 dist 整包（含 OPM.js）；勿修改
assets/css/               樣式（base.css 全域；各畫面自有 CSS 檔）
assets/illustrations/     圖鑑 SVG（mages/ spells/ enemies/ bosses/）
assets/icons/  assets/social/   PWA 圖示、OG 分享卡
src/data/                 數值（唯一來源）：config, mages, passives, enemies, spawns, bosses, maps, unlocks, spells/*, audio/*
src/sim/                  純模擬（無 DOM、無引擎）：run, combat, enemies, entities, boss, bosses/*, hazards, progression, player, spells/*
src/render/               XYZ.js 呈現：battle-view, models/*, maps/*, vfx-shapes, particles, materials, pool, title-scene
src/ui/                   DOM 畫面（每檔 export create(app)）
src/i18n/                 i18n.js + ui/<area>.js 字串
src/audio/                audio.js 門面 + 曲目／音效合成資料
src/save/  src/meta/      存檔；解鎖與高分榜規則
src/core/                 input.js、debug.js
tools/                    serve.mjs, bot.mjs, spelltest.mjs, balance.mjs, build-cache.mjs, lab/*
tests/                    node:test（模擬、存檔、i18n 完整性）
```

## 4. 指令

```
node tools/serve.mjs 5180            # 開發伺服器 http://127.0.0.1:5180/
node --test tests/                   # 單元測試
node tools/bot.mjs ignis academy 1 1100          # 無頭整局機器人，列出升級／擊殺時間軸
node tools/spelltest.mjs <spellId> [--level n]   # 單一法術 DPS／實體峰值／每步耗時
node tools/build-cache.mjs           # 重新產生 SW 預快取清單（上線前）
```

除錯入口（瀏覽器）：`/?debug={"mage":"ignis","map":"academy","spells":["fireball"],"levels":{"fireball":8},"evolve":["fireball"],"passives":{"power_sigil":3},"time":480,"ffwd":60,"boss":0,"god":true,"enemies":{"imp":10}}`
說明見 `src/core/debug.js`。`window.hexsurge` 即 `app` 物件，可在主控台／自動化腳本使用。

## 5. 模組契約

### 5.1 模擬（`src/sim/`）
- 純函式式模擬，座標 x/z 平面（y 向上僅用於呈現）。角度 θ 對應方向 `(cos θ, sin θ)` 於 (x, z)。
- `createRun(opts)`、`step(run, dt, {x,z})`、`chooseUpgrade(run, i)`、`getResult(run)`。
- 所有隨機用 `run.rng`（不得用 `Math.random`）。傷害一律經 `damageEnemy`（暴擊、同系加成、反應、狀態、擊退、擊殺掉落都在內）。
- 事件：`emit(run, {type, ...})`，由 app 派送至音訊／HUD，並由 `BattleView.handleEvents` 呈現。事件型別：`hit kill burst arc cast pickup levelup upgrade evolve hurt death heal reaction freeze healpulse summon fuse enemyShot eliteWave bossWarning bossSpawn bossCast bossEnrage bossKill victory blizzard`。

### 5.2 法術（`src/data/spells/<element>.js` + `src/sim/spells/<element>.js`）
資料與行為契約見 `src/data/spells/index.js`、`src/sim/spells/index.js` 檔頭；火系 `fireball`／`meteor_rain` 為參考實作。`vfx` 描述子：`{shape, color, size, glow, trail}`，`shape` 取自 `src/render/vfx-shapes.js`（可新增）。

### 5.3 敵人與 Boss
- 敵人數值 `src/data/enemies.js`，AI 於 `src/sim/enemies.js`（10 族）。
- Boss 數值 `src/data/bosses.js`，招式腦 `src/sim/bosses/<id>.js`，工具箱 `src/sim/bosses/kit.js`（契約見檔頭）。
- 敵彈 `spawnEnemyProjectile`，地面預警／殘留傷害區 `spawnZone`（`src/sim/hazards.js`）。

### 5.4 呈現（`src/render/`）
- 模型：`models/enemies.js` `buildEnemyGeometry(def) → Geometry`（原點在腳底、面向 +X、頂點色）；`models/mages.js` `createMageModel(mage) → {root, update(dt, player)}`；`models/bosses.js` `createBossModel(bossDef) → {root, update(dt, boss)}`。
- 地圖：`maps/<id>.js` 匯出 `look` 與 `build(ctx)`，並於 `maps/index.js` `registerMap(id, mod)`（契約見 `maps/index.js` 檔頭）。
- 材質：`matte()`（啞光）、`glow(color, power)`（發光）、`zoneMaterial()`（半透明地面區）；批次渲染用 `InstancePool`；低多邊形幾何用 `MeshBuilder`（`geo.js`）。
- 標題背景：`title-scene.js` `createTitleView(game, opts) → {scene, init(), sync(dt), resize(), dispose()}`。
- 效能指標：中階手機 30 敵同屏 ≥ 30 fps；同屏 60 敵不崩潰。避免每幀配置大量物件。

### 5.5 UI（`src/ui/<name>.js`）
- 每檔 `export function create(app) → { el, show(params), hide(), update?(run, dt), onEvent?(e, run), refresh?() }`，`el` 由 `app.js` 掛入 `#ui`。
- `app` 提供：`game save audio t L setLang getLang run view input selection lastResult summary go(name, params) startRun(sel) togglePause(force) pickUpgrade(i) finishRun(reason) continueEndless() showTitle() toast(msg)`。
- 畫面名稱：`title select codex leaderboard settings howto results`（`app.go`）；覆蓋層：`hud levelup pause`；`toast`。
- i18n：靜態文字 `data-i18n="key"`；動態 `t(key, params)`；內容欄位 `L({zh,en,ja})`。UI 字串寫入自己負責的 `src/i18n/ui/<area>.js`（`{en:{}, zh:{}, ja:{}}`，三語鍵必須齊全），key 慣例 `<area>.<name>`。
- 每個畫面自有 CSS 檔 `assets/css/<area>.css`，由該 UI 模組在 `create()` 時動態插入 `<link>`（或由 `index.html` 之外的方式載入；不要改共用的 `base.css`，除非是全域變數）。
- 版面：RWD 三斷點——寬（≥1024px：三欄：戰場＋左狀態面板＋右法術列）、中（700–1023px：單側面板）、窄（<700px：分頁籤＋虛擬搖桿）；全程無捲軸。

### 5.6 音訊（`src/audio/audio.js`）
`audio.init(game)`、`unlock()`（需使用者手勢）、`playMusic(id)`（`title menu battle:<map> boss:<map> results endless` + 圖內兩首環境曲）、`stopMusic()`、`sfx(name, event?)`（`cast hit pickup level evolve boss ui hurt`…七類為準）、`applySettings(settings)`、`pause()/resume()`。曲目與音色資料在 `src/data/audio/`。

### 5.7 存檔與 meta（`src/save/`, `src/meta/`）
存檔結構見 `src/save/save.js` 的 `defaultSave()`；解鎖規則資料 `src/data/unlocks.js`。`recordRun(save, run, result)` 回傳 `{newUnlocks, rank, ...}`。

## 6. 實作慣例

- 原生 ES modules、具描述性命名、單一職責；不為展示能力過度設計；尊重既有風格，不做無關重構。
- 註解只寫「為什麼」與非顯而易見的約束。
- 內容文字全部三語；不得省略任何語言。
- 效能：模擬熱迴圈避免配置；呈現全部批次化。
- 驗證：以實際瀏覽器操作與截圖驗證 UI／呈現；以 `node` 驗證模擬；未驗證的項目不得宣稱完成。

## 7. Git 規則（提交紀律）

- 完成一項功能即自動 commit；**禁止整包提交**，一個 commit 對應一個功能。
- 每個里程碑結束 commit，message 帶 `M0:`–`M7:` 前綴；功能 commit 同樣帶所屬 M 前綴。
- **嚴禁 push**；推送由使用者親自執行。
- 多個執行 Agent 共用同一工作目錄：只 `git add` 並 `git commit -- <你的檔案路徑>`，不要 `git add -A`、不要動別人的檔案；遇到 `index.lock` 稍候重試。
- 不改寫歷史、不重設他人變更。
