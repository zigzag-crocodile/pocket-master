import { NextRequest, NextResponse } from 'next/server'
import { detectTaskType, detectSensitiveInfo, buildRouteChain } from '@/lib/routing'
import { getMockResponse } from '@/lib/mock_responses'
import { buildTools, executeTool, TOOL_LABELS, HelperOption, ToolContext } from '@/lib/agentTools'

const LLM_API_KEY = process.env.LLM_API_KEY || process.env.DOUBAO_API_KEY || ''
const LLM_MODEL = process.env.LLM_MODEL || process.env.DOUBAO_MODEL || 'deepseek-chat'
const LLM_BASE_URL = (process.env.LLM_BASE_URL || process.env.DOUBAO_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')

const DEFAULT_HELPERS: HelperOption[] = [
  { id: 'schedule-helper', name: '日程小帮手', description: '整理待办、时间、提醒建议' },
  { id: 'meeting-helper', name: '会议小帮手', description: '会议主题、结论、行动项表格' },
  { id: 'summary-helper', name: '内容总结小帮手', description: '长文本摘要、面试表达、汇报' },
  { id: 'clinic-helper', name: '小诊所小帮手', description: '诊断调度/配置/模型问题' },
]

function buildSystemPrompt(helpers: HelperOption[]): string {
  const list = helpers.map((h) => `- ${h.name}（${h.id}）：${h.description}`).join('\n')
  return `你是「小当家」，一个任务调度助手。你管理着以下已启用的小帮手：
${list}

工作流程：
1. 先调用 route 工具，从上面选出最合适的小帮手，并给出 task_type 和一句话理由。
2. 然后以该小帮手的身份处理任务。
3. 涉及"明天/下周/今天下午"等相对时间时，先调用 get_current_datetime 换算成具体日期再处理。
4. 当用户想把某件事整理成提醒/日程时，调用 create_calendar_event 生成可下载的日历事件文件。
5. 最后用简洁清晰的 Markdown 输出最终结果（不要输出工具调用过程）。

各任务类型的输出要求：
- meeting_task（会议小帮手）：输出 会议主题 / 核心结论 / 行动项表格(事项|负责人|截止时间|状态) / 待确认信息。
- schedule_task（日程小帮手）：整理 事项/建议时间/地点/相关对象/提醒建议；并调用 create_calendar_event 生成日历文件；最后说明"当前版本只生成可导入的日历文件，不会自动写入系统日历"。
- summary_task（内容总结小帮手）：结构化摘要、重点提炼；若用户问面试/简历/项目怎么讲，必须包含「## 我在面试中可以这样讲」章节。
- vision_prompt_task（图文识别小帮手）：只生成 Markdown 形式的图文识别 Prompt，不直接处理图片，并提示"当前版本只生成 Prompt"。
- info_reminder_task（资讯小帮手）：资讯主题 / 三条重点 / 为什么值得关注 / 建议跟进时间 / 后续行动；若有 web_search 工具可用则先搜索。
- repair_task（小诊所小帮手）：输出诊断报告（问题类型 / 问题描述 / 可能原因 / 修复建议 / 是否建议重新测试 / 修复后预期结果）。`
}

async function callLLM(messages: any[], tools: any[]) {
  const res = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM_API_KEY}` },
    body: JSON.stringify({ model: LLM_MODEL, messages, tools, tool_choice: 'auto', temperature: 0.5, max_tokens: 2000 }),
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status} ${body.slice(0, 200)}`)
  }
  return res.json()
}

export async function POST(req: NextRequest) {
  const { input, permissionScope, enabledHelpers } = await req.json()
  if (!input?.trim()) return NextResponse.json({ error: 'empty input' }, { status: 400 })

  const helpers: HelperOption[] = Array.isArray(enabledHelpers) && enabledHelpers.length ? enabledHelpers : DEFAULT_HELPERS

  // 敏感信息检测（权限门，保留轻量关键词+正则）
  const sensitiveTypes = detectSensitiveInfo(input)
  if (sensitiveTypes.length > 0 && !permissionScope) {
    const guess = detectTaskType(input)
    return NextResponse.json({
      needPermission: true,
      sensitiveTypes,
      taskType: guess.type,
      helper: guess.helper,
      helperName: guess.helperName,
      routeChain: buildRouteChain(guess.type, guess.helperName),
    })
  }
  if (permissionScope === 'cancel') return NextResponse.json({ cancelled: true })

  const isMockMode = !LLM_API_KEY || LLM_API_KEY.trim() === ''

  // ── Mock 兜底：无 key 时用关键词路由 + Mock 输出 ──
  if (isMockMode) {
    const { type, helper, helperName } = detectTaskType(input)
    return NextResponse.json({
      output: getMockResponse(type, input),
      taskType: type,
      helper,
      helperName,
      routeChain: buildRouteChain(type, helperName),
      isMock: true,
      errorMessage: null,
      modelUsed: LLM_MODEL,
    })
  }

  // ── 真实 agent：LLM function calling 路由 + 工具调用 ──
  try {
    const tools = buildTools(helpers, !!process.env.SEARCH_API_KEY)
    const ctx: ToolContext = { route: null, toolsUsed: [], artifacts: {}, helpers }
    const messages: any[] = [
      { role: 'system', content: buildSystemPrompt(helpers) },
      { role: 'user', content: input },
    ]

    let finalContent = ''
    for (let i = 0; i < 6; i++) {
      const data = await callLLM(messages, tools)
      const msg = data.choices?.[0]?.message
      if (!msg) throw new Error('empty response')

      if (msg.tool_calls?.length) {
        messages.push(msg)
        for (const tc of msg.tool_calls) {
          let args: any = {}
          try { args = JSON.parse(tc.function?.arguments || '{}') } catch {}
          const result = await executeTool(tc.function?.name, args, ctx)
          messages.push({ role: 'tool', tool_call_id: tc.id, content: result })
        }
        continue
      }
      finalContent = msg.content || ''
      break
    }

    if (!finalContent) finalContent = '小当家已处理，但未生成文字结果，请重试或换个说法。'

    const helperName = ctx.route?.helperName || detectTaskType(input).helperName
    const taskType = ctx.route?.taskType || detectTaskType(input).type
    const helperId = ctx.route?.helperId || detectTaskType(input).helper
    const toolChain = ctx.toolsUsed.filter((t) => t !== 'route').map((t) => TOOL_LABELS[t] || t)
    const routeChain = ['小当家', helperName, ...toolChain]

    return NextResponse.json({
      output: finalContent,
      taskType,
      helper: helperId,
      helperName,
      routeChain,
      isMock: false,
      errorMessage: null,
      modelUsed: LLM_MODEL,
      artifacts: ctx.artifacts,
    })
  } catch (err) {
    // 失败兜底到 Mock
    const { type, helper, helperName } = detectTaskType(input)
    return NextResponse.json({
      output: getMockResponse(type, input),
      taskType: type,
      helper,
      helperName,
      routeChain: buildRouteChain(type, helperName),
      isMock: true,
      errorMessage: err instanceof Error ? err.message : 'unknown error',
      modelUsed: LLM_MODEL,
    })
  }
}
