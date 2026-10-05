# Hexsurge（魔潮圍城）DESIGN — 數值唯一來源

> 本檔由 `node tools/gen-design.mjs` 從 `src/data/` 自動產生，禁止手改。數值衝突以本檔為準；機制衝突以企劃書正文為準。

## 1. 全域常數
**SIM**：step=0.017、maxStepsPerFrame=5、maxAlive=60、targetAliveMin=30、targetAliveMax=50、maxProjectiles=220、maxEnemyProjectiles=160、maxGems=160、maxMinions=12、maxEvolved=6、spellSlots=6、passiveSlots=6、gridCell=4

**ARENA**：radius=44、edgePad=0.8、spawnMin=18、spawnMax=24

**TIMELINE**：runLength=1080、bossTimes=[480,840,1080]、eliteWaveTime=300、bossWarning=6、bossCountdownShow=90、bossFightMin=45、bossFightMax=180、endlessScoreMult=2、endlessDensityPerMin=0.06、endlessHpPerMin=0.08

**PLAYER**：baseHp=100、heartHp=10、moveSpeed=5.4、radius=0.5、pickupRadius=2.4、magnetPull=14、invuln=0.7、shieldRegenDelay=4、shieldRegenRate=0.25、acceleration=60、baseCritChance=0.05、baseCritMult=1.6、baseXpGain=1、baseRegen=0.35、levelUpHeal=0.12

**XP**：firstLevel=60、growth=1.105、linear=0、openingFactors=[0.6,0.8]、gemValues=[1,3,8,20,60]、spellUpWeight=6、guideSpellLevel=5、mergeThreshold=120、maxLevel=60、levelUpChoices=3、luckExtraChoiceChance=0.04

**COMBAT**：contactCooldown=0.7、knockbackDecay=9、damagePopupMin=1、enemyDespawnDistance=60、critLuckBonus=0.02、bossResist=0

**STATUS**：burn={"duration":3,"dpsRatio":0.35,"tick":0.5}、chill={"duration":2.2,"slow":0.35,"freezeHits":4,"freezeTime":1.4}、shock={"duration":3}、slowFloor=0.25、bossStatusScale=0.35

**SCORE**：perSecond=2、perKill=1、perEliteKill=25、perBossKill=1500、finalBossKill=6000、levelBonus=10、difficultyScale=[1,1.25,1.55,1.9,2.4]、leaderboardSize=20

### 1.1 經驗曲線（升級所需經驗）
| 等級 | 所需經驗 | 累計 |
|---|---|---|
| 1→2 | 36 | 36 |
| 2→3 | 53 | 89 |
| 3→4 | 73 | 162 |
| 4→5 | 81 | 243 |
| 5→6 | 89 | 332 |
| 6→7 | 99 | 431 |
| 7→8 | 109 | 540 |
| 8→9 | 121 | 661 |
| 9→10 | 133 | 794 |
| 10→11 | 147 | 941 |
| 11→12 | 163 | 1104 |
| 12→13 | 180 | 1284 |
| 13→14 | 199 | 1483 |
| 14→15 | 220 | 1703 |
| 15→16 | 243 | 1946 |
| 16→17 | 268 | 2214 |
| 17→18 | 296 | 2510 |
| 18→19 | 328 | 2838 |
| 19→20 | 362 | 3200 |
| 20→21 | 400 | 3600 |
| 21→22 | 442 | 4042 |
| 22→23 | 488 | 4530 |
| 23→24 | 540 | 5070 |
| 24→25 | 596 | 5666 |
| 25→26 | 659 | 6325 |
| 26→27 | 728 | 7053 |
| 27→28 | 805 | 7858 |
| 28→29 | 889 | 8747 |
| 29→30 | 982 | 9729 |
| 30→31 | 1086 | 10815 |
| 31→32 | 1200 | 12015 |
| 32→33 | 1326 | 13341 |
| 33→34 | 1465 | 14806 |
| 34→35 | 1618 | 16424 |
| 35→36 | 1788 | 18212 |
| 36→37 | 1976 | 20188 |
| 37→38 | 2184 | 22372 |
| 38→39 | 2413 | 24785 |
| 39→40 | 2666 | 27451 |
| 40→41 | 2946 | 30397 |

節奏目標：首次升級 30–45 秒；前 5 分鐘 8–10 次（實測 ≈ 12–16，因無頭機器人專注擊殺）；一局 30–40 次，護欄 ≤ 50（`node tools/balance.mjs pace`）。

## 2. 難度梯（1–5，解鎖型）
| 難度 | 血量 | 速度 | 密度 | 傷害 | 特殊敵提前(s) | 分數倍率 |
|---|---|---|---|---|---|---|
| 1 | ×1 | ×1 | ×1 | ×1 | 0 | ×1 |
| 2 | ×1.35 | ×1.07 | ×1.25 | ×1.1 | 45 | ×1.25 |
| 3 | ×1.8 | ×1.14 | ×1.5 | ×1.2 | 90 | ×1.55 |
| 4 | ×2.4 | ×1.22 | ×1.75 | ×1.35 | 150 | ×1.9 |
| 5 | ×3 | ×1.3 | ×2 | ×1.5 | 210 | ×2.4 |

## 3. 雙軌流派（R11）
純系套裝（同系法術數 → 該系傷害加成）：2=0.12、3=0.26；混系互補（持有元素種類 → 反應增幅）：3=0.1、4=0.2。

元素反應：{"baseChance":0.55,"attuneChance":1,"luckChance":0.015,"cooldownPerEnemy":0.35,"melt":{"ice":"fire","multiplier":0.9},"burnout":{"fire":"nature","stacks":2,"maxStacks":8,"dpsPerStack":0.22,"duration":4},"superconduct":{"shock":"ice","jumps":3,"range":6,"damageRatio":0.55},"erosion":{"amp":0.18,"maxAmp":0.36,"duration":5},"attune":{"duration":4,"statusBonus":0.3}}

| 組合 | 反應 | 效果 |
|---|---|---|
| 冰 → 火 | 融化 | 對凍結目標的火系命中傷害增幅並解凍 |
| 火 → 自然 | 燃盡 | 自然系命中燃燒目標時疊加持續傷害層數 |
| 雷 → 冰 | 超導 | 冰系命中被雷擊標記目標時電弧連鎖更多目標 |
| 虛空 → 任意 | 侵蝕 | 目標承受所有來源的額外傷害 |
| 奧術 → 任意 | 調和 | 目標的元素反應觸發率大幅提高、狀態持續更久 |

平衡護欄：純系與混系同投入輸出差距 ≤ 15%（`node tools/balance.mjs dual`）。

## 4. 法師（6，R18）
| id | 系 | 名稱 | 起手法術 | 專屬被動 | 被動參數 | 屬性修正 | 解鎖 |
|---|---|---|---|---|---|---|---|
| ignis | fire | Ignis | fireball | Ember Heart | {"kind":"ember_heart","radius":2.6,"damage":16} | {"damage":0.05} | 初始 |
| glacia | ice | Glacia | ice_lance | Winter Aura | {"kind":"winter_aura","radius":4.2} | {"maxHp":0.1} | {"kind":"runs","n":2} |
| voltra | thunder | Voltra | chain_lightning | Static Charge | {"kind":"static_charge","interval":3.5,"damage":24,"range":11} | {"moveSpeed":0.1} | {"kind":"kills","n":400} |
| arcanis | arcane | Arcanis | arcane_missiles | Mana Flow | {"kind":"mana_flow","damage":34,"radius":6.5} | {"cooldown":0.08} | {"kind":"level","n":14} |
| sylva | nature | Sylva | thorn_field | Verdant Pulse | {"kind":"verdant_pulse"} | {"regen":1,"pickup":0.2} | {"kind":"bossKill","n":1} |
| nox | void | Nox | void_rift | Hollow Hunger | {"kind":"hollow_hunger","perKill":0.01,"maxStacks":15,"decayAfter":6} | {} | {"kind":"evolve","n":3} |

## 5. 被動道具（12）
| id | 屬性 | 每級 | 上限 | 附帶 |
|---|---|---|---|---|
| tome_haste | castSpeed | 0.08 | 5 |  |
| power_sigil | damage | 0.08 | 5 |  |
| wide_sigil | area | 0.1 | 5 |  |
| magnet_charm | pickup | 0.25 | 4 |  |
| wind_boots | moveSpeed | 0.07 | 4 |  |
| clover | luck | 1 | 5 |  |
| ward_amulet | shield | 16 | 5 |  |
| scholar_lens | xpGain | 0.1 | 5 |  |
| hourglass | cooldown | 0.05 | 5 |  |
| twin_crest | count | [1,0,1,0] | 4 |  |
| vitality | maxHp | 0.1 | 5 | {"regen":0.25} |
| echo_gem | duration | 0.12 | 4 |  |

## 6. 法術（18 + 18 進化形）
初始解鎖：fireball, chain_lightning, thorn_field, frost_nova, arcane_orbs, spirit_wolf, mana_barrier；其餘由條件解鎖：{"ember_field":{"kind":"runs","n":3},"flame_wheel":{"kind":"kills","n":600},"glacial_ward":{"kind":"survive","n":420},"thunderstrike":{"kind":"level","n":12},"thunder_hawk":{"kind":"kills","n":1500},"razor_leaf":{"kind":"evolve","n":1},"shadow_familiar":{"kind":"evolve","n":2},"entropy_aura":{"kind":"bossKill","n":2}}；法師解鎖時其起手法術一併解鎖。

同時持有進化形上限 6（護欄 ≤ 8），法術欄 6，被動欄 6。

### Fireball（fireball）— fire / projectile
進化：**Meteor Rain（meteor_rain）** = fireball Lv 8 + power_sigil ≥ Lv 3

| Lv | cooldown | damage | count | speed | radius | explode | life | splash | spread | knock |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1.15 | 26 | 1 | 13 | 0.45 | 1.4 | 2.2 | 0.55 | 0.17 | 2 |
| 2 | 1.11 | 30 | 1 | 13 | 0.45 | 1.4 | 2.2 | 0.55 | 0.17 | 2 |
| 3 | 1.11 | 34 | 2 | 13 | 0.45 | 1.4 | 2.2 | 0.55 | 0.17 | 2 |
| 4 | 1.07 | 38 | 2 | 13 | 0.45 | 1.4 | 2.2 | 0.55 | 0.17 | 2 |
| 5 | 1.03 | 42 | 2 | 13 | 0.45 | 1.4 | 2.2 | 0.55 | 0.17 | 2 |
| 6 | 1.03 | 46 | 3 | 13 | 0.45 | 1.4 | 2.2 | 0.55 | 0.17 | 2 |
| 7 | 0.99 | 50 | 3 | 13 | 0.45 | 1.4 | 2.2 | 0.55 | 0.17 | 2 |
| 8 | 0.94 | 55 | 3 | 13 | 0.45 | 1.4 | 2.2 | 0.55 | 0.17 | 2 |

進化形數值：cooldown=1.1、damage=75、count=3、radius=2.6、delay=0.7、stagger=0.12、range=15、scatter=1.5、fire=3、tick=0.5、poolScale=0.8、burn=0.12、knock=6（類型 burst）

### Ember Field（ember_field）— fire / area
進化：**Volcano Eruption（volcano_eruption）** = ember_field Lv 8 + wide_sigil ≥ Lv 3

| Lv | cooldown | damage | count | radius | duration | tick | range |
|---|---|---|---|---|---|---|---|
| 1 | 2.5 | 5 | 1 | 2.3 | 3.5 | 0.5 | 16 |
| 2 | 2.4 | 6 | 1 | 2.3 | 3.5 | 0.5 | 16 |
| 3 | 2.4 | 7 | 2 | 2.3 | 3.5 | 0.5 | 16 |
| 4 | 2.3 | 8 | 2 | 2.3 | 3.5 | 0.5 | 16 |
| 5 | 2.2 | 9 | 2 | 2.3 | 3.5 | 0.5 | 16 |
| 6 | 2.2 | 10 | 3 | 2.3 | 3.5 | 0.5 | 16 |
| 7 | 2.1 | 11 | 3 | 2.3 | 3.5 | 0.5 | 16 |
| 8 | 1.95 | 13 | 3 | 2.3 | 3.5 | 0.5 | 16 |

進化形數值：cooldown=3、damage=30、count=2、radius=2.7、duration=4.5、tick=0.5、range=16、eruptionInterval=1.5、eruptionDamage=75、eruptionScale=1.15、knock=3、fragments=5、fragmentDamage=18、fragmentSpeed=8、fragmentRadius=0.3、fragmentLife=1.2（類型 area）

### Flame Wheel（flame_wheel）— fire / orbit
進化：**Phoenix Ring（phoenix_ring）** = flame_wheel Lv 8 + echo_gem ≥ Lv 2

| Lv | cooldown | damage | count | radius | speed | size |
|---|---|---|---|---|---|---|
| 1 | 0.7 | 26 | 2 | 7 | 2.8 | 1.4 |
| 2 | 0.675 | 29 | 2 | 7 | 2.8 | 1.4 |
| 3 | 0.675 | 32 | 3 | 7 | 2.8 | 1.4 |
| 4 | 0.65 | 35 | 3 | 7 | 2.8 | 1.4 |
| 5 | 0.625 | 38 | 3 | 7 | 2.8 | 1.4 |
| 6 | 0.625 | 41 | 4 | 7 | 2.8 | 1.4 |
| 7 | 0.6 | 44 | 4 | 7 | 2.8 | 1.4 |
| 8 | 0.575 | 47 | 4 | 7 | 2.8 | 1.4 |

進化形數值：cooldown=1.1、damage=80、count=5、radius=8、speed=3.2、size=0.8、hitInterval=0.45、featherDamage=45、featherSpeed=12、featherRadius=0.35、featherLife=1.5、featherPierce=1、healChance=0.15、heal=1、flourishScale=1.1（類型 orbit）

### Ice Lance（ice_lance）— ice / projectile
進化：**Polar Storm（polar_storm）** = ice_lance Lv 8 + tome_haste ≥ Lv 3

| Lv | cooldown | damage | count | speed | radius | pierce | life | spread | knock |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.95 | 15 | 2 | 19 | 0.4 | 4 | 1.8 | 0.12 | 1 |
| 2 | 0.91 | 19 | 2 | 19 | 0.4 | 4 | 1.8 | 0.12 | 1 |
| 3 | 0.87 | 23 | 2 | 19 | 0.4 | 4 | 1.8 | 0.12 | 1 |
| 4 | 0.87 | 27 | 3 | 19 | 0.4 | 4 | 1.8 | 0.12 | 1 |
| 5 | 0.83 | 31 | 3 | 19 | 0.4 | 4 | 1.8 | 0.12 | 1 |
| 6 | 0.79 | 35 | 3 | 19 | 0.4 | 4 | 1.8 | 0.12 | 1 |
| 7 | 0.76 | 39 | 3 | 19 | 0.4 | 4 | 1.8 | 0.12 | 1 |
| 8 | 0.72 | 43 | 3 | 19 | 0.4 | 4 | 1.8 | 0.12 | 1 |

進化形數值：cooldown=1.3、damage=48、count=9、radius=12、innerRadius=2、sweep=3.2、spin=2.8、size=0.7、hitInterval=0.6、fieldRatio=0.9、duration=1.35、tick=0.65（類型 orbit）

### Frost Nova（frost_nova）— ice / burst
進化：**Absolute Zero（absolute_zero）** = frost_nova Lv 8 + hourglass ≥ Lv 3

| Lv | cooldown | damage | count | radius | duration | knock |
|---|---|---|---|---|---|---|
| 1 | 2.1 | 20 | 1 | 10 | 0.65 | 3 |
| 2 | 2 | 26 | 1 | 10 | 0.65 | 3 |
| 3 | 1.9 | 32 | 1 | 10 | 0.65 | 3 |
| 4 | 1.8 | 38 | 1 | 10 | 0.65 | 3 |
| 5 | 1.7 | 44 | 1 | 10 | 0.65 | 3 |
| 6 | 1.6 | 50 | 1 | 10 | 0.65 | 3 |
| 7 | 1.5 | 56 | 1 | 10 | 0.65 | 3 |
| 8 | 1.4 | 62 | 1 | 10 | 0.65 | 3 |

進化形數值：cooldown=3.2、damage=48、count=1、radius=22、delay=0.75、shatter=2.8、freeze=2.2、knock=2（類型 burst）

### Glacial Ward（glacial_ward）— ice / aura
進化：**Frozen Bastion（frozen_bastion）** = glacial_ward Lv 8 + ward_amulet ≥ Lv 3

| Lv | cooldown | damage | count | radius | orbitRadius | spin | size | hitInterval | shield | duration | tick | fieldRatio |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 3 | 8 | 3 | 11 | 2.2 | 1.7 | 0.6 | 0.9 | 8 | 3.05 | 0.85 | 1.3 |
| 2 | 3 | 10.55 | 3 | 11 | 2.2 | 1.7 | 0.6 | 0.9 | 10 | 3.05 | 0.85 | 1.3 |
| 3 | 3 | 13.1 | 3 | 11.1 | 2.2 | 1.7 | 0.6 | 0.9 | 10 | 3.05 | 0.85 | 1.3 |
| 4 | 3 | 15.65 | 4 | 11.1 | 2.2 | 1.7 | 0.6 | 0.9 | 10 | 3.05 | 0.85 | 1.3 |
| 5 | 3 | 17.213 | 4 | 11.1 | 2.2 | 1.7 | 0.6 | 0.9 | 12 | 3.05 | 0.85 | 1.3 |
| 6 | 3 | 18.775 | 4 | 11.2 | 2.2 | 1.7 | 0.6 | 0.9 | 12 | 3.05 | 0.85 | 1.3 |
| 7 | 3 | 20.338 | 5 | 11.2 | 2.2 | 1.7 | 0.6 | 0.9 | 12 | 3.05 | 0.85 | 1.3 |
| 8 | 3 | 21.9 | 5 | 11.2 | 2.2 | 1.7 | 0.6 | 0.9 | 15 | 3.05 | 0.85 | 1.3 |

進化形數值：cooldown=2、damage=34、count=6、radius=14、orbitRadius=3.2、spin=0.65、size=0.9、hitInterval=0.9、shield=30、duration=2.05、tick=0.75、fieldRatio=1、reflectDamage=36、reflectCount=10、reflectSpeed=17、reflectLife=1.3、reflectPierce=2、reflectRadius=0.4（類型 aura）

### Chain Lightning（chain_lightning）— thunder / chain
進化：**Storm Wrath（storm_wrath）** = chain_lightning Lv 8 + twin_crest ≥ Lv 2

| Lv | cooldown | damage | count | jumps | range | jumpRange | arcLife |
|---|---|---|---|---|---|---|---|
| 1 | 1.2 | 29 | 1 | 3 | 20 | 7 | 0.22 |
| 2 | 1.135 | 37 | 1 | 3 | 20 | 7 | 0.22 |
| 3 | 1.07 | 45 | 1 | 3 | 20 | 7 | 0.22 |
| 4 | 1.005 | 53 | 1 | 3 | 20 | 7 | 0.22 |
| 5 | 0.94 | 61 | 1 | 3 | 20 | 7 | 0.22 |
| 6 | 0.875 | 69 | 1 | 3 | 20 | 7 | 0.22 |
| 7 | 0.81 | 77 | 1 | 3 | 20 | 7 | 0.22 |
| 8 | 0.745 | 85 | 1 | 3 | 20 | 7 | 0.22 |

進化形數值：cooldown=0.95、damage=62、count=3、jumps=4、range=22、jumpRange=8、arcLife=0.3、radius=2.7、duration=1.6、tick=0.4、fieldDamage=9（類型 chain）

### Thunderstrike（thunderstrike）— thunder / burst
進化：**Sky Judgement（sky_judgement）** = thunderstrike Lv 8 + clover ≥ Lv 3

| Lv | cooldown | damage | count | radius | delay | range | arcLife | columnLength |
|---|---|---|---|---|---|---|---|---|
| 1 | 1.5 | 16 | 2 | 2.2 | 0.4 | 20 | 0.2 | 1.5 |
| 2 | 1.43 | 20 | 2 | 2.2 | 0.4 | 20 | 0.2 | 1.5 |
| 3 | 1.36 | 24 | 2 | 2.2 | 0.4 | 20 | 0.2 | 1.5 |
| 4 | 1.29 | 28 | 2 | 2.2 | 0.4 | 20 | 0.2 | 1.5 |
| 5 | 1.22 | 32 | 2 | 2.2 | 0.4 | 20 | 0.2 | 1.5 |
| 6 | 1.15 | 36 | 2 | 2.2 | 0.4 | 20 | 0.2 | 1.5 |
| 7 | 1.08 | 40 | 2 | 2.2 | 0.4 | 20 | 0.2 | 1.5 |
| 8 | 1.01 | 44 | 2 | 2.2 | 0.4 | 20 | 0.2 | 1.5 |

進化形數值：cooldown=1.6、damage=90、count=3、radius=4、delay=0.65、range=22、arcLife=0.3、columnLength=3.4、aftershocks=2、aftershockDelay=0.32、aftershockDamage=15（類型 burst）

### Thunder Hawk（thunder_hawk）— thunder / summon
進化：**Storm Roc（storm_roc）** = thunder_hawk Lv 8 + wind_boots ≥ Lv 3

| Lv | damage | count | cooldown | speed | radius | range | life | hitInterval | arcLife |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 22 | 2 | 0.9 | 9 | 1.4 | 22 | 120 | 0.4 | 0.18 |
| 2 | 26 | 2 | 0.855 | 9 | 1.4 | 22 | 120 | 0.4 | 0.18 |
| 3 | 30 | 2 | 0.81 | 9 | 1.4 | 22 | 120 | 0.4 | 0.18 |
| 4 | 34 | 2 | 0.765 | 9 | 1.4 | 22 | 120 | 0.4 | 0.18 |
| 5 | 38 | 2 | 0.72 | 9 | 1.4 | 22 | 120 | 0.4 | 0.18 |
| 6 | 42 | 2 | 0.675 | 9 | 1.4 | 22 | 120 | 0.4 | 0.18 |
| 7 | 46 | 2 | 0.63 | 9 | 1.4 | 22 | 120 | 0.4 | 0.18 |
| 8 | 50 | 2 | 0.585 | 9 | 1.4 | 22 | 120 | 0.4 | 0.18 |

進化形數值：damage=100、count=2、cooldown=0.65、speed=10、radius=2.4、range=24、life=120、hitInterval=0.45、arcLife=0.24、boltInterval=0.8、boltDamage=42、boltRadius=2.5、boltDelay=0.28、columnLength=2（類型 summon）

### Arcane Missiles（arcane_missiles）— arcane / projectile
進化：**Arcane Barrage（arcane_barrage）** = arcane_missiles Lv 8 + tome_haste ≥ Lv 4

| Lv | cooldown | damage | count | speed | radius | life | homing | spread |
|---|---|---|---|---|---|---|---|---|
| 1 | 1.2 | 32 | 3 | 15 | 0.3 | 2.4 | 7 | 0.24 |
| 2 | 1.15 | 37 | 3 | 15 | 0.3 | 2.4 | 7 | 0.24 |
| 3 | 1.15 | 42 | 4 | 15 | 0.3 | 2.4 | 7 | 0.24 |
| 4 | 1.1 | 48 | 4 | 15 | 0.3 | 2.4 | 7 | 0.24 |
| 5 | 1.07 | 51 | 4 | 15 | 0.3 | 2.4 | 7 | 0.24 |
| 6 | 1.04 | 54 | 4 | 15 | 0.3 | 2.4 | 7 | 0.24 |
| 7 | 1.01 | 57 | 4 | 15 | 0.3 | 2.4 | 7 | 0.24 |
| 8 | 0.98 | 60 | 4 | 15 | 0.3 | 2.4 | 7 | 0.24 |

進化形數值：cooldown=0.24、damage=52、count=2、speed=18、radius=0.32、life=2、homing=10、rotation=3.3、launchRadius=1.1、explode=1.8、blastDamage=24（類型 projectile）

### Arcane Orbs（arcane_orbs）— arcane / orbit
進化：**Celestial Orrery（celestial_orrery）** = arcane_orbs Lv 8 + wide_sigil ≥ Lv 2

| Lv | damage | count | radius | speed | size | hitInterval |
|---|---|---|---|---|---|---|
| 1 | 28 | 3 | 9 | 2.6 | 1.1 | 0.65 |
| 2 | 31 | 4 | 9 | 2.6 | 1.1 | 0.65 |
| 3 | 34 | 5 | 9 | 2.6 | 1.1 | 0.65 |
| 4 | 38 | 6 | 9 | 2.6 | 1.1 | 0.65 |
| 5 | 39 | 7 | 9 | 2.6 | 1.1 | 0.65 |
| 6 | 40 | 8 | 9 | 2.6 | 1.1 | 0.65 |
| 7 | 41 | 9 | 9 | 2.6 | 1.1 | 0.65 |
| 8 | 42 | 10 | 9 | 2.6 | 1.1 | 0.65 |

進化形數值：cooldown=0.5、damage=58、count=8、radius=6、outerScale=1.4、speed=2.4、outerSpeed=-1.5、size=0.8、outerSize=0.65、hitInterval=0.5、shotDamage=65、shotCount=4、shotSpeed=18、shotLife=2、homing=8、shotRadius=0.35（類型 orbit）

### Mana Barrier（mana_barrier）— arcane / aura
進化：**Aegis of Mana（aegis_of_mana）** = mana_barrier Lv 8 + vitality ≥ Lv 3

| Lv | cooldown | damage | radius | shield | restore | tick | runes | runeSize | rotation |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 3 | 16 | 10 | 15 | 7 | 0.5 | 6 | 0.4 | 1.2 |
| 2 | 3 | 17 | 10 | 18 | 7 | 0.5 | 6 | 0.4 | 1.2 |
| 3 | 3 | 18 | 10 | 21 | 7 | 0.5 | 6 | 0.4 | 1.2 |
| 4 | 3 | 19 | 10.02 | 21 | 7 | 0.5 | 6 | 0.4 | 1.2 |
| 5 | 3 | 22 | 10.02 | 24 | 7 | 0.5 | 6 | 0.4 | 1.2 |
| 6 | 3 | 25 | 10.12 | 24 | 7 | 0.5 | 6 | 0.4 | 1.2 |
| 7 | 3 | 28 | 10.12 | 28 | 7 | 0.5 | 6 | 0.4 | 1.2 |
| 8 | 3 | 31 | 10.22 | 28 | 7 | 0.5 | 6 | 0.4 | 1.2 |

進化形數值：cooldown=2.4、damage=46、radius=13、shield=55、restore=18、tick=0.5、runes=10、runeSize=0.55、rotation=-0.8、shockDamage=90、shockRadius=15、shockDuration=0.45、knock=2（類型 aura）

### Thorn Field（thorn_field）— nature / area
進化：**World Roots（world_roots）** = thorn_field Lv 8 + magnet_charm ≥ Lv 2

| Lv | cooldown | damage | count | radius | duration | tick | slow | range | growth | initialRadius |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2.8 | 12 | 1 | 2.7 | 3.1 | 0.55 | 0.8 | 18 | 0.6 | 0.45 |
| 2 | 2.68 | 16 | 1 | 2.7 | 3.1 | 0.55 | 0.8 | 18 | 0.6 | 0.45 |
| 3 | 2.56 | 20 | 1 | 2.7 | 3.1 | 0.55 | 0.8 | 18 | 0.6 | 0.45 |
| 4 | 2.56 | 21 | 2 | 2.7 | 3.1 | 0.55 | 0.8 | 18 | 0.6 | 0.45 |
| 5 | 2.44 | 25 | 2 | 2.7 | 3.1 | 0.55 | 0.8 | 18 | 0.6 | 0.45 |
| 6 | 2.32 | 29 | 2 | 2.7 | 3.1 | 0.55 | 0.8 | 18 | 0.6 | 0.45 |
| 7 | 2.2 | 33 | 2 | 2.7 | 3.1 | 0.55 | 0.8 | 18 | 0.6 | 0.45 |
| 8 | 2.08 | 37 | 2 | 2.7 | 3.1 | 0.55 | 0.8 | 18 | 0.6 | 0.45 |

進化形數值：cooldown=2.5、damage=65、count=5、radius=3.4、duration=2.6、tick=0.6、slow=1.2、range=18、spacing=2.4、ringRadius=3.8、delay=0.08、heal=2、growth=0.35、initialRadius=0.35（類型 area）

### Spirit Wolf（spirit_wolf）— nature / summon
進化：**Fenrir Pack（fenrir_pack）** = spirit_wolf Lv 8 + vitality ≥ Lv 2

| Lv | damage | count | speed | radius | life | hitInterval | range | spawnRadius |
|---|---|---|---|---|---|---|---|---|
| 1 | 12 | 2 | 10 | 0.75 | 30 | 0.6 | 22 | 1.2 |
| 2 | 14 | 2.25 | 10 | 0.75 | 30 | 0.6 | 22 | 1.2 |
| 3 | 16 | 2.5 | 10 | 0.75 | 30 | 0.6 | 22 | 1.2 |
| 4 | 18 | 2.75 | 10 | 0.75 | 30 | 0.6 | 22 | 1.2 |
| 5 | 20 | 3 | 10 | 0.75 | 30 | 0.6 | 22 | 1.2 |
| 6 | 22 | 3.25 | 10 | 0.75 | 30 | 0.6 | 22 | 1.2 |
| 7 | 24 | 3.5 | 10 | 0.75 | 30 | 0.6 | 22 | 1.2 |
| 8 | 26 | 3.75 | 10 | 0.75 | 30 | 0.6 | 22 | 1.2 |

進化形數值：cooldown=5、damage=35、count=6、speed=11、radius=0.85、life=30、hitInterval=0.6、range=24、spawnRadius=1.6、howlDuration=2.6、howlDamage=1.45、howlSpeed=1.35、alphaDamage=1.5、alphaSize=1.5、howlRadius=4（類型 summon）

### Razor Leaf（razor_leaf）— nature / chain
進化：**Blade Tempest（blade_tempest）** = razor_leaf Lv 8 + wind_boots ≥ Lv 2

| Lv | cooldown | damage | count | speed | radius | life | bounces | spread |
|---|---|---|---|---|---|---|---|---|
| 1 | 1.3 | 18 | 1 | 17 | 0.45 | 3 | 3 | 0.16 |
| 2 | 1.25 | 24 | 1 | 17 | 0.45 | 3 | 3 | 0.16 |
| 3 | 1.2 | 30 | 1 | 17 | 0.45 | 3 | 3 | 0.16 |
| 4 | 1.15 | 36 | 1 | 17 | 0.45 | 3 | 3 | 0.16 |
| 5 | 1.1 | 42 | 1 | 17 | 0.45 | 3 | 3 | 0.16 |
| 6 | 1.05 | 48 | 1 | 17 | 0.45 | 3 | 3 | 0.16 |
| 7 | 1 | 54 | 1 | 17 | 0.45 | 3 | 3 | 0.16 |
| 8 | 0.95 | 60 | 1 | 17 | 0.45 | 3 | 3 | 0.16 |

進化形數值：cooldown=1.65、damage=32、count=7、speed=15、radius=0.5、life=3.6、bounces=4、spiralDuration=0.5、spiralSpeed=3.5、seekRange=22（類型 chain）

### Void Rift（void_rift）— void / area
進化：**Black Hole（black_hole）** = void_rift Lv 8 + echo_gem ≥ Lv 3

| Lv | cooldown | damage | count | radius | duration | tick | pull | range |
|---|---|---|---|---|---|---|---|---|
| 1 | 3.2 | 7 | 1 | 3.4 | 2.8 | 0.5 | 4.2 | 20 |
| 2 | 3.05 | 13 | 1 | 3.4 | 2.8 | 0.5 | 4.2 | 20 |
| 3 | 2.9 | 19 | 1 | 3.4 | 2.8 | 0.5 | 4.2 | 20 |
| 4 | 2.75 | 25 | 1 | 3.4 | 2.8 | 0.5 | 4.2 | 20 |
| 5 | 2.6 | 28.5 | 1 | 3.4 | 2.8 | 0.5 | 4.2 | 20 |
| 6 | 2.45 | 32 | 1 | 3.4 | 2.8 | 0.5 | 4.2 | 20 |
| 7 | 2.3 | 35.5 | 1 | 3.4 | 2.8 | 0.5 | 4.2 | 20 |
| 8 | 2.15 | 39 | 1 | 3.4 | 2.8 | 0.5 | 4.2 | 20 |

進化形數值：cooldown=6、damage=12、count=1、radius=19、coreRadius=4.5、duration=3.5、tick=0.5、pull=8、collapseDamage=85、collapseRadius=7、range=14（類型 area）

### Shadow Familiar（shadow_familiar）— void / summon
進化：**Shadow Legion（shadow_legion）** = shadow_familiar Lv 8 + scholar_lens ≥ Lv 3

| Lv | damage | count | speed | radius | life | range | fireInterval | shotSpeed | shotRadius | shotLife | pierce |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 22 | 2 | 9 | 0.45 | 120 | 22 | 0.9 | 18 | 0.35 | 2 | 0 |
| 2 | 25.5 | 2.4 | 9 | 0.45 | 120 | 22 | 0.9 | 18 | 0.35 | 2 | 0 |
| 3 | 29 | 2.8 | 9 | 0.45 | 120 | 22 | 0.9 | 18 | 0.35 | 2 | 0 |
| 4 | 32.5 | 3.2 | 9 | 0.45 | 120 | 22 | 0.9 | 18 | 0.35 | 2 | 0 |
| 5 | 36 | 3.6 | 9 | 0.45 | 120 | 22 | 0.9 | 18 | 0.35 | 2 | 0 |
| 6 | 39.5 | 4 | 9 | 0.45 | 120 | 22 | 0.9 | 18 | 0.35 | 2 | 0 |
| 7 | 43 | 4.4 | 9 | 0.45 | 120 | 22 | 0.9 | 18 | 0.35 | 2 | 0 |
| 8 | 46.5 | 4.8 | 9 | 0.45 | 120 | 22 | 0.9 | 18 | 0.35 | 2 | 0 |

進化形數值：damage=37、count=8、maxCount=12、killsPerRecruit=8、meleeEvery=3、speed=11、radius=0.65、life=120、range=24、fireInterval=0.8、hitInterval=0.5、shotSpeed=20、shotRadius=0.4、shotLife=2、pierce=1、formationRadius=2.6（類型 summon）

### Entropy Aura（entropy_aura）— void / aura
進化：**Heat Death（heat_death）** = entropy_aura Lv 8 + hourglass ≥ Lv 2

| Lv | cooldown | damage | count | radius | duration | tick | slow |
|---|---|---|---|---|---|---|---|
| 1 | 0.5 | 12 | 1 | 10 | 0.49 | 0.5 | 0.8 |
| 2 | 0.5 | 14.5 | 1 | 10.1 | 0.49 | 0.5 | 0.8 |
| 3 | 0.5 | 17 | 1 | 10.2 | 0.49 | 0.5 | 0.8 |
| 4 | 0.5 | 19.5 | 1 | 10.3 | 0.49 | 0.5 | 0.8 |
| 5 | 0.5 | 22 | 1 | 10.4 | 0.49 | 0.5 | 0.8 |
| 6 | 0.5 | 24.5 | 1 | 10.5 | 0.49 | 0.5 | 0.8 |
| 7 | 0.5 | 27 | 1 | 10.6 | 0.49 | 0.5 | 0.8 |
| 8 | 0.5 | 29.5 | 1 | 10.7 | 0.49 | 0.5 | 0.8 |

進化形數值：cooldown=2.8、damage=68、count=1、radius=12、startRadius=1.2、duration=1.6、tick=0.15、freeze=0.6、bossFreezeScale=0.2、weakThreshold=0.4、weakMultiplier=2.2（類型 aura）

## 7. 敵人（10 族、26 種）
| id | 族 | 階 | HP | 速度 | 傷害 | 半徑 | XP | 特性 |
|---|---|---|---|---|---|---|---|---|
| imp | swarm | 1 | 12 | 2.7 | 5 | 0.45 | 1 |  |
| ghoul | swarm | 2 | 34 | 2.9 | 8 | 0.55 | 3 |  |
| revenant | swarm | 3 | 80 | 3.1 | 13 | 0.62 | 8 |  |
| fangwolf | fast | 1 | 15 | 4.4 | 6 | 0.5 | 1 | {"lungeEvery":3.2,"lungeTime":0.45,"lungeMult":2} |
| shade_stalker | fast | 3 | 48 | 5 | 12 | 0.5 | 6 | {"lungeEvery":2.6,"lungeTime":0.5,"lungeMult":2.2} |
| stone_brute | tank | 1 | 110 | 1.8 | 14 | 0.95 | 4 |  |
| iron_ogre | tank | 2 | 300 | 1.9 | 20 | 1.15 | 10 |  |
| colossus | tank | 3 | 720 | 1.7 | 30 | 1.5 | 24 |  |
| cult_archer | ranged | 1 | 24 | 2.3 | 7 | 0.5 | 2 | {"range":10,"interval":2.4,"count":1,"spread":0,"shotSpeed":7,"shotLife":3.5} |
| hex_caster | ranged | 2 | 55 | 2.2 | 9 | 0.55 | 5 | {"range":11,"interval":2.8,"count":3,"spread":0.28,"shotSpeed":6.5,"shotLife":3.8} |
| arc_gunner | ranged | 3 | 120 | 2 | 14 | 0.7 | 11 | {"range":12,"interval":3.4,"count":5,"spread":0.2,"shotSpeed":5.5,"shotLife":4.2,"ring":true} |
| slime | split | 1 | 42 | 2.2 | 7 | 0.75 | 2 | {"into":"slime_bit","count":2} |
| brood_mother | split | 3 | 180 | 2 | 12 | 1 | 9 | {"into":"brood_spawn","count":4} |
| slime_bit | split | 0 | 12 | 3 | 4 | 0.4 | 1 | child |
| brood_spawn | split | 0 | 18 | 3.6 | 6 | 0.4 | 1 | child |
| bomb_imp | exploder | 1 | 10 | 3.6 | 24 | 0.45 | 2 | {"fuse":0.55,"blast":2.8,"trigger":1.5} |
| magma_bomber | exploder | 3 | 46 | 3 | 42 | 0.7 | 7 | {"fuse":0.8,"blast":4,"trigger":2} |
| gloom_bat | flyer | 1 | 11 | 4 | 5 | 0.4 | 1 | flying |
| harpy | flyer | 2 | 38 | 4.2 | 10 | 0.55 | 4 | flying |
| wraith | flyer | 3 | 95 | 3.8 | 16 | 0.75 | 10 | flying |
| war_drummer | buffer | 2 | 65 | 2.1 | 8 | 0.7 | 5 | {"radius":5.5,"speed":0.25,"damage":0.2,"keep":7} |
| banner_knight | buffer | 3 | 170 | 2 | 14 | 0.85 | 12 | {"radius":7,"speed":0.35,"damage":0.35,"keep":6} |
| mender | healer | 2 | 52 | 2.1 | 6 | 0.55 | 5 | {"radius":6,"interval":3,"heal":0.1,"keep":8} |
| life_weaver | healer | 3 | 130 | 2 | 9 | 0.7 | 12 | {"radius":8,"interval":2.5,"heal":0.15,"keep":8} |
| necromancer | summoner | 2 | 100 | 2 | 8 | 0.65 | 7 | {"into":"imp","count":2,"interval":6,"keep":9,"cap":10} |
| hive_queen | summoner | 3 | 280 | 1.9 | 14 | 1 | 16 | {"into":"gloom_bat","count":3,"interval":7,"keep":10,"cap":12} |

## 8. 出怪表與節奏曲線（R12）
0–3 分散兵期；3–8 分成群期（5:00 精英波）；8:00 Boss 1；8–14 分混合期；14:00 Boss 2；14–18 分決戰期（密度倍增）；18:00 終 Boss；之後無盡（計分加倍）。

**族權重（[秒, 權重] 關鍵格）**

| 族 | 關鍵格 |
|---|---|
| swarm | [[0,100],[180,70],[300,50],[480,32],[840,26],[1080,24]] |
| fast | [[0,0],[75,0],[76,6],[180,16],[480,20],[840,22],[1080,22]] |
| tank | [[0,0],[215,0],[240,6],[480,18],[840,22],[1080,22]] |
| ranged | [[0,0],[335,0],[360,6],[480,16],[840,18],[1080,18]] |
| split | [[0,0],[435,0],[480,5],[840,12],[1080,12]] |
| exploder | [[0,0],[495,0],[540,6],[840,12],[1080,12]] |
| flyer | [[0,0],[465,0],[500,6],[840,14],[1080,14]] |
| buffer | [[0,0],[570,0],[600,4],[840,9],[1080,9]] |
| healer | [[0,0],[590,0],[630,3],[840,8],[1080,8]] |
| summoner | [[0,0],[620,0],[660,3],[840,7],[1080,7]] |

同屏目標密度（難度 ×1）：[[0,12],[60,16],[180,26],[300,34],[480,38],[840,46],[1080,50]]；決戰期加成：{"from":840,"to":900,"mult":1.35}；變體階機率：[[0,[1,0,0]],[240,[0.85,0.15,0]],[480,[0.55,0.4,0.05]],[840,[0.25,0.45,0.3]],[1080,[0.1,0.35,0.55]]]；血量成長：{"perMinute":0.09}；分組：{"swarm":[3,6],"fast":[2,4],"tank":[1,2],"ranged":[1,2],"split":[1,2],"exploder":[2,3],"flyer":[2,4],"buffer":[1,1],"healer":[1,1],"summoner":[1,1]}；{"perSecond":7,"groupRadius":2.2,"eliteWave":{"count":7,"hpMult":4.5,"dmgMult":1.3,"sizeMult":1.45,"xpMult":6},"bossReduce":0.55}

## 9. Boss（5）
規則：{"tierDamage":[1,1.25,1.55],"xpDrop":[150,300,600],"summonCap":14,"enrageSpeed":1.35,"enrageCooldown":0.65,"spawnDistance":17}。同一隻 Boss 於 8:00／14:00／18:00 以階 0／1／2 登場（階 1 加招喚與第三招，階 2 全招式＋狂暴）。單場目標 60–120 秒（護欄 45–180）。

| id | 地圖 | 半徑 | 速度 | 接觸傷害 | HP(階0/1/2) | 狂暴血量 | 招式 |
|---|---|---|---|---|---|---|---|
| fallen_archmage | academy | 1.4 | 2.4 | 18 | 26000 / 60000 / 160000 | 0.3 | arcane_rings, rune_seals, summon_constructs, barrage_spiral |
| rotwood_king | forest | 1.9 | 1.8 | 14 | 32000 / 55000 / 150000 | 0.3 | root_eruption, spore_cloud, seed_barrage, treant_call |
| rimewing | tundra | 1.7 | 3.2 | 4 | 23000 / 55000 / 160000 | 0.3 | frost_breath, icicle_rain, blizzard_dash, ice_golems |
| ignarok | abyss | 2.2 | 1.6 | 30 | 19000 / 40000 / 150000 | 0.3 | ground_slam, lava_pools, fire_ring_volley, magma_bombers |
| nullgaze | void | 1.6 | 2 | 26 | 23000 / 48000 / 120000 | 0.3 | gravity_wells, gaze_sweep, rift_summons, void_spiral |

**fallen_archmage attacks**：`{"movement":{"distance":10,"teleportCd":11,"teleportWarn":1,"teleportRadius":12},"arcane_rings":{"cooldown":4.8,"warn":0.9,"count":16,"extra":4,"gap":3,"speed":5.6,"damage":11,"life":6,"radius":0.32},"rune_seals":{"cooldown":6.4,"warn":1.2,"count":3,"radius":2.2,"spacing":4.8,"damage":19},"summon_constructs":{"cooldown":15,"count":3,"ids":["imp","ghoul","revenant"]},"barrage_spiral":{"cooldown":10,"duration":3.2,"interval":0.22,"rotation":0.32,"arms":2,"extra":1,"speed":6.2,"damage":10,"life":5,"radius":0.28}}`

**rotwood_king attacks**：`{"root_eruption":{"cooldown":5.8,"warn":1.4,"count":7,"spacing":2.6,"radius":1.2,"damage":8},"spore_cloud":{"cooldown":7.2,"warn":1.5,"radius":2.6,"life":6,"tick":0.8,"damage":2,"slow":0.12,"offset":4.5},"seed_barrage":{"cooldown":4.8,"count":7,"extra":2,"spread":1.5,"speed":5.2,"damage":5,"life":6,"radius":0.32},"treant_call":{"cooldown":16,"count":2,"finalCount":4,"ids":["slime","ghoul"]}}`

**rimewing attacks**：`{"movement":{"distance":5.5,"strafe":0.4},"frost_breath":{"cooldown":5.5,"warn":1.4,"rows":5,"spacing":2.3,"radius":1.1,"width":0.45,"damage":3,"bullets":5,"extra":2,"spread":0.9,"speed":5.5,"life":5},"icicle_rain":{"cooldown":7,"warn":1.5,"count":5,"radius":1.3,"spread":6,"damage":3},"blizzard_dash":{"cooldown":9,"warn":1.2,"duration":0.9,"speed":18,"extension":5,"spacing":2,"radius":1.2},"ice_golems":{"cooldown":17,"count":2,"finalCount":4,"id":"fangwolf"}}`

**ignarok attacks**：`{"stopDistance":7,"windupSpeed":0.2,"ground_slam":{"cooldown":8,"warn":1.4,"radius":4,"damage":16,"count":18,"extra":6,"gap":4,"speed":4.5,"life":6,"bulletDamage":6,"bulletRadius":0.32},"lava_pools":{"cooldown":6.5,"warn":1.4,"radius":2.1,"life":5,"damage":4,"tick":0.9,"count":2,"extra":1,"spacing":4},"fire_ring_volley":{"cooldown":6,"warn":1.1,"count":22,"extra":6,"gap":5,"speed":5.5,"life":5,"damage":5,"bulletRadius":0.3,"volleys":2,"interval":0.6,"rotation":0.12},"magma_bombers":{"cooldown":17,"warn":1.4,"radius":1.8,"spawnRadius":4,"count":2,"eliteCount":2},"bulletSize":0.7,"bulletGlow":1.7}`

**nullgaze attacks**：`{"orbitDistance":7,"orbitRate":0.22,"windupSpeed":0.25,"gravity_wells":{"cooldown":8.5,"warn":1.4,"radius":3.5,"coreRadius":1.2,"life":4,"damage":3,"tick":1,"pull":1.2,"count":2,"extra":1,"spacing":6},"gaze_sweep":{"cooldown":9,"warn":1.5,"radius":0.75,"step":1.4,"length":11,"slices":5,"arc":0.85,"interval":0.2,"active":0.16,"damage":4,"speed":6,"bulletRadius":0.26,"life":4,"extra":1},"rift_summons":{"cooldown":16,"warn":1.4,"radius":2,"spawnRadius":4,"count":3,"eliteCount":1},"void_spiral":{"cooldown":7,"duration":2.4,"interval":0.26,"arms":3,"extra":1,"rotation":0.3,"speed":5,"life":5,"damage":5,"bulletRadius":0.26},"bulletSize":0.65,"bulletGlow":1.8}`

## 10. 地圖（5）
| id | Boss | 解鎖 | 加速度 | 障礙數 | 危害 | 主題權重 |
|---|---|---|---|---|---|---|
| academy | fallen_archmage | 初始 | 60 | 12 | [{"kind":"rune_pylon","every":22,"count":2,"radius":4.2,"warn":1.6,"active":0.5,"damage":14}] | {"swarm":1,"fast":1,"tank":1,"ranged":1.2,"split":1,"exploder":1,"flyer":1,"buffer":1,"healer":1,"summoner":1.1} |
| forest | rotwood_king | {"kind":"bossKill","map":"academy"} | 60 | 20 | [{"kind":"spore_cloud","every":16,"count":2,"radius":3.6,"life":12,"drift":0.9,"damage":5,"tick":0.5}] | {"swarm":1.3,"fast":1,"tank":0.9,"ranged":0.9,"split":1.6,"exploder":1,"flyer":1.2,"buffer":0.8,"healer":1.2,"summoner":1.6} |
| tundra | rimewing | {"kind":"bossKill","map":"forest"} | 14 | 16 | [{"kind":"blizzard","every":20,"duration":5,"force":3.2,"warn":1.8}] | {"swarm":1,"fast":1.5,"tank":1.3,"ranged":1,"split":0.8,"exploder":0.8,"flyer":1,"buffer":1.2,"healer":1,"summoner":0.9} |
| abyss | ignarok | {"kind":"bossKill","map":"tundra"} | 60 | 16 | [{"kind":"lava_burst","every":8,"count":3,"radius":2.6,"warn":1.6,"damage":18}] | {"swarm":1,"fast":0.9,"tank":1.2,"ranged":1.2,"split":0.8,"exploder":1.8,"flyer":0.9,"buffer":1.2,"healer":0.7,"summoner":0.9} |
| void | nullgaze | {"kind":"bossKill","map":"abyss"} | 60 | 14 | [{"kind":"void_rift","every":24,"count":1,"radius":7,"life":9,"pull":4.5,"damage":12,"tick":0.4}] | {"swarm":0.9,"fast":1.1,"tank":1,"ranged":1.1,"split":1.4,"exploder":1,"flyer":1.6,"buffer":1.2,"healer":1.5,"summoner":1.2} |

## 11. 計分與成績榜
計分 = (存活時間 + 擊殺 + 精英 + Boss + 等級) × 難度倍率；進無盡後新增分數 ×2（R21）。本機榜依 法師×難度 分欄，每欄前 20 筆（R20）。係數：perSecond=2、perKill=1、perEliteKill=25、perBossKill=1500、finalBossKill=6000、levelBonus=10、difficultyScale=[1,1.25,1.55,1.9,2.4]、leaderboardSize=20

## 12. 音樂與音效
BGM 共 15 首（R19：標題／選單／Boss／結算／無盡各 1 + 五圖環境各 2 = 15；戰鬥中播放各圖環境曲，護欄 ≥ 12）。全部由 OPM.js FM 即時合成。

| 曲目 | BPM | 拍數 | 層數 | 音符數 |
|---|---|---|---|---|
| title | 104 | 64 | 4 | 231 |
| menu | 82 | 32 | 4 | 119 |
| boss | 148 | 32 | 5 | 159 |
| results | 88 | 32 | 4 | 116 |
| endless | 132 | 32 | 5 | 155 |
| academy-1 | 132 | 32 | 5 | 173 |
| academy-2 | 146 | 32 | 5 | 281 |
| forest-1 | 96 | 32 | 5 | 158 |
| forest-2 | 122 | 32 | 5 | 278 |
| tundra-1 | 108 | 32 | 5 | 165 |
| tundra-2 | 140 | 32 | 5 | 279 |
| abyss-1 | 100 | 32 | 5 | 163 |
| abyss-2 | 152 | 32 | 5 | 281 |
| void-1 | 102 | 32 | 5 | 162 |
| void-2 | 144 | 32 | 5 | 272 |

SFX：ui, pickup, level, evolve, boss, hurt, cast:fire, hit:fire, cast:ice, hit:ice, cast:thunder, hit:thunder, cast:arcane, hit:arcane, cast:nature, hit:nature, cast:void, hit:void（七類：施法／命中／拾取／升級／進化／Boss 登場／UI 點擊；另有受傷）。
