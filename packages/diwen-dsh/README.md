# diwen-dsh

迪文（Diwen）DeepSeek Harness（dsh）Cordis 插件 —— **open-core**：本包是开源 Cordis 壳（工具 + skill），核心与概念数据闭源，经相邻包 `packages/diwen`（`../diwen/index.mjs`）引用。

许可：**允许商用、不可再分发、必须署名作者 Pondsi**（见 [LICENSE](./LICENSE)）。

## 工具与 skill

| 工具 | 参数 | 说明 |
| --- | --- | --- |
| `diwen_map` | `text`（必填）、`model?`（auto/deterministic/decision/off，默认 deterministic）、`enhance?` | 中文文本→迪文契约 `contract{status, words[span, slots S1..S7], uncovered, coverage}`；`semanticApproval` 恒 false |
| `diwen_describe` | `id`（必填，number） | 概念详情：lemma_zh / coord / field / bfo_type / nsm / pinyin / definitions |

宿主提供 skills 服务（`ctx.get('skills')`）时，另注册运行时 skill `diwen`（内容读 `skills/diwen/SKILL.md`）：模型视角说明书，涵盖何时用工具、公理②（自然语→迪文需模型选义）、公理④（无概念→verbatim 不伪造）、`semanticApproval=false` 含义。

## 安装

前提：已安装 dsh CLI；持有**完整 Diwen 仓库 checkout**（本插件以相对路径引用相邻 open-core 包 `packages/diwen`，且其依赖如 `@node-rs/jieba` 需已安装）。

```bash
# 本地路径（推荐；在仓库根目录执行）
dsh plugin --profile <p> add ./packages/diwen-dsh

# GitHub（pnpm ≥9 子目录安装；建议锁定 commit）
dsh plugin --profile <p> add github:Pondsi/Diwen#path:packages/diwen-dsh
```

安装后验证层并启动：

```bash
dsh --profile <p> --dump-config   # 应看到 diwen-dsh 层（insert id=diwen）
dsh --profile <p>
```

注意：

- `@deepseek-ai/dsh-tools` 是 peerDependency，由 dsh 宿主提供，本包不捆绑、不安装。
- 本插件 `import '../diwen/index.mjs'` 依赖相邻 `packages/diwen`。若子目录安装未包含相邻包，请改用本地完整 checkout 安装。
- `model:'decision'/'auto'` 需要可用的模型 provider 与密钥；`deterministic`/`off` 完全离线。

## 自测

```bash
node --check packages/diwen-dsh/index.js
node packages/diwen-dsh/selftest.mjs
```

`selftest.mjs` 用 mock ctx 与 mock peer 依赖（不安装 `@deepseek-ai/dsh-tools`）断言注册了 `diwen_map`/`diwen_describe` 两工具，并直接调用 `execute({text:'我吃饭',model:'deterministic'})` 验证返回 contract。

## open-core 与许可

- **开源壳**：本目录（index.js / cordis.patch.yml / skills / README / 自测）。
- **闭源**：`packages/diwen` 的 `dist/core.mjs` 与加密概念数据 `data.enc`；不得试图解密、提取、绕过或再分发。
- **许可**（全文见 [LICENSE](./LICENSE)）：个人与商业使用免费、无需另行授权；不可再分发本项目本身（源码、闭源核心、加密数据）；使用/集成须署名「Diwen / 迪文」、作者 **Pondsi**，并在程序文档/关于页附仓库链接 <https://github.com/Pondsi/Diwen>。

## 共同约定

- 公理②：自然语→迪文需模型选义；deterministic 只是机械基线。
- 公理④：无对应概念→verbatim 如实保留（`contract.uncovered`），不伪造。
- `semanticApproval:false` 恒成立：机器规范通过 ≠ 语义正确 ≠ 人工批准。
- 当前仅支持中文。