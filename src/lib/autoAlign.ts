import { binarizeGray, imageDataToGray, otsuThreshold } from './imageUtils'
import { getPreprocessedCanvas } from './preprocess'
import { drawCopyImage } from './transform'
import type { TransformState } from './transform'
import { DEFAULT_TRANSFORM } from './transform'

function getInkMask(
  image: HTMLImageElement,
  width: number,
  height: number,
  preprocess: boolean,
): Uint8Array {
  const canvas = getPreprocessedCanvas(image, width, height, preprocess)
  const data = canvas.getContext('2d')!.getImageData(0, 0, width, height)
  const gray = imageDataToGray(data)
  const thresh = otsuThreshold(gray)
  return binarizeGray(gray, thresh)
}

function renderCopyMask(
  copy: HTMLImageElement,
  transform: TransformState,
  width: number,
  height: number,
  preprocess: boolean,
): Uint8Array {
  const copySrc = getPreprocessedCanvas(copy, width, height, preprocess)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  drawCopyImage(ctx, copySrc, transform, width, height)
  const gray = imageDataToGray(ctx.getImageData(0, 0, width, height))
  return binarizeGray(gray, otsuThreshold(gray))
}

function scoreOverlap(origMask: Uint8Array, copyMask: Uint8Array): number {
  let match = 0
  let total = 0
  for (let i = 0; i < origMask.length; i++) {
    if (origMask[i] || copyMask[i]) {
      total++
      if (origMask[i] && copyMask[i]) match++
    }
  }
  return total === 0 ? 0 : match / total
}

export function estimateAutoAlign(
  original: HTMLImageElement,
  copy: HTMLImageElement,
  displayWidth: number,
  displayHeight: number,
  enablePreprocess = true,
): TransformState {
  const maxSide = 280
  const scale = Math.min(maxSide / displayWidth, maxSide / displayHeight, 1)
  const w = Math.max(1, Math.round(displayWidth * scale))
  const h = Math.max(1, Math.round(displayHeight * scale))

  const origMask = getInkMask(original, w, h, enablePreprocess)
  const toDisplay = displayWidth / w

  let best: TransformState = { ...DEFAULT_TRANSFORM }
  let bestScore = -1

  const translateRange = Math.round(40 * scale)
  const translateStep = Math.max(2, Math.round(4 * scale))

  for (let rotation = -8; rotation <= 8; rotation += 2) {
    for (let s = 0.85; s <= 1.2; s += 0.05) {
      for (let tx = -translateRange; tx <= translateRange; tx += translateStep) {
        for (let ty = -translateRange; ty <= translateRange; ty += translateStep) {
          const candidate: TransformState = {
            translateX: tx,
            translateY: ty,
            scale: s,
            rotation,
          }
          const copyMask = renderCopyMask(copy, candidate, w, h, enablePreprocess)
          const score = scoreOverlap(origMask, copyMask)
          if (score > bestScore) {
            bestScore = score
            best = candidate
          }
        }
      }
    }
  }

  return {
    translateX: Math.round(best.translateX * toDisplay),
    translateY: Math.round(best.translateY * toDisplay),
    scale: best.scale,
    rotation: best.rotation,
  }
}
