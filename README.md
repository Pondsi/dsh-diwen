# diwen-dsh — 迪文（Diwen）dsh 插件

让 DeepSeek Harness（dsh）里的模型**用迪文概念坐标沟通**：模型可自行决定何时使用；而在 **AI↔AI 通讯**（本体↔子代理、多 agent 编排、机械化批处理、上下文摘要）中被**强制**走迪文线格式，避免自然语歧义与跨模型漂移。

许可：**署名即用**——任何使用/修改/再分发/引用片段都须保留作者 **Pondsi**（见 LICENSE）。无其他限制。

## 安装

```bash
# 从 npm
dsh plugin add diwen-dsh

# 或从本仓（本地路径 / git）
dsh plugin add git+https://github.com/Pondsi/dsh-diwen.git
dsh plugin add ./dsh-diwen
```

依赖 `diwen@^6.16.2`（开源版，数据开放、无需许可）。

## 提供什么

| 能力 | 说明 |
|---|---|
| `diwen_map` | 中文 → 迪文概念坐标契约（S1..S7 槽位、coverage、uncovered） |
| `diwen_describe` | 概念 id → 唯一释义（lemma/坐标/场/BFO/NSM/拼音） |
| `diwen_pack` | 中文正文 → **迪文线格式** `{v:1,pairs:[[surface,coord]]}`，供 agent 间传输 |
| `diwen_unpack` | 线格式 → 中文还原（`!verbatim` 原样保留） |
| `diwen` skill | 运行时 skill：何时用、公理②（模型选义）、公理④（无概念→verbatim 不伪造） |
| 强制层 | 系统提示硬指令 + `agent/pre-step` 输入投影 + `tools/post-execute` 结果投影 |

## 两种使用模式

**1）模型自主裁量（默认开启）**
工具与 skill 由模型自行判断何时调用——适合自然语交流、探索性任务。
模型看到工具描述与 skill 目录后自判；`diwen_map` 默认 `deterministic`（离线确定性），可选 `decision/auto` 走模型选义。

**2）AI↔AI 强制（默认开启，作用域化）**
面向「无人在环」的机器间通讯：

| Seam | 行为 | 开关 |
|---|---|---|
| `systemPrompt.context(required)` | 每步注入硬指令：机器间沟通/子代理通讯/摘要须以迪文坐标为准，交换消息先 `diwen_pack`、接收方 `diwen_unpack` | `forceSystemPrompt` |
| `agent/pre-step` | 每步把进入的中文输入投影为 `surface→S3a:S3b`，经 `agent.inject` 排队为模型可见上下文 | `forcePreStep` |
| `tools/post-execute` | 每个工具结果后追加迪文坐标上下文（`additionalContexts`） | `forcePostExecute` |

三个开关在 dsh 设置 UI 中可见，逐项可关；关掉即退回纯模型裁量。

## 为什么机器间要用迪文

自然语在多 agent 链路里会逐跳漂移（同义词替换、指代丢失、模型改写）。迪文概念坐标是确定性标识：`我→53:2`、`吃饭→!verbatim`。传输用 `diwen_pack`，接收方 `diwen_unpack`，语义不随模型变化；无对应概念者以 `!verbatim` 如实保留，不伪造（公理④）。

`semanticApproval` 恒为 `false`：机器规范通过 ≠ 语义正确 ≠ 人工批准。

## 自检

```bash
node selftest.mjs        # 需要已安装 dsh peer（@deepseek-ai/dsh-tools / dsh-llm）
```

## 相关

- 用户仓：https://github.com/Pondsi/Diwen
- 核心包：npm `diwen`
- 赞助：见 SPONSORS.md

---

## ������֧�� �� License & Support

- **����**��[CC BY 4.0](./LICENSE) ���� �������ã��������á��޸ġ���Դ���ٷַ�������Ƭ�Σ�ΨһҪ�������� **Pondsi**����� [NOTICE.md](./NOTICE.md)��
- **����**��[SPONSORS.md](./SPONSORS.md) �� GitHub Sponsors <https://github.com/sponsors/Pondsi>
- **���ⷴ��**��[Issues](https://github.com/Pondsi/dsh-diwen/issues)
- **�û��֣����Ĵ���/˵����**��<https://github.com/Pondsi/Diwen>
