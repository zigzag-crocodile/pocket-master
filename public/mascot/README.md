# 小当家人物状态图

这里是小当家各状态的人物图，由 `components/CharacterAvatar.tsx` 按状态自动加载。文件名严格按下表，放进本目录即自动生效。

| 文件名 | 对应状态 | 触发时机 |
|---|---|---|
| `idle.png` | 休息中 / 空闲 | 无任务、等待输入 |
| `thinking.png` | 思考中 | 正在理解需求 |
| `routing.png` | 调度中 | 正在挑选小帮手 |
| `running.png` | 执行中 | 小帮手正在处理 |
| `waiting.png` | 等待授权 | 检测到敏感信息、等用户授权 |
| `generating.png` | 生成结果中 | 正在整理最终结果 |
| `completed.png` | 完成 | 任务完成 |
| `error.png` | 失败 | 任务失败 |
| `mock.png` | Mock 模式 | API 未接通、走 Mock |

## 当前素材来源（2026-06-15）
- 来自用户提供的 `status-cards-9-v2.zip`，已自动**裁掉每张上下的标签/文案文字带**，只保留人物（脚本裁剪，白底）。
- ⚠️ v2 素材**没有「生成结果中」单独图**，`generating.png` 暂用 `running.png` 复制顶替；如需独立形象，单独放一张 `generating.png` 覆盖即可。
- v2 里的 `paused（暂停中）` 当前 App 没有对应状态，未使用。

## 规格建议（如需替换/补图）
- 正方形或近正方形，**白底或透明底**均可（状态区是白卡片，白底能无缝融合）
- 若用透明底 PNG，效果在浅色背景上更通用
- 缺某张时，对应状态会自动回退到绿色 SVG 占位（`components/Mascot.tsx`），不会报错
