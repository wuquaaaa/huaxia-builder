# 华夏建造者（Huaxia Builder）

古代中式风格的放置/经营游戏 MVP，基于 TypeScript + Vite + React。
设计文档见 `华夏建造者-设计文档.md`（总览）与 `华夏建造者-详细设计文档-MVP.md`（详设）。

## 运行

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，浏览器打开提示的地址
npm run build    # 生产构建
npm test         # 运行 Vitest 单元测试
```

## 玩法闭环

1. 点击「🌾 采集粮食」攒到 10 粮食 → 营造**农田**（被动产粮）。
2. 用木材营造**民居**（提升人口上限）；食物盈余时百姓自然迁入。
3. 在「民生」里把白身百姓分派为**农夫/樵夫/书生**。
4. 书生产出**学问**，可在「学问」里研习**历法 → 农耕 / 采矿**。
5. 注意四季：冬季粮产骤降，需提前囤粮，否则会饥荒饿亡。

## 目录

- `src/core/` —— 纯逻辑状态机（无 UI 依赖，可单测）
- `src/data/` —— 资源/建筑/工役/学问/季节配置表（数据驱动，调平衡只改这里）
- `src/store/` —— 游戏循环与状态订阅（连接 core 与 React）
- `src/ui/` —— React 组件
- `tests/` —— Vitest 单元测试

## 离线逻辑校验（无需安装依赖）

由于核心逻辑是纯 TS，可用 Node 22 的类型擦除直接跑校验脚本：

```bash
node --import ./.verify/register.mjs ./.verify/check.ts
```

会运行 18 项核心断言（资源/上限/乘算/净产/人口/饥荒/技艺/历法/引擎）。
`tests/` 下的 Vitest 用例覆盖同样的逻辑，待 `npm install` 后用 `npm test` 运行。
