#!/usr/bin/env node
// 迪文（Diwen）MCP server —— 开源 stdio 壳（open-core）。
// 本文件开源；核心与概念数据闭源，由 ../diwen（dist/core.mjs + dist/data.enc + env.cjs 解密壳）提供。
// 许可：允许商用（无需另行授权）、不可再分发、必须署名作者 Pondsi。见 LICENSE / https://github.com/Pondsi/Diwen
//
// 传输：stdio，逐行（newline-delimited）JSON-RPC 2.0，MCP protocol version 2024-11-05。
// 纪律：stdout 只写 JSON-RPC 响应；一切日志走 stderr（console.error）。
// 公理：②自然语→迪文不唯一，需模型选义；④无对应概念→verbatim 如实保留；semanticApproval 恒 false
//      （机器规范通过 ≠ 语义正确 ≠ 人工批准）。本壳原样透传核心结果，不改写、不吞并、不伪造。

import * as fs from 'node:fs';
import * as readline from 'node:readline';
import * as diwen from '../diwen/index.mjs';

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_NAME = 'diwen-mcp';
const SERVER_VERSION = readVersion();
const MODELS = ['auto', 'deterministic', 'decision', 'off'];

// 防御：任何（含第三方/native 依赖的）console  stdout 输出都改道 stderr，保证 stdout 纯净。
console.log = (...a) => console.error(...a);
console.info = (...a) => console.error(...a);
console.debug = (...a) => console.error(...a);
console.dir = (...a) => console.error(...a);

function readVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
    return typeof pkg.version === 'string' && pkg.version ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

// ---------------------------------------------------------------------------
// 工具声明（tools/list）
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    name: 'diwen_map',
    description:
      '中文自然语言 → 迪文填空契约（contract）。公理②：映射不唯一，由 model 选义（deterministic=确定性匹配，' +
      'auto=自动，decision=本地决策模型+校准拒答，off=不选义）；公理④：无对应概念的词以 verbatim 如实保留在 ' +
      'contract.uncovered，不就近吞并、不伪造。返回 {contract, semanticApproval}，semanticApproval 恒 false' +
      '（机器规范通过 ≠ 语义批准）。仅支持中文。',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待映射的中文自然语言文本（非空）。' },
        model: {
          type: 'string',
          enum: MODELS,
          description: "选义模式，默认由核心决定（'auto'）。'decision' 需本地 ollama 决策模型。",
        },
        enhance: { type: 'boolean', description: '是否启用 WSD 增强层（对比定义/few-shot/注记/拒答）。' },
      },
      required: ['text'],
      additionalProperties: false,
    },
  },
  {
    name: 'diwen_describe',
    description:
      '迪文概念 ID → 中文唯一释义（公理①）。返回 {ok, id, coord, lemma_zh, field, bfo_type, nsm, pinyin, ' +
      'definitions, slots, semanticApproval}；semanticApproval 恒 false。ID 不存在时 ok:false 且 isError:true。',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: '迪文概念 ID（整数），例如 1223。' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
];

// ---------------------------------------------------------------------------
// JSON-RPC 输出helpers
// ---------------------------------------------------------------------------
function write(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}
function respond(id, result) {
  write({ jsonrpc: '2.0', id, result });
}
function respondError(id, code, message) {
  write({ jsonrpc: '2.0', id, error: { code, message } });
}
// MCP tools/call 结果：文本内容 + isError。工具级失败一律 isError:true（不用协议错误吞掉）。
function toolResult(payload, isError = false) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  return { content: [{ type: 'text', text }], isError };
}
function errText(err) {
  return err instanceof Error ? err.message : String(err);
}

// ---------------------------------------------------------------------------
// 工具实现
// ---------------------------------------------------------------------------
async function callMap(args) {
  const text = args.text;
  if (typeof text !== 'string' || text.length === 0) {
    return toolResult('diwen_map: 参数 text 必须是非空字符串。', true);
  }
  const opts = {};
  if (args.model !== undefined) {
    if (typeof args.model !== 'string' || !MODELS.includes(args.model)) {
      return toolResult(`diwen_map: 参数 model 必须是 ${MODELS.join(' | ')} 之一。`, true);
    }
    opts.model = args.model;
  }
  if (args.enhance !== undefined) {
    if (typeof args.enhance !== 'boolean') {
      return toolResult('diwen_map: 参数 enhance 必须是 boolean。', true);
    }
    opts.enhance = args.enhance;
  }
  try {
    const r = await diwen.mapChinese(text, opts);
    // 原样透传 contract（含 words[].span/slots 与 uncovered 的 verbatim 记录）+ semanticApproval。
    return toolResult({ contract: r.contract, semanticApproval: r.semanticApproval ?? false });
  } catch (err) {
    console.error('[diwen-mcp] diwen_map error:', errText(err));
    return toolResult(`diwen_map 执行失败: ${errText(err)}`, true);
  }
}

function callDescribe(args) {
  const raw = args.id;
  // 容忍客户端把整数 ID 传成字符串；其余一律拒绝。
  const id = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    return toolResult('diwen_describe: 参数 id 必须是整数概念 ID。', true);
  }
  try {
    const r = diwen.describeConcept(id);
    return toolResult(r, r.ok !== true);
  } catch (err) {
    console.error('[diwen-mcp] diwen_describe error:', errText(err));
    return toolResult(`diwen_describe 执行失败: ${errText(err)}`, true);
  }
}

async function callTool(params) {
  const name = params.name;
  const args = params.arguments;
  if (args !== undefined && (args === null || typeof args !== 'object' || Array.isArray(args))) {
    return toolResult('tools/call: arguments 必须是对象。', true);
  }
  const a = args ?? {};
  if (name === 'diwen_map') return callMap(a);
  if (name === 'diwen_describe') return callDescribe(a);
  return toolResult(`未知工具: ${String(name)}（可用: diwen_map, diwen_describe）`, true);
}

// ---------------------------------------------------------------------------
// 请求分发
// ---------------------------------------------------------------------------
async function handleRequest(msg) {
  const { id, method, params } = msg;
  switch (method) {
    case 'initialize':
      return respond(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
    case 'ping':
      return respond(id, {});
    case 'tools/list':
      return respond(id, { tools: TOOLS });
    case 'tools/call':
      return respond(id, await callTool(params ?? {}));
    default:
      return respondError(id, -32601, `Method not found: ${method}`);
  }
}

async function dispatch(line) {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return respondError(null, -32700, 'Parse error: 该行不是合法 JSON');
  }
  if (Array.isArray(msg)) {
    return respondError(null, -32600, 'Invalid Request: 不支持 batch（2024-11-05）');
  }
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    if (msg && typeof msg === 'object' && 'id' in msg) {
      return respondError(msg.id ?? null, -32600, 'Invalid Request');
    }
    return; // 无法识别的通知：忽略
  }
  // 通知（无 id）——notifications/initialized、notifications/cancelled 等一律忽略，绝不回响应。
  if (msg.id === undefined || msg.id === null) {
    console.error(`[diwen-mcp] notification ignored: ${msg.method}`);
    return;
  }
  try {
    await handleRequest(msg);
  } catch (err) {
    console.error(`[diwen-mcp] internal error on ${msg.method}:`, errText(err));
    respondError(msg.id, -32603, `Internal error: ${errText(err)}`);
  }
}

// ---------------------------------------------------------------------------
// stdio 主循环（串行处理，保证响应顺序与 stdout 不被交错写入）
// ---------------------------------------------------------------------------
const rl = readline.createInterface({ input: process.stdin, terminal: false, crlfDelay: Infinity });
let queue = Promise.resolve();

rl.on('line', (line) => {
  const s = line.trim();
  if (!s) return;
  queue = queue.then(() => dispatch(s)).catch((err) => {
    console.error('[diwen-mcp] dispatch failure:', errText(err));
  });
});

rl.on('close', () => {
  queue.then(() => process.exit(0)).catch(() => process.exit(0));
});

process.stdin.on('error', (err) => console.error('[diwen-mcp] stdin error:', errText(err)));
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => process.exit(0));
}

console.error(`[diwen-mcp] ${SERVER_NAME} v${SERVER_VERSION} ready (stdio, MCP ${PROTOCOL_VERSION}); tools: diwen_map, diwen_describe`);