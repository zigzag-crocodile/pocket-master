'use client'
import { useState } from 'react'
import { MarketplaceTemplate, mockData } from '@/data/mock_data'

const CATEGORIES = ['全部', '效率办公', '学习总结', '生活事务', '内容创作', '数据分析', '系统内置']

const CATEGORY_EMOJI: Record<string, string> = {
  生活事务: '🗓️',
  效率办公: '📋',
  学习总结: '📚',
  内容创作: '🎨',
  数据分析: '📊',
  系统内置: '🩺',
}

interface Props {
  installedIds: string[]
  onInstall: (template: MarketplaceTemplate) => void
}

export default function MarketplacePanel({ installedIds, onInstall }: Props) {
  const [category, setCategory] = useState('全部')
  const [search, setSearch] = useState('')

  const templates = mockData.marketplace_templates.filter((t) => {
    const matchCat = category === '全部' || t.category === category
    const matchSearch = !search || t.name.includes(search) || t.description.includes(search)
    return matchCat && matchSearch
  })

  return (
    <div className="px-4 py-4">
      {/* search */}
      <div className="flex items-center gap-2 px-4 py-2.5 mb-3 bg-card rounded-full shadow-card">
        <span className="text-faint">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索小帮手名称或功能"
          className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      {/* category */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="text-[12.5px] px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors"
            style={{
              background: category === cat ? '#7d9c57' : '#ffffff',
              color: category === cat ? '#ffffff' : '#969a8c',
              boxShadow: category === cat ? '0 5px 14px rgba(125,156,87,0.25)' : '0 1px 3px rgba(53,56,47,0.04)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* cards */}
      <div className="space-y-3">
        {templates.map((t) => {
          const isInstalled = installedIds.includes(t.id)
          return (
            <div key={t.id} className="bg-card rounded-2xl shadow-card p-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: '#f5f8f0' }}>
                  {CATEGORY_EMOJI[t.category] || '🤖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-ink">{t.name}</span>
                    {t.official_recommended && (
                      <span className="text-[10.5px] px-1.5 py-0.5 rounded-full text-brand-deep font-medium" style={{ background: '#eef4e6' }}>官方推荐</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-sub">
                    <span className="text-warn">★ {t.rating}</span>
                    <span>·</span>
                    <span>{t.call_count.toLocaleString()} 次调用</span>
                  </div>
                </div>
              </div>

              <p className="text-[12.5px] text-sub mt-2.5 leading-relaxed">{t.description}</p>

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {t.scenarios.map((s) => (
                  <span key={s} className="text-[11px] px-2 py-0.5 rounded-full text-sub" style={{ background: '#f0f2eb' }}>
                    {s}
                  </span>
                ))}
              </div>

              {t.required_permissions.length > 0 && (
                <div className="text-[11.5px] text-warn mt-2">需要权限：{t.required_permissions.join('、')}</div>
              )}

              <button
                onClick={() => !isInstalled && onInstall(t)}
                disabled={isInstalled}
                className="mt-3 w-full text-[13px] font-medium py-2 rounded-full transition-all"
                style={{
                  background: isInstalled ? '#f0f2eb' : '#7d9c57',
                  color: isInstalled ? '#969a8c' : '#ffffff',
                  boxShadow: isInstalled ? 'none' : '0 6px 16px rgba(125,156,87,0.28)',
                  cursor: isInstalled ? 'default' : 'pointer',
                }}
              >
                {isInstalled ? '✓ 已安装' : '安装到我的小帮手'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
