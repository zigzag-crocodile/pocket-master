// 小当家可调用的真实工具（OpenAI 兼容 function calling）
export interface HelperOption {
  id: string
  name: string
  description: string
}

export interface ToolContext {
  route: { helperId: string; helperName: string; taskType: string; reason: string } | null
  toolsUsed: string[]
  artifacts: { ics?: { filename: string; content: string } }
  helpers: HelperOption[]
}

// 工具名 → 路由链上展示的中文
export const TOOL_LABELS: Record<string, string> = {
  route: '调度',
  get_current_datetime: '查询当前时间',
  create_calendar_event: '生成日历事件',
  web_search: '联网搜索',
}

export function buildTools(helpers: HelperOption[], hasSearch: boolean) {
  const ids = helpers.length ? helpers.map((h) => h.id) : ['summary-helper']
  const tools: any[] = [
    {
      type: 'function',
      function: {
        name: 'route',
        description: '理解用户意图，从可用小帮手中选出最合适的一个来处理本次任务。必须在开始处理前先调用一次。',
        parameters: {
          type: 'object',
          properties: {
            helper_id: { type: 'string', enum: ids, description: '选中的小帮手 id' },
            task_type: {
              type: 'string',
              enum: ['schedule_task', 'meeting_task', 'summary_task', 'vision_prompt_task', 'info_reminder_task', 'repair_task'],
              description: '任务类型',
            },
            reason: { type: 'string', description: '一句话说明为什么选它' },
          },
          required: ['helper_id', 'task_type', 'reason'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_current_datetime',
        description: '获取当前的日期和时间。当用户提到"明天/下周/今天下午"等相对时间、需要换算成具体日期时调用。',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_calendar_event',
        description: '为用户生成一个可下载导入的日历事件文件(.ics)。当用户想把某件事整理成提醒/日程时调用。',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '事件标题' },
            start: { type: 'string', description: 'ISO8601 开始时间，例如 2026-06-19T15:00:00' },
            end: { type: 'string', description: 'ISO8601 结束时间，可选' },
            location: { type: 'string', description: '地点，可选' },
            notes: { type: 'string', description: '备注，可选' },
          },
          required: ['title', 'start'],
        },
      },
    },
  ]
  if (hasSearch) {
    tools.push({
      type: 'function',
      function: {
        name: 'web_search',
        description: '联网搜索实时信息（资讯、最新动态等）。',
        parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
      },
    })
  }
  return tools
}

function icsTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  // 使用浮动本地时间，避免时区误差
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function buildIcs(a: { title: string; start: string; end?: string; location?: string; notes?: string }): string {
  const dtStart = icsTime(a.start)
  const dtEnd = a.end ? icsTime(a.end) : icsTime(new Date(new Date(a.start).getTime() + 3600000).toISOString())
  const stamp = icsTime(new Date().toISOString())
  const esc = (s = '') => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//My Pocket Master//CN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@pocketmaster`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${esc(a.title)}`,
    a.location ? `LOCATION:${esc(a.location)}` : '',
    a.notes ? `DESCRIPTION:${esc(a.notes)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(a.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

export async function executeTool(name: string, args: any, ctx: ToolContext): Promise<string> {
  if (!ctx.toolsUsed.includes(name)) ctx.toolsUsed.push(name)
  switch (name) {
    case 'route': {
      const helper = ctx.helpers.find((h) => h.id === args.helper_id)
      ctx.route = { helperId: args.helper_id, helperName: helper?.name || args.helper_id, taskType: args.task_type, reason: args.reason }
      return `已选择「${helper?.name || args.helper_id}」处理。`
    }
    case 'get_current_datetime': {
      const d = new Date()
      return JSON.stringify({ iso: d.toISOString(), readable: d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) })
    }
    case 'create_calendar_event': {
      if (!args.title || !args.start) return '缺少标题或开始时间，无法生成日历事件。'
      const content = buildIcs(args)
      const safe = String(args.title).replace(/[^\w一-龥-]/g, '_').slice(0, 30) || 'event'
      ctx.artifacts.ics = { filename: `${safe}.ics`, content }
      return '已生成日历事件文件(.ics)，结果区可下载并导入到日历。'
    }
    case 'web_search': {
      const key = process.env.SEARCH_API_KEY
      if (!key) return '联网搜索未配置，暂无法获取实时信息。'
      try {
        const proxy = process.env.STT_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY
        const { fetch: uf, ProxyAgent } = await import('undici')
        const r = await uf('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: key, query: args.query, max_results: 5 }),
          signal: AbortSignal.timeout(20000),
          ...(proxy ? { dispatcher: new ProxyAgent(proxy) } : {}),
        } as any)
        const d = (await r.json()) as any
        const items = (d.results || []).map((x: any) => `- ${x.title}: ${x.content?.slice(0, 200)} (${x.url})`).join('\n')
        return items || '没有搜到结果。'
      } catch (e) {
        return '搜索失败：' + (e instanceof Error ? e.message : '未知错误')
      }
    }
    default:
      return '未知工具'
  }
}
