# diwen-dsh

迪文（Diwen）DeepSeek Harness（dsh）Cordis 插件 —— **open-core，自包含（装上即用）**：开源 Cordis 壳（工具 + skill）+ **内置**闭源核心与加密概念数据（`vendor/diwen/`）。

装进 profile 的 `node_modules` 后**不需要相邻包、不需要完整 Diwen 仓库 checkout**：核心以包内相对路径 `./vendor/diwen/index.mjs` 引入。

许可：**允许商用、不可再分发、必须署名作者 Pondsi**（见 [LICENSE](./LICENSE)）。

## 自包含结构

```
packages/diwen-dsh/
├── index.js                    开源 Cordis 壳：defineTool × 2 + 运行时 skill
├── cordis.patch.yml            dsh 组合包 patch（insert id=diwen, name=diwen-dsh）
├── skills/diwen/SKILL.md       运行时 skill 内容（模型视角说明书）
├── selftest.mjs                自测（只 mock peer；核心走真实 vendor 制品）
└── vendor/diwen/               内置 open-core 制品（闭源，随包分发）
    ├── index.mjs               加载壳：import './env.cjs' → export * from './dist/core.mjs'
    ├── env.cjs                 解密壳：以 __dirname 相对读 dist/data.enc → 临时目录 → DIWEN_DATA_DIR
    ├── package.json            制品元数据
    ├── index.d.ts              类型声明
    └── dist/
        ├── core.mjs            闭源核心（minify bundle，约 198 KB）
        ├── data.enc            加密概念数据（AES-256-GCM，约 26.5 MB）
        └── diwen.schema.json   契约 JSON Schema
```

- `vendor/diwen/` 与 npm 包 `packages/diwen` 的运行时制品**逐字节一致**（同一构建产物，不含 `node_modules`）。
- `env.cjs` 用 `__dirname` 相对定位 `dist/data.enc`，`core.mjs` 用 `import.meta.url` 相对定位 `dist/diwen.schema.json`，数据目录经 `DIWEN_DATA_DIR` 注入 —— 全部包内自洽，无外部路径假设。
- **体积**：`vendor/` 共 7 个文件、25.5 MiB（26.76 MB），主要是 `data.enc`（25.3 MiB）。每个宿主进程首次加载时会解密到系统临时目录（389 个数据文件 / 14 个子目录，约 18.9 MiB）并设置 `DIWEN_DATA_DIR`。
- **运行时依赖仅 `@node-rs/jieba`**（中文分词，含平台原生二进制），已声明在本包 `dependencies`，安装时自动装上；核心以 bare `require('@node-rs/jieba')` / `require('@node-rs/jieba/dict.js')` 解析，无需任何相对路径。

## 工具与 skill

| 工具 | 参数 | 说明 |
| --- | --- | --- |
| `diwen_map` | `text`（必填）、`model?`（auto/deterministic/decision/off，默认 deterministic）、`enhance?` | 中文文本→迪文契约 `contract{status, words[span, slots S1..S7], uncovered, coverage}`；`semanticApproval` 恒 false |
| `diwen_describe` | `id`（必填，number） | 概念详情：lemma_zh / coord / field / bfo_type / nsm / pinyin / definitions |

宿主提供 skills 服务（`ctx.get('skills')`）时，另注册运行时 skill `diwen`（内容读 `skills/diwen/SKILL.md`）：模型视角说明书，涵盖何时用工具、公理②（自然语→迪文需模型选义）、公理④（无概念→verbatim 不伪造）、`semanticApproval=false` 含义。

## 安装

前提：已安装 dsh CLI。**无需** Diwen 仓库 checkout，无需手工装核心。

```bash
# GitHub 子目录安装（公开分发仓库；建议锁定 commit）
dsh plugin --profile <p> add github:Pondsi/dsh-diwen#path:packages/diwen-dsh

# 本地路径（在仓库根目录执行）
dsh plugin --profile <p> add ./packages/diwen-dsh
```

安装后验证层并启动：

```bash
dsh --profile <p> --dump-config   # 应看到 diwen-dsh 层（insert id=diwen）
dsh --profile <p>
```

注意：

- `@deepseek-ai/dsh-tools` 是 **peerDependency，由 dsh 宿主提供**，本包不捆绑、不安装。
- `@node-rs/jieba` 是 **dependencies，安装时自动安装**（含对应平台的原生可选包）。若安装环境拿不到原生二进制，核心会 catch 并降级（分词器为空），机械匹配仍可跑但切分质量下降。
- GitHub 子目录安装要求该仓库快照**已包含 `packages/diwen-dsh/vendor/`**（自包含版本）。若加载报 `Cannot find module '../diwen/index.mjs'`，说明快照仍是旧的「相邻包引用」版本：改用本地路径安装，或更新到含 `vendor/` 的 commit。
- `model:'decision'` 需本机可用的 ollama 与决策模型；`model:'auto'` 走云端 provider（见下方限制）；`deterministic`/`off` **完全离线**，装完即可用。

## 自测

```bash
node --check packages/diwen-dsh/index.js
node packages/diwen-dsh/selftest.mjs
```

`selftest.mjs` 用 Node 模块定制钩子（data-URL loader）**只 mock peer 依赖** `@deepseek-ai/dsh-tools`（恒等 `defineTool`），并**拦截任何 `../diwen/...` 解析**以证明自包含；**迪文核心不 mock**，直接加载 `./vendor/diwen/index.mjs` 真实制品（在仓库内自测时 `@node-rs/jieba` 由根 `node_modules` 向上解析提供）。断言：

- `apply(mockCtx)` 注册 `diwen_map`/`diwen_describe`，`output.schema` 为 `{type:'object', additionalProperties:true}`；
- `diwen_map.execute({text:'我吃饭',model:'deterministic'})` 返回 `contract`，`semanticApproval=false`；缺省 model 时 `modelUsed=false`；
- **`diwen_describe.execute({id:1223}).lemma_zh === '折'`** —— 该词元只存在于加密数据中，断言成立即证明 `vendor/diwen/dist/data.enc` 解密加载成功；
- 无此概念 → `ok=false`（不伪造）；`output.render` 产出 text；运行时 skill `diwen` 注册。

## open-core 与许可

- **开源壳**：`index.js` / `cordis.patch.yml` / `skills/` / `README.md` / `selftest.mjs` / `vendor/diwen/env.cjs`（解密壳）。
- **闭源**：`vendor/diwen/dist/core.mjs` 与加密概念数据 `vendor/diwen/dist/data.enc`；不得试图解密、提取、绕过或再分发。
- **许可**（全文见 [LICENSE](./LICENSE)）：个人与商业使用免费、无需另行授权；**不可再分发**本项目本身（源码、闭源核心、加密数据，含 `vendor/` 副本）；使用/集成须署名「Diwen / 迪文」、作者 **Pondsi**，并在程序文档/关于页附仓库链接 <https://github.com/Pondsi/Diwen>。
- 诚实说明：客户端加密/混淆只**提高提取成本**，并非不可破（解密密钥在开源壳内）。如需真正保密，须把核心与数据服务端化。

## 共同约定

- 公理②：自然语→迪文需模型选义；deterministic 只是机械基线。
- 公理④：无对应概念→verbatim 如实保留（`contract.uncovered`），不伪造。
- `semanticApproval:false` 恒成立：机器规范通过 ≠ 语义正确 ≠ 人工批准。
- 当前仅支持中文。

## 限制

- 覆盖率非 100%（公理④设计）：未收录义项如实 verbatim，不就近吞并。
- `vendor/` 内是**发布构建产物**，不含开发期可选增强料（如拼音豁免表、歧义句料）；核心对这些路径有存在性守卫，缺失时相应增强层不生效，`deterministic`/`off` 主路径不受影响。
- 云端选义（`model:'auto'`）在构建产物内读取**作者开发机上的密钥文件**（无环境变量覆盖），接收者环境不存在该文件 → 云端路径不可用；请改用本地 ollama 决策模型（`model:'decision'`）或离线路径。
- 每个宿主进程首次加载都会在系统临时目录新建一份解密数据（约 18.9 MiB），进程内复用；插件本身不做清理（由操作系统临时目录策略回收）。