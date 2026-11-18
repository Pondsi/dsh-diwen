# diwen（npm 包）

迪文概念坐标系统 open-core npm 包：**开源加载壳**（`index.mjs`/`env.cjs`）+ **闭源核心**（`dist/core.mjs`，minify bundle）+ **加密概念数据**（`dist/data.enc`，AES-256-GCM）。当前版本 **6.7.1**。

## 安装与使用
```bash
npm install diwen        # 运行时依赖 @node-rs/jieba（中文分词）自动安装
```
```js
import { mapChinese, describeConcept, checkModelCapacity } from 'diwen';
const r = await mapChinese('我吃饭', { model: 'deterministic' });
console.log(r.contract.words, r.semanticApproval); // semanticApproval 恒 false
console.log(describeConcept(1223).lemma_zh);        // 折
```
`env.cjs` 在加载时把 `data.enc` 解密到临时目录并设 `DIWEN_DATA_DIR`，再加载闭源核心。无需手动解密。

> 仓库内开发（克隆本仓）：`cd packages/diwen && npm install`，然后 `import … from './index.mjs'`。

## 关键导出（概览）
- **映射 / 释义**：`mapChinese`、`describeConcept`、`mapText`、`fillContractToDoc`、`loadCandidates`
- **增强层**：`loadEnhance`、`buildEnhanceAddon`、`abstain`、`calibrateThreshold`
- **决策选义**：`decisionSelect`、`clearDecisionCache`、`selectSenses`、`PROVIDER_PRESETS`、`resolveProvider`
- **云端集成 / 级联**：`ensembleSelect`（C3 多家族加权投票）、`cascadeSelect`（C14 云内级联）
- **选项容量**：`loadCaps`、`requiredChoices`、`checkModelCapacity`、`modelAllowed`、`classifyModelError`
- **渲染 / 编码 / 校验**：`renderDocument`、`toSVG`、`decodeDocument`、`encode`/`decode`（GCF）、`validateDocument`、`readingOf`

完整集成说明（npm / MCP / dsh 三形态）见仓库 `docs/PACKAGE-USAGE.md`；技术 API 见 `docs/INTEGRATION-GUIDE.md`。

## 选项容量（提示 + 错误反馈，不禁止模型）
`checkModelCapacity(model, required)` 给建议性提示（上限未知/可能超限/质量风险），**不禁止任何模型**，由使用者自判。`decisionSelect` 使用出错时 `classifyModelError` 反馈是否为模型上限问题（`choice-capacity`），使用者自行调整。能力表 `data/decision-model-caps.json`（在加密数据内）。

## 许可
允许商用（无需授权）、不可再分发、必须署名 Pondsi + Diwen/迪文 + 仓库链接。见 LICENSE。

## 诚实说明
客户端加密/混淆非不可破（密钥在壳内）；真保密需服务端化。