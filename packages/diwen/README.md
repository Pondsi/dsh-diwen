# diwen（npm 包）

迪文概念坐标系统 open-core npm 包：**开源加载壳**（`index.mjs`/`env.cjs`）+ **闭源核心**（`dist/core.mjs`，minify bundle）+ **加密概念数据**（`dist/data.enc`，AES-256-GCM）。

## 安装与使用
```bash
npm install        # 运行时依赖 @node-rs/jieba（中文分词）
```
```js
import { mapChinese, describeConcept, checkModelCapacity } from './index.mjs';
const r = await mapChinese('我吃饭', { model: 'deterministic' });
console.log(r.contract.words, r.semanticApproval); // semanticApproval 恒 false
console.log(describeConcept(1223).lemma_zh);        // 折
```
`env.cjs` 在加载时把 `data.enc` 解密到临时目录并设 `DIWEN_DATA_DIR`，再加载闭源核心。无需手动解密。

## 选项容量守卫
`checkModelCapacity(model, required)`：候选义项数(+`__none__`)超模型硬上限或模型未探测 → 不让使用。能力表 `data/decision-model-caps.json`（在加密数据内）。

## 许可
允许商用（无需授权）、不可再分发、必须署名 Pondsi + Diwen/迪文 + 仓库链接。见 LICENSE。

## 诚实说明
客户端加密/混淆非不可破（密钥在壳内）；真保密需服务端化。