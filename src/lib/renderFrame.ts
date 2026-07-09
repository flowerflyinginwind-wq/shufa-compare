import {
  computeDiffOverlay,
  drawOriginalToCanvas,
  getImageDataFromCanvas,
  type DiffMethod,
} from './imageDiff'
import { getPreprocessedCanvas } from './preprocess'
import { applyViewportTransform, drawCopyImage, renderCopyToCanvas } from './transform'
import type { TransformState, ViewportState } from './transform'

export type CompareMode = 'overlay' | 'diff'
export type OverlayView = 'overlay' | 'original' | 'copy'

export interface RenderOptions {
  original: HTMLImageElement
  copy: HTMLImageElement
  transform: TransformState
  viewport?: ViewportState
  mode: CompareMode
  overlayView: OverlayView
  opacity: number
  diffThreshold: number
  width: number
  height: number
  showGuides?: boolean
  enablePreprocess?: boolean
  diffMethod?: DiffMethod
}

export function drawAlignmentGuides(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  ctx.save()
  ctx.strokeStyle = 'rgba(180, 120, 40, 0.45)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])

  ctx.beginPath()
  ctx.moveTo(width / 2, 0)
  ctx.lineTo(width / 2, height)
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()

  for (let i = 1; i < 3; i++) {
    const x = (width * i) / 3
    const y = (height * i) / 3
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.restore()
}

function getSources(options: RenderOptions) {
  const { original, copy, width, height, enablePreprocess = true } = options
  const prep = enablePreprocess ?? true
  return {
    orig: getPreprocessedCanvas(original, width, height, prep),
    copy: getPreprocessedCanvas(copy, width, height, prep),
  }
}

export function renderComparisonFrame(
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
) {
  const {
    original,
    copy,
    transform,
    viewport,
    mode,
    overlayView,
    opacity,
    diffThreshold,
    width,
    height,
    showGuides,
    enablePreprocess = true,
    diffMethod = 'structure',
  } = options

  const { orig, copy: copySrc } = getSources(options)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  if (viewport) {
    applyViewportTransform(ctx, viewport, width, height)
  }

  if (mode === 'overlay') {
    if (overlayView === 'original' || overlayView === 'overlay') {
      ctx.drawImage(orig, 0, 0, width, height)
    }
    if (overlayView === 'copy' || overlayView === 'overlay') {
      const alpha = overlayView === 'copy' ? 1 : opacity / 100
      drawCopyImage(ctx, copySrc, transform, width, height, alpha)
    }
    if (showGuides && overlayView === 'overlay') {
      drawAlignmentGuides(ctx, width, height)
    }
    ctx.restore()
    return
  }

  ctx.drawImage(orig, 0, 0, width, height)

  const originalCanvas = drawOriginalToCanvas(orig, width, height)
  const copyCanvas = renderCopyToCanvas(copySrc, transform, width, height)
  const originalData = getImageDataFromCanvas(originalCanvas)
  const copyData = getImageDataFromCanvas(copyCanvas)
  const diffData = computeDiffOverlay(
    originalData,
    copyData,
    diffThreshold,
    enablePreprocess ? diffMethod : 'pixel',
  )

  const diffCanvas = document.createElement('canvas')
  diffCanvas.width = width
  diffCanvas.height = height
  diffCanvas.getContext('2d')!.putImageData(diffData, 0, 0)
  ctx.drawImage(diffCanvas, 0, 0)

  if (showGuides) {
    drawAlignmentGuides(ctx, width, height)
  }

  ctx.restore()

  void original
  void copy
}

export function renderToCanvas(options: RenderOptions): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = options.width
  canvas.height = options.height
  renderComparisonFrame(canvas.getContext('2d')!, options)
  return canvas
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
