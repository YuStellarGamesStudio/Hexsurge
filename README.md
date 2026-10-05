# Hexsurge · 魔潮圍城

**Play:** https://hexsurge.ysgs.app/ · **Source:** https://github.com/YuStellarGamesStudio/Hexsurge · **License:** AGPL-3.0

[English](#english) · [繁體中文](#繁體中文) · [日本語](#日本語)

A low-poly fantasy survival bullet-hell for the browser (desktop and phones, PWA, works offline). Built on [XYZ.js](https://github.com/JS-PACKAGE/XYZ.js) 1.14.0; all music and sound effects are synthesised live by OPM.js — there are no audio recordings.

---

## English

### What is it?
One mage. A rising tide of monsters. You only move — your spells fire automatically. Level up, pick new spells and relics, push your spells to level 8 and **evolve** them, and survive the 18-minute magic tide, three Boss fights and an endless finale.

### Features
- 6 mages (Fire / Ice / Thunder / Arcane / Nature / Void), each with a unique passive and starting spell — no permanent stat upgrades; progress is unlocks only.
- 18 spells across 7 types, each with an evolved form that changes how it works (Fireball → Meteor Rain, Ice Lance → Polar Storm …); 12 passive relics that double as evolution recipes.
- Two build tracks: pure-element set bonuses, or mixed-element reactions (Melt, Burnout, Superconduct, Erosion, Attune).
- 26 enemy types in 10 families, 5 maps with their own hazards and 5 Bosses (8:00 / 14:00 / 18:00), difficulty 1–5, endless mode with double score.
- Local leaderboard (top 20 per mage × difficulty), a Codex with illustrated entries (download a card as a ≥2× PNG), save export/import (JSON file or Base64 code).
- English / 繁體中文 / 日本語, switched in place. 15 FM-synthesised music tracks.

### Requirements
A recent browser with WebGL2 (WebGPU is used automatically when available). Desktop or phone; landscape is recommended on phones.

### Controls
- **Move:** WASD / arrow keys, or drag the on-screen joystick with one finger (appears wherever you touch). Mode can be forced in Settings.
- **Pause:** Esc / P or the pause button. Spells cast automatically; there are no other buttons.

### Basic rules
Collect the glowing gems to level up and choose 1 of 3 cards. A spell at level 8 plus the right relic (see the Codex) unlocks its evolution card. Bosses arrive at 8:00, 14:00 and 18:00. Beating the final Boss wins the run; you may continue into the endless mode for double score.

### Development
```
node tools/serve.mjs 5180        # http://127.0.0.1:5180/
npm test                         # node:test suites
node tools/balance.mjs all       # pacing, dual-track gap, boss fights
node tools/gen-design.mjs        # regenerate DESIGN.md from src/data
node tools/build-cache.mjs       # regenerate the service-worker inventory before deploying
```
Read `AGENTS.md` for architecture and conventions, `DESIGN.md` for every number. Deploy the repository root to GitHub Pages (CNAME `hexsurge.ysgs.app`).

### License
AGPL-3.0 (see `LICENSE`). Bundles XYZ.js (Apache-2.0) and OPM.js (Apache-2.0) with their original licenses and notices in `vendor/xyz/`.

---

## 繁體中文

### 簡介
你是唯一的法師，面對一波又一波的魔潮。你只需要走位，法術會自動施放。升級、挑選新法術與道具，把法術練到 8 級後**進化**，撐過 18 分鐘的魔潮、三場 Boss 戰與無盡終章。

### 特色
- 6 位法師（火／冰／雷／奧術／自然／虛空），各有專屬被動與起手法術；沒有永久數值強化，進度全是解鎖。
- 7 種類型共 18 個法術，各有會改變機制的進化形（火球 → 隕星雨、冰錐 → 極寒風暴……）；12 種被動道具同時是進化配方。
- 雙軌流派：純系套裝加成，或混系元素反應（融化、燃盡、超導、侵蝕、調和）。
- 10 族 26 種敵人、5 張地圖（各有專屬危害）與 5 隻 Boss（8:00／14:00／18:00）、難度 1–5、分數加倍的無盡模式。
- 本機高分榜（法師 × 難度各前 20 名）、含精緻插畫的圖鑑（可下載 ≥2x 高解析卡片）、存檔匯出／匯入（JSON 檔或 Base64 存檔碼）。
- 繁體中文／English／日本語，原地切換；15 首 FM 即時合成音樂。

### 系統需求
支援 WebGL2 的新版瀏覽器（有 WebGPU 時自動使用）。桌面與手機皆可，手機建議橫向。

### 操作
- **移動：** WASD／方向鍵，或用單指拖曳虛擬搖桿（觸碰處即出現）。可在設定中固定操作模式。
- **暫停：** Esc／P 或暫停鈕。法術自動施放，沒有其他按鈕。

### 基本規則
拾取發光的經驗晶體升級，三選一。法術 8 級加上對應被動道具（配方見圖鑑）即可出現進化選項。Boss 於 8:00、14:00、18:00 登場；擊敗終 Boss 即通關，之後可繼續挑戰分數加倍的無盡模式。

### 開發與授權
指令見上方英文區。架構與慣例見 `AGENTS.md`，所有數值見 `DESIGN.md`。授權為 AGPL-3.0（見 `LICENSE`）；收錄的 XYZ.js 與 OPM.js（Apache-2.0）保留原授權與 NOTICE（`vendor/xyz/`）。

---

## 日本語

### 概要
魔法使いはあなた一人。押し寄せる魔潮の中で、操作は移動だけ——魔法は自動で発動します。レベルアップで新しい魔法とアイテムを選び、魔法をLv8まで育てて**進化**させ、18分間の魔潮と3度のボス戦、そして無限モードを生き抜きましょう。

### 特徴
- 6人の魔法使い（炎／氷／雷／秘術／自然／虚空）。固有パッシブと初期魔法があり、永続的なステータス強化はなくアンロックのみで進行。
- 7タイプ・全18魔法。それぞれ仕組みが変わる進化形あり（ファイアボール → 流星雨、アイスランス → 極寒の嵐 …）。12種のアイテムは進化レシピも兼ねます。
- 2つのビルド路線：同属性セットボーナス、または混合属性の反応（融解・燃え尽き・超電導・侵食・調和）。
- 10系統・26種の敵、固有の危険がある5つのマップと5体のボス（8:00／14:00／18:00）、難易度1〜5、スコア2倍の無限モード。
- ローカルランキング（魔法使い×難易度ごとに上位20件）、イラスト付き図鑑（2倍以上の高解像度カード保存）、セーブの書き出し／読み込み（JSONファイル／Base64コード）。
- English／繁體中文／日本語をその場で切り替え。FM合成の音楽15曲。

### 動作環境
WebGL2対応の最新ブラウザ（WebGPUがあれば自動使用）。PC・スマホ対応、スマホは横向き推奨。

### 操作
- **移動：** WASD／矢印キー、または指1本で画面のジョイスティックをドラッグ（触れた場所に出現）。設定で固定も可能。
- **一時停止：** Esc／P または一時停止ボタン。魔法は自動発動で、他のボタンはありません。

### 基本ルール
光る結晶を集めてレベルアップ、3枚から1枚を選択。魔法Lv8と対応するアイテム（レシピは図鑑で確認）がそろうと進化カードが現れます。ボスは8:00・14:00・18:00に登場。最終ボスを倒すとクリア、その後はスコア2倍の無限モードに挑戦できます。

### 開発・ライセンス
コマンドは上の英語セクションを参照。構成と規約は `AGENTS.md`、全数値は `DESIGN.md`。ライセンスは AGPL-3.0（`LICENSE`）。同梱の XYZ.js と OPM.js（Apache-2.0）は元のライセンスと NOTICE を `vendor/xyz/` に保持しています。
