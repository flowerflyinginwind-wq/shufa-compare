export function toGray(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function imageDataToGray(data: ImageData): Float32Array {
  const gray = new Float32Array(data.width * data.height)
  for (let i = 0; i < data.data.length; i += 4) {
    gray[i / 4] = toGray(data.data[i], data.data[i + 1], data.data[i + 2])
  }
  return gray
}

export function grayToImageData(gray: Float32Array, width: number, height: number): ImageData {
  const out = new ImageData(width, height)
  for (let i = 0; i < gray.length; i++) {
    const v = Math.max(0, Math.min(255, Math.round(gray[i])))
    const pi = i * 4
    out.data[pi] = v
    out.data[pi + 1] = v
    out.data[pi + 2] = v
    out.data[pi + 3] = 255
  }
  return out
}

export function binarizeGray(gray: Float32Array, threshold = 140): Uint8Array {
  const mask = new Uint8Array(gray.length)
  for (let i = 0; i < gray.length; i++) {
    mask[i] = gray[i] < threshold ? 1 : 0
  }
  return mask
}

export function binarize(data: ImageData, threshold = 140): Uint8Array {
  return binarizeGray(imageDataToGray(data), threshold)
}

export function otsuThreshold(gray: Float32Array): number {
  const hist = new Uint32Array(256)
  for (const v of gray) hist[Math.min(255, Math.max(0, Math.round(v)))]++

  const total = gray.length
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]

  let sumB = 0
  let wB = 0
  let maxVar = 0
  let threshold = 140

  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const variance = wB * wF * (mB - mF) ** 2
    if (variance > maxVar) {
      maxVar = variance
      threshold = t
    }
  }
  return threshold
}
