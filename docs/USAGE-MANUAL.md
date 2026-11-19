# 迪文（Diwen）使用手册（非技术）

迪文是**机器之间的沟通语言**：把语义落到机器可校验的概念坐标，用于多智能体协作、子代理通讯、知识库确定性内容、上下文摘要、提示词等。它不是翻译器。**当前中文可交付使用。**

## 一、获取与安装

本仓库为 open-core 公开分发（开源壳 + 闭源核心 + 加密数据），clone 后离线即用。当前发布：**diwen@6.8.0 / diwen-mcp@6.3.2 / diwen-dsh@0.3.2**。

- **npm 包**（已发布）：`npm install diwen`（自动安装中文分词依赖），然后 `import { mapChinese, describeConcept } from 'diwen'`；或从本仓库进入 `packages/diwen` 运行 `npm install` 后使用。
- **MCP server**（已发布）：`npm install diwen-mcp`，然后 `npx diwen-mcp`（或 `node packages/diwen-mcp/server.mjs`），在你的 MCP 客户端里配置该命令即可。**3 工具**：`diwen_map` / `diwen_describe` / `diwen_select`（云端级联/集成选义，需环境变量 `DIWEN_KEYS_FILE` 密钥）。
- **DeepSeek Harness 插件**（已发布）：`dsh plugin --profile <p> add diwen-dsh`（从 npm，自动拉取 diwen 核心，**非自包含**）。含**确定性强制层**（systemPrompt 硬指令 / pre-step 输入投影 / post-execute 结果投影）+ 每 seam **设置开关** `forceSystemPrompt`/`forcePreStep`/`forcePostExecute`（默认全开），详见 [docs/DSH-FORCE-USAGE.md](DSH-FORCE-USAGE.md)。

## 二、基本调用

- **自然语 → 迪文**：`mapChinese(文本, {model})`。`model` 可选：
  - `deterministic`：离线确定性基线（默认，无需模型/密钥）。
  - `decision`：本地 ollama 决策模型选义（需本机 ollama 与模型）。
  - `auto`：模型选义路径（云端需自备密钥，设环境变量 `DIWEN_KEYS_FILE`）。
  - `off`：仅机械匹配。
- **迪文 → 中文**：`describeConcept(概念id)` 返回唯一中文释义。
- 返回的 `semanticApproval` 恒为 `false`：表示机器规范通过，**不等于**语义已被人工批准。
- 无对应概念的词会如实保留原文（`uncovered`/verbatim），**不会伪造**概念。

## 三、决策模型选项上限

决策模型能接受的选项数量**因模型而异、不是固定值**。**由你自行判断选用哪些模型**，迪文不替你禁用：
- 迪文会给建议性提示（上限未知 / 可能超限 / 质量风险）。
- 使用出错时会给**错误反馈**，标明「这是模型能力问题（如选项超上限），请换模型或减少候选」，你据此自行调整。

## 四、许可与署名（必须）

- **使用与商用：免费、无需另行授权**；可集成进你自己的程序并销售你的程序。
- **不可再分发**：不得把迪文本身（源码/闭源核心/加密数据）单独或随程序再分发/镜像/上传他库。
- **署名**：注明使用迪文（Diwen/迪文）+ 作者 **Pondsi** + 仓库链接 https://github.com/Pondsi/dsh-diwen （LICENSE 三(c) 指定）。
- 完整条款见仓库 LICENSE。

## 五、限制

- 当前仅中文可交付；其他语言在后续路线中。
- 覆盖率非 100%；无概念词如实保留，不伪造。
- 集成 technical 细节见 [PACKAGE-USAGE.md](PACKAGE-USAGE.md)。

## 六、增加你自己的私有迪文（私有概念）

你可以**自行增加私有概念**，把自己的领域术语纳入迪文，无需改动公开核心；私有概念与基础概念一起被匹配、选义、查释义、渲染。

四步：① `diwen private template -o my-private.json` 生成模板；② 填写你的概念（`id` 须 ≥ **524288** 私有号段、`lemma_zh` 你的中文词、`s3a/s3b` 用 `diwen private free-coords` 查空闲坐标、field/bfo_type/place/nsm/pinyin）；③ `diwen private validate my-private.json` 校验；④ 设环境变量 `DIWEN_PRIVATE_LEXICON=my-private.json` 启用，`diwen private list` 查看。

私有文件是你自己的数据（不上传、不再分发、无需解密核心）；修改后重启生效。多义消歧另设 `DIWEN_PRIVATE_CANDIDATES`。完整说明见 [PACKAGE-USAGE.md](PACKAGE-USAGE.md) §5。