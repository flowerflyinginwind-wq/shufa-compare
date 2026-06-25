import {
  binarizeGray,
  imageDataToGray,
  otsuThreshold,
  toGray,
} from './imageUtils'

export type DiffMethod = 'pixel' | 'structure'

function normalizeInk(value: number): number {
  if (value > 200) return 255
  if (value < 80) return 0
  return value
}

/** 像素级差异（旧算法，关闭增强时可用） */
export function computePixelDiffOverlay(
  originalData: ImageData,
  copyData: ImageData,
  threshold: number,
): ImageData {
  const { width, height, data: orig } = originalData
  const copy = copyData.data
  const output = new ImageData(width, height)

  for (let i = 0; i < orig.length; i += 4) {
    const grayA = normalizeInk(toGray(orig[i], orig[i + 1], orig[i + 2]))
    const grayB = normalizeInk(toGray(copy[i], copy[i + 1], copy[i + 2]))
    const diff = Math.abs(grayA - grayB)

    if (diff > threshold) {
      const intensity = Math.min(255, Math.round((diff / 255) * 220 + 35))
      output.data[i] = 220
      output.data[i + 1] = 38
      output.data[i + 2] = 38
      output.data[i + 3] = intensity
    }
  }

  return output
}

function sobelMagnitude(gray: Float32Array, width: number, height: number): Float32Array {
  const mag = new Float32Array(gray.length)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const tl = gray[(y - 1) * width + (x - 1)]
      const tc = gray[(y - 1) * width + x]
      const tr = gray[(y - 1) * width + (x + 1)]
      const ml = gray[y * width + (x - 1)]
      const mr = gray[y * width + (x + 1)]
      const bl = gray[(y + 1) * width + (x - 1)]
      const bc = gray[(y + 1) * width + x]
      const br = gray[(y + 1) * width + (x + 1)]

      const gx = -tl + tr - 2 * ml + 2 * mr - bl + br
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br
      mag[idx] = Math.sqrt(gx * gx + gy * gy)
    }
  }
  return mag
}

function morphOpen(mask: Uint8Array, width: number, height: number): Uint8Array {
  const eroded = new Uint8Array(mask.length)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let keep = 1
      for (let dy = -1; dy <= 1 && keep; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!mask[(y + dy) * width + (x + dx)]) {
            keep = 0
            break
          }
        }
      }
      eroded[y * width + x] = keep
    }
  }
  return eroded
}

/**
 * 结构差异：Otsu 二值笔画 + Sobel 边缘比对
 * 蓝：原帖有、临摹缺 | 红：临摹多 | 橙：边缘结构偏差
 */
export function computeStructureDiffOverlay(
  originalData: ImageData,
  copyData: ImageData,
  sensitivity: number,
): ImageData {
  const { width, height } = originalData
  const output = new ImageData(width, height)

  const grayA = imageDataToGray(originalData)
  const grayB = imageDataToGray(copyData)

  const threshA = otsuThreshold(grayA)
  const threshB = otsuThreshold(grayB)
  let strokeA = binarizeGray(grayA, threshA)
  let strokeB = binarizeGray(grayB, threshB)

  strokeA = morphOpen(strokeA, width, height)
  strokeB = morphOpen(strokeB, width, height)

  const edgeA = sobelMagnitude(grayA, width, height)
  const edgeB = sobelMagnitude(grayB, width, height)

  const edgeThreshold = 12 + (80 - sensitivity) * 0.8

  for (let i = 0; i < strokeA.length; i++) {
    const pi = i * 4
    const a = strokeA[i]
    const b = strokeB[i]
    const edgeDiff = Math.abs(edgeA[i] - edgeB[i])

    if (a && !b) {
      output.data[pi] = 40
      output.data[pi + 1] = 100
      output.data[pi + 2] = 230
      output.data[pi + 3] = 200
    } else if (!a && b) {
      output.data[pi] = 220
      output.data[pi + 1] = 45
      output.data[pi + 2] = 45
      output.data[pi + 3] = 200
    } else if ((a || b) && edgeDiff > edgeThreshold) {
      const intensity = Math.min(220, Math.round(edgeDiff))
      output.data[pi] = 230
      output.data[pi + 1] = 120
      output.data[pi + 2] = 30
      output.data[pi + 3] = intensity
    }
  }

  return output
}

export function computeDiffOverlay(
  originalData: ImageData,
  copyData: ImageData,
  threshold: number,
  method: DiffMethod = 'structure',
): ImageData {
  if (method === 'pixel') {
    return computePixelDiffOverlay(originalData, copyData, threshold)
  }
  return computeStructureDiffOverlay(originalData, copyData, threshold)
}

export function getImageDataFromCanvas(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d')!
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function drawOriginalToCanvas(
  image: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  return canvas
}
