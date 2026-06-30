# 华夏建造者 — 项目记忆

## 项目信息
- 路径: F:\game\myGame\mao
- 类型: 放置/增量经营游戏 (Kittens Game 玩法原型)
- 题材: 古代中国
- 技术栈: Vite + TypeScript + React 18 + Vitest + lz-string

## 关键设计决策
- 冷启动: 点击"采集粮食"按钮每次 +1 grain，攒够 10 粮建第一块农田
- 离线: 快速近似（net × gapSec），不设时长上限
- 乘算: 加法叠加（1 + Σ(factor * count)），非乘法
- UI: 普通 Emoji 图标 + 纯 CSS 配色，不做水墨美术
- 存档: localStorage + lz-string Base64，不关注安全性
- 模糊点: 结构性参考猫国建造者文档

## 当前状态
- 2026-06-30: MVP 首版完成，22 单测全绿，TS 零错误，构建通过
- 实现内容: core 引擎完整 + React UI 五大面板 + 离线结算 + 存档系统
