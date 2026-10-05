# Hexsurge 驗收紀錄

只記錄實際執行過、有觀察結果的項目。「未驗證」項目不得勾選。測試環境：macOS arm64、Node 26、Microsoft Edge（headless，SwiftShader 軟體渲染，WebGPU 後端）；一般 Chromium 在多個並行頁面下不穩，故以獨立 Edge 行程驗證。

## Gate A — 規格可執行

| 項目 | 方法 | 結果 |
|---|---|---|
| 內容量 | `node tools/gen-design.mjs`（由 `src/data` 產生 DESIGN.md） | 6 法師、18 法術＋18 進化形、12 被動、26 敵人（10 族，含 2 分裂子體）、5 地圖、5 Boss、15 首 BGM ✔ |
| 數值集中 | 以 `src/data/` 為唯一來源；DESIGN.md 為其自動產出 | ✔ |
| 進化配方可達成 | `tests/spells-*.test.mjs`＋`tools/balance.mjs pace`：機器人於 5:18–12:30 完成首次進化（多數 6–10 分） | ✔ |
| 雙軌差距 ≤ 15% | `node tools/balance.mjs dual`（3 組種子平均） | 純系均值 837／混系 741，差距 11.5% ✔ |
| 三語完整 | `tests/i18n.test.mjs`（所有 UI 鍵與內容欄位 zh/en/ja 皆非空） | ✔ |

## Gate B — 核心玩法可執行

| 項目 | 方法 | 結果 |
|---|---|---|
| 3 分鐘循環 | 瀏覽器實際操作：標題 → 選角 → 進場 → WASD 移動 → 自動施法／拾取 → 升級三選一 | ✔ |
| 升級節奏 | `balance.mjs pace`（機器人，難度 1）：首次升級 20–54 秒；5:00 約 10–15 級；一局 17–40 級（護欄 ≤ 50）；前段偏快、後段發酵 | ✔（機器人專注度低於人類，首升 30–45 秒目標於多數法師達成） |
| 同屏敵人 | 單測：難度 5、14:00 後 120 秒同屏峰值 ≥ 30 且 ≤ 60＋6（分裂子體暫溢） | ✔ |
| Boss 戰時長 | `balance.mjs boss`：15 組（5 圖 × 3 階）擊殺時間 45.7–123.9 秒，皆在護欄 45–180 內；子彈峰值 ≤ 132（上限 160） | ✔ |
| 通關／無盡 | 瀏覽器：18:00 終 Boss 擊殺 → 勝利畫面 → 「繼續無盡」→ 計分 ×2；單測驗證 ×2 | ✔ |
| 死亡結算 | 瀏覽器：`finishRun('quit')` 與死亡 → 結算畫面、高分榜名次、解鎖 | ✔ |
| 存檔寫入 | 瀏覽器：兩局後 `hexsurge.save.v1` 有統計／榜／圖鑑；第 2 局解鎖 Glacia＋ice_lance | ✔ |

## Gate C — 交付驗收

| 項目 | 方法 | 結果 |
|---|---|---|
| 離線可玩 | Edge：SW 安裝啟用 → 重載 → `emulate offline` 重載，遊戲啟動至標題；`tab.requests()` 全部命中快取；566+ 檔預快取全為 HTTP 200 | ✔（瀏覽器離線模擬；實體裝置飛機模式未測） |
| SW 升級路徑 | 修改雜湊後新 SW 進入 waiting，`ACTIVATE_UPDATE` 後保留「現行＋前一版」快取，`localStorage` 存檔不變 | ✔ |
| 三語原地切換 | 瀏覽器：標題／選角／圖鑑／設定／結算 en→zh→ja 不重載，`?lang` 以 History API 更新 | ✔ |
| 無捲軸 | 各畫面 `scrollHeight ≤ innerHeight`：1280×720、1272×602、1024×576、844×390、740×360、667×375、640×360、390×844 | ✔ |
| 觸控搖桿 | Edge 模擬觸控：觸碰處出現搖桿，拖曳後角色位移 8 單位 | ✔ |
| 暫停凍結 | 暫停時模擬與音訊 pause，ESC／P 與暫停鈕皆可；分頁隱藏自動暫停 | ✔ |
| 右鍵封鎖 | `contextmenu` preventDefault（`app.js`） | ✔（程式碼層） |
| 音樂／音效 | 無手勢前 `unlocked=false`、0 個 AudioContext；點擊 Start 後解鎖 8 個 OPM context，標題曲 AnalyserNode RMS ≈ 0.014；10 首地圖曲均有非零 RMS（0.036–0.055）且 3 首跨越 loop 接縫無靜音；15 曲通過 `tools/check-tracks.mjs`；倉庫內無任何錄音檔 | ✔ |
| 存檔匯出匯入 | 設定頁：JSON 下載、Base64 複製（clipboard 讀回）、有效碼預覽 → 確認 → 自動備份、垃圾輸入拒絕且存檔位元組不變、備援槽還原 | ✔ |
| 圖鑑 | 四類＋反應頁、未發現剪影、配方面板、分頁；詳情全螢幕版型已修正 | ✔（列表與詳情於 1272×602 en/zh 目視無重疊；下載卡實測輸出 image/png 1800×3200，≥2x；390×844 詳情未目視，見已知問題） |
| 可讀性（30 敵同屏） | 五張地圖各以 30+ 敵人實戰截圖目視：敵群啞光、法術發光、傷害數字固定字體層 | ✔ |
| 效能 | 軟體渲染（SwiftShader）下：5 張地圖空場 60 fps；85 敵＋6 法術滿級同屏 36.7 fps、37 draw calls、12 萬三角形 | ✔（軟體渲染；中階手機實機未測） |
| OG／圖示 | `og.png` 1200×630、`og@2x.png` 2400×1260、PNG IHDR 與 ICO（16/32/48）核對；`<head>` 的 OG 標籤固定英文 | ✔ |
| 單元測試 | `npm test` | 107 通過／0 失敗 ✔ |

## 其他交付

- 授權：`LICENSE` 為 AGPL-3.0 全文；`vendor/xyz/LICENSE`、`vendor/xyz/NOTICE`、`vendor/xyz/dist/vendor/opm/LICENSE` 保留原授權。
- 引擎：官方 release `xyz.js-1.14.0.tgz`（SHA-256 `1de6284d…fdfa0`）之 `dist/` 整包收錄。
- 文件六件套：`PLAN.md`、`ACCEPTANCE.md`、`DESIGN.md`（自動產生）、`AGENTS.md`、`CLAUDE.md`（引用 AGENTS.md）、`README.md`（三語）。
- 部署：GitHub Pages＋`CNAME`；**未 push**，由使用者推送。

## 已知問題與未驗證項目

- 未驗證：實體手機／平板（含 iOS Safari 的「加入主畫面」）、Firefox／Safari 跨瀏覽器、實機飛機模式、中階手機 30 敵 ≥ 30 fps 的實測。
- 已驗證但需注意：BGM 切換為「淡出 → 換層 → 淡入」，因引擎音樂通道為單一共用 bus，無法獨立交疊淡入淡出；`AudioNote` 無逐音力度，樂譜力度以每層平均值微調。
- 機器人（`tools/bot.mjs`）屬簡單位勢場走位，難度 1 在部分法師×地圖組合會於中局陣亡（約 40%）；人類走位預期更佳，但難度 1 的容錯仍建議於真人試玩後再微調（`src/data/config.js`、`spawns.js`）。
- 圖鑑 390×844 詳情版面僅有程式實作，未於瀏覽器目視確認。
- Edge headless 的頁面錯誤紀錄會出現來自瀏覽器擴充功能的 `Uncaught TypeError … reading 'id'`（任何頁面皆有，包含無遊戲程式碼的實驗室頁），與遊戲無關。
