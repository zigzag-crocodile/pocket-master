export const mockData = {
  meta: {
    product_name: "My Pocket Master",
    chinese_name: "随身小当家",
    version: "v1.0-mock",
    is_mock: true,
    mock_notice: "API没接上，先用 Mock 模式帮你跑完整流程。",
  },
  current_user: {
    id: "user_demo_001",
    email: "demo@mypocketmaster.app",
    display_name: "Demo User",
  },
  marketplace_templates: [
    {
      id: "schedule-helper",
      name: "日程小帮手",
      category: "生活事务",
      description: "把零散事务整理成待办、时间安排和提醒建议。",
      scenarios: ["待办整理", "提醒建议", "时间提取", "日程文本结构化"],
      required_permissions: ["private_schedule"],
      rating: 4.7,
      call_count: 1328,
      official_recommended: true,
      install_status: "installed",
    },
    {
      id: "meeting-helper",
      name: "会议小帮手",
      category: "效率办公",
      description: "把会议记录整理成主题、结论、行动项和负责人表格。",
      scenarios: ["会议纪要", "行动项提取", "负责人整理", "待确认事项"],
      required_permissions: ["private_schedule", "company_secret"],
      rating: 4.9,
      call_count: 2461,
      official_recommended: true,
      install_status: "installed",
    },
    {
      id: "summary-helper",
      name: "内容总结小帮手",
      category: "学习总结",
      description: "把长文本整理成重点、结构、摘要和可复用表达。",
      scenarios: ["长文本摘要", "面试表达", "汇报稿", "项目复盘"],
      required_permissions: [],
      rating: 4.8,
      call_count: 3190,
      official_recommended: true,
      install_status: "installed",
    },
    {
      id: "vision-prompt-helper",
      name: "图文识别小帮手",
      category: "内容创作",
      description: "第一版不直接识图，负责生成图文识别、OCR、多模态理解 Prompt。",
      scenarios: ["截图识别", "OCR Prompt", "图片总结 Prompt", "隐私图片提醒"],
      required_permissions: ["image_privacy"],
      rating: 4.5,
      call_count: 886,
      official_recommended: true,
      install_status: "not_installed",
    },
    {
      id: "info-reminder-helper",
      name: "资讯小帮手",
      category: "生活事务",
      description: "把资讯、行业动态整理成关注理由和后续建议。",
      scenarios: ["资讯摘要", "动态跟进", "关注理由", "行动建议"],
      required_permissions: [],
      rating: 4.6,
      call_count: 1072,
      official_recommended: false,
      install_status: "not_installed",
    },
    {
      id: "clinic-helper",
      name: "小诊所小帮手",
      category: "系统内置",
      description: "诊断小当家调度错误、小帮手配置异常和 API 调用失败。",
      scenarios: ["调度错误诊断", "配置异常修复", "模型失败诊断", "复测建议"],
      required_permissions: [],
      rating: 4.9,
      call_count: 642,
      official_recommended: true,
      install_status: "installed",
    },
  ],
  installed_subagents: [
    {
      id: "schedule-helper",
      name: "日程小帮手",
      category: "生活事务",
      description: "把零散事务整理成待办、时间安排和提醒建议。",
      status: "enabled",
      is_enabled: true,
      required_permissions: ["private_schedule"],
      last_called_at: "2026-06-01T19:27:55.504806+00:00",
      last_test_result: {
        status: "passed",
        test_input: "帮我把明天下午三点面试这件事整理成提醒。",
        summary: "已正确输出事项、建议时间、提醒建议，并声明当前版本不写入系统日历。",
        tested_at: "2026-05-31T20:07:55.504806+00:00",
      },
      configs: {
        "AGENTS.md": {
          frontend_note: "这个小帮手的工作说明书，说明它如何被小当家调度。",
          content: "当 task_type 为 schedule_task 时可被调度。负责提取事项、时间、地点、对象，并生成提醒建议。第一版不真实写入系统日历。",
        },
        "IDENTITY.md": {
          frontend_note: "这个小帮手的身份牌，说明它是谁、负责什么。",
          content: "日程小帮手负责将用户输入的零散事务整理成清楚的待办事项和提醒建议。",
        },
        "SOUL.md": {
          frontend_note: "这个小帮手的性格卡，说明它的表达风格和行为边界。",
          content: "清楚、简短、像一个会整理事情的小秘书。不说已创建提醒，只说已生成提醒建议。",
        },
        "MEMORY.md": {
          frontend_note: "这个小帮手的小账本，记录它需要记住的偏好、规则和历史信息。",
          content: "第一版不接入真实日历 API。用户选择不允许存储时，不保存原始日程文本。",
        },
        "SKILLS.md": {
          frontend_note: "这个小帮手会使用哪些 Skill。",
          content: "TimeExtractionSkill、TodoStructuringSkill、ReminderSuggestionSkill、MarkdownTodoSkill",
        },
        "TOOLS.md": {
          frontend_note: "这个小帮手能调用哪些 Tool。",
          content: "MarkdownExportTool、JsonExportTool、PermissionCheckTool、TaskLogTool",
        },
      },
    },
    {
      id: "meeting-helper",
      name: "会议小帮手",
      category: "效率办公",
      description: "把会议记录整理成主题、结论、行动项和负责人表格。",
      status: "enabled",
      is_enabled: true,
      required_permissions: ["private_schedule", "company_secret"],
      last_called_at: "2026-06-01T19:49:55.504806+00:00",
      last_test_result: {
        status: "passed",
        test_input: "今天讨论 My Pocket Master 第一版，小王负责接口，小李负责页面，周五前完成。",
        summary: "已输出会议主题、核心结论、行动项表格，并识别负责人和截止时间。",
        tested_at: "2026-05-31T20:25:55.504806+00:00",
      },
      configs: {
        "AGENTS.md": {
          frontend_note: "这个小帮手的工作说明书，说明它如何被小当家调度。",
          content: "当 task_type 为 meeting_task 时可被调度。负责会议主题识别、结论提炼、行动项提取、负责人和截止时间识别。",
        },
        "IDENTITY.md": {
          frontend_note: "这个小帮手的身份牌，说明它是谁、负责什么。",
          content: "会议小帮手负责把散乱会议内容整理为可执行纪要。",
        },
        "SOUL.md": {
          frontend_note: "这个小帮手的性格卡，说明它的表达风格和行为边界。",
          content: "冷静、靠谱，结论在前，行动项必须表格化。缺失信息标记待确认。",
        },
        "MEMORY.md": {
          frontend_note: "这个小帮手的小账本，记录它需要记住的偏好、规则和历史信息。",
          content: "会议纪要必须包含主题、结论、行动项。涉及公司机密时触发权限确认。",
        },
        "SKILLS.md": {
          frontend_note: "这个小帮手会使用哪些 Skill。",
          content: "MeetingTopicSkill、DecisionExtractionSkill、ActionItemExtractionSkill、OwnerDeadlineExtractionSkill、MeetingMarkdownSkill",
        },
        "TOOLS.md": {
          frontend_note: "这个小帮手能调用哪些 Tool。",
          content: "MarkdownExportTool、JsonExportTool、PermissionCheckTool、TaskLogTool",
        },
      },
    },
    {
      id: "summary-helper",
      name: "内容总结小帮手",
      category: "学习总结",
      description: "把长文本整理成重点、结构、摘要和可复用表达。",
      status: "enabled",
      is_enabled: true,
      required_permissions: [],
      last_called_at: "2026-06-01T19:58:55.504806+00:00",
      last_test_result: {
        status: "passed",
        test_input: "面试里怎么讲 My Pocket Master 这个项目？",
        summary: "已输出面试讲述版本，强调小当家调度、小帮手配置、小诊所和当家账本。",
        tested_at: "2026-05-31T20:39:55.504806+00:00",
      },
      configs: {
        "AGENTS.md": {
          frontend_note: "这个小帮手的工作说明书，说明它如何被小当家调度。",
          content: "当 task_type 为 summary_task 时可被调度。负责摘要、重点提炼、结构整理、面试表达与汇报稿。",
        },
        "IDENTITY.md": {
          frontend_note: "这个小帮手的身份牌，说明它是谁、负责什么。",
          content: "内容总结小帮手负责将长文本、碎片内容和项目资料整理成清晰、可复用、可表达的内容。",
        },
        "SOUL.md": {
          frontend_note: "这个小帮手的性格卡，说明它的表达风格和行为边界。",
          content: "清晰、锋利、有产品感。少空话，多结构，重点前置。",
        },
        "MEMORY.md": {
          frontend_note: "这个小帮手的小账本，记录它需要记住的偏好、规则和历史信息。",
          content: "面试表达要突出产品能力、业务理解、指标意识和落地能力。缺失事实标注待补充。",
        },
        "SKILLS.md": {
          frontend_note: "这个小帮手会使用哪些 Skill。",
          content: "KeyPointExtractionSkill、StructureRewriteSkill、InterviewNarrativeSkill、MarkdownSummarySkill、ActionSuggestionSkill",
        },
        "TOOLS.md": {
          frontend_note: "这个小帮手能调用哪些 Tool。",
          content: "MarkdownExportTool、JsonExportTool、CopyResultTool、TaskLogTool",
        },
      },
    },
    {
      id: "clinic-helper",
      name: "小诊所小帮手",
      category: "系统内置",
      description: "诊断调度错误、配置异常和模型失败。",
      status: "enabled",
      is_enabled: true,
      required_permissions: [],
      last_called_at: "2026-06-02T19:51:55.504806+00:00",
      last_test_result: {
        status: "passed",
        test_input: "会议任务调用了日程小帮手。",
        summary: "已识别 routing_error，并给出检查会议小帮手启用状态与调度关键词的建议。",
        tested_at: "2026-05-31T20:49:55.504806+00:00",
      },
      configs: {
        "AGENTS.md": {
          frontend_note: "这个小帮手的工作说明书，说明它如何被小当家调度。",
          content: "当 task_type 为 repair_task 或系统出现调度错误、配置异常、模型失败时自动调用。",
        },
        "IDENTITY.md": {
          frontend_note: "这个小帮手的身份牌，说明它是谁、负责什么。",
          content: "小诊所小帮手是修理室内部诊断小帮手，负责发现、解释和修复 Agent 系统中的问题。",
        },
        "SOUL.md": {
          frontend_note: "这个小帮手的性格卡，说明它的表达风格和行为边界。",
          content: "像一个冷静的系统医生：先说明问题类型，再说明可能原因，然后给出可执行修复建议。",
        },
        "MEMORY.md": {
          frontend_note: "这个小帮手的小账本，记录它需要记住的偏好、规则和历史信息。",
          content: "API 失败必须标记 Mock 模式。未测试小帮手不能启用。修复后必须重新测试。",
        },
        "SKILLS.md": {
          frontend_note: "这个小帮手会使用哪些 Skill。",
          content: "RoutingDiagnosisSkill、ConfigValidationSkill、ModelFailureDiagnosisSkill、AutoFixSuggestionSkill、RetestPlanSkill、RepairReportSkill",
        },
        "TOOLS.md": {
          frontend_note: "这个小帮手能调用哪些 Tool。",
          content: "RepairLogTool、ConfigDiffTool、RetestSubAgentTool、MockModeFlagTool、TaskLogTool",
        },
      },
    },
  ],
  repair_logs: [
    {
      id: "repair_demo_001",
      run_id: "run_demo_004",
      issue_type: "model_error",
      issue_type_text: "模型失败",
      diagnosis: "Doubao API 调用超时，系统已切换至 Mock 模式。当前演示流程完整，但真实模型链路未成功返回。",
      suggestion: "检查 DOUBAO_API_KEY、DOUBAO_MODEL、网络状态和后端超时设置。修复后重新测试内容总结小帮手。",
      can_auto_fix: false,
      fixed: false,
      created_at: "2026-06-02T19:52:55.504806+00:00",
    },
    {
      id: "repair_demo_002",
      run_id: "run_demo_005",
      issue_type: "routing_error",
      issue_type_text: "调度错误",
      diagnosis: "用户输入包含会议整理意图，但系统命中了日程关键词，误调用日程小帮手。",
      suggestion: "提高 meeting_task 中「会议、纪要、行动项、负责人」的关键词权重；检查会议小帮手是否启用；重新测试小当家调度链路。",
      can_auto_fix: true,
      fixed_config_preview: "将 meeting_task 关键词权重提升，并在 RoutingSkill 中增加：若同时出现「会议」和「行动项」，优先调度会议小帮手。",
      fixed: true,
      created_at: "2026-06-01T19:59:55.504806+00:00",
    },
  ],
  ledger_metrics: {
    total_tasks: 24,
    completed_tasks: 21,
    mock_tasks: 2,
    metrics: [
      { name: "任务完成率", value: 0.875, display: "87.5%", formula: "成功完成任务数 / 总任务数" },
      { name: "调度成功率", value: 0.9565, display: "95.7%", formula: "用户未反馈调度错误的任务数 / 已调度任务数" },
      { name: "模型调用成功率", value: 0.9091, display: "90.9%", formula: "模型成功返回次数 / 模型调用总次数" },
      { name: "Mock 模式触发率", value: 0.0833, display: "8.3%", formula: "Mock 模式任务数 / 总任务数" },
      { name: "小帮手启用率", value: 1.0, display: "100%", formula: "已启用小帮手数 / 已安装小帮手数" },
      { name: "小诊所解决率", value: 0.6667, display: "66.7%", formula: "已修复问题数 / 进入小诊所的问题数" },
      { name: "导出率", value: 0.4286, display: "42.9%", formula: "发生导出行为的任务数 / 成功完成任务数" },
    ],
  },
  authorization_options: [
    { label: "仅本次任务允许处理", value: "allow_once", behavior: "当前任务可发送给模型处理，按日志规则保存" },
    { label: "仅允许摘要处理", value: "summary_only", behavior: "只允许生成摘要，不输出敏感原文" },
    { label: "不允许存储", value: "no_storage", behavior: "可处理，但不保存原始输入" },
    { label: "取消任务", value: "cancel", behavior: "中断任务，不调用模型" },
  ],
}

export interface ConfigFile {
  frontend_note: string
  content: string
}

export interface SubAgent {
  id: string
  user_id?: string
  name: string
  category: string
  description: string
  status: string
  is_enabled: boolean
  required_permissions: string[]
  last_called_at: string
  last_test_result: {
    status: string
    test_input: string
    summary: string
    tested_at: string
  }
  configs: Record<string, ConfigFile>
}

export interface MarketplaceTemplate {
  id: string
  name: string
  category: string
  description: string
  scenarios: string[]
  required_permissions: string[]
  rating: number
  call_count: number
  official_recommended: boolean
  install_status: string
}

export interface RepairLog {
  id: string
  user_id?: string
  run_id: string
  issue_type: string
  issue_type_text: string
  diagnosis: string
  suggestion: string
  can_auto_fix: boolean
  fixed: boolean
  fixed_config_preview?: string
  created_at: string
}

export interface Metric {
  name: string
  value: number
  display: string
  formula: string
}
