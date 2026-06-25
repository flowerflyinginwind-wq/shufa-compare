import type { TransformState } from '../lib/transform'
import { DEFAULT_TRANSFORM } from '../lib/transform'

interface TransformControlsProps {
  transform: TransformState
  onChange: (transform: TransformState) => void
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
        可在右侧画布直接拖拽移动、滚轮缩放；滑块用于精细调节
      </p>

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
        label="缩放"
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
