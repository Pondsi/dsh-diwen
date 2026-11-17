# 迪文（Diwen）使用手册（非技术）

迪文是**机器之间的沟通语言**：把语义落到机器可校验的概念坐标，用于多智能体协作、子代理通讯、知识库确定性内容、上下文摘要、提示词等。它不是翻译器。**当前中文可交付使用。**

## 一、获取与安装

本仓库为 open-core 公开分发（开源壳 + 闭源核心 + 加密数据），clone 后离线即用。

- **npm 包**：进入 `packages/diwen`，运行 `npm install`（安装中文分词依赖）。
- **MCP server**：`node packages/diwen-mcp/server.mjs`，在你的 MCP 客户端里配置该命令即可。
- **DeepSeek Harness 插件**：`dsh plugin --profile <p> add github:Pondsi/dsh-diwen#path:packages/diwen-dsh`（自包含，装上即用）。

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
- **署名**：注明使用迪文（Diwen/迪文）+ 作者 **Pondsi** + 仓库链接 https://github.com/Pondsi/dsh-diwen 。
- 完整条款见仓库 LICENSE。

## 五、限制

- 当前仅中文可交付；其他语言在后续路线中。
- 覆盖率非 100%；无概念词如实保留，不伪造。
- 集成 technical 细节见 [PACKAGE-USAGE.md](PACKAGE-USAGE.md)。