# 迪文（Diwen）集成使用说明（npm / MCP / dsh 插件）

> open-core 分发：**开源加载壳 + 闭源核心 + 加密概念数据**。三种形态同一核心。
> 许可：**允许商用（无需另行授权）、不可再分发、必须署名作者 Pondsi**（见 LICENSE）。

## 当前发布版本（单一真相）

| 包 | 版本 | 说明 |
|---|---|---|
| diwen | **6.4.0** | 核心：开源加载壳 + 闭源核心 + 加密概念数据 + 私有迪文扩展 |
| diwen-mcp | **6.3.1** | MCP server（3 工具），依赖 npm diwen ^6.4.0 |
| diwen-dsh | **0.3.1** | dsh 插件（强制层 + 设置开关），依赖 npm diwen ^6.4.0 |

> 版本以各 `packages/*/package.json` 为准；其余文档只引用本表，不另行复制版本号。

## 0. 许可与数据加密

- **商用**：免费、无需事先授权；可集成进你的程序并销售你的程序。
- **不可再分发**：不得把本项目（源码/闭源核心/加密数据）单独或随程序再分发/镜像/上传他库；你的程序只能以「依赖/引用」形式包含它，且接收者不能提取为独立项目。
- **署名（必须）**：注明 Diwen / 迪文 + 作者 **Pondsi** + 仓库链接 https://github.com/Pondsi/dsh-diwen 。
- **数据加密可以吗？符合许可吗？** **可以，且符合。** 许可以「不可再分发/不可提取」约束接收者；加密是作者侧的技术保护措施，与许可目标一致。接收者**无权**解密、提取或再分发闭源核心与数据。

## 1. npm 包（packages/diwen）

构建（作者侧）：`node scripts/build-npm.mjs` → 产出 `packages/diwen/`（index.mjs 开源壳 + env.cjs 解密 + dist/core.mjs 闭源 + dist/data.enc 加密数据）。

安装（接收者）：`npm install diwen`（运行时依赖 `@node-rs/jieba` 自动安装）。

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
- 云端集成/级联选义：`ensembleSelect`（C3 加权投票）/ `cascadeSelect`（C14 云内级联），见 §2 MCP `diwen_select`。
- 运行时依赖仅 `@node-rs/jieba`（分词）。

## 2. MCP server（packages/diwen-mcp，依赖 npm diwen 核心）

**零第三方协议依赖**（手写 stdio JSON-RPC，不依赖 MCP SDK）的开源薄壳；核心能力来自已发布的 npm `diwen`（闭源核心 + 加密数据 + jieba 由该包提供）。`npm install diwen-mcp` 即可，**无需相邻目录、无需自行构建核心**。
```bash
npm install diwen-mcp
npx diwen-mcp                              # 等价于 node node_modules/diwen-mcp/server.mjs
```
MCP 客户端配置（`command`=node，`args`=server.mjs 绝对路径）：
```json
{ "mcpServers": { "diwen": { "command": "node", "args": ["<绝对路径>/node_modules/diwen-mcp/server.mjs"] } } }
```
工具（**3 个**）：
- `diwen_map{text, model?, enhance?}` —— 中文 → 迪文填空契约。
- `diwen_describe{id}` —— 概念 ID → 中文唯一释义。
- `diwen_select{cases, mode?, weights?}` —— 批量云端义项选择：`mode='cascade'`（C14 云内级联，小云易例/大云难例）或 `'ensemble'`（C3 多家族加权投票，`weights` 按模型赋权，默认等权）；`cases=[{id,surface,sentence}]`。**需云端密钥**（环境变量 `DIWEN_KEYS_FILE`），无密钥时 `isError:true` 并提示。返回 `{predictions, models, escalated, semanticApproval:false}`。

自测：`node node_modules/diwen-mcp/selftest.mjs`（**45/45** 断言，含三工具 inputSchema）。仓库内开发亦可 `cd packages/diwen-mcp && npm install && node selftest.mjs`。

## 3. dsh 插件（packages/diwen-dsh，开源 Cordis 壳 + 依赖 npm diwen 核心 + 确定性强制层）

DeepSeek Harness「一切皆插件」。壳开源（Cordis defineTool + skill + 强制层）；核心/数据闭源，**依赖已发布的 npm `diwen` 包**（核心可 `pnpm update diwen` 独立更新），运行时分词依赖 `@node-rs/jieba` 自动安装，peer `@deepseek-ai/dsh-tools`/`@deepseek-ai/dsh-llm` 由宿主提供。
```bash
dsh plugin --profile <p> add diwen-dsh        # 从 npm（自动拉取 diwen 核心）
# 或本地：dsh plugin --profile <p> add ./packages/diwen-dsh
```
注册工具 `diwen_map`/`diwen_describe`（**2 工具**）+ 运行时 skill `diwen`。自测：`node packages/diwen-dsh/selftest.mjs`。符合官方规范（name/inject/apply、defineTool、output.schema additionalProperties:true、cordis.patch.yml、dsh.bundle.patch）。

> 能力边界：dsh 侧当前 2 工具（无 diwen_select）；云端级联/集成选义经 MCP `diwen_select` 或直接调用 `cascadeSelect`/`ensembleSelect`。

**确定性强制层**（不替换 agent-loop，使迪文在关键环节强制使用而非仅模型自判）：
- `systemPrompt.context(required)` 每步迪文硬指令；`agent/pre-step` 输入经 diwen_map 投影坐标 inject；`tools/post-execute` 工具结果追加迪文坐标。
- **设置开关**（dsh 设置 UI 可见，默认全开，各带用途+举例）：`forceSystemPrompt` / `forcePreStep` / `forcePostExecute`。profile 配置示例：`- id: diwen / name: diwen-dsh / config: {forcePreStep: false}`。
- 详见 docs/DSH-FORCE-USAGE.md。

> 云端选义（ensembleSelect 加权投票 / cascadeSelect 云内级联）密钥：设环境变量 `DIWEN_KEYS_FILE` 指向你的密钥文件（或 `DIWEN_CLOUD_BASE` 覆盖 base）；离线 deterministic/off 与本地 ollama decision 路径无需密钥。

## 4. 共同约定

- `semanticApproval:false` 恒成立：机器规范通过 ≠ 语义正确 ≠ 人工批准。
- 公理④：无对应概念→verbatim 如实保留，不就近吞并、不伪造。
- 阈值按域校准（data/wsd-thresholds.json：curated t40 / real t50）。
- **决策模型选项容量（提示+错误反馈，不禁止模型）**：选项上限按模型各异（硬上限实测 255；有效判别上限 tev1=32/d3=128/clef-flash=255/clef=128；当前候选库存单面最大 12 义（老）+__none__=13，远小于上限）。**由使用者自判选用**；`checkModelCapacity` 给建议性提示，`decisionSelect` 出错时 `classifyModelError` 反馈「模型能力问题（如选项超上限），请换模型/减少候选」。

## 5. 私有迪文（用户自定义概念扩展）

迪文允许使用者**自行增加私有概念**（私有迪文），无需改动公开核心，即可让迪文承载你自己的领域术语/专有概念。私有概念与基础概念（3055 条）在同一词库合并，**全链路可用**（map 匹配 / 模型 WSD 选义 / describe 释义 / render 渲染）。

**分区与隔离**
- 概念 ID 分区：基础概念 id ∈ [1, 524287]；**私有概念 id 须 ≥ 524288**（`PRIVATE_ID_MIN`，上半区约 52 万槽位）。加载期校验 id 分区，杜绝与基础概念冲突。
- 字形坐标 (s3a,s3b) 须避开基础概念已占用的组合（加载期碰撞检测）；用 `diwen private free-coords` 查空闲坐标。
- 私有数据是**使用者自己的文件**（明文 JSON，不入库、不加密、不再分发）；不需要也不允许解密公开核心。符合许可（你扩展自己的私有数据，非再分发迪文本身）。

**增加私有概念（CLI，四步）**
```bash
diwen private template -o my-private.json    # 1. 生成模板（含示例概念 + 空闲坐标）
# 2. 编辑 my-private.json：id≥524288、lemma_zh（自然中文词形）、field、bfo_type、place、nsm、pinyin
diwen private free-coords 20                 # 查空闲 (s3a,s3b) 供挑选
diwen private validate my-private.json       # 3. 校验（id 分区/坐标碰撞/schema）
export DIWEN_PRIVATE_LEXICON=my-private.json  # 4. 设环境变量，加载私有概念
diwen private list                           # 查看已加载私有概念
```

**使用（设 DIWEN_PRIVATE_LEXICON 后自动生效）**
```bash
diwen map "……你的私有词……" --model deterministic   # 私有词形被匹配
diwen concept 524288                                  # 私有概念 → 中文释义
```
```js
import { mapChinese, describeConcept, loadLexicon } from 'diwen';
const lex = loadLexicon();                 // 自动合并 DIWEN_PRIVATE_LEXICON 指向的私有概念
const r = await mapChinese('含私有词的句子', { model: 'auto' });
console.log(describeConcept(524288).lemma_zh);
```

**私有候选义项（模型 WSD 选义，可选）**
私有概念若需多义消歧，设 `DIWEN_PRIVATE_CANDIDATES` 指向私有候选 JSON（结构同 zh-sense-candidates.json：`{entries:[{surface,senses:[{sense_key,concept,definitionZh,example,verbatim}]}]}`）。`loadCandidates()` 按 surface 合并私有义项（标 private:true），模型即可在私有义项上选义。

**程序化 API（代码级控制）**
- `loadLexicon(path?, { privatePath, noCache })`：显式指定私有文件（覆盖环境变量）。
- `validatePrivateRoots(roots, baseRoots)` / `loadPrivateRoots(path, baseRoots)`：校验/加载。
- `freeCoordinates(baseRoots, count)` / `privateTemplate(baseRoots)`：空闲坐标/模板。
- `mergeLexicon(baseLex, pack)` / `validateNamespacePack(pack, baseLex)`：扩展包合并（命名空间机制）。

**注意**
- 私有文件修改后需**重启进程**（词库进程级缓存）；或 `loadLexicon(undefined,{noCache:true})` 强制重读。
- `lemma_zh` 宜为自然中文词形（与基础概念一致），分词边界过滤对私有/基础词同等生效。
- 私有概念 `semanticApproval` 同样恒 false；无对应概念仍走 verbatim（公理④）。