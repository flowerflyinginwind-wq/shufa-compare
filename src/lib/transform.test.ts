import { describe, expect, it } from 'vitest'
import { DEFAULT_TRANSFORM, applyCopyTransform } from './transform'

function transformPoint(
  x: number,
  y: number,
  transform: typeof DEFAULT_TRANSFORM,
  w: number,
  h: number,
) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  applyCopyTransform(ctx, transform, w, h)
  const m = ctx.getTransform()
  return {
    x: m.a * x + m.c * y + m.e,
    y: m.b * x + m.d * y + m.f,
  }
}

describe('applyCopyTransform', () => {
  const w = 400
  const h = 400
  const center = { x: 200, y: 200 }

  it('水平平移时 scale=1 不改变点到中心的距离', () => {
    const p0 = transformPoint(100, 200, { ...DEFAULT_TRANSFORM, translateX: 0 }, w, h)
    const p1 = transformPoint(100, 200, { ...DEFAULT_TRANSFORM, translateX: 50 }, w, h)

    const d0 = Math.hypot(p0.x - center.x, p0.y - center.y)
    const d1 = Math.hypot(p1.x - center.x - 50, p1.y - center.y)

    expect(d0).toBeCloseTo(100, 1)
    expect(d1).toBeCloseTo(100, 1)
  })

  it('纯平移时所有点偏移量相同', () => {
    const t = { ...DEFAULT_TRANSFORM, translateX: 30, translateY: -20 }
    const a = transformPoint(50, 80, t, w, h)
    const b = transformPoint(300, 350, t, w, h)
    const baseA = transformPoint(50, 80, DEFAULT_TRANSFORM, w, h)
    const baseB = transformPoint(300, 350, DEFAULT_TRANSFORM, w, h)

    expect(a.x - baseA.x).toBeCloseTo(30, 1)
    expect(a.y - baseA.y).toBeCloseTo(-20, 1)
    expect(b.x - baseB.x).toBeCloseTo(30, 1)
    expect(b.y - baseB.y).toBeCloseTo(-20, 1)
  })

  it('缩放会改变点到中心的距离', () => {
    const p = transformPoint(300, 200, { ...DEFAULT_TRANSFORM, scale: 2 }, w, h)
    expect(Math.hypot(p.x - center.x, p.y - center.y)).toBeCloseTo(200, 1)
  })
})
