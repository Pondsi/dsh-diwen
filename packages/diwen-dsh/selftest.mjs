// 迪文 dsh 插件自测（自包含验证；不安装 peerDependency @deepseek-ai/dsh-tools）。
// 运行：node packages/diwen-dsh/selftest.mjs
// 做法：
//   1) 用 Node 模块定制钩子（data-URL loader）把 peer 依赖 '@deepseek-ai/dsh-tools' 指向恒等 mock
//      （defineTool 原样返回定义）；同时**拦截任何 '../diwen/...' 解析**，确保插件不再依赖相邻包。
//   2) 迪文核心**不 mock**：直接走 ./vendor/diwen/index.mjs 真实制品（env.cjs 解密 dist/data.enc）。
//      分词依赖 @node-rs/jieba 由本包 dependencies 声明；在仓库内自测时由根 node_modules 向上解析提供。
//   3) 用 mock ctx（tools.register 收集、get 返回 undefined / skills）调用 apply，直接调用 execute 验证。
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginDir = fileURLToPath(new URL('.', import.meta.url))

const mockToolsUrl =
  'data:text/javascript,' + encodeURIComponent('export const defineTool = (definition) => definition;')
const loaderSource = `export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@deepseek-ai/dsh-tools') {
    return { url: ${JSON.stringify(mockToolsUrl)}, shortCircuit: true }
  }
  if (specifier === '../diwen' || specifier.startsWith('../diwen/')) {
    throw new Error('自包含违规：插件仍引用相邻包 ' + specifier)
  }
  return nextResolve(specifier, context)
}`
register('data:text/javascript,' + encodeURIComponent(loaderSource), import.meta.url)

// 自包含前置检查：vendor 内置制品齐备，且 index.js 不再引用相邻 ../diwen。
const vendorDir = join(pluginDir, 'vendor', 'diwen')
for (const rel of ['index.mjs', 'env.cjs', 'package.json', 'index.d.ts', 'dist/core.mjs', 'dist/data.enc', 'dist/diwen.schema.json']) {
  assert.ok(existsSync(join(vendorDir, rel)), `vendor 制品缺失: ${rel}`)
}
const indexSource = readFileSync(join(pluginDir, 'index.js'), 'utf8')
assert.ok(indexSource.includes("'./vendor/diwen/index.mjs'"), 'index.js 应从 ./vendor/diwen/index.mjs 引入核心')
assert.ok(!indexSource.includes('../diwen'), 'index.js 不得再引用相邻 ../diwen')
const pkg = JSON.parse(readFileSync(join(pluginDir, 'package.json'), 'utf8'))
assert.ok(pkg.files.includes('vendor'), 'package.json files 必须包含 vendor（否则安装后缺制品）')
assert.ok(pkg.dependencies?.['@node-rs/jieba'], 'package.json 必须声明运行时依赖 @node-rs/jieba')
assert.equal(pkg.peerDependencies?.['@deepseek-ai/dsh-tools'], '*', 'peer 依赖由宿主提供')
assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml', 'dsh.bundle.patch 保持')
console.log('PASS 自包含: vendor/diwen 制品齐备（core.mjs + data.enc + schema + env.cjs），files 含 vendor，依赖 @node-rs/jieba 已声明')

const plugin = await import('./index.js')

assert.equal(plugin.name, 'diwen')
assert.deepEqual(plugin.inject, ['tools'])

// 核心确实来自 vendor，且 env.cjs 已把加密数据解密到临时目录（DIWEN_DATA_DIR）。
const dataDir = process.env.DIWEN_DATA_DIR
assert.ok(dataDir && typeof dataDir === 'string', 'vendor env.cjs 应设置 DIWEN_DATA_DIR')
assert.ok(!resolve(dataDir).startsWith(resolve(pluginDir)), '解密数据目录应在插件目录之外（临时目录）')
assert.ok(existsSync(join(dataDir, 'roots.json')), '解密后的词典 roots.json 应存在')
console.log(`PASS vendor 解密: DIWEN_DATA_DIR=${dataDir}（roots.json 就位）`)

// 场景 1：无 skills 服务（get 返回 undefined）→ 只注册两个工具
const registered = []
const ctx = {
  tools: { register: (tool) => { registered.push(tool) } },
  get: () => undefined,
}
plugin.apply(ctx)
assert.equal(registered.length, 2, '应注册恰好 2 个工具')
const byName = Object.fromEntries(registered.map((t) => [t.name, t]))
assert.ok(byName.diwen_map, 'diwen_map 已注册')
assert.ok(byName.diwen_describe, 'diwen_describe 已注册')
for (const tool of registered) {
  assert.equal(tool.output.schema.type, 'object')
  assert.equal(tool.output.schema.additionalProperties, true, 'object 输出 schema 必须 additionalProperties:true')
}
console.log('PASS 工具注册:', registered.map((t) => t.name).join(', '))

// 直接调用 diwen_map.execute（deterministic 离线路径，无需网络/密钥）
const mapped = await byName.diwen_map.execute({ text: '我吃饭', model: 'deterministic' })
assert.ok(mapped && typeof mapped === 'object', 'map 返回对象')
assert.ok(mapped.contract, '返回 contract')
assert.equal(typeof mapped.contract.status, 'string', 'contract.status 为字符串')
assert.ok(Array.isArray(mapped.contract.words), 'contract.words 为数组')
assert.equal(mapped.semanticApproval, false, 'semanticApproval 恒 false')
console.log(
  `PASS diwen_map.execute({text:'我吃饭',model:'deterministic'}): ` +
  `status=${mapped.contract.status} words=${mapped.contract.words.length} ` +
  `uncovered=${(mapped.contract.uncovered || []).length} semanticApproval=${mapped.semanticApproval}`
)

// 缺省 model 时走 deterministic（不触发模型）
const mappedDefault = await byName.diwen_map.execute({ text: '我吃饭' })
assert.ok(mappedDefault.contract, '缺省 model 仍返回 contract')
assert.equal(mappedDefault.modelUsed, false, '缺省 deterministic 不用模型')
console.log('PASS diwen_map.execute 缺省 model=deterministic（modelUsed=false）')

// 关键：diwen_describe.execute({id:1223}) → lemma_zh==='折'
// 该词元只存在于加密概念数据中，断言成立即证明 vendor/diwen/dist/data.enc 被 env.cjs 成功解密加载。
const described1223 = await byName.diwen_describe.execute({ id: 1223 })
assert.equal(described1223.ok, true, 'id=1223 应存在')
assert.equal(described1223.lemma_zh, '折', 'vendor 加密数据解密后 id=1223 的 lemma_zh 应为「折」')
assert.equal(described1223.semanticApproval, false)
console.log(
  `PASS diwen_describe.execute({id:1223}): describe1223=${described1223.lemma_zh} ` +
  `coord=${described1223.coord} field=${described1223.field}（vendor 加密数据解密成功）`
)

// 另测 id=1（存在）与不存在 id（ok=false，不伪造）
const described = await byName.diwen_describe.execute({ id: 1 })
assert.equal(described.ok, true)
assert.equal(described.semanticApproval, false)
console.log(`PASS diwen_describe.execute({id:1}): lemma_zh=${described.lemma_zh} coord=${described.coord}`)
const missing = await byName.diwen_describe.execute({ id: 999999999 })
assert.equal(missing.ok, false, '无此概念应 ok=false')
console.log('PASS diwen_describe.execute 无此概念 → ok=false（不伪造）')

// render 为纯函数，产出模型可见文本内容
const rendered = byName.diwen_map.output.render({ text: '我吃饭' }, mapped)
assert.ok(Array.isArray(rendered) && rendered[0].type === 'text' && rendered[0].text.length > 0)
const renderedDescribe = byName.diwen_describe.output.render({ id: 1223 }, described1223)
assert.ok(Array.isArray(renderedDescribe) && renderedDescribe[0].type === 'text')
assert.ok(renderedDescribe[0].text.includes('折'), 'describe render 应含 lemma_zh')
console.log('PASS output.render 返回 text 内容')

// 场景 2：有 skills 服务 → 另注册运行时 skill 'diwen'（content 读 skills/diwen/SKILL.md）
const skillRegs = []
const ctx2 = {
  tools: { register: () => {} },
  get: (key) => (key === 'skills' ? { register: (s) => { skillRegs.push(s); return () => {} } } : undefined),
  effect: (fn) => fn(),
}
plugin.apply(ctx2)
assert.equal(skillRegs.length, 1, '应注册 1 个运行时 skill')
assert.equal(skillRegs[0].name, 'diwen')
assert.ok(skillRegs[0].content.includes('diwen_map'), 'skill content 来自 SKILL.md')
assert.ok(skillRegs[0].content.includes('semanticApproval'), 'skill content 含 semanticApproval 约定')
console.log('PASS 运行时 skill 注册: diwen（content 读自 skills/diwen/SKILL.md）')

console.log('ALL PASS: diwen-dsh selftest（自包含 vendor 制品）')