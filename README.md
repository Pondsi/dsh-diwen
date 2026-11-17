# dsh-diwen — 迪文（Diwen）概念坐标系统

## 迪文是什么：机器之间的沟通语言

迪文为**机器与机器之间的沟通**而设计——在智能体与智能体之间、自然语与机器交互中的确定性内容、机器与机器的交互中，提供一套**机器可校验的概念坐标**。

自然语有歧义、会漂移；迪文把语义落到离散的概念坐标（S3a 语义场 × S3b 构式），让机器之间据此**精确对齐**，并可唯一地渲染回自然语释义。典型场景：

- **多智能体协作**：智能体间以概念坐标传递语义，避免自然语歧义导致的误解。
- **子代理通讯**：主代理与子代理之间用确定性概念交换任务与结果。
- **知识库确定性内容**：把知识落到可机器校验的概念，而非模糊文本。
- **上下文摘要 / 提示词**：以概念坐标承载压缩语义，跨回合、跨模型稳定一致。

迪文**不是翻译器**，不做自然语言生成；它是自然语之上的可验证语义中间表示。

## 现状：中文可交付使用

中文部分已达**可交付使用**状态：

| 路径 | 概念准确率（实测 holdout/真实域） |
|---|---|
| 云端 deepseek（增强） | 0.9933（holdout 增强达 1.0） |
| 本地决策 d3:4b（增强+校准） | 0.9636 → curated 0.9818 |
| 本地 chat qwen3:8b（增强） | 0.9727 |
| 跨家族 ensemble | 0.9636 |
| 确定性机械（下界，非生产路径） | 0.5173 |

公理①（迪文→中文唯一释义）100% 确定。`semanticApproval=false` 恒成立：机器规范通过 ≠ 语义正确 ≠ 人工批准；无对应概念时如实 verbatim 保留（公理④），不伪造。

## 后续更新路线

1. 持续完善中文可用状态（覆盖扩张、真实域泛化）。
2. 完成 27 语言的开发，进而支持更多语言。
3. 合并概念、消除自然语的分区，跨语言共享概念坐标。
4. 由机器扩展更多自然语种的概念与语义。
5. 继续完善人类既有的概念与语义。
6. 由机器扩展自然语中尚不存在的概念。
7. 由机器完善描绘物理世界的概念。
8. 由机器完善描绘世界的抽象概念。
9. 由机器抽象出更高密度的概念，演化出更适合该概念的结构。
10. 持续完善迪文，以清晰描绘世界万物。

## 快速开始

本仓库是迪文的 **open-core 公开分发**：开源加载壳 + 闭源核心（minify bundle）+ 加密概念数据（AES-256-GCM）。clone 后 `npm install` 即可离线使用。

### npm 包
```bash
cd packages/diwen
npm install        # 安装运行时分词依赖 @node-rs/jieba
```
```js
import { mapChinese, describeConcept } from './index.mjs';

// 自然语 → 迪文填空契约（公理②：模型选义；公理④：无概念→verbatim 如实保留）
const r = await mapChinese('我吃饭', { model: 'deterministic' }); // 'auto'|'decision'|'off'
console.log(r.contract.status, r.contract.words, r.semanticApproval); // semanticApproval 恒 false

// 迪文 → 中文唯一释义（公理①）
console.log(describeConcept(1223).lemma_zh); // 折
```
- `model:'decision'` 用本地 ollama 决策模型（d3:4b 等）+ 校准拒答；`enhance:true` 启用增强层。

### MCP server（零依赖 stdio）
```bash
node packages/diwen-mcp/server.mjs
```
MCP 客户端配置 `command=node, args=[<绝对路径>/packages/diwen-mcp/server.mjs]`；工具 `diwen_map{text,model?,enhance?}`、`diwen_describe{id}`。自测 `node packages/diwen-mcp/selftest.mjs`（42/42）。

### DeepSeek Harness（dsh）插件
**自包含**：开源 Cordis 壳 + 内置闭源核心/加密数据（`vendor/diwen/`），装上即用。`dsh plugin --profile <p> add github:Pondsi/dsh-diwen#path:packages/diwen-dsh`（或本地路径）；注册 `diwen_map`/`diwen_describe` + skill `diwen`。自测 `node packages/diwen-dsh/selftest.mjs`（含隔离安装验证）。

## 使用手册
- [docs/USAGE-MANUAL.md](docs/USAGE-MANUAL.md)：非技术使用手册（安装、调用、许可、署名）。
- [docs/PACKAGE-USAGE.md](docs/PACKAGE-USAGE.md)：npm / MCP / dsh 三形态集成说明。

## 决策模型选项容量（提示 + 错误反馈）
决策模型 `--choice` 选项上限**按模型各异、非固定**。实测硬上限均 255（ollama 接口），有效判别上限：tev1:0.8b=32 / d3:4b=128 / clef-flash=255 / clef=128。**由使用者自行判断选用哪些模型，迪文不禁止**：`checkModelCapacity` 给建议性提示；`decisionSelect` 使用出错时 `classifyModelError` 反馈「这是模型能力问题（如选项超上限），请换模型或减少候选」。

## 仓库结构
```
packages/diwen/       npm 包：index.mjs/env.cjs 开源壳 + dist/core.mjs 闭源 + dist/data.enc 加密数据
packages/diwen-mcp/   MCP server（开源壳，复用闭源核心）
packages/diwen-dsh/   dsh 插件（自包含：开源 Cordis 壳 + vendor 闭源核心 + skill）
docs/USAGE-MANUAL.md  非技术使用手册
docs/PACKAGE-USAGE.md 集成使用说明
LICENSE               许可
```

## 许可
**允许商用（免费、无需另行授权）、不可再分发、必须署名**：注明使用 Diwen/迪文 + 作者 **Pondsi** + 仓库链接。完整条款见 [LICENSE](LICENSE)。

## 限制
- 当前仅中文可交付；其他语言在路线中（公理⑤：语言独立映射，无枢轴）。
- 覆盖率非 100%（公理④设计）；无概念词如实 verbatim，不伪造。

作者：Pondsi · https://github.com/Pondsi/dsh-diwen