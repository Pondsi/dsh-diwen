# dsh-diwen — 迪文（Diwen）概念坐标系统 · open-core 分发

迪文是一套**机器可校验的概念坐标系统**，位于自然语言之上：把自然语词义映射到带语义坐标（S3a 语义场 × S3b 构式）的概念，并可唯一地渲染回自然语释义。它**不是翻译器**，不做自然语言生成。

本仓库是迪文的 **open-core 公开分发**：开源加载壳 + 闭源核心（minify bundle）+ 加密概念数据（AES-256-GCM）。clone 后 `npm install` 即可离线使用。

> 诚实说明：客户端加密/混淆只**提高提取成本**，并非不可破（解密密钥在开源壳内）。如需真正保密，须服务端化。核心明文源码与数据在作者私有仓库开发，不以明文进入本公开仓库。

## 快速开始

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
开源 Cordis 壳 + 闭源核心。`dsh plugin --profile <p> add ./packages/diwen-dsh`；注册 `diwen_map`/`diwen_describe` + skill `diwen`。自测 `node packages/diwen-dsh/selftest.mjs`。

## 可用性（实测，holdout/真实域）
| 路径 | 概念准确率 |
|---|---|
| 云端 deepseek（增强） | 0.9933（holdout 增强达 1.0） |
| 本地决策 d3:4b（增强+校准） | 0.9636 → curated 0.9818 |
| 本地 chat qwen3:8b（增强） | 0.9727 |
| 跨家族 ensemble | 0.9636 |
| 确定性机械（下界，非生产路径） | 0.5173 |

真实域泛化受候选库存覆盖限制（公理④：未收录义如实 verbatim）。`semanticApproval=false` 恒成立：机器规范通过 ≠ 语义正确 ≠ 人工批准。

## 决策模型选项容量守卫
决策模型 `--choice` 选项上限**按模型各异、非固定**。实测硬上限均 255（ollama 接口），有效判别上限：tev1:0.8b=32 / d3:4b=128 / clef-flash=255 / clef=128。候选义项数(+`__none__`)超硬上限或模型未探测 → **不让使用**（`checkModelCapacity`/`decisionSelect` 内置守卫）。详见 docs/PACKAGE-USAGE.md。

## 仓库结构
```
packages/diwen/       npm 包：index.mjs/env.cjs 开源壳 + dist/core.mjs 闭源 + dist/data.enc 加密数据
packages/diwen-mcp/   MCP server（开源壳，复用闭源核心）
packages/diwen-dsh/   dsh 插件（开源 Cordis 壳 + skill）
docs/PACKAGE-USAGE.md 集成使用说明
LICENSE               许可
```

## 许可
**允许商用（免费、无需另行授权）、不可再分发、必须署名**：注明使用 Diwen/迪文 + 作者 **Pondsi** + 仓库链接。完整条款见 [LICENSE](LICENSE)。

## 限制
- 仅中文活跃；其他语言暂停（公理⑤：语言独立映射，无枢轴）。
- 覆盖率非 100%（公理④设计）；无概念词如实 verbatim，不伪造。
- 客户端加密非不可破；真保密需服务端化。

作者：Pondsi · https://github.com/Pondsi/dsh-diwen