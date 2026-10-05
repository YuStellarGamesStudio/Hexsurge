# Hexsurge（魔潮圍城）實作計畫

依《魔潮圍城 Hexsurge 企劃書 v1.0》（R1–R22）與 `DESIGN.md` 實作完整遊戲。本檔為單一實作計畫。

## 1. 強制執行範圍（硬規則）

1. 內容完整優先（R9）：R8 內容——6 法師、18 法術（全進化）、12 被動道具、26 種敵人（10 族）、5 地圖 5 Boss——一項不減；時程壓力以排程解決，不以砍內容解決。
2. 提交紀律：每完成一項功能立即 commit，禁止整包提交，一個 commit 對應一個功能；每個里程碑結束 commit，message 帶 `M0:`–`M7:` 前綴；**嚴禁 push**，推送由使用者親自執行。
3. 數值集中於 `src/data/`，`DESIGN.md` 為唯一數值來源；其他程式碼不寫死數字。
4. 純前端 HTML/CSS/JS（ES modules），無框架、無 CDN、無 bundler；引擎 XYZ.js v1.14.0 整包 vendor 於 `vendor/xyz/dist/`。
5. 音樂與音效全部由引擎內建 OPM.js 即時 FM 合成；禁止錄音檔。
6. 圖鑑插畫為精緻 SVG 分層繪製；下載卡 ≥ 2x 高解析匯出。
7. 所有 UI 保持在視窗內，html/body/面板無捲軸；觸控目標 ≥ 44px。
8. 授權 AGPL-3.0（`LICENSE` 為附錄 A 全文）；收錄的 XYZ.js（Apache-2.0）與 OPM.js 保留原授權與 NOTICE（`vendor/xyz/LICENSE`、`vendor/xyz/NOTICE`、`vendor/xyz/dist/vendor/opm/LICENSE`）。
9. 文件內以「執行 Agent」泛稱 AI，不綁定特定工具名。

## 2. 倉庫結構

```
index.html  app.js  sw.js  sw-assets.js  manifest.webmanifest  favicon.ico  CNAME  LICENSE
PLAN.md  DESIGN.md  ACCEPTANCE.md  AGENTS.md  CLAUDE.md  README.md
vendor/xyz/        XYZ.js 1.14.0 官方 dist 整包 + LICENSE + NOTICE
assets/            css/ illustrations/ icons/ social/ branding/
src/data/          唯一數值來源（config mages passives enemies spawns bosses maps unlocks spells/* audio/*）
src/sim/           純模擬（run combat enemies entities boss bosses/* hazards progression player spells/*）
src/render/        XYZ.js 呈現（battle-view models/* maps/* shapes/* particles pool materials title-scene）
src/ui/            DOM 畫面          src/i18n/  三語字串      src/audio/  音訊門面
src/save/ src/meta/ 存檔與解鎖/高分榜  src/core/  輸入與除錯
tools/             serve bot spelltest bosstest balance build-cache check-tracks lab/*
tests/             node:test
```

## 3. 里程碑

| M | 內容 | 驗收硬指標 |
|---|---|---|
| M0 | 倉庫、文件六件套、LICENSE、vendor XYZ.js、整合契約驗證、空場景、部署管線 | 空場景可開、`game.audio` 出聲、SW 離線生效 |
| M1 | 核心循環：走位、自動施法、敵群 steering、經驗拾取、升級三選一、死亡結算 | 3 分鐘可玩循環成立 |
| M2 | 6 法師、18 法術、進化鏈、12 被動、雙軌加成 | 全進化配方可達成、雙軌差距 ≤ 15% |
| M3 | 26 敵人、出怪表與節奏曲線、5 Boss、難度梯 | 18 分鐘曲線實測、5 Boss 全機制可過 |
| M4 | 5 張地圖與環境危害、低多邊形視覺、特效與可讀性 | 30 敵同屏可讀性截圖驗收 |
| M5 | 解鎖 meta、圖鑑、高分榜、存檔匯出匯入 | 匯入破檔不損存檔、備援槽生效 |
| M6 | i18n、PWA、RWD、介面慣例、OPM.js 15 曲＋音效 | 飛機模式可玩、三語切換不重載 |
| M7 | 驗收與上線：效能、跨瀏覽器、OG、部署 | 驗收清單全數通過後上線 |

## 4. 技術要點

- 模擬與呈現分離：`src/sim` 無 DOM／引擎依賴，可在 Node 無頭執行（`tools/bot.mjs`、`tools/balance.mjs`），所有隨機走 `run.rng`。
- 敵群運動為 steering（朝向玩家＋分離力），不使用尋路；空間雜湊格加速碰撞與查詢。
- 渲染全部批次化（`InstancedMesh`，敵群同質材合批）；敵群啞光、法術發光、拾取物脈動；傷害數字在固定字體的 2D 疊層。
- 呈現後處理：ACES tone mapping、Bloom、FXAA、線性霧。
- 存檔 `hexsurge.save.v1`；匯出匯入（JSON 檔＋Base64 碼）；匯入前預覽、覆蓋前備份、解析失敗拒絕。
- 路由 `?lang=zh|en|ja` + History API 原地切換；偵測優先序 URL > localStorage > navigator.language > en。
- PWA：SW 資產雜湊版本化、不使用 `ignoreSearch`、更新不動存檔；離線可玩。

## 5. 驗收硬指標

- 一局主線 18 分鐘（±1）：首次升級 30–45 秒、首次進化 6–8 分、首次 Boss 擊殺 8–10 分、終 Boss 18 分、一局升級 30–40 次（≤ 50）。
- 同屏敵人目標 30–50，護欄 ≤ 60；進化形同時持有 ≤ 6（護欄 ≤ 8）。
- 單場 Boss 戰 60–120 秒（護欄 45–180）。
- 純系與混系同投入輸出差距 ≤ 15%。
- 中階手機 30 敵同屏 ≥ 30 fps；60 敵不崩潰。
- BGM ≥ 12（目標 15）、七類 SFX 皆為 FM 合成。

## 6. 交付前自檢

- [ ] `npm test`（`node --test tests/*.test.mjs`）全綠；`node tools/balance.mjs` 的曲線與雙軌差距落在護欄內。
- [ ] 三語切換全畫面不重載、無空白、無 key 名。
- [ ] 飛機模式可玩；舊快取升級路徑通過；更新不動存檔。
- [ ] 三個斷點（寬／中／窄）全畫面無捲軸；觸控目標 ≥ 44px。
- [ ] 30 敵同屏可讀性截圖通過；效能指標達成。
- [ ] 匯入破損檔不損存檔、備援槽生效。
- [ ] OG 標籤固定英文；`og.png` 1200×630（含 2x 版）。
- [ ] 未 push；commit 皆為單一功能且帶 M 前綴。

開始執行。
