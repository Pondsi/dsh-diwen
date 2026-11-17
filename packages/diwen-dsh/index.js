// 迪文（Diwen）DeepSeek Harness（dsh）Cordis 插件 —— 开源壳（open-core），自包含。
// 核心与概念数据闭源，内置于本包 ./vendor/diwen（core.mjs + 加密 data.enc + env.cjs 解密壳）；
// 装到任意 profile 的 node_modules 后不依赖相邻包或仓库 checkout。本文件不含闭源实现。
// 许可：允许商用、不可再分发、必须署名作者 Pondsi（见 LICENSE）。
// 插件规范（官方教程）：https://deepseek-harness.github.io/deepseek-harness/develop/basic/tool
import { readFileSync } from 'node:fs'
import { defineTool } from '@deepseek-ai/dsh-tools'
import * as diwen from './vendor/diwen/index.mjs'

// dsh 工具输出须为无损 JSON（JSON 往返一致）：剔除 undefined 属性、把非有限数转 null。
const lossless = (v) => JSON.parse(JSON.stringify(v, (_k, val) =>
  typeof val === 'number' && !Number.isFinite(val) ? null : val))

export const name = 'diwen'
export const inject = ['tools']

const SKILL_DESCRIPTION =
  '迪文（Diwen）概念坐标系统使用指引：何时用 diwen_map/diwen_describe、公理②（模型选义）与公理④（无概念→verbatim）、semanticApproval=false 恒成立、不伪造。'

export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'diwen_map',
    description:
      '将中文文本映射为迪文（Diwen）概念坐标契约：返回 contract{status, words[{span, slots{S1..S7}, root}], uncovered, coverage} 及 mechanical/validation 等。' +
      '公理④：无对应概念的片段 verbatim 如实保留于 uncovered，不就近吞并、不伪造。' +
      'semanticApproval 恒为 false（机器规范通过≠语义正确≠人工批准）。' +
      'model 默认 deterministic（离线确定性基线）；auto/decision 走模型选义（公理②，需可用 provider）。',
    parameters: {
      text: { type: 'string', required: true, description: '待映射的中文文本' },
      model: {
        type: 'string',
        enum: ['auto', 'deterministic', 'decision', 'off'],
        description: "选义模式：'deterministic'（默认，离线确定性）| 'off'（仅机械匹配）| 'decision'/'auto'（模型选义，需可用 provider 与密钥）",
      },
      enhance: { type: 'boolean', description: '是否启用 WSD 增强层（对比定义/few-shot/注记），仅在模型选义路径生效' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => {
        const contract = value && value.contract ? value.contract : {}
        const words = Array.isArray(contract.words) ? contract.words.length : 0
        const uncovered = Array.isArray(contract.uncovered) ? contract.uncovered.length : 0
        const summary =
          `diwen_map status=${contract.status} words=${words} uncovered=${uncovered} ` +
          'semanticApproval=false（机器规范通过≠语义正确≠人工批准；uncovered 为公理④ verbatim 保留，勿伪造）'
        return [{ type: 'text', text: summary + '\n' + JSON.stringify(value) }]
      },
    },
    async execute(args) {
      const r = await diwen.mapChinese(args.text, {
        model: args.model || 'deterministic',
        enhance: args.enhance,
      })
      return lossless(r)   // dsh 要求无损 JSON：剔除 undefined/非有限值，保证 JSON 往返一致
    },
  }))

  ctx.tools.register(defineTool({
    name: 'diwen_describe',
    description:
      '按数字概念 id 查询迪文（Diwen）概念详情：lemma_zh、coord（s3a:s3b）、field、bfo_type、nsm、pinyin、definitions。' +
      'id 可来自 diwen_map 返回的 words[].root.id。ok=false 表示无此概念，须如实报告、不得伪造。semanticApproval 恒为 false。',
    parameters: {
      id: { type: 'number', required: true, description: '迪文概念数字 id（如 diwen_map 返回 words[].root.id）' },
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render: (_args, value) => {
        const head = value && value.ok
          ? `diwen_describe id=${value.id} lemma_zh=${value.lemma_zh} coord=${value.coord} field=${value.field}`
          : `diwen_describe ok=false error=${value ? value.error : 'unknown'}（无此概念，勿伪造详情）`
        return [{ type: 'text', text: head + '\n' + JSON.stringify(value) }]
      },
    },
    async execute(args) {
      return lossless(diwen.describeConcept(args.id))
    },
  }))

  // 可选：宿主提供 skills 服务时注册运行时 skill 'diwen'（content 读 skills/diwen/SKILL.md）。
  // ctx.skills.register 返回 disposer；经 ctx.effect 挂到插件生命周期（dispose 即注销）。
  const skills = ctx.get?.('skills')
  if (skills) {
    const content = readFileSync(new URL('./skills/diwen/SKILL.md', import.meta.url), 'utf8')
    const skill = { name: 'diwen', description: SKILL_DESCRIPTION, source: 'runtime', content }
    if (typeof ctx.effect === 'function') ctx.effect(() => skills.register(skill))
    else skills.register(skill)
  }
}