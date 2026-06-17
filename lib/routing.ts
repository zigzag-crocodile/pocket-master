export type TaskType =
  | 'schedule_task'
  | 'meeting_task'
  | 'summary_task'
  | 'vision_prompt_task'
  | 'info_reminder_task'
  | 'repair_task'
  | 'unknown'

const rules: { type: TaskType; keywords: string[]; helper: string; helperName: string }[] = [
  {
    type: 'meeting_task',
    keywords: ['会议', '纪要', '行动项', '负责人', '结论', 'meeting notes', '讨论记录'],
    helper: 'meeting-helper',
    helperName: '会议小帮手',
  },
  {
    type: 'schedule_task',
    keywords: ['待办', '日程', '提醒', '明天', '下周', '截止时间', '跟进', '安排', '计划', 'todo', '日历', '面试时间'],
    helper: 'schedule-helper',
    helperName: '日程小帮手',
  },
  {
    type: 'summary_task',
    keywords: ['总结', '摘要', '提炼', '重点', '归纳', '复盘', '改写', '汇报', '面试', '怎么讲', '怎么说', '简历'],
    helper: 'summary-helper',
    helperName: '内容总结小帮手',
  },
  {
    type: 'vision_prompt_task',
    keywords: ['图片', '截图', '识图', 'OCR', '图文识别', '看图', '多模态', 'prompt'],
    helper: 'vision-prompt-helper',
    helperName: '图文识别小帮手',
  },
  {
    type: 'info_reminder_task',
    keywords: ['资讯', '新闻', '动态', '提醒我关注', '跟踪', '行业消息', 'remind'],
    helper: 'info-reminder-helper',
    helperName: '资讯小帮手',
  },
  {
    type: 'repair_task',
    keywords: ['调度错了', '结果不准', 'API 失败', '配置异常', '测试失败', '执行失败', '诊断'],
    helper: 'clinic-helper',
    helperName: '小诊所小帮手',
  },
]

export function detectTaskType(input: string): { type: TaskType; helper: string; helperName: string } {
  for (const rule of rules) {
    if (rule.keywords.some((kw) => input.includes(kw))) {
      return { type: rule.type, helper: rule.helper, helperName: rule.helperName }
    }
  }
  return { type: 'summary_task', helper: 'summary-helper', helperName: '内容总结小帮手' }
}

const SENSITIVE_PATTERNS: { type: string; patterns: RegExp[] }[] = [
  { type: 'private_schedule', patterns: [/面试/, /日程/, /约会/, /私人/, /医院/, /体检/] },
  { type: 'company_secret', patterns: [/公司机密/, /内部会议/, /保密/, /商业秘密/] },
  { type: 'finance', patterns: [/银行卡/, /财务/, /工资/, /收入/, /税/] },
  { type: 'identity', patterns: [/身份证/, /护照/, /证件号/] },
  { type: 'contact', patterns: [/手机号/, /\d{11}/, /邮箱.{0,5}@/] },
  { type: 'health', patterns: [/病历/, /诊断/, /医疗/, /药/] },
]

export function detectSensitiveInfo(input: string): string[] {
  const found: string[] = []
  for (const { type, patterns } of SENSITIVE_PATTERNS) {
    if (patterns.some((p) => p.test(input))) found.push(type)
  }
  return found
}

export function buildRouteChain(taskType: TaskType, helperName: string): string[] {
  const skillMap: Record<TaskType, string[]> = {
    schedule_task: ['小当家', helperName, 'ReminderSuggestionSkill', 'MarkdownExportTool'],
    meeting_task: ['小当家', helperName, 'MeetingMarkdownSkill', 'MarkdownExportTool'],
    summary_task: ['小当家', helperName, 'InterviewNarrativeSkill'],
    vision_prompt_task: ['小当家', helperName, 'VisionPromptSkill'],
    info_reminder_task: ['小当家', helperName, 'InfoReminderSkill'],
    repair_task: ['小当家', helperName, 'RoutingDiagnosisSkill', 'RepairReportSkill'],
    unknown: ['小当家', helperName],
  }
  return skillMap[taskType] || ['小当家', helperName]
}
