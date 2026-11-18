# 迪文 dsh 插件：使用方式与强制集成（强制层 round154/155 实现，现状 round164）

> 证据来自 deepseek-ai/deepseek-harness（master）官方文档/源码；真机验证在本机 DeepSeek Harness（源码构建）+ headless profile + deepseek-v4-pro。

## 1. 默认：模型自主裁量（会效果不佳）
- `diwen_map`/`diwen_describe` 工具与 `diwen` skill **都由模型自行决定**是否调用：模型看到 tool description + skill 目录（仅 name+description），自判。
- skill 正文需模型主动调 `skill({name})` 工具才加载；`SkillInvocationPolicy` 只有可见性（modelInvocable/userInvocable），**无 always/forced 策略**。
- 核心 `GenerateOptions` **无 tool_choice**——协议层不支持"强制某工具调用"。
- 风险：模型可能因 token 压力/分心/"自认为懂中文"跳过迪文，各 agent 独立决定 → 语义不一致，与迪文"机器间确定性概念坐标"定位冲突。
- 证据：docs/architecture.zh.md、docs/subsystems/{tools,skills}.zh.md、packages/core/agent-loop/README.zh.md。

## 2. 强制机制（真实存在的确定性扩展点）
dsh 是 Cordis"一切皆插件"，无特权内核；瀑布事件（waterfall，监听器调 next() 委托或返回 Decision 短路）是确定性中间件核心。

| 扩展点 | 作用 | 强制力 |
|---|---|---|
| `agent/pre-step` 瀑布 | 每步请求推导前改写/拒绝输入 | 高（唯一请求前瀑布） |
| `tools/pre-execute` | 工具分发前 deny/ask/guard 门禁 | 高（可阻塞） |
| `tools/post-execute` + deferContext | 每个工具结果后追加迪文坐标上下文 | 高 |
| `agent/turn-stopping` steer | 轮次将停时续跑/纠偏 | 中-高 |
| `ctx.systemPrompt.section/context(required)` | 注入硬指令"必须经迪文" | 中（仍经模型） |
| 替换 `ctx.compaction` 引擎 | 强制上下文摘要走迪文概念坐标 | 高（确定性 seam） |
| `registerMessageProjection` | 改写派生历史（投影迪文坐标） | 高 |
| `llm/stream` 短路 / 自定义 LlmAdapter | 自产 tool-call / wire 注入强制调用 | 高（旁路模型） |
| `ctx.commands` | 不经模型的确定性命令 | 高 |
| 替换 agent-loop（setFactory，config patch） | 完全自定义循环 | 最高（侵入大） |

- hooks（hook-protocol + claude-code/codex 桥，experimental）：可阻塞/拒绝/追加上下文，但**不能改工具入参、不能运行级硬停**。官方建议原生插件直接用原生事件（比 hook 强）。
- 证据：docs/subsystems/{core,system-prompt,llm-streaming,compaction,session,commands,subagent}.zh.md、docs/tool-execution-pipeline.zh.md、packages/experimental/hook-protocol/README.zh.md。

## 3. 推荐：确定性闭环（不替换循环）
组合多个 seam 形成"迪文强制层"，作用域化绑定子代理 preset：
1. **pre-step**：把进入模型的语义内容先经 diwen_map 投影为概念坐标（改写输入）。
2. **post-execute + deferContext**：每个工具结果追加迪文坐标，保证机器间传递确定性。
3. **compaction seam**：上下文摘要强制走迪文（替换 ctx.compaction）。
4. **messageProjection**：历史投影为迪文坐标，跨回合稳定。
5. **subagent outputSchema / 自定义 provider**：子代理通讯强制迪文格式。
6. **systemPrompt required 段**：硬指令兜底。
- 优点：不侵入循环、可作用域化（仅对需确定性的子代理/环节强制）、保留模型灵活性。
- 缺点：需实现多个 seam 插件并测试；compaction/投影替换需跟进 dsh 版本演进。

## 4. 真机验证（已通过）
- 安装：DeepSeek Harness（git clone --depth 1 + pnpm install + pnpm run build，10 门禁全过）。
- 插件：`dsh plugin --profile headless add <packages/diwen-dsh>` → 配置树含 `id: diwen`；headless 启动越过插件挂载（peer 由宿主解析）。
- 模型路由：DEEPSEEK_BASE_URL=自定义 base + DEEPSEEK_API_KEY（仅内存）+ patch 覆盖 agent-default-model.model=deepseek-v4-pro。
- 端到端：deepseek-v4-pro **自主**加载 diwen skill → diwen_map('我吃饭')→我=1363/吃饭 verbatim（公理④）→ diwen_describe(1363)=我/coord 53:2/field corePron1，正确报 semanticApproval=false、不伪造。
- **修复真 bug**：dsh 工具输出须"无损 JSON"，mapChinese 返回含 undefined 字段 → `value is not lossless JSON`。已在插件 execute 加 `lossless()`（JSON 往返净化，剔 undefined/非有限值）修复，真机复测通过。

## 5. 已实现（diwen-dsh@0.3.0，真机验证通过）
强制层并入 **diwen-dsh**（不再有单独 diwen-dsh-force 壳），依赖已发布 npm `diwen` 核心（去 vendor）：
- `ctx.systemPrompt.context({name:'diwen-force',required:true,interpolate:false})`：每步硬指令。
- `agent/pre-step` 瀑布：**透传 next()**（不修改 decision.messages，避免冻结消息处理差异）+ `payload.agent.inject(mkMsg(proj))` 排队迪文坐标投影。
- `tools/post-execute` 瀑布：`{...decision, additionalContexts:[...mkMsg(proj)]}` 追加迪文坐标。
- 投影 `diwen.mapChinese(text,{model:'deterministic'})`→`surface→S3a:S3b`，无概念 verbatim；防反馈循环（跳过含迪文标记的文本）。

**关键 bug 与修复（真机调试）**：dsh `MessageBase` 必需 `source` 字段（user=`{kind:'user'}`）。注入消息若缺 source，loop 读 `message.source.kind` 抛 `Cannot read properties of undefined (reading 'kind')`。修复：`mkMsg` 用 `createUserMessage({content,source:{kind:'user'}})`。另：pre-step 直接改 decision.messages 注入冻结消息会触发同类错误，改用文档推荐的 `agent.inject()` 透传方式稳健。

**验证**：selftest 全过（工具/skill/强制层 seam/投影/source.kind）；DeepSeek Harness headless + deepseek-v4-pro 真机：模型自主调 diwen_map('我吃饭')→我1363/吃饭verbatim，强制层注入无错误。

**npm 发布**：diwen@6.3.0（核心）/ diwen-mcp@6.3.0 / diwen-dsh@0.3.0（含强制层+设置开关）。更新：`dsh plugin --profile <p> update diwen-dsh`。

> 能力边界：dsh 侧当前注册 **2** 工具（diwen_map/diwen_describe）+ skill；云端级联/集成选义（C14/C3）经 MCP `diwen_select`（diwen-mcp@6.3.0，3 工具）或直接调用核心 `cascadeSelect`/`ensembleSelect`，不在 dsh 工具集内。

### 设置开关（diwen-dsh@0.3.0，dsh 设置 UI 可见）
`export const Config = z.object({...})`（@deepseek-ai/schemastery），`apply(ctx, config={})` 读开关，每项 `.description()` 说明用途+举例，默认全开：
| 开关 | 默认 | 用途 | 举例 |
|---|---|---|---|
| forceSystemPrompt | true | 每步注入迪文硬指令（required 抗抑制） | 关：不再每步注入指令段，工具仍可用 |
| forcePreStep | true | 输入中文经 diwen_map 投影坐标，agent.inject 排队 | 关：输入「我吃饭」不附「我→53:2;吃饭→verbatim」投影 |
| forcePostExecute | true | 工具结果后追加迪文坐标 additionalContexts | 关：工具结果不附迪文坐标 |

profile 配置示例：`- id: diwen / name: diwen-dsh / config: {forcePreStep: false}`。真机验证：默认开（注入有效）+ 全关（纯工具模式正常）。

## 6. 后续可选增强
- compaction seam 替换（强制摘要走迪文）与 registerMessageProjection（历史投影）：当前用 pre-step inject + post-execute 已构成闭环；compaction/projection 为更深集成，需实现完整 seam 约定（阈值/工具配对平衡/取消转发），按需推进。
- 作用域化子代理 preset 绑定（当前 profile 级生效）。