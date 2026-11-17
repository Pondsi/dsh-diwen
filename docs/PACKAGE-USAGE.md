# 迪文（Diwen）集成使用说明（npm / MCP / dsh 插件）

> open-core 分发：**开源加载壳 + 闭源核心 + 加密概念数据**。三种形态同一核心。
> 许可：**允许商用（无需另行授权）、不可再分发、必须署名作者 Pondsi**（见 LICENSE）。

## 0. 许可与数据加密

- **商用**：免费、无需事先授权；可集成进你的程序并销售你的程序。
- **不可再分发**：不得把本项目（源码/闭源核心/加密数据）单独或随程序再分发/镜像/上传他库；你的程序只能以「依赖/引用」形式包含它，且接收者不能提取为独立项目。
- **署名（必须）**：注明 Diwen / 迪文 + 作者 **Pondsi** + 仓库链接 https://github.com/Pondsi/Diwen 。
- **数据加密可以吗？符合许可吗？** **可以，且符合。** 许可以「不可再分发/不可提取」约束接收者；加密是作者侧的技术保护措施，与许可目标一致。接收者**无权**解密、提取或再分发闭源核心与数据。
  - 诚实说明：客户端加密/混淆只**提高提取成本**，并非不可破；若需真正保密，把核心+数据放服务端。

## 1. npm 包（packages/diwen）

本公开仓库已含**预构建加密制品**（`packages/diwen/dist/`），clone 后 `npm install` 即用，无需自行构建。核心明文源码与数据在作者私有仓库；制品由作者侧构建脚本产出。

使用（接收者）：
```js
import { mapChinese, describeConcept } from 'diwen';

// 自然语 → 迪文填空契约（公理②：模型选义；公理④：无概念→verbatim）
const r = await mapChinese('我吃饭', { model: 'deterministic' }); // 或 'auto'/'decision'/'off'
console.log(r.contract.status, r.contract.words, r.semanticApproval); // semanticApproval 恒 false

// 迪文 → 中文唯一释义（公理①）
console.log(describeConcept(1223).lemma_zh); // 折
```
- `model:'decision'` 用本地 ollama 决策模型（d3:4b 等）+ 校准拒答；`enhance:true` 启用增强层。
- 运行时依赖仅 `@node-rs/jieba`（分词）。

## 2. MCP server（packages/diwen-mcp，闭源核心/数据）

零依赖 stdio MCP server，复用 packages/diwen 闭源核心。
```bash
node packages/diwen-mcp/server.mjs
```
MCP 客户端配置：
```json
{ "mcpServers": { "diwen": { "command": "node", "args": ["<绝对路径>/packages/diwen-mcp/server.mjs"] } } }
```
工具：`diwen_map{text, model?, enhance?}`、`diwen_describe{id}`。自测：`node packages/diwen-mcp/selftest.mjs`。

## 3. dsh 插件（packages/diwen-dsh，开源 Cordis 壳 + 闭源核心）

DeepSeek Harness「一切皆插件」。壳开源（Cordis defineTool + skill），核心/数据闭源（引用 packages/diwen）。
```bash
dsh plugin --profile <p> add <本地路径或 github:Pondsi/Diwen 子路径>
```
注册工具 `diwen_map`/`diwen_describe` + 运行时 skill `diwen`。自测：`node packages/diwen-dsh/selftest.mjs`。

## 4. 共同约定

- `semanticApproval:false` 恒成立：机器规范通过 ≠ 语义正确 ≠ 人工批准。
- 公理④：无对应概念→verbatim 如实保留，不就近吞并、不伪造。
- 阈值按域校准（data/wsd-thresholds.json：curated t40 / real t50）。
- **决策模型选项容量守卫**：选项上限按模型各异（硬上限实测 255；有效判别上限 tev1=32/d3=128/clef-flash=255/clef=128）；候选义项数(+__none__)超硬上限或未探测模型→**不让使用**（`checkModelCapacity`/`decisionSelect` 内置）。能力表随加密数据分发；换模型由作者侧重探刷新。详见 README「决策模型选项容量守卫」。