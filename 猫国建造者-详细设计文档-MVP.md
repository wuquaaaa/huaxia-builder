# 猫国建造者 · 详细设计文档（MVP 可玩闭环）

> 本文档是可直接照着开发的详设。范围为 **MVP 可玩闭环**：采集 → 建造 → 人口/工种 → 科技 → 季节 → 存档 → 离线结算。所有数据结构、配置表、公式、验收标准均落到可编码粒度。后续系统（贸易、宗教、转生、太空）预留接口但不在本期实现。
>
> 配套阅读：`猫国建造者-设计文档.md`（总览/愿景）。

---

## 0. 技术选型说明

### 0.1 原版用什么
原版《Kittens Game》（作者 bloodrizer）使用 **原生 JavaScript + Dojo Toolkit（pre-1.7）**，存档用 `lz-string` 压缩。Dojo 在 2014 年是主流，但今天已过时，不建议复刻。

### 0.2 本项目选型（推荐）
| 层 | 选型 | 理由 |
|----|------|------|
| 语言 | **TypeScript** | 资源/建筑/科技配置多，强类型避免低级错误 |
| 构建 | **Vite** | 启动快、HMR 好 |
| 核心逻辑 | **纯 TS（core/，零 UI 依赖）** | 可单测、可移植、与渲染解耦 |
| UI | **React 18** | 组件化；游戏循环在 React 外运行，节流同步 |
| 状态同步 | 自建轻量 store + `useSyncExternalStore` | 避免每 tick 触发 React 重渲染 |
| 存档 | `localStorage` + `lz-string` 压缩 + Base64 导入导出 | 无需服务器 |
| 测试 | **Vitest** | 与 Vite 同生态，core 逻辑全覆盖 |

### 0.3 关键架构原则
1. **逻辑与渲染分离**：`core/` 是一个可独立运行的状态机，`requestAnimationFrame` 驱动 tick；UI 仅订阅快照。
2. **数据驱动**：资源、建筑、科技全部写在配置表里（`data/*.ts`），逻辑只读配置，调平衡不改代码。
3. **纯函数优先**：产出/成本/增长计算写成纯函数，输入 state 输出 state 或数值，便于测试。

---

## 1. 项目结构

```
mao/
├─ index.html
├─ package.json
├─ vite.config.ts
├─ src/
│  ├─ core/                  # 纯逻辑，无 UI 依赖
│  │  ├─ state.ts            # GameState 定义 + 初始 state 工厂
│  │  ├─ engine.ts          # tick 主循环、产出/消耗结算
│  │  ├─ resources.ts       # 资源产量、储量上限计算
│  │  ├─ population.ts      # 人口增长、饥荒、工种分配
│  │  ├─ buildings.ts       # 购买校验、扣费、效果应用
│  │  ├─ tech.ts            # 科技解锁
│  │  ├─ calendar.ts        # 季节/历法推进
│  │  ├─ save.ts            # 序列化/反序列化/迁移
│  │  └─ offline.ts         # 离线结算
│  ├─ data/                 # 配置表（数据驱动）
│  │  ├─ resources.data.ts
│  │  ├─ buildings.data.ts
│  │  ├─ jobs.data.ts
│  │  ├─ techs.data.ts
│  │  └─ seasons.data.ts
│  ├─ store/
│  │  └─ gameStore.ts       # 订阅/快照，连接 core 与 React
│  ├─ ui/
│  │  ├─ App.tsx
│  │  ├─ ResourceBar.tsx
│  │  ├─ BuildingsPanel.tsx
│  │  ├─ JobsPanel.tsx
│  │  ├─ TechPanel.tsx
│  │  └─ LogPanel.tsx
│  └─ main.tsx
└─ tests/
   ├─ resources.test.ts
   ├─ population.test.ts
   └─ save.test.ts
```

---

## 2. 数据模型（TypeScript 定义）

### 2.1 资源 / 储量
```ts
export type ResourceId = 'catnip' | 'wood' | 'minerals' | 'science';

export interface ResourceState {
  amount: number;   // 当前量
  // cap 不存储，每帧根据建筑/科技计算（派生值）
}

export interface ResourceConfig {
  id: ResourceId;
  name: string;          // 显示名
  baseCap: number;       // 基础上限（科学/木材等可无上限时设 Infinity）
  craftable: boolean;    // 是否可上限扩容
}
```

### 2.2 建筑
```ts
export type BuildingId = 'field' | 'hut' | 'library' | 'barn' | 'mine';

export interface BuildingConfig {
  id: BuildingId;
  name: string;
  // 价格：base * priceRatio^count，每种资源独立计算
  prices: Partial<Record<ResourceId, number>>;
  priceRatio: number;            // 建议 1.12
  // 被动产出（每秒，正=产、负=耗），季节修正在引擎里乘
  produces?: Partial<Record<ResourceId, number>>;
  affectedBySeason?: ResourceId[]; // 哪些产出受季节影响（如 catnip）
  // 提供的容量加成
  capBonus?: Partial<Record<ResourceId, number>>;
  // 提供的人口上限
  maxKittens?: number;
  // 解锁条件：需要的科技 id（无则一开始可见）
  requiresTech?: TechId;
  // 乘算加成（如图书馆提升科学产量、矿场提升矿工产量）
  multipliers?: { target: ResourceId | JobId; factor: number };
}

export interface BuildingState {
  count: number;        // 已建数量
  unlocked: boolean;    // 是否已解锁可见
}
```

### 2.3 工种 / 人口
```ts
export type JobId = 'farmer' | 'woodcutter' | 'scholar' | 'miner';

export interface JobConfig {
  id: JobId;
  name: string;
  produces: Partial<Record<ResourceId, number>>; // 每只猫每秒产出
  affectedBySeason?: ResourceId[];
  requiresTech?: TechId;
}

export interface Kitten {
  name: string;        // 随机猫名
  job: JobId | null;   // null = 闲置
  skill: number;       // 当前工种熟练度 0~∞，转化为加成
}

export interface PopulationState {
  kittens: Kitten[];
  growthProgress: number; // 0~1，满了生一只
}
```

### 2.4 科技
```ts
export type TechId = 'calendar' | 'agriculture' | 'mining';

export interface TechConfig {
  id: TechId;
  name: string;
  cost: Partial<Record<ResourceId, number>>; // 主要是 science
  requires?: TechId[];                        // 前置科技
  unlocksBuildings?: BuildingId[];
  unlocksJobs?: JobId[];
  description: string;
}
```

### 2.5 顶层 GameState
```ts
export interface GameState {
  version: number;                 // 存档版本，迁移用
  lastTick: number;                // 时间戳（ms），离线结算用
  resources: Record<ResourceId, ResourceState>;
  buildings: Record<BuildingId, BuildingState>;
  techs: Record<TechId, boolean>;  // 是否已研究
  population: PopulationState;
  calendar: {
    day: number;     // 0~99，每季 100 天
    season: 0|1|2|3; // 0春 1夏 2秋 3冬
    year: number;
  };
  log: LogEntry[];   // 最近 N 条事件
}

export interface LogEntry { ts: number; type: 'info'|'warn'|'event'; text: string; }
```

---

## 3. 配置表（初始数值，全部可调）

> 下列数值为**初始平衡基线**，须用 §9 的电子表格法做正式调参。统一约定：产出/消耗均以**每秒**为单位；引擎内部按 tick 拆分。

### 3.1 资源 `resources.data.ts`
| id | 名称 | baseCap | 说明 |
|----|------|---------|------|
| catnip | 猫薄荷 | 5000 | 食物，受季节影响最大 |
| wood | 木材 | 200 | 建筑主材 |
| minerals | 矿物 | 250 | 进阶材料 |
| science | 科学 | 250 | 解锁科技 |

### 3.2 建筑 `buildings.data.ts`
| id | 名称 | 初始价格 | ratio | 被动产出/秒 | 容量加成 | 人口上限 | 解锁 |
|----|------|----------|-------|-------------|----------|----------|------|
| field | 猫薄荷田 | catnip 10 | 1.12 | catnip +0.6（受季节） | — | — | 初始 |
| hut | 小屋 | wood 5 | 1.15 | — | — | +2 | 初始 |
| library | 图书馆 | wood 25 | 1.15 | science +0.1（受工种乘算） | science +250 | — | 初始 |
| barn | 谷仓 | wood 50 | 1.75 | — | catnip +5000, wood +200, minerals +250 | — | 初始 |
| mine | 矿场 | wood 100 | 1.15 | — | — | — | tech: mining；矿工产量 ×1.2/座 |

> 说明：图书馆同时提供 **科学产量乘算**（每座 +10% 科学相关产出），与学者协同。矿场对矿工产量提供 **每座 +20%** 乘算。

### 3.3 工种 `jobs.data.ts`
| id | 名称 | 每只/秒产出 | 受季节 | 解锁 |
|----|------|-------------|--------|------|
| farmer | 农夫 | catnip +1.0 | 是 | 初始 |
| woodcutter | 伐木工 | wood +0.018 | 否 | 初始 |
| scholar | 学者 | science +0.035 | 否 | 初始 |
| miner | 矿工 | minerals +0.05 | 否 | tech: mining |

> 闲置猫（job=null）不产出但仍消耗食物。

### 3.4 科技 `techs.data.ts`
| id | 名称 | 成本 | 前置 | 解锁 | 描述 |
|----|------|------|------|------|------|
| calendar | 历法 | science 30 | — | 显示季节天数、可预知换季 | 让玩家规划过冬 |
| agriculture | 农业 | science 100 | calendar | 农夫产量 +50%、田产量 +50% | 食物质变 |
| mining | 采矿 | science 100 | calendar | 解锁 miner 工种 + mine 建筑 | 开启矿物链 |

### 3.5 季节 `seasons.data.ts`
| 季节 | catnip 产量乘子 | 备注 |
|------|-----------------|------|
| 春 Spring | 1.5 | 黄金期 |
| 夏 Summer | 1.0 | — |
| 秋 Autumn | 1.0 | 备粮 |
| 冬 Winter | 0.25 | 食物危机 |

- 一季 = 100 天；一天 = 2 秒真实时间（即 `dayLengthMs = 2000`）。一年 = 800 秒 ≈ 13 分钟。

### 3.6 全局常量
```ts
export const TICKS_PER_SECOND = 5;       // 200ms / tick
export const KITTEN_CATNIP_PER_SEC = 0.85; // 每只猫每秒吃猫薄荷
export const BASE_MAX_KITTENS = 0;       // 初始上限 0，靠小屋提供
export const GROWTH_PER_SEC = 0.01;      // 食物盈余时人口增长进度/秒
export const SKILL_PER_SEC = 0.0005;     // 在岗熟练度增速
export const SKILL_MAX_BONUS = 1.0;      // 熟练度上限提供 +100% 产出
export const OFFLINE_CAP_HOURS = 8;      // 离线结算上限
export const LOG_MAX = 50;
```

---

## 4. 核心算法

### 4.1 主循环（engine.ts）
```
每帧（requestAnimationFrame）：
  now = Date.now()
  elapsed = now - state.lastTick
  ticksToRun = floor(elapsed / (1000 / TICKS_PER_SECOND))
  ticksToRun = min(ticksToRun, MAX_CATCHUP_TICKS)   // 防卡顿后爆量
  for i in 0..ticksToRun:
     runTick(state, dt = 1 / TICKS_PER_SECOND)
  state.lastTick += ticksToRun * (1000 / TICKS_PER_SECOND)
  notifyStore(snapshot(state))   // 节流后通知 UI（最多每 100ms 一次）
```

### 4.2 单 tick 结算顺序（runTick，顺序很重要）
```
1. 推进历法 calendar.advance(dt)        // 累加天数，跨季触发事件
2. 计算本 tick 各资源 cap                // 派生值，见 4.4
3. 计算各资源净产出 net[res]（见 4.3）   // 含建筑被动 + 工种 + 修正
4. 应用产出：amount = clamp(amount + net*dt, 0, cap)
5. 食物结算：catnip 已含猫的消耗（见 4.3 把消耗算进 net）
6. 人口结算 population.update(dt)        // 增长 / 饥荒 / 熟练度
7. 写日志（换季、饥荒、人口+1 等）
```

### 4.3 资源净产出公式（resources.ts）
对每种资源 `r`：
```
net[r] =
    Σ(建筑被动产出)               // count * produces[r] * seasonMul(若受季节)
  + Σ(工种产出)                   // 见下
  + Σ(资源消耗，负值)             // 如 catnip 被猫吃
  + 建筑/科技乘算修正

工种产出（某 res）=
   Σ over kittens with job j (produces[j][r] 存在):
      base = produces[j][r]
      skillMul = 1 + min(skill, ...)*SKILL_MAX_BONUS   // 熟练度加成
      seasonMul = affectedBySeason 含 r ? season乘子 : 1
      techMul   = 该工种相关科技加成（如 agriculture 对 farmer +50%）
      buildMul  = 相关建筑乘算（如 mine 对 miner、library 对 science）
      贡献 = base * skillMul * seasonMul * techMul * buildMul

catnip 消耗 = -(kittens.length * KITTEN_CATNIP_PER_SEC)
```
> 实现要点：把"乘算修正"集中在一个 `getMultiplier(target)` 纯函数里，避免散落。

### 4.4 储量上限（resources.ts）
```
cap[r] = baseCap[r]
       + Σ(建筑 capBonus[r] * count)
       + Σ(科技 capBonus，若有)
science 的 cap 还叠加 library 的 +250/座
```
- 若 `amount > cap`（如拆建筑后），下个 tick 自然被 clamp。

### 4.5 人口与饥荒（population.ts）
```
update(dt):
  maxK = BASE_MAX_KITTENS + Σ(building.maxKittens * count)

  // A. 增长：仅当 catnip 净产 ≥ 0 且 amount > 0 且 kittens < maxK
  if (canGrow):
     growthProgress += GROWTH_PER_SEC * dt
     if growthProgress >= 1:
        growthProgress -= 1
        kittens.push(newKitten())     // 随机名，job=null
        log("一只新猫加入了猫国：" + name)

  // B. 饥荒：catnip == 0 且净产 < 0
  if (catnip <= 0 && net.catnip < 0):
     starveTimer += dt
     if starveTimer >= STARVE_INTERVAL (如 5s):
        starveTimer = 0
        removeOneKitten()             // 优先移除闲置/低熟练
        log.warn("食物耗尽！一只猫饿死了。")

  // C. 熟练度：在岗猫 skill += SKILL_PER_SEC*dt（封顶）
```
> 设计权衡：增长依赖"净产≥0"而非"有存粮"，让冬季自动停止增长，避免冬天暴毙。

### 4.6 购买建筑（buildings.ts）
```
getPrice(b): for each res in prices:
    price[res] = prices[res] * priceRatio ^ buildings[b].count

canAfford(b): ∀res amount[res] >= price[res]

buy(b):
   if !canAfford return {ok:false}
   for res: amount[res] -= price[res]
   buildings[b].count += 1
   recomputeUnlocks()      // 新建筑可能解锁其它内容
   log("建造了 " + name)
```
- 批量购买 ×10 / ×max：循环或用等比数列求和公式预判可买数量。

### 4.7 历法（calendar.ts）
```
advance(dt):
  dayProgress += dt * 1000 / dayLengthMs
  while dayProgress >= 1:
     dayProgress -= 1
     day += 1
     if day >= 100:
        day = 0
        season = (season + 1) % 4
        if season == 0: year += 1; log.event("新的一年：第" + year + "年")
        log.event("季节变为：" + seasonName[season])
```

### 4.8 离线结算（offline.ts）
```
onLoad:
  gap = min(now - state.lastTick, OFFLINE_CAP_HOURS*3600*1000)
  ticks = floor(gap / tickMs)
  分批跑 runTick（每批让出主线程，避免卡 UI），或
  快速近似：按当前净产 * 时长直接累加（季节按比例分配）
  弹窗汇报："你离开了 X 小时，期间收获 …"
```
> MVP 建议先用"分批真实跑 tick"，逻辑与在线一致，最准确。

---

## 5. 存档（save.ts）

### 5.1 流程
```
save():  json = JSON.stringify(state)
         compressed = LZString.compressToBase64(json)
         localStorage.setItem('mao_save', compressed)
自动存档：每 30 秒 + 页面 visibilitychange 隐藏时。

load():  raw = localStorage.getItem('mao_save')
         json = LZString.decompressFromBase64(raw)
         state = migrate(JSON.parse(json))   // 版本迁移
```

### 5.2 版本迁移
```
migrate(s):
  while s.version < CURRENT_VERSION:
     s = migrations[s.version](s)   // 每个迁移函数补默认字段
     s.version += 1
  return s
```

### 5.3 导入/导出
- 导出：把 Base64 字符串显示给玩家（可复制）。
- 导入：粘贴 → 解压 → 校验 → 覆盖。校验失败给出明确错误，不破坏现有存档。

---

## 6. UI 设计与状态同步

### 6.1 组件树
```
<App>
 ├─ <ResourceBar/>      // 顶部常驻：每资源 当前/上限 + 净产/秒（红负绿正）
 ├─ <TabNav/>           // 村庄 | 科技
 ├─ 主区
 │   ├─ <BuildingsPanel/>  // 建筑列表：名称、数量、价格、买×1/×10/×max；买不起置灰
 │   ├─ <JobsPanel/>       // 工种：每职业 +/- 调整在岗数；显示闲置猫数
 │   └─ <TechPanel/>       // 科技：成本、前置、可研究高亮
 └─ <LogPanel/>         // 滚动日志
```

### 6.2 渲染节流（关键）
- 游戏循环在 React 外用 `rAF` 跑。
- `gameStore` 维护快照，**最多每 100ms** 发一次变更通知。
- 组件通过 `useSyncExternalStore(subscribe, getSnapshot)` 订阅，避免每 tick（5/s）重渲染。
- 数字显示用记忆化组件，仅在值变化时更新。

### 6.3 交互细节
- 悬停建筑：tooltip 显示完整成本、效果、"建成后净产变化预测"。
- 资源接近上限（>95%）变黄；净产为负变红并提示。
- 季节图标 + 当前天数进度条（解锁历法后显示）。

---

## 7. 完整数据流（一帧）

```
rAF → engine.runTick × N
        ├─ calendar.advance
        ├─ resources.computeCaps
        ├─ resources.computeNet（建筑+工种+修正+猫消耗）
        ├─ apply & clamp
        └─ population.update（增长/饿死/熟练）
   → 节流 → gameStore.emit(snapshot)
   → React 订阅组件按需重渲染
   每30s/隐藏 → save()
```

---

## 8. 数值平衡基线与调参方法

### 8.1 关键平衡目标（MVP 体验曲线）
| 时间点 | 期望状态 |
|--------|----------|
| 0–2 分钟 | 手点猫薄荷 → 建出第 1 块田 + 第 1 座小屋 → 第 1 只猫 |
| 2–10 分钟 | 农夫/伐木工分工，木材稳定，建图书馆出科学 |
| 10–20 分钟 | 研究历法→农业，迎来首个冬天，食物吃紧但不崩 |
| 20–40 分钟 | 研究采矿，矿物链开启，人口 8~15，闭环成立 |

### 8.2 调参表（建议用 Excel/Sheets 建模）
对每个建筑列出前 30 次购买的累计成本与边际产出，确保：
- 成本增速（ratio）让"下一座建筑"始终是几十秒到几分钟可达，而非瞬间或遥不可及。
- 冬季 catnip 净产**不应长期为负**到导致团灭——农业科技后应能勉强撑过。

### 8.3 可调参数集中管理
所有平衡常量集中在 `data/` 与 §3.6 常量，禁止散落在逻辑里。

---

## 9. 验收标准 / 测试用例

### 9.1 可玩闭环验收清单（手动）
- [ ] 冷启动能手动采集猫薄荷并建出第一块田
- [ ] 小屋提升人口上限，食物盈余时自然生猫
- [ ] 工种 +/- 即时改变对应资源净产
- [ ] 冬季 catnip 产量明显下降，开春恢复
- [ ] 科学攒够可研究历法/农业/采矿，且解锁对应建筑/工种
- [ ] 食物归零且净产为负时会饿死猫并写日志
- [ ] 关闭页面再打开，资源按离线时长合理增长（≤8h 上限）
- [ ] 刷新后存档无损；导出再导入状态一致

### 9.2 单元测试（Vitest，core 必测）
```
resources.test.ts
  - computeCaps：建谷仓后 catnip cap 正确叠加
  - computeNet：N 农夫 + M 田 + 春季乘子，结果等于手算
  - clamp：amount 不超过 cap、不低于 0
population.test.ts
  - 净产≥0 且未满员 → 经过 1/GROWTH 秒恰好 +1 猫
  - 冬季净产<0 → 不增长
  - catnip=0 且净产<0 → STARVE_INTERVAL 后 -1 猫
  - 熟练度随在岗时间增长并封顶
save.test.ts
  - save→load 往返等价（深比较）
  - 旧版本存档经 migrate 后字段补全、不报错
buildings.test.ts
  - getPrice 等比正确；canAfford 边界；buy 扣费与 count+1 原子
calendar.test.ts
  - 100 天换季、4 季换年、跨年 year+1
```

### 9.3 验证步骤（开发完成后必做）
1. `npm run test` 全绿。
2. 加速 tick（临时调 TICKS_PER_SECOND 或 dayLengthMs）跑完一整年，观察人口与食物曲线是否符合 §8.1。
3. 模拟离线（手动改 lastTick 回拨 1h / 24h），核对结算量与上限封顶。

---

## 10. 开发任务拆分（建议 Sprint Backlog）

| # | 任务 | 依赖 | 产出 |
|---|------|------|------|
| 1 | 搭脚手架 Vite+TS+React+Vitest，建目录 | — | 可运行空壳 |
| 2 | 定义 GameState 与所有配置表（§2、§3） | 1 | 类型 + data |
| 3 | engine tick 循环 + 资源净产/cap 结算 | 2 | core 可跑数 |
| 4 | 建筑购买逻辑 + BuildingsPanel | 3 | 能建田/小屋 |
| 5 | 人口增长/饥荒/工种 + JobsPanel | 3 | 分工生效 |
| 6 | 历法/季节 + ResourceBar 季节显示 | 3 | 四季循环 |
| 7 | 科技系统 + TechPanel | 4,5 | 解锁链路 |
| 8 | 存档/迁移/导入导出 | 3 | 持久化 |
| 9 | 离线结算 + 启动弹窗 | 3,8 | 离线收益 |
| 10 | store 节流同步 + UI 打磨 + 日志 | 4-9 | 流畅可玩 |
| 11 | 单测补齐 + 数值平衡调参 | all | 闭环达标 |

---

## 11. 后续系统预留接口（不在 MVP 实现）

为避免返工，以下扩展点在 MVP 即预留：
- **资源**：`ResourceId` 用联合类型，加新资源只改 data + 类型。
- **乘算修正**：`getMultiplier(target)` 统一入口，将来贸易/宗教/转生加成都挂这里。
- **建筑/科技配置**：纯数据，新增内容不动引擎。
- **GameState.version**：迁移框架已就绪，后续加字段走 migration。
- **预留字段（先不渲染）**：`trade`、`religion`、`paragon`、`space` 可在 state 里留空对象，降低后续存档迁移成本。

---

*本详设以 MVP 闭环为目标，按 §10 任务顺序即可开工；每完成一个 core 模块先补 §9.2 单测再接 UI。所有数值为基线，须经 §8 调参定稿。*
