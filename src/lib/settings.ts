import type { DiffMethod } from '../lib/imageDiff'
import type { TransformState } from './transform'
import { DEFAULT_TRANSFORM } from './transform'
import type { CompareMode, OverlayView } from '../components/ModeToolbar'

const STORAGE_KEY = 'shufa-compare-settings'

export type ZoomMode = 'viewport' | 'copy'

export interface AppSettings {
  transform: TransformState
  zoomMode: ZoomMode
  mode: CompareMode
  overlayView: OverlayView
  opacity: number
  diffThreshold: number
  showGuides: boolean
  enablePreprocess: boolean
  diffMethod: DiffMethod
  enableMagnifier: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  transform: DEFAULT_TRANSFORM,
  zoomMode: 'viewport',
  mode: 'overlay',
  overlayView: 'overlay',
  opacity: 50,
  diffThreshold: 25,
  showGuides: true,
  enablePreprocess: true,
  diffMethod: 'structure',
  enableMagnifier: false,
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Partial<AppSettings>) {
  try {
    const current = loadSettings()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...settings }))
  } catch {
    // ignore
  }
}
