import { NextRequest, NextResponse } from 'next/server'
import { detectTaskType, detectSensitiveInfo, buildRouteChain } from '@/lib/routing'
import { getMockResponse } from '@/lib/mock_responses'

// 通用 OpenAI 兼容模型层：DeepSeek / Doubao / Kimi / 智谱 GLM / 通义千问 等都支持。
// 只需在 .env.local 配置三项即可切换，无需改代码。向后兼容旧的 DOUBAO_* 变量。
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.DOUBAO_API_KEY || ''
const LLM_MODEL = process.env.LLM_MODEL || process.env.DOUBAO_MODEL || 'deepseek-chat'
const LLM_BASE_URL = (process.env.LLM_BASE_URL || process.env.DOUBAO_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')

function buildSystemPrompt(taskType: string, helperName: string): string {
  const prompts: Record<string, string> = {
    meeting_task: `你是${helperName}，一个专业的会议纪要整理助手。请把用户输入的会议内容整理成结构化纪要，包含：会议主题、核心结论、行动项表格（事项|负责人|截止时间|状态）、待确认信息。用 Markdown 格式输出。`,
    schedule_task: `你是${helperName}，一个专业的日程整理助手。请把用户输入整理成待办事项，包含：事项、建议时间、地点、相关对象、提醒建议。必须在最后加上：当前版本仅生成提醒建议，暂不直接写入系统日历。用 Markdown 格式输出。`,
    summary_task: `你是${helperName}，一个专业的内容总结助手。请把用户输入整理成结构化摘要。如果用户问面试如何表达项目，必须包含"## 我在面试中可以这样讲"章节。用 Markdown 格式输出。`,
    vision_prompt_task: `你是${helperName}，负责生成图文识别 Prompt。第一版只生成 Prompt，不直接处理图片。请根据用户描述生成可复用的 Markdown Prompt。必须提示：当前版本只生成 Prompt，不直接处理图片。`,
    info_reminder_task: `你是${helperName}，负责整理资讯内容。请整理出：资讯主题、三条重点、为什么值得关注、建议跟进时间、后续行动建议。注意：不主动联网，不保证时效性。用 Markdown 格式输出。`,
    repair_task: `你是${helperName}，一个系统诊断助手。请按照标准格式输出诊断报告：问题类型、问题描述、可能原因（3条）、修复建议（3条）、是否建议重新测试、修复后预期结果。用 Markdown 格式输出。`,
  }
  return prompts[taskType] || `你是${helperName}，请帮助处理用户的任务。用 Markdown 格式输出结果。`
}

export async function POST(req: NextRequest) {
  const { input, permissionScope } = await req.json()

  if (!input?.trim()) {
    return NextResponse.json({ error: 'empty input' }, { status: 400 })
  }

  const { type: taskType, helper, helperName } = detectTaskType(input)
  const sensitiveTypes = detectSensitiveInfo(input)
  const routeChain = buildRouteChain(taskType, helperName)

  const needPermission = sensitiveTypes.length > 0 && !permissionScope
  if (needPermission) {
    return NextResponse.json({
      needPermission: true,
      sensitiveTypes,
      taskType,
      helper,
      helperName,
      routeChain,
    })
  }

  if (permissionScope === 'cancel') {
    return NextResponse.json({ cancelled: true })
  }

  const isMockMode = !LLM_API_KEY || LLM_API_KEY.trim() === ''
  let output: string
  let errorMessage: string | null = null
  let actuallyMock = isMockMode

  if (!isMockMode) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: buildSystemPrompt(taskType, helperName) },
            { role: 'user', content: input },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`API ${response.status} ${body.slice(0, 200)}`)
      }

      const data = await response.json()
      output = data.choices?.[0]?.message?.content

      if (!output) throw new Error('empty response')
    } catch (err) {
      actuallyMock = true
      errorMessage = err instanceof Error ? err.message : 'unknown error'
      output = getMockResponse(taskType, input)
    }
  } else {
    output = getMockResponse(taskType, input)
  }

  return NextResponse.json({
    output,
    taskType,
    helper,
    helperName,
    routeChain,
    isMock: actuallyMock,
    errorMessage,
    modelUsed: LLM_MODEL,
  })
}
