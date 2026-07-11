import type { TransformState } from '../lib/transform'
import { DEFAULT_TRANSFORM } from '../lib/transform'
import type { ZoomMode } from '../lib/settings'

interface TransformControlsProps {
  transform: TransformState
  onChange: (transform: TransformState) => void
  zoomMode: ZoomMode
  onZoomModeChange: (mode: ZoomMode) => void
  disabled?: boolean
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-stone-600">
        <span>{label}</span>
        <span>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-700 disabled:opacity-40"
      />
    </div>
  )
}

export default function TransformControls({
  transform,
  onChange,
  zoomMode,
  onZoomModeChange,
  disabled,
}: TransformControlsProps) {
  const update = (patch: Partial<TransformState>) => {
    onChange({ ...transform, ...patch })
  }

  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-800">对齐调节</h3>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(DEFAULT_TRANSFORM)}
          className="text-xs text-amber-800 hover:text-amber-950 disabled:opacity-40"
        >
          重置
        </button>
      </div>

      <p className="text-xs text-stone-500">
        单指拖动画布可移动临摹层。双指捏合缩放时，可选择整体缩放或仅缩放临摹层。
      </p>

      <div className="flex overflow-hidden rounded-lg border border-stone-200 text-xs">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onZoomModeChange('viewport')}
          className={`flex-1 px-3 py-2 transition-colors ${
            zoomMode === 'viewport'
              ? 'bg-amber-100 font-medium text-amber-900'
              : 'bg-white text-stone-600 hover:bg-stone-50'
          } disabled:opacity-40`}
        >
          整体缩放
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onZoomModeChange('copy')}
          className={`flex-1 border-l border-stone-200 px-3 py-2 transition-colors ${
            zoomMode === 'copy'
              ? 'bg-amber-100 font-medium text-amber-900'
              : 'bg-white text-stone-600 hover:bg-stone-50'
          } disabled:opacity-40`}
        >
          临摹缩放
        </button>
      </div>

      <SliderRow
        label="水平平移"
        value={transform.translateX}
        min={-300}
        max={300}
        step={1}
        unit="px"
        disabled={disabled}
        onChange={(translateX) => update({ translateX })}
      />
      <SliderRow
        label="垂直平移"
        value={transform.translateY}
        min={-300}
        max={300}
        step={1}
        unit="px"
        disabled={disabled}
        onChange={(translateY) => update({ translateY })}
      />
      <SliderRow
        label="临摹缩放"
        value={transform.scale}
        min={0.5}
        max={2}
        step={0.01}
        unit="x"
        disabled={disabled}
        onChange={(scale) => update({ scale })}
      />
      <SliderRow
        label="旋转"
        value={transform.rotation}
        min={-15}
        max={15}
        step={0.1}
        unit="°"
        disabled={disabled}
        onChange={(rotation) => update({ rotation })}
      />
    </div>
  )
}
