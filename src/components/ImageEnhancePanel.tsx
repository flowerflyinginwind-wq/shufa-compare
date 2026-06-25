import type { DiffMethod } from '../lib/imageDiff'

interface ImageEnhancePanelProps {
  disabled?: boolean
  enablePreprocess: boolean
  diffMethod: DiffMethod
  onPreprocessChange: (enabled: boolean) => void
  onDiffMethodChange: (method: DiffMethod) => void
}

export default function ImageEnhancePanel({
  disabled,
  enablePreprocess,
  diffMethod,
  onPreprocessChange,
  onDiffMethodChange,
}: ImageEnhancePanelProps) {
  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-medium text-stone-800">图像增强</h3>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={enablePreprocess}
          disabled={disabled}
          onChange={(e) => onPreprocessChange(e.target.checked)}
          className="accent-amber-700"
        />
        上传后自动增强
      </label>
      <p className="text-xs text-stone-500">
        去阴影、提升对比度、轻微去噪，减少手机拍照干扰
      </p>

      <div className="space-y-1">
        <span className="text-xs text-stone-600">差异算法</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDiffMethodChange('structure')}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs ${
              diffMethod === 'structure'
                ? 'bg-amber-800 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            结构比对
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onDiffMethodChange('pixel')}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs ${
              diffMethod === 'pixel'
                ? 'bg-amber-800 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            像素比对
          </button>
        </div>
        <p className="text-xs text-stone-500">
          {diffMethod === 'structure'
            ? '笔画二值化 + 边缘检测，更适合书法'
            : '传统灰度像素差分，对光照变化较敏感'}
        </p>
      </div>
    </div>
  )
}
