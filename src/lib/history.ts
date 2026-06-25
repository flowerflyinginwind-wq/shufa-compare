import type { AppSettings } from './settings'
import { imageToDataUrl } from './imageLoad'

const HISTORY_KEY = 'shufa-compare-history'
const MAX_RECORDS = 6

export interface HistoryRecord {
  id: string
  savedAt: number
  label: string
  originalThumb: string
  copyThumb: string
  originalDataUrl: string
  copyDataUrl: string
  settings: AppSettings
}

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as HistoryRecord[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function persistHistory(records: HistoryRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)))
}

export function saveHistoryRecord(
  original: HTMLImageElement,
  copy: HTMLImageElement,
  settings: AppSettings,
  label?: string,
): HistoryRecord {
  const record: HistoryRecord = {
    id: `${Date.now()}`,
    savedAt: Date.now(),
    label: label ?? `对比 ${new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    originalThumb: imageToDataUrl(original, 120, 0.65),
    copyThumb: imageToDataUrl(copy, 120, 0.65),
    originalDataUrl: imageToDataUrl(original, 800, 0.75),
    copyDataUrl: imageToDataUrl(copy, 800, 0.75),
    settings: { ...settings },
  }

  const records = [record, ...loadHistory().filter((r) => r.id !== record.id)]
  persistHistory(records)
  return record
}

export function deleteHistoryRecord(id: string) {
  persistHistory(loadHistory().filter((r) => r.id !== id))
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}
