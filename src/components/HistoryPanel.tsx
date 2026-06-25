import { useEffect, useState } from 'react'
import {
  clearHistory,
  deleteHistoryRecord,
  loadHistory,
  saveHistoryRecord,
  type HistoryRecord,
} from '../lib/history'
import type { AppSettings } from '../lib/settings'

interface HistoryPanelProps {
  disabled?: boolean
  original: HTMLImageElement | null
  copy: HTMLImageElement | null
  settings: AppSettings
  onRestore: (record: HistoryRecord) => void
}

export default function HistoryPanel({
  disabled,
  original,
  copy,
  settings,
  onRestore,
}: HistoryPanelProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([])

  const refresh = () => setRecords(loadHistory())

  useEffect(() => {
    refresh()
  }, [])

  const handleSave = () => {
    if (!original || !copy) return
    saveHistoryRecord(original, copy, settings)
    refresh()
  }

  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-stone-800">历史记录</h3>
        {records.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearHistory()
              refresh()
            }}
            className="text-xs text-stone-500 hover:text-red-600"
          >
            清空
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={handleSave}
        className="w-full rounded-md border border-amber-700 bg-amber-50 py-2 text-sm text-amber-900 hover:bg-amber-100 disabled:opacity-40"
      >
        保存当前对比
      </button>

      {records.length === 0 ? (
        <p className="text-xs text-stone-500">暂无记录，保存后可快速恢复同一字帖练习</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {records.map((record) => (
            <li
              key={record.id}
              className="flex items-center gap-2 rounded-md border border-stone-100 bg-stone-50 p-2"
            >
              <div className="flex shrink-0 gap-1">
                <img src={record.originalThumb} alt="原帖" className="h-10 w-10 rounded object-cover" />
                <img src={record.copyThumb} alt="临摹" className="h-10 w-10 rounded object-cover" />
              </div>
              <button
                type="button"
                onClick={() => onRestore(record)}
                className="min-w-0 flex-1 text-left text-xs text-stone-700 hover:text-amber-900"
              >
                {record.label}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteHistoryRecord(record.id)
                  refresh()
                }}
                className="shrink-0 text-xs text-stone-400 hover:text-red-600"
              >
                删
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
