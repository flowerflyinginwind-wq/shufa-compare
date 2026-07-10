import { useCallback, useEffect, useRef, useState } from 'react'
import ActionToolbar from './components/ActionToolbar'
import ComparisonCanvas, { type ComparisonCanvasHandle } from './components/ComparisonCanvas'
import HistoryPanel from './components/HistoryPanel'
import ImageEnhancePanel from './components/ImageEnhancePanel'
import ImageUpload from './components/ImageUpload'
import ModeToolbar from './components/ModeToolbar'
import type { CompareMode, OverlayView } from './components/ModeToolbar'
import TransformControls from './components/TransformControls'
import { estimateAutoAlign } from './lib/autoAlign'
import type { HistoryRecord } from './lib/history'
import { saveHistoryRecord } from './lib/history'
import type { DiffMethod } from './lib/imageDiff'
import { loadImageFromDataUrl } from './lib/imageLoad'
import { loadSettings, saveSettings } from './lib/settings'
import { DEFAULT_TRANSFORM } from './lib/transform'
import type { TransformState } from './lib/transform'
import { APP_VERSION } from './lib/appVersion'
import { isTouchDevice } from './lib/device'

export default function App() {
  const initial = loadSettings()
  const canvasRef = useRef<ComparisonCanvasHandle>(null)

  const [original, setOriginal] = useState<HTMLImageElement | null>(null)
  const [copy, setCopy] = useState<HTMLImageElement | null>(null)
  const [transform, setTransform] = useState<TransformState>(initial.transform)
  const [mode, setMode] = useState<CompareMode>(initial.mode)
  const [overlayView, setOverlayView] = useState<OverlayView>(initial.overlayView)
  const [opacity, setOpacity] = useState(initial.opacity)
  const [diffThreshold, setDiffThreshold] = useState(initial.diffThreshold)
  const [showGuides, setShowGuides] = useState(initial.showGuides)
  const [enablePreprocess, setEnablePreprocess] = useState(initial.enablePreprocess)
  const [diffMethod, setDiffMethod] = useState<DiffMethod>(initial.diffMethod)
  const [enableMagnifier, setEnableMagnifier] = useState(initial.enableMagnifier)
  const [autoAligning, setAutoAligning] = useState(false)
  const [mobileFocus, setMobileFocus] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const ready = Boolean(original && copy)

  const currentSettings = {
    transform,
    mode,
    overlayView,
    opacity,
    diffThreshold,
    showGuides,
    enablePreprocess,
    diffMethod,
    enableMagnifier,
  }

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault()
    window.addEventListener('dragover', prevent)
    window.addEventListener('drop', prevent)
    return () => {
      window.removeEventListener('dragover', prevent)
      window.removeEventListener('drop', prevent)
    }
  }, [])

  useEffect(() => {
    const update = () => setIsMobile(isTouchDevice())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (ready && isMobile) {
      setMobileFocus(true)
    }
    if (!ready) {
      setMobileFocus(false)
    }
  }, [ready, isMobile])

  useEffect(() => {
    saveSettings(currentSettings)
  }, [transform, mode, overlayView, opacity, diffThreshold, showGuides, enablePreprocess, diffMethod, enableMagnifier])

  const handleAutoAlign = () => {
    if (!original || !copy) return
    const size = canvasRef.current?.getDisplaySize()
    if (!size || size.width <= 0) return

    setAutoAligning(true)
    window.setTimeout(() => {
      try {
        const next = estimateAutoAlign(
          original,
          copy,
          size.width,
          size.height,
          enablePreprocess,
        )
        setTransform(next)
        setMode('overlay')
        setOverlayView('overlay')
      } finally {
        setAutoAligning(false)
      }
    }, 30)
  }

  const handleExport = () => {
    if (original && copy) {
      saveHistoryRecord(original, copy, currentSettings)
    }
    canvasRef.current?.exportPng()
  }

  const handleOriginalChange = (img: HTMLImageElement | null) => {
    setOriginal(img)
    if (img) setTransform(DEFAULT_TRANSFORM)
  }

  const handleCopyChange = (img: HTMLImageElement | null) => {
    setCopy(img)
    if (img) setTransform(DEFAULT_TRANSFORM)
  }

  const handleRestoreHistory = useCallback(async (record: HistoryRecord) => {
    try {
      const [orig, cop] = await Promise.all([
        loadImageFromDataUrl(record.originalDataUrl),
        loadImageFromDataUrl(record.copyDataUrl),
      ])
      setOriginal(orig)
      setCopy(cop)
      setTransform(record.settings.transform)
      setMode(record.settings.mode)
      setOverlayView(record.settings.overlayView)
      setOpacity(record.settings.opacity)
      setDiffThreshold(record.settings.diffThreshold)
      setShowGuides(record.settings.showGuides)
      setEnablePreprocess(record.settings.enablePreprocess)
      setDiffMethod(record.settings.diffMethod)
      setEnableMagnifier(record.settings.enableMagnifier ?? false)
    } catch {
      alert('恢复历史记录失败')
    }
  }, [])

  return (
    <div className="min-h-screen">
      {!mobileFocus && (
        <header className="border-b border-stone-300 bg-white/80 px-6 py-4 backdrop-blur">
          <h1 className="text-xl font-semibold text-stone-900">书法临摹对比</h1>
          <p className="mt-1 text-sm text-stone-600">
            拍照上传 · 全屏对比 · 双指缩放 · v{APP_VERSION}
          </p>
        </header>
      )}

      {mobileFocus ? (
        <div className="fixed inset-0 z-50 flex h-dvh w-full flex-col bg-[#faf7f2]">
          <ComparisonCanvas
            ref={canvasRef}
            original={original}
            copy={copy}
            transform={transform}
            onTransformChange={setTransform}
            mode={mode}
            overlayView={overlayView}
            opacity={opacity}
            diffThreshold={diffThreshold}
            showGuides={showGuides}
            enablePreprocess={enablePreprocess}
            diffMethod={diffMethod}
            enableMagnifier={enableMagnifier}
            fullscreen
            onExitFullscreen={() => setMobileFocus(false)}
          />
        </div>
      ) : (
      <main className="mx-auto flex max-w-7xl flex-col gap-4 p-4 lg:min-h-0 lg:flex-row lg:items-start lg:p-6">
        <aside className="w-full shrink-0 space-y-4 lg:w-80 lg:shrink-0">
          <ImageUpload
            label="原帖"
            hint="字帖原图或扫描件"
            image={original}
            onImageChange={handleOriginalChange}
          />
          <ImageUpload
            label="临摹"
            hint="你的临摹作品照片"
            image={copy}
            onImageChange={handleCopyChange}
          />

          <HistoryPanel
            disabled={!ready}
            original={original}
            copy={copy}
            settings={currentSettings}
            onRestore={handleRestoreHistory}
          />

          <ImageEnhancePanel
            disabled={!ready}
            enablePreprocess={enablePreprocess}
            diffMethod={diffMethod}
            onPreprocessChange={setEnablePreprocess}
            onDiffMethodChange={setDiffMethod}
          />

          <ActionToolbar
            disabled={!ready}
            autoAligning={autoAligning}
            showGuides={showGuides}
            enableMagnifier={enableMagnifier}
            onAutoAlign={handleAutoAlign}
            onExport={handleExport}
            onToggleGuides={() => setShowGuides((v) => !v)}
            onToggleMagnifier={() => setEnableMagnifier((v) => !v)}
          />

          {ready && isMobile && (
            <button
              type="button"
              onClick={() => setMobileFocus(true)}
              className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
            >
              全屏对比
            </button>
          )}

          <TransformControls
            transform={transform}
            onChange={setTransform}
            disabled={!ready}
          />
          <ModeToolbar
            mode={mode}
            overlayView={overlayView}
            opacity={opacity}
            diffThreshold={diffThreshold}
            disabled={!ready}
            onModeChange={setMode}
            onOverlayViewChange={setOverlayView}
            onOpacityChange={setOpacity}
            onDiffThresholdChange={setDiffThreshold}
          />
        </aside>

        <ComparisonCanvas
          ref={canvasRef}
          original={original}
          copy={copy}
          transform={transform}
          onTransformChange={setTransform}
          mode={mode}
          overlayView={overlayView}
          opacity={opacity}
          diffThreshold={diffThreshold}
          showGuides={showGuides}
          enablePreprocess={enablePreprocess}
          diffMethod={diffMethod}
          enableMagnifier={enableMagnifier}
        />
      </main>
      )}

      {ready && isMobile && !mobileFocus && (
        <button
          type="button"
          onClick={() => setMobileFocus(true)}
          className="fixed bottom-5 right-4 z-40 rounded-full bg-amber-800 px-5 py-3 text-sm font-medium text-white shadow-lg"
        >
          全屏对比
        </button>
      )}
    </div>
  )
}
