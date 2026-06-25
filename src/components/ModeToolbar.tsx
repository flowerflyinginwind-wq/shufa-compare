export type CompareMode = 'overlay' | 'diff'
export type OverlayView = 'overlay' | 'original' | 'copy'

interface ModeToolbarProps {
  mode: CompareMode
  overlayView: OverlayView
  opacity: number
  diffThreshold: number
  disabled?: boolean
  onModeChange: (mode: CompareMode) => void
  onOverlayViewChange: (view: OverlayView) => void
  onOpacityChange: (opacity: number) => void
  onDiffThresholdChange: (threshold: number) => void
}

export default function ModeToolbar({
  mode,
  overlayView,
  opacity,
  diffThreshold,
  disabled,
  onModeChange,
  onOverlayViewChange,
  onOpacityChange,
  onDiffThresholdChange,
}: ModeToolbarProps) {
  return (
    <div className="space-y-4 rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onModeChange('overlay')}
          className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-40 ${
            mode === 'overlay'
              ? 'bg-amber-800 text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          叠加对比
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onModeChange('diff')}
          className={`flex-1 rounded-md px-3 py-2 text-sm transition-colors disabled:opacity-40 ${
            mode === 'diff'
              ? 'bg-amber-800 text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          差异高亮
        </button>
      </div>

      {mode === 'overlay' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(
              [
                ['original', '仅原帖'],
                ['copy', '仅临摹'],
                ['overlay', '叠加'],
              ] as const
            ).map(([view, label]) => (
              <button
                key={view}
                type="button"
                disabled={disabled}
                onClick={() => onOverlayViewChange(view)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors disabled:opacity-40 ${
                  overlayView === view
                    ? 'bg-stone-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {overlayView === 'overlay' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-stone-600">
                <span>临摹透明度</span>
                <span>{opacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={opacity}
                disabled={disabled}
                onChange={(e) => onOpacityChange(Number(e.target.value))}
                className="w-full accent-amber-700 disabled:opacity-40"
              />
            </div>
          )}
        </div>
      )}

      {mode === 'diff' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-stone-600">
            <span>差异敏感度</span>
            <span>{diffThreshold}</span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            step={1}
            value={diffThreshold}
            disabled={disabled}
            onChange={(e) => onDiffThresholdChange(Number(e.target.value))}
            className="w-full accent-amber-700 disabled:opacity-40"
          />
          <p className="text-xs text-stone-500">
            结构模式：蓝=原帖多出 · 红=临摹多出 · 橙=边缘偏差
          </p>
        </div>
      )}
    </div>
  )
}
