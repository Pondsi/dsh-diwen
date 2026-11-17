#!/usr/bin/env node
// 迪文 MCP server 自测（开源壳的一部分，可保留）。
// 用法：node packages/diwen-mcp/selftest.mjs
// 流程：spawn server.mjs → initialize → notifications/initialized → tools/list
//      → tools/call(diwen_map text='我吃饭' model='deterministic') → tools/call(diwen_describe id=1223)
//      → 错误路径（isError / -32601 / -32700）→ 关闭 stdin 断言退出码 0。
// 许可：允许商用、不可再分发、必须署名作者 Pondsi。

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SERVER = fileURLToPath(new URL('./server.mjs', import.meta.url));
const PKG_DIR = fileURLToPath(new URL('.', import.meta.url));
const REQUEST_TIMEOUT_MS = 60_000;
const TOTAL_TIMEOUT_MS = 180_000;

const results = [];
let child;
let stderrBuf = '';
const stray = [];      // 没有对应请求的响应（通知绝不该产生响应）
const waiters = [];    // {match, resolve, reject, timer}
let stdoutLineCount = 0;
let failed = false;

function ok(name, detail) {
  results.push({ name, pass: true });
  console.log(`[ok]   ${name}${detail ? ' — ' + detail : ''}`);
}
function assert(name, cond, detail) {
  if (cond) return ok(name, detail);
  results.push({ name, pass: false, detail });
  failed = true;
  throw new Error(`断言失败: ${name}${detail ? ' — ' + detail : ''}`);
}
function show(label, value) {
  console.log(`       ${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
}

function waitFor(match, label, timeoutMs = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const i = waiters.findIndex((w) => w.resolve === resolve);
      if (i >= 0) waiters.splice(i, 1);
      reject(new Error(`等待响应超时(${timeoutMs}ms): ${label}`));
    }, timeoutMs);
    waiters.push({ match, resolve, reject, timer });
  });
}

function send(obj) {
  child.stdin.write(JSON.stringify(obj) + '\n');
}
function request(id, method, params) {
  const p = waitFor((m) => m.id === id, `${method} (id=${id})`);
  send(params === undefined ? { jsonrpc: '2.0', id, method } : { jsonrpc: '2.0', id, method, params });
  return p;
}

function onLine(line) {
  const s = line.trim();
  if (!s) return;
  stdoutLineCount++;
  let msg;
  try {
    msg = JSON.parse(s);
  } catch {
    failed = true;
    throw new Error(`stdout 出现非 JSON 行（违反 stdout 只写 JSON-RPC）: ${s.slice(0, 200)}`);
  }
  if (msg.jsonrpc !== '2.0') {
    failed = true;
    throw new Error(`stdout 响应缺少 jsonrpc:"2.0": ${s.slice(0, 200)}`);
  }
  const i = waiters.findIndex((w) => w.match(msg));
  if (i >= 0) {
    const w = waiters.splice(i, 1)[0];
    clearTimeout(w.timer);
    w.resolve(msg);
  } else {
    stray.push(msg);
  }
}

function cleanup() {
  for (const w of waiters.splice(0)) clearTimeout(w.timer);
  if (child && child.exitCode === null && !child.killed) child.kill();
}

async function main() {
  console.log(`# diwen-mcp selftest`);
  console.log(`# server: ${SERVER}`);
  console.log(`# node:   ${process.version}\n`);

  child = spawn(process.execPath, [SERVER], {
    cwd: PKG_DIR,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env,
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (d) => { stderrBuf += d; });
  child.stdout.setEncoding('utf8');
  let buf = '';
  child.stdout.on('data', (d) => {
    buf += d;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      onLine(line);
    }
  });
  const exited = new Promise((resolve) => child.on('close', (code, signal) => resolve({ code, signal })));
  child.on('error', (e) => { throw e; });

  const watchdog = setTimeout(() => {
    console.error(`\n[FAIL] 总超时 ${TOTAL_TIMEOUT_MS}ms`);
    cleanup();
    process.exit(1);
  }, TOTAL_TIMEOUT_MS);

  // --- 1. initialize -------------------------------------------------------
  const init = await request(1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'diwen-mcp-selftest', version: '1.0.0' },
  });
  show('initialize result', init.result);
  assert('initialize 无错误', !init.error, JSON.stringify(init.error ?? null));
  assert('protocolVersion = 2024-11-05', init.result?.protocolVersion === '2024-11-05', init.result?.protocolVersion);
  assert('capabilities.tools 存在', init.result?.capabilities && typeof init.result.capabilities.tools === 'object');
  assert('serverInfo.name = diwen-mcp', init.result?.serverInfo?.name === 'diwen-mcp', init.result?.serverInfo?.name);
  assert('serverInfo.version 非空', typeof init.result?.serverInfo?.version === 'string' && init.result.serverInfo.version.length > 0, init.result?.serverInfo?.version);

  // --- 2. notifications/initialized（必须被忽略，无响应）-------------------
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  ok('已发送 notifications/initialized（通知，无 id）');

  // --- 3. tools/list -------------------------------------------------------
  const list = await request(2, 'tools/list');
  const tools = list.result?.tools ?? [];
  show('tools', tools.map((t) => t.name));
  assert('tools/list 无错误', !list.error);
  assert('恰好两个工具', tools.length === 2, `count=${tools.length}`);
  const map = tools.find((t) => t.name === 'diwen_map');
  const desc = tools.find((t) => t.name === 'diwen_describe');
  assert('diwen_map 存在且含 inputSchema', !!map && map.inputSchema?.type === 'object');
  assert('diwen_map.required = [text]', JSON.stringify(map?.inputSchema?.required) === '["text"]');
  assert('diwen_map 声明 model/enhance', !!map?.inputSchema?.properties?.model && !!map?.inputSchema?.properties?.enhance);
  assert('diwen_map.model enum 四值', JSON.stringify(map?.inputSchema?.properties?.model?.enum) === JSON.stringify(['auto', 'deterministic', 'decision', 'off']));
  assert('diwen_describe 存在且含 inputSchema', !!desc && desc.inputSchema?.type === 'object');
  assert('diwen_describe.required = [id]', JSON.stringify(desc?.inputSchema?.required) === '["id"]');
  assert('通知未产生响应', stray.length === 0, `stray=${JSON.stringify(stray)}`);

  // --- 4. tools/call diwen_map --------------------------------------------
  const mapRes = await request(3, 'tools/call', {
    name: 'diwen_map',
    arguments: { text: '我吃饭', model: 'deterministic' },
  });
  assert('diwen_map 无协议错误', !mapRes.error, JSON.stringify(mapRes.error ?? null));
  assert('diwen_map isError 非真', mapRes.result?.isError !== true, JSON.stringify(mapRes.result?.content?.[0]?.text ?? '').slice(0, 200));
  assert('diwen_map 返回 text 内容', mapRes.result?.content?.[0]?.type === 'text' && typeof mapRes.result.content[0].text === 'string');
  const mapPayload = JSON.parse(mapRes.result.content[0].text);
  show('diwen_map payload', mapPayload);
  assert('payload 含 contract', !!mapPayload.contract && typeof mapPayload.contract === 'object');
  assert('contract.status 为字符串', typeof mapPayload.contract.status === 'string', mapPayload.contract.status);
  assert('contract.words 为数组', Array.isArray(mapPayload.contract.words), `words=${mapPayload.contract.words?.length}`);
  assert('semanticApproval 恒 false', mapPayload.semanticApproval === false, String(mapPayload.semanticApproval));
  const words = mapPayload.contract.words ?? [];
  assert('至少一个词被映射（我）', words.some((w) => w.surface === '我'), words.map((w) => w.surface).join(','));
  const SLOT_KEYS = ['S1', 'S2', 'S3a', 'S3b', 'S4', 'S5', 'S6', 'S7'];
  assert('每个词含 span 与 8 个 slots', words.every((w) => Array.isArray(w.span) && w.span.length === 2 && SLOT_KEYS.every((k) => k in (w.slots ?? {}))));
  assert('span 落在文本范围内', words.every((w) => w.span[0] >= 0 && w.span[1] <= '我吃饭'.length && w.span[0] < w.span[1]));
  // 公理④：无对应概念 → verbatim 如实保留（不吞并、不改写）
  const uncovered = mapPayload.contract.uncovered ?? [];
  show('uncovered(公理④ verbatim)', uncovered);
  assert('uncovered 逐项 verbatim 与原文一致', uncovered.every((u) => '我吃饭'.slice(u.span[0], u.span[1]) === u.surface), JSON.stringify(uncovered));
  assert('未覆盖部分未被伪造概念', uncovered.every((u) => u.root === undefined && u.reason !== undefined), uncovered.map((u) => u.reason).join(','));

  // --- 5. tools/call diwen_describe ---------------------------------------
  const descRes = await request(4, 'tools/call', { name: 'diwen_describe', arguments: { id: 1223 } });
  assert('diwen_describe 无协议错误', !descRes.error);
  assert('diwen_describe isError 非真', descRes.result?.isError !== true);
  const d = JSON.parse(descRes.result.content[0].text);
  show('diwen_describe payload', d);
  assert('describe ok = true', d.ok === true, JSON.stringify(d.error ?? null));
  assert('describe id = 1223', d.id === 1223, String(d.id));
  assert('describe lemma_zh = 折', d.lemma_zh === '折', d.lemma_zh);
  assert('describe coord 形如 s3a:s3b', typeof d.coord === 'string' && /^\d+:\d+$/.test(d.coord), d.coord);
  assert('describe semanticApproval 恒 false', d.semanticApproval === false, String(d.semanticApproval));

  // --- 6. 错误路径 ---------------------------------------------------------
  const badArgs = await request(5, 'tools/call', { name: 'diwen_map', arguments: {} });
  assert('缺 text → isError:true', badArgs.result?.isError === true && !badArgs.error, badArgs.result?.content?.[0]?.text);

  const unknownTool = await request(6, 'tools/call', { name: 'nope', arguments: {} });
  assert('未知工具 → isError:true', unknownTool.result?.isError === true && !unknownTool.error, unknownTool.result?.content?.[0]?.text);

  const missingId = await request(7, 'tools/call', { name: 'diwen_describe', arguments: { id: 999999999 } });
  assert('不存在的概念 → isError:true', missingId.result?.isError === true && !missingId.error, String(missingId.result?.content?.[0]?.text).slice(0, 160));

  const unknownMethod = await request(8, 'resources/list');
  assert('未知方法 → -32601', unknownMethod.error?.code === -32601, JSON.stringify(unknownMethod.error));

  const parseErrP = waitFor((m) => m.id === null && m.error, 'parse error');
  child.stdin.write('this-is-not-json\n');
  const parseErr = await parseErrP;
  assert('非法 JSON → -32700', parseErr.error?.code === -32700, JSON.stringify(parseErr.error));

  assert('全程 stdout 只有 JSON-RPC 响应', stray.length === 0, `stray=${JSON.stringify(stray)}`);

  // --- 7. 关闭 stdin → 干净退出 -------------------------------------------
  child.stdin.end();
  const { code, signal } = await exited;
  assert('stdin 关闭后退出码 0', code === 0, `code=${code} signal=${signal}`);
  assert('stdout 行数 = 请求数(9)', stdoutLineCount === 9, `lines=${stdoutLineCount}`);

  clearTimeout(watchdog);
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n# stderr(server 日志，仅诊断用):\n${stderrBuf.trim().split('\n').map((l) => '  ' + l).join('\n')}`);
  console.log(`\nPASS ${passed}/${results.length} checks — diwen-mcp selftest 通过`);
}

main().then(() => {
  cleanup();
  process.exit(failed ? 1 : 0);
}).catch((err) => {
  console.error(`\n[FAIL] ${err.message}`);
  if (stderrBuf.trim()) console.error(`\n# server stderr:\n${stderrBuf.trim()}`);
  const passed = results.filter((r) => r.pass).length;
  console.error(`\nFAIL ${passed}/${results.length} checks — diwen-mcp selftest 未通过`);
  cleanup();
  process.exit(1);
});