// 迪文 dsh 插件自测（依赖已发布 diwen 核心包；不安装 peerDependency @deepseek-ai/dsh-tools）。
// 运行：node packages/diwen-dsh/selftest.mjs（需先 npm install diwen，或由仓库根 node_modules 解析）
// 做法：data-URL loader 把 peer '@deepseek-ai/dsh-tools' 指向恒等 mock；diwen 核心不 mock（走已发布包）。
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginDir = fileURLToPath(new URL('.', import.meta.url))
const mockToolsUrl = 'data:text/javascript,' + encodeURIComponent('export const defineTool = (d) => d;')
const mockLlmUrl = 'data:text/javascript,' + encodeURIComponent('export const createUserMessage = (x) => x;')
const loaderSource = `export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@deepseek-ai/dsh-tools') return { url: ${JSON.stringify(mockToolsUrl)}, shortCircuit: true }
  if (specifier === '@deepseek-ai/dsh-llm') return { url: ${JSON.stringify(mockLlmUrl)}, shortCircuit: true }
  return nextResolve(specifier, context)
}`
register('data:text/javascript,' + encodeURIComponent(loaderSource), import.meta.url)

// 包元数据：依赖已发布 diwen + jieba，peer 由宿主提供，dsh.bundle.patch 保持。
const pkg = JSON.parse(readFileSync(join(pluginDir, 'package.json'), 'utf8'))
assert.ok(pkg.dependencies?.diwen, 'package.json 必须依赖已发布 diwen 核心包')
assert.ok(pkg.dependencies?.['@node-rs/jieba'], '必须声明运行时依赖 @node-rs/jieba')
assert.equal(pkg.peerDependencies?.['@deepseek-ai/dsh-tools'], '*', 'peer 由宿主提供')
assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml', 'dsh.bundle.patch 保持')
const indexSource = readFileSync(join(pluginDir, 'index.js'), 'utf8')
assert.ok(indexSource.includes("from 'diwen'"), 'index.js 应从已发布 diwen 引入核心')
assert.ok(!indexSource.includes('../diwen') && !indexSource.includes('./vendor'), '不得引用相邻包或 vendor')
console.log('PASS 包结构: 依赖 diwen + jieba，peer 宿主提供，import from diwen')

const plugin = await import('./index.js')
assert.equal(plugin.name, 'diwen')
assert.deepEqual(plugin.inject, ['tools'])

// 场景 1：无 skills 服务 → 注册两个工具
const registered = []
const ctx = { tools: { register: (t) => registered.push(t) }, get: () => undefined }
plugin.apply(ctx)
const byName = Object.fromEntries(registered.map((t) => [t.name, t]))
assert.ok(byName.diwen_map && byName.diwen_describe, 'diwen_map/diwen_describe 已注册')
for (const t of registered) {
  assert.equal(t.output.schema.type, 'object')
  assert.equal(t.output.schema.additionalProperties, true, 'object 输出须 additionalProperties:true')
}
console.log('PASS 工具注册:', registered.map((t) => t.name).join(', '))

const mapped = await byName.diwen_map.execute({ text: '我吃饭', model: 'deterministic' })
assert.ok(mapped.contract && Array.isArray(mapped.contract.words))
assert.equal(mapped.semanticApproval, false)
// 无损 JSON（dsh 要求）：JSON 往返一致
assert.deepEqual(JSON.parse(JSON.stringify(mapped)), mapped, '输出须无损 JSON')
console.log(`PASS diwen_map: status=${mapped.contract.status} words=${mapped.contract.words.length} semanticApproval=false 无损JSON`)

const mappedDefault = await byName.diwen_map.execute({ text: '我吃饭' })
assert.equal(mappedDefault.modelUsed, false, '缺省 deterministic 不用模型')
console.log('PASS 缺省 model=deterministic（modelUsed=false）')

const d1223 = await byName.diwen_describe.execute({ id: 1223 })
assert.equal(d1223.ok, true)
assert.equal(d1223.lemma_zh, '折', 'diwen 核心加密数据 id=1223 lemma_zh=折')
assert.equal(d1223.semanticApproval, false)
console.log(`PASS diwen_describe(1223)=${d1223.lemma_zh} coord=${d1223.coord}（diwen 核心解密成功）`)

const missing = await byName.diwen_describe.execute({ id: 999999999 })
assert.equal(missing.ok, false, '无此概念 ok=false 不伪造')
console.log('PASS 无此概念 → ok=false（不伪造）')

const rendered = byName.diwen_map.output.render({ text: '我吃饭' }, mapped)
assert.ok(rendered[0].type === 'text' && rendered[0].text.length > 0)
console.log('PASS output.render 返回 text')

// 场景 2：有 skills 服务 → 注册运行时 skill diwen
const skillRegs = []
const ctx2 = {
  tools: { register: () => {} },
  get: (k) => (k === 'skills' ? { register: (s) => { skillRegs.push(s); return () => {} } } : undefined),
  effect: (fn) => fn(),
}
plugin.apply(ctx2)
assert.equal(skillRegs.length, 1)
assert.equal(skillRegs[0].name, 'diwen')
assert.ok(skillRegs[0].content.includes('diwen_map') && skillRegs[0].content.includes('semanticApproval'))
console.log('PASS 运行时 skill 注册: diwen')

// 场景 3：确定性强制层（systemPrompt required + pre-step 输入投影 + post-execute 结果投影）
const listeners = {}
const promptCtx = []
const ctx3 = {
  tools: { register: () => {} },
  get: () => undefined,
  on: (ev, fn) => { listeners[ev] = fn; return () => {} },
  systemPrompt: { context: (c) => { promptCtx.push(c); return () => {} } },
}
plugin.apply(ctx3)
assert.ok(promptCtx.some((c) => c.name === 'diwen-force' && c.required === true), 'systemPrompt 必需上下文 diwen-force 已注册')
assert.equal(typeof listeners['agent/pre-step'], 'function', 'pre-step 瀑布监听器已注册')
assert.equal(typeof listeners['tools/post-execute'], 'function', 'post-execute 瀑布监听器已注册')
console.log('PASS 强制层注册: systemPrompt(required) + agent/pre-step + tools/post-execute')

// pre-step：透传决策 + 经 agent.inject 排队迪文坐标投影（含必需 source.kind='user'）
const userMsg = { content: [{ type: 'text', text: '我吃饭' }] }
const injectedMsgs = []
const preDecision = await listeners['agent/pre-step'](
  { messages: [userMsg], signal: { aborted: false }, agent: { inject: (m) => injectedMsgs.push(m) } },
  async () => ({ kind: 'enter', messages: [userMsg] }),
)
assert.equal(preDecision.kind, 'enter', 'pre-step 透传 enter 决策')
assert.ok(injectedMsgs.length >= 1, 'pre-step 经 agent.inject 排队迪文坐标')
assert.ok(JSON.stringify(injectedMsgs[0]).includes('迪文概念坐标'), '注入消息含迪文坐标标记')
assert.equal(injectedMsgs[0].source?.kind, 'user', '注入消息须含 source.kind=user（MessageBase 必需）')
console.log('PASS pre-step 输入投影: 我吃饭 → agent.inject 迪文坐标（source.kind=user）')

// pre-step：reject 决策透传不改写
const rej = await listeners['agent/pre-step']({ messages: [userMsg], signal: { aborted: false }, agent: { inject: () => {} } }, async () => ({ kind: 'reject' }))
assert.equal(rej.kind, 'reject', 'reject 决策保持')
console.log('PASS pre-step reject 保持（不强行进入）')

// post-execute：工具结果 → 追加迪文坐标 additionalContexts
const postDecision = await listeners['tools/post-execute'](
  { name: 'some_tool' },
  { content: [{ type: 'text', text: '我吃饭' }] },
  async () => ({ kind: 'accept' }),
)
assert.equal(postDecision.kind, 'accept')
assert.ok((postDecision.additionalContexts || []).some((m) => JSON.stringify(m).includes('迪文概念坐标')), 'post-execute 追加迪文坐标上下文')
console.log('PASS post-execute 结果投影: 追加迪文坐标 additionalContexts')

console.log('ALL PASS: diwen-dsh selftest（依赖 diwen + 确定性强制层）')