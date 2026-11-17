# diwen-dsh

迪文（Diwen）DeepSeek Harness（dsh）Cordis 插件 —— **开源壳 + 确定性强制层**，依赖已发布的 [`diwen`](https://www.npmjs.com/package/diwen) 核心包（闭源核心 + 加密概念数据）。

注册 `diwen_map`/`diwen_describe` 工具 + 运行时 skill `diwen`，并以原生 Cordis seam 组成**迪文确定性闭环**，使迪文概念坐标在 dsh 关键环节强制使用（而非仅模型自判）。

许可：**允许商用、不可再分发、必须署名作者 Pondsi**（见 [LICENSE](./LICENSE)）。

## 安装
```bash
dsh plugin --profile <p> add diwen-dsh        # 从 npm（自动拉取 diwen 核心 + jieba）
# 或本地：dsh plugin --profile <p> add ./packages/diwen-dsh
```
peer 依赖 `@deepseek-ai/dsh-tools`、`@deepseek-ai/dsh-llm` 由 dsh 宿主提供。

## 确定性强制层（不替换 agent-loop）
| seam | 作用 |
|---|---|
| `ctx.systemPrompt.context({required:true})` | 每步必在提示词的迪文硬指令（抗抑制） |
| `agent/pre-step` 瀑布 | 透传决策 + `agent.inject()` 把输入的迪文坐标投影排队为模型可见上下文 |
| `tools/post-execute` 瀑布 | 每个工具结果后 `additionalContexts` 追加迪文坐标 |

- 投影用 `diwen.mapChinese(text,{model:'deterministic'})`（离线、无需密钥），格式 `surface→S3a:S3b`，无概念→verbatim（公理④）。
- 注入消息含必需 `source:{kind:'user'}`（dsh MessageBase 约定）；`semanticApproval=false` 恒成立。
- 各 seam 防御性注册：宿主 API 差异时降级，不破坏插件加载；卸载插件即撤销（可逆）。
- 作用域：装进哪个 profile 即对该 profile 生效；如需仅对子代理强制，可在子代理 preset 的 profile 安装。

## 结构
```
packages/diwen-dsh/
├── index.js              开源 Cordis 壳：defineTool×2 + skill + 强制层 seam
├── cordis.patch.yml      dsh 组合包 patch（insert id=diwen, name=diwen-dsh）
├── skills/diwen/SKILL.md 运行时 skill（模型视角说明书）
└── selftest.mjs          自测（mock peer；核心走已发布 diwen）
```
核心不再 vendor 内置，改依赖 npm `diwen`（核心可经 `pnpm update diwen` 独立更新）。

## 自测
```bash
npm install        # 拉取 diwen + jieba
node selftest.mjs  # 工具/skill/强制层 seam + 投影 + source.kind 校验
```

## 真机验证
已在 F:\DeepSeek Harness（源码构建）headless profile + deepseek-v4-pro 验证：模型自主加载 skill → diwen_map('我吃饭')→我=1363/吃饭 verbatim → diwen_describe(1363)=我/coord 53:2；强制层 seam 注册并注入迪文坐标，无错误。

## 更新
`dsh plugin --profile <p> update diwen-dsh`（npm registry 路径）。详见仓库 docs/DSH-FORCE-USAGE.md。