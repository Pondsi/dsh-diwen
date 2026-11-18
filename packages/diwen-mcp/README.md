# diwen-mcp

迪文（Diwen）概念坐标系统的 **MCP server**：**零第三方协议依赖**（手写 stdio JSON-RPC，不依赖 MCP SDK）的**开源薄壳**，核心能力来自已发布的 npm [`diwen`](https://www.npmjs.com/package/diwen) 包（闭源核心 + 加密概念数据），把核心能力暴露为**三个** MCP 工具。

- `diwen_map` —— 中文自然语言 → 迪文填空契约（公理②：映射不唯一，需模型选义；公理④：无对应概念 → verbatim 如实保留）
- `diwen_describe` —— 迪文概念 ID → 中文唯一释义（公理①）
- `diwen_select` —— 批量云端义项选择（C14 云内级联 / C3 多家族加权投票；需云端密钥）

> **许可：允许商用（免费、无需另行授权）、不可再分发、必须署名作者 Pondsi。** 详见 [LICENSE](./LICENSE)。
> 仓库：https://github.com/Pondsi/Diwen

---

## 1. open-core 边界（壳开源，核心/数据闭源）

| 部分 | 位置（npm 安装后） | 形态 |
| --- | --- | --- |
| MCP 协议壳（本包） | `node_modules/diwen-mcp/server.mjs`、`selftest.mjs` | **源码公开可读**，手写 JSON-RPC，无第三方协议依赖 |
| 加载壳 + 解密环境 | `node_modules/diwen/index.mjs`、`node_modules/diwen/env.cjs` | 源码公开可读 |
| **核心逻辑** | `node_modules/diwen/dist/core.mjs` | **闭源** |
| **概念数据** | `node_modules/diwen/dist/data.enc` | **加密**（运行时由 `env.cjs` 解密到临时目录并设 `DIWEN_DATA_DIR`） |

本包只做协议转换与参数校验，**不含任何语言学逻辑或数据**：全部能力来自 `import * as diwen from 'diwen'`，结果**原样透传**（不改写 contract、不吞并未覆盖词、不伪造概念）。

「壳源码可读」不等于宽松许可：本包整体适用随附的自定义许可（**不是 MIT**），仍禁止再分发与提取闭源核心/数据。

## 2. 前置条件与安装

- Node.js **>= 18**（自测在 v24 上通过）。
- **依赖已发布的 npm `diwen`（`^6.3.0`）**：闭源核心 + 加密数据 + 分词器 `@node-rs/jieba` 均由该包提供。`npm install diwen-mcp` 会自动拉取 `diwen`，**无需相邻 `packages/diwen` 目录、无需自行构建核心**。
- 本包 `dependencies = { "diwen": "^6.3.0" }`；`diwen` 6.3.0 起含 `cascadeSelect`/`ensembleSelect`（`diwen_select` 所需）。

```bash
npm install diwen-mcp
```

> 仓库内开发（克隆本仓时）：`cd packages/diwen-mcp && npm install`（拉取 npm diwen），再 `node server.mjs`。

## 3. 运行

```bash
npx diwen-mcp                              # 等价于 node node_modules/diwen-mcp/server.mjs
```

stdio 纪律（MCP stdio transport）：

- **stdout 只写 JSON-RPC 响应**，每行一条 JSON（newline-delimited）。壳内已把 `console.log/info/debug/dir` 改道 stderr，防止污染协议流。
- **日志全部走 stderr**（`console.error`），例如启动行 `[diwen-mcp] diwen-mcp v6.3.0 ready (stdio, MCP 2024-11-05); tools: diwen_map, diwen_describe, diwen_select`。
- 协议版本：`2024-11-05`。支持 `initialize`、`ping`、`tools/list`、`tools/call`；通知（`notifications/initialized`、`notifications/cancelled` 等无 `id` 的消息）一律忽略、不回响应。
- 关闭 stdin 即干净退出（exit 0）；亦响应 `SIGINT`/`SIGTERM`。

### MCP 客户端配置

`command` = `node`，`args` = **server.mjs 的绝对路径**：

```json
{
  "mcpServers": {
    "diwen": {
      "command": "node",
      "args": ["<绝对路径>/node_modules/diwen-mcp/server.mjs"]
    }
  }
}
```

Windows 示例（路径按实际安装位置替换，JSON 中反斜杠需转义）：

```json
{
  "mcpServers": {
    "diwen": {
      "command": "node",
      "args": ["C:\\path\\to\\node_modules\\diwen-mcp\\server.mjs"]
    }
  }
}
```

POSIX 示例：

```json
{
  "mcpServers": {
    "diwen": { "command": "node", "args": ["/path/to/node_modules/diwen-mcp/server.mjs"] }
  }
}
```

## 4. 工具

### `diwen_map`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `text` | string | 是 | 待映射的中文文本（非空） |
| `model` | string | 否 | `auto` \| `deterministic` \| `decision` \| `off` |
| `enhance` | boolean | 否 | 启用 WSD 增强层（对比定义 / few-shot / 注记 / 拒答） |

返回 `content[0].text` 为 JSON 字符串：`{ "contract": {...}, "semanticApproval": false }`。
`contract` 含 `status`、`lang`、`segments`、`words[]`（`surface`/`span`/`root`/`slots{S1,S2,S3a,S3b,S4,S5,S6,S7}`）、`uncovered[]`、`coverage`。

请求：

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call",
 "params":{"name":"diwen_map","arguments":{"text":"我吃饭","model":"deterministic"}}}
```

实测响应内容（`model:'deterministic'`，自测原样输出）：

```json
{
  "contract": {
    "status": "partial",
    "lang": ["zh"],
    "segments": [{ "id": "s1", "lang": "zh", "text": "我吃饭", "span": [0, 3] }],
    "words": [
      { "surface": "我", "span": [0, 1], "segment": "s1",
        "root": { "id": 1363, "s3a": 53, "s3b": 2, "lemma_zh": "我", "field": "corePron1" },
        "slots": { "S1": "C_U", "S2": "A", "S3a": 53, "S3b": 2, "S4": "INF", "S5": "LG", "S6": "PRED", "S7": "N" } }
    ],
    "uncovered": [{ "surface": "吃饭", "span": [1, 3], "reason": "no-concept" }],
    "coverage": { "contentChars": 3, "matchedChars": 1, "ratio": 0.3333333333333333 }
  },
  "semanticApproval": false
}
```

注意 `status:"partial"` 与 `uncovered` 是**公理④的正常结果**：`吃饭` 暂无对应概念，如实保留原文，不就近吞并、不伪造坐标。覆盖率缺口属数据覆盖限制，不是协议错误。

### `diwen_describe`

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | integer | 是 | 迪文概念 ID（如 `1223`；运行时也容忍整数字符串） |

返回 `{ok, id, coord, lemma_zh, field, bfo_type, nsm, pinyin, definitions, slots, semanticApproval}`。实测 `id:1223` → `coord:"46:19"`、`lemma_zh:"折"`、`bfo_type:"Process"`、`nsm:["DO"]`、`semanticApproval:false`。ID 不存在时 `ok:false` 且工具结果 `isError:true`。

### `diwen_select`

批量云端义项选择（高级 WSD）。对多个用例用云端模型选义，两种模式：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `cases` | array | 是 | 选义用例数组，每项 `{id:string, surface:string, sentence:string}`（非空） |
| `mode` | string | 否 | `cascade`（默认）\| `ensemble` |
| `weights` | object | 否 | 仅 `ensemble`：按模型赋权（如 `{"deepseek-v4-pro":2}`），默认等权 |

- **`cascade`（C14 云内级联）**：小云模型跑全部易例，难例（verbatim/null）升级大云模型，省成本；返回 `escalated` 升级计数。
- **`ensemble`（C3 多家族加权投票）**：多个不同家族云端模型投票，去单模型偏差；`weights` 按模型赋权。
- **密钥前提**：需云端密钥——设环境变量 `DIWEN_KEYS_FILE` 指向你的密钥文件（或 `DIWEN_CLOUD_BASE` 覆盖 base）。**无密钥时 `isError:true`**，文案提示「设 `DIWEN_KEYS_FILE` 指向密钥文件」。
- 返回 `content[0].text` 为 JSON：`{ predictions: {<id> → {conceptId, verbatim, sense_key}}, models, escalated, semanticApproval: false }`。公理④：无概念 → verbatim。`semanticApproval` 恒 `false`。

请求：

```json
{"jsonrpc":"2.0","id":9,"method":"tools/call",
 "params":{"name":"diwen_select","arguments":{
   "cases":[{"id":"c1","surface":"开","sentence":"学校明天开运动会。"}],
   "mode":"cascade"}}}
```

> 离线 `deterministic`/`off` 与本地 ollama `decision` 路径无需密钥；`diwen_select` 是云端路径，必须自备密钥。

### 选义模式（diwen_map 的 `model`）

| `model` | 行为 | 联网/外部进程 |
| --- | --- | --- |
| `deterministic` | 确定性匹配选义 | 无（自测覆盖） |
| `off` | 不选义（`fallbackReason:"off"`） | 无（已实测离线返回） |
| `auto` | 自动；无候选跨度时降级（`fallbackReason:"no-candidate-spans"`） | 视候选情况而定（`我吃饭` 一例已实测离线降级） |
| `decision` | 本地决策模型 + 按域校准拒答 | **需本地 ollama 决策模型**；无候选跨度时不触发模型、直接离线降级（`我吃饭` 实测 `no-candidate-spans`，17ms）。真实模型调用路径本自测未覆盖 |

### 错误语义

- **工具级失败** → `result.isError: true` + 文本说明：参数非法（缺 `text`、`model` 不在枚举、`enhance` 非 boolean、`id` 非整数、`cases` 非数组/项缺字段、`mode` 不在枚举）、未知工具名、概念不存在、云端密钥缺失、核心抛错。
- **协议级错误** → JSON-RPC `error`：`-32700` 非法 JSON 行、`-32600` 非法请求/不支持 batch、`-32601` 未知方法、`-32603` 内部错误。

## 5. 恒真约定

- `semanticApproval` **恒 `false`**：机器规范通过 ≠ 语义正确 ≠ 人工批准。本壳不会把它改成 `true`，也不会代为批准。
- 公理②：自然语 → 迪文**不唯一**，须由模型选义；不同 `model` 可能给出不同结果。
- 公理④：无对应概念 → **verbatim 如实保留**（`contract.uncovered`）。
- **仅中文**：其他语言的独立映射按项目规则暂停，本包不提供其他语言入口。

## 6. 自测

```bash
node node_modules/diwen-mcp/selftest.mjs   # 仓库内：node packages/diwen-mcp/selftest.mjs
```

spawn `server.mjs` 并走完整流程：`initialize` → `notifications/initialized`（断言无响应）→ `tools/list`（断言**恰好三个工具**）→ `tools/call(diwen_map, text='我吃饭', model='deterministic')` → `tools/call(diwen_describe, id=1223)` → 错误路径（`isError:true` / `-32601` / `-32700`）→ 关闭 stdin 断言 exit 0。

共 **45 项断言**，含：协议版本与 `serverInfo`、**三工具** `inputSchema`（`diwen_map.required=[text]`、`diwen_describe.required=[id]`、`diwen_select.required=[cases]` 且 `mode` enum=`cascade/ensemble`）、`slots` 八格齐全、`span` 边界、`uncovered` 逐项与原文 verbatim 一致、`semanticApproval === false`、**stdout 每行都是合法 JSON-RPC**（无杂散输出）、通知零响应。全部通过时打印 `PASS 45/45 checks`，退出码 0；任一失败退出码 1 并附 server stderr。

> `diwen_select` 的真实云端调用需密钥与网络，不在零网络自测内；其参数校验/schema 由上述断言覆盖，云端端到端经真机验证（开运动会→hold3047 / 严重→severe3048）。

## 7. 已知限制

- **仅 stdio**：无 HTTP/SSE/WebSocket 传输，无鉴权、无多客户端会话隔离；请按本地单客户端进程使用。
- **请求串行处理**：为保证响应顺序与 stdout 不交错，请求排队执行；一旦 `decision`/`auto`/`diwen_select` 真正触发模型调用，该慢调用会阻塞后续请求。
- **依赖 npm `diwen`**：`diwen` 未安装或版本不匹配（低于 6.3.0 缺 `cascadeSelect`/`ensembleSelect`）时进程启动即失败（错误在 stderr）；本包不能脱离 `diwen` 独立运行。
- **首次调用有解密开销**：`env.cjs` 需解密概念数据到临时目录（实测 import 约 0.3s 量级，随机器/数据量变化）。
- **覆盖限制**：`status:"partial"` / `uncovered` 常见，属数据覆盖问题（`我吃饭` 实测仅 `我` 有概念，覆盖率 1/3）；`decision` 的真实模型调用需本地 ollama，`diwen_select` 需云端密钥，这两条路径未在零网络自测内验证。
- 不支持 JSON-RPC batch（`2024-11-05` 无此能力）。

## 8. 许可与署名（必须）

自定义许可（见 [LICENSE](./LICENSE)，与仓库根 `LICENSE` 同文，即 2026-11-18 起的「允许商用」版本）：

1. **允许商用**：个人与商业目的免费使用、集成，**无需事先取得作者授权**；可集成进你自己的程序（组件/依赖/插件/**MCP 服务**）并销售你的程序。
2. **不可再分发**：不得将本项目（源码、闭源核心、加密数据，整体或实质性部分）单独或随你的程序再分发、转售、公开镜像或上传他库；你的程序只能以「依赖/引用」形式包含它，且接收者不得能提取为独立项目。**不得解密、提取、绕过或再分发闭源核心与数据。**
3. **必须署名**：在你的程序文档/关于页/随附说明中注明使用了 **Diwen / 迪文**、作者 **Pondsi**、仓库链接 **https://github.com/Pondsi/Diwen** 。

其余权利保留；按「现状」提供，无任何担保。违反条款（尤其再分发与署名义务）将自动终止已授予的权利。

署名示例（可直接复制到你的 README / 关于页）：

```text
This product uses Diwen (迪文) by Pondsi — https://github.com/Pondsi/Diwen
```