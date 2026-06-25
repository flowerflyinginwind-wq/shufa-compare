import {
  grayToImageData,
  imageDataToGray,
} from './imageUtils'

export interface PreprocessOptions {
  shadowRemoval?: boolean
  contrastEnhance?: boolean
  denoise?: boolean
}

const DEFAULT_OPTS: Required<PreprocessOptions> = {
  shadowRemoval: true,
  contrastEnhance: true,
  denoise: true,
}

function boxBlur(gray: Float32Array, width: number, height: number, radius: number) {
  const out = new Float32Array(gray.length)
  const tmp = new Float32Array(gray.length)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      let count = 0
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx
        if (nx < 0 || nx >= width) continue
        sum += gray[y * width + nx]
        count++
      }
      tmp[y * width + x] = sum / count
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      let count = 0
      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= height) continue
        sum += tmp[ny * width + x]
        count++
      }
      out[y * width + x] = sum / count
    }
  }

  return out
}

function removeShadow(gray: Float32Array, width: number, height: number) {
  const bg = boxBlur(gray, width, height, 16)
  const out = new Float32Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    const norm = (gray[i] / (bg[i] + 12)) * 210
    out[i] = Math.max(0, Math.min(255, norm))
  }
  return out
}

function contrastStretch(gray: Float32Array) {
  let lo = 255
  let hi = 0
  const step = Math.max(1, Math.floor(gray.length / 5000))
  for (let i = 0; i < gray.length; i += step) {
    if (gray[i] < lo) lo = gray[i]
    if (gray[i] > hi) hi = gray[i]
  }
  if (hi - lo < 20) return gray

  const out = new Float32Array(gray.length)
  const range = hi - lo
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.max(0, Math.min(255, ((gray[i] - lo) / range) * 255))
  }
  return out
}

function medianDenoise(gray: Float32Array, width: number, height: number) {
  const out = new Float32Array(gray)
  const window: number[] = []
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      window.length = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          window.push(gray[(y + dy) * width + (x + dx)])
        }
      }
      window.sort((a, b) => a - b)
      out[y * width + x] = window[4]
    }
  }
  return out
}

/** 灰度化 → 去阴影 → 对比度增强 → 轻微去噪 */
export function preprocessImageData(
  data: ImageData,
  options: PreprocessOptions = {},
): ImageData {
  const opts = { ...DEFAULT_OPTS, ...options }
  const { width, height } = data
  let gray = imageDataToGray(data)

  if (opts.shadowRemoval) gray = removeShadow(gray, width, height)
  if (opts.contrastEnhance) gray = contrastStretch(gray)
  if (opts.denoise) gray = medianDenoise(gray, width, height)

  return grayToImageData(gray, width, height)
}

export function imageToImageData(
  image: HTMLImageElement,
  width: number,
  height: number,
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

const canvasCache = new WeakMap<HTMLImageElement, Map<string, HTMLCanvasElement>>()

function cacheKey(width: number, height: number, enabled: boolean) {
  return `${width}x${height}-${enabled ? 1 : 0}`
}

/** 获取预处理后的画布（带缓存） */
export function getPreprocessedCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  enabled: boolean,
): HTMLCanvasElement {
  if (!enabled) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)
    return canvas
  }

  let map = canvasCache.get(image)
  if (!map) {
    map = new Map()
    canvasCache.set(image, map)
  }

  const key = cacheKey(width, height, true)
  const cached = map.get(key)
  if (cached) return cached

  const raw = imageToImageData(image, width, height)
  const processed = preprocessImageData(raw)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.putImageData(processed, 0, 0)
  map.set(key, canvas)
  return canvas
}
