import { describe, expect, it } from 'vitest'
import { computeDiffOverlay } from './imageDiff'

function makeImageData(width: number, height: number, fill: [number, number, number]) {
  const data = new ImageData(width, height)
  for (let i = 0; i < data.data.length; i += 4) {
    data.data[i] = fill[0]
    data.data[i + 1] = fill[1]
    data.data[i + 2] = fill[2]
    data.data[i + 3] = 255
  }
  return data
}

describe('computeDiffOverlay', () => {
  it('相同图像不产生差异高亮（像素模式）', () => {
    const img = makeImageData(10, 10, [30, 30, 30])
    const diff = computeDiffOverlay(img, img, 25, 'pixel')
    const highlighted = Array.from(diff.data).filter((v, i) => i % 4 === 3 && v > 0)
    expect(highlighted.length).toBe(0)
  })

  it('不同图像产生高亮（像素模式）', () => {
    const a = makeImageData(10, 10, [30, 30, 30])
    const b = makeImageData(10, 10, [220, 220, 220])
    const diff = computeDiffOverlay(a, b, 25, 'pixel')
    const redPixels = Array.from(diff.data).filter((v, i) => i % 4 === 0 && v > 0)
    expect(redPixels.length).toBeGreaterThan(0)
  })

  it('结构模式可检测笔画差异', () => {
    const a = makeImageData(20, 20, [255, 255, 255])
    const b = makeImageData(20, 20, [255, 255, 255])
    for (let y = 5; y < 15; y++) {
      for (let x = 5; x < 15; x++) {
        const i = (y * 20 + x) * 4
        a.data[i] = a.data[i + 1] = a.data[i + 2] = 20
      }
    }
    const diff = computeDiffOverlay(a, b, 25, 'structure')
    const highlighted = Array.from(diff.data).filter((v, i) => i % 4 === 3 && v > 0)
    expect(highlighted.length).toBeGreaterThan(0)
  })
})
