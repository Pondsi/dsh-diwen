// 迪文（Diwen）DeepSeek Harness（dsh）Cordis 插件 —— 开源壳（open-core）。
// 核心与概念数据闭源，经依赖已发布的 diwen 核心包（npm diwen，含闭源 core + 加密 data.enc）引入；
// 本文件不含闭源实现。注册 diwen_map/diwen_describe 工具 + 运行时 skill + 确定性强制层。
// 许可：允许商用、不可再分发、必须署名作者 Pondsi（见 LICENSE）。
// 插件规范（官方教程）：https://deepseek-harness.github.io/deepseek-harness/develop/basic/tool
import { readFileSync } from 'node:fs'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import * as diwen from 'diwen'

// dsh 工具输出须为无损 JSON（JSON 往返一致）：剔除 undefined 属性、把非有限数转 null。
const lossless = (v) => JSON.parse(JSON.stringify(v, (_k, val) =>
  typeof val === 'number' && !Number.isFinite(val) ? null : val))

// ===== 确定性强制层（dsh 迪文闭环）=====
// 标记：避免对迪文自身投影输出再次投影（防反馈循环）。
const DIWEN_MARK = '[迪文概念坐标]'
const HAS_ZH = /[\u4e00-\u9fff]/

// 从消息/内容块提取纯文本。
function textOf(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n')
}

// 确定性把中文文本投影为迪文概念坐标摘要（deterministic 离线，无需模型/密钥）。
async function projectText(text) {
  if (!text || !HAS_ZH.test(text) || text.includes(DIWEN_MARK)) return null
  try {
    const r = await diwen.mapChinese(text.slice(0, 2000), { model: 'deterministic' })
    const words = (r.contract.words || []).map((w) => {
      const s = w.slots || {}
      return `${w.surface ?? ''}→${s.S3a}:${s.S3b}`
    })
    const unc = (r.contract.uncovered || []).map((u) => `${u.surface}→verbatim`)
    const parts = [...words, ...unc].filter(Boolean).slice(0, 40)
    if (!parts.length) return null
    return `${DIWEN_MARK} ${parts.join('; ')}。semanticApproval=false（机器规范≠语义批准；verbatim 为公理④无概念如实保留，勿伪造）。`
  } catch { return null }
}

const FORCE_INSTRUCTION =
  '迪文（Diwen）确定性概念坐标层已启用：机器间沟通、子代理通讯、知识库确定性内容、上下文摘要须以迪文概念坐标（S3a:S3b）为准。' +
  '中文语义经 diwen_map 映射为概念坐标；迪文→中文用 diwen_describe（唯一释义）。' +
  '公理④：无对应概念如实 verbatim 保留，不伪造。semanticApproval 恒 false（机器规范通过≠语义正确≠人工批准）。' +
  '每步输入与工具结果已附迪文坐标投影，请据此对齐语义，避免自然语歧义。'

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

  // ===== 确定性强制层：systemPrompt 硬指令 + pre-step 输入投影 + post-execute 结果投影 =====
  // 不替换 agent-loop；用原生瀑布 seam 组成闭环。防御性：next() 可能因下游监听器返回 undefined 而得 undefined，
  //   须兜底为合法决策；createUserMessage 由宿主 peer 提供，缺失时退化为_plain user message。
  const mkMsg = (text) => {
    const content = [{ type: 'text', text }]
    const source = { kind: 'user' }   // MessageBase 必需 source（user={kind:'user'}）；缺失会致 loop 读 source.kind 报错
    try { return typeof createUserMessage === 'function' ? createUserMessage({ content, source }) : { role: 'user', content, source, id: 'diwen-' + Math.random().toString(36).slice(2) } }
    catch { return { role: 'user', content, source } }
  }

  // 1) systemPrompt 必需上下文（required:true 抗抑制，每步必在提示词）。
  try {
    ctx.systemPrompt?.context?.({ name: 'diwen-force', order: 50, text: FORCE_INSTRUCTION, required: true, interpolate: false })
  } catch { /* 宿主无 systemPrompt 服务时降级 */ }

  // 2) agent/pre-step 瀑布：透传决策（不修改 decision.messages，避免冻结消息处理差异），
  //    经 agent.inject() 把输入的迪文坐标投影排队为下一步模型可见上下文（文档推荐 seam）。
  try {
    ctx.on?.('agent/pre-step', async (payload, next) => {
      try {
        const text = (payload?.messages || []).map((m) => textOf(m.content)).join('\n')
        const proj = await projectText(text)
        if (proj && typeof payload?.agent?.inject === 'function') payload.agent.inject(mkMsg(proj))
      } catch { /* 投影失败不影响主流程 */ }
      return next()
    })
  } catch { /* 降级 */ }

  // 3) tools/post-execute 瀑布：每个工具结果后确定性追加迪文坐标上下文（additionalContexts）。
  try {
    ctx.on?.('tools/post-execute', async (exec, result, next) => {
      let decision
      try { decision = await next() } catch { decision = undefined }
      if (!decision) decision = { kind: 'accept' }
      if (decision.kind !== 'accept') return decision
      const text = textOf(result?.content) || (typeof result?.value === 'string' ? result.value : '')
      const proj = await projectText(text)
      if (!proj) return decision
      return { ...decision, additionalContexts: [...(decision.additionalContexts || []), mkMsg(proj)] }
    })
  } catch { /* 降级 */ }
}