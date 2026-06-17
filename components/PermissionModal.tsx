'use client'

const RISK_LABELS: Record<string, string> = {
  private_schedule: '私人日程',
  company_secret: '公司机密',
  finance: '财务信息',
  identity: '身份证件',
  contact: '联系方式',
  health: '医疗健康信息',
  image_privacy: '隐私图片',
}

const OPTIONS = [
  { label: '仅本次任务允许处理', value: 'allow_once', desc: '当前任务可发送给模型处理，按日志规则保存', tone: 'brand' },
  { label: '仅允许摘要处理', value: 'summary_only', desc: '只允许生成摘要，不输出敏感原文', tone: 'plain' },
  { label: '不允许存储', value: 'no_storage', desc: '可处理，但不保存原始输入', tone: 'plain' },
  { label: '取消任务', value: 'cancel', desc: '中断任务，不调用模型', tone: 'cancel' },
]

interface Props {
  sensitiveTypes: string[]
  onChoose: (scope: string) => void
}

export default function PermissionModal({ sensitiveTypes, onChoose }: Props) {
  const labels = sensitiveTypes.map((t) => RISK_LABELS[t] || t).join('、')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: 'rgba(53,56,47,0.32)', backdropFilter: 'blur(3px)' }}>
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-lift p-5 pop-in">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="flex items-center justify-center w-9 h-9 rounded-full text-warn text-lg" style={{ background: '#faf0e2' }}>
            🔒
          </span>
          <div className="text-[15px] font-semibold text-ink">需要你的授权</div>
        </div>
        <p className="text-[13px] text-sub mb-4 leading-relaxed">
          系统检测到该任务可能包含敏感信息（<span className="text-warn font-medium">{labels}</span>）。请选择允许的处理范围：
        </p>
        <div className="space-y-2">
          {OPTIONS.map((opt) => {
            const isCancel = opt.tone === 'cancel'
            const isBrand = opt.tone === 'brand'
            return (
              <button
                key={opt.value}
                onClick={() => onChoose(opt.value)}
                className="w-full text-left px-3.5 py-2.5 rounded-2xl transition-all duration-150 border"
                style={{
                  borderColor: isBrand ? '#dde9cf' : '#edefe7',
                  background: isBrand ? '#f5f8f0' : '#ffffff',
                }}
              >
                <div className="text-[13px] font-medium" style={{ color: isCancel ? '#e07a6a' : isBrand ? '#6b8a48' : '#34382f' }}>
                  {opt.label}
                </div>
                <div className="text-[11.5px] text-sub mt-0.5">{opt.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
