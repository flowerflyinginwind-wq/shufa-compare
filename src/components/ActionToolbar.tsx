interface ActionToolbarProps {
  disabled?: boolean
  autoAligning?: boolean
  showGuides: boolean
  enableMagnifier: boolean
  onAutoAlign: () => void
  onExport: () => void
  onToggleGuides: () => void
  onToggleMagnifier: () => void
}

export default function ActionToolbar({
  disabled,
  autoAligning,
  showGuides,
  enableMagnifier,
  onAutoAlign,
  onExport,
  onToggleGuides,
  onToggleMagnifier,
}: ActionToolbarProps) {
  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-medium text-stone-800">快捷操作</h3>

      <button
        type="button"
        disabled={disabled || autoAligning}
        onClick={onAutoAlign}
        className="w-full rounded-md bg-amber-800 px-3 py-2 text-sm text-white hover:bg-amber-900 disabled:opacity-40"
      >
        {autoAligning ? '正在自动对齐...' : '自动初对齐'}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={onExport}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-40"
      >
        导出对比图 PNG
      </button>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={showGuides}
          disabled={disabled}
          onChange={onToggleGuides}
          className="accent-amber-700"
        />
        显示对齐辅助线
      </label>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={enableMagnifier}
          disabled={disabled}
          onChange={onToggleMagnifier}
          className="accent-amber-700"
        />
        局部放大镜（悬停查看）
      </label>

      <p className="text-xs text-stone-500">
        拖拽对齐临摹 · 开启放大镜后移动鼠标细看笔画
      </p>
    </div>
  )
}
