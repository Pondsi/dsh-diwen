// 迪文 dsh 插件自测（不安装 peerDependency @deepseek-ai/dsh-tools）。
// 运行：node packages/diwen-dsh/selftest.mjs
// 做法：用 Node 模块定制钩子把 '@deepseek-ai/dsh-tools' 指向恒等 mock（defineTool 原样返回定义），
//       再用 mock ctx（tools.register 收集、get 返回 undefined）调用 apply，直接调用 execute 验证。
import assert from 'node:assert/strict'
import { register } from 'node:module'

const mockToolsUrl =
  'data:text/javascript,' + encodeURIComponent('export const defineTool = (definition) => definition;')
const loaderSource = `export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@deepseek-ai/dsh-tools') {
    return { url: ${JSON.stringify(mockToolsUrl)}, shortCircuit: true }
  }
  return nextResolve(specifier, context)
}`
register('data:text/javascript,' + encodeURIComponent(loaderSource), import.meta.url)

const plugin = await import('./index.js')

assert.equal(plugin.name, 'diwen')
assert.deepEqual(plugin.inject, ['tools'])

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

// 直接调用 diwen_describe.execute（id=1 → 存在）
const described = await byName.diwen_describe.execute({ id: 1 })
assert.equal(described.ok, true)
assert.equal(described.semanticApproval, false)
console.log(`PASS diwen_describe.execute({id:1}): lemma_zh=${described.lemma_zh} coord=${described.coord}`)

// render 为纯函数，产出模型可见文本内容
const rendered = byName.diwen_map.output.render({ text: '我吃饭' }, mapped)
assert.ok(Array.isArray(rendered) && rendered[0].type === 'text' && rendered[0].text.length > 0)
const renderedDescribe = byName.diwen_describe.output.render({ id: 1 }, described)
assert.ok(Array.isArray(renderedDescribe) && renderedDescribe[0].type === 'text')
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

console.log('ALL PASS: diwen-dsh selftest')