import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { renderComparisonFrame, downloadCanvas, renderToCanvas } from '../lib/renderFrame'
import type { CompareMode, OverlayView } from '../lib/renderFrame'
import type { DiffMethod } from '../lib/imageDiff'
import type { TransformState } from '../lib/transform'

export interface ComparisonCanvasHandle {
  exportPng: () => void
  getDisplaySize: () => { width: number; height: number }
}

interface ComparisonCanvasProps {
  original: HTMLImageElement | null
  copy: HTMLImageElement | null
  transform: TransformState
  onTransformChange: (transform: TransformState) => void
  mode: CompareMode
  overlayView: OverlayView
  opacity: number
  diffThreshold: number
  showGuides: boolean
  enablePreprocess: boolean
  diffMethod: DiffMethod
  enableMagnifier: boolean
}

function calcDisplaySize(
  containerWidth: number,
  containerHeight: number,
  image: HTMLImageElement,
): { width: number; height: number } {
  const pad = 16
  const maxW = Math.max(1, containerWidth - pad * 2)
  const maxH = Math.max(1, containerHeight - pad * 2)
  const scale = Math.min(maxW / image.width, maxH / image.height)
  return {
    width: Math.max(1, Math.round(image.width * scale)),
    height: Math.max(1, Math.round(image.height * scale)),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

const ComparisonCanvas = forwardRef<ComparisonCanvasHandle, ComparisonCanvasProps>(
  function ComparisonCanvas(
    {
      original,
      copy,
      transform,
      onTransformChange,
      mode,
      overlayView,
      opacity,
      diffThreshold,
      showGuides,
      enablePreprocess,
      diffMethod,
      enableMagnifier,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number } | null>(null)
    const magnifierRef = useRef<HTMLCanvasElement>(null)

    const dragRef = useRef<{
      pointerId: number
      startX: number
      startY: number
      baseTransform: TransformState
    } | null>(null)

    const activePointersRef = useRef(new Map<number, { x: number; y: number }>())
    const activeTouchesRef = useRef(new Map<number, { x: number; y: number }>())

    const pinchRef = useRef<{
      startDistance: number
      startCenterX: number
      startCenterY: number
      baseTransform: TransformState
    } | null>(null)

    const transformRef = useRef(transform)
    transformRef.current = transform

    const renderParamsRef = useRef({
      mode,
      overlayView,
      opacity,
      diffThreshold,
      showGuides,
      enablePreprocess,
      diffMethod,
    })
    renderParamsRef.current = {
      mode,
      overlayView,
      opacity,
      diffThreshold,
      showGuides,
      enablePreprocess,
      diffMethod,
    }

    const canInteract = Boolean(original && copy)

    useImperativeHandle(ref, () => ({
      getDisplaySize: () => displaySize,
      exportPng: () => {
        if (!original || !copy || displaySize.width <= 0) return
        const { mode, overlayView, opacity, diffThreshold, showGuides, enablePreprocess, diffMethod } =
          renderParamsRef.current
        const canvas = renderToCanvas({
          original,
          copy,
          transform: transformRef.current,
          mode,
          overlayView,
          opacity,
          diffThreshold,
          width: displaySize.width,
          height: displaySize.height,
          showGuides,
          enablePreprocess,
          diffMethod,
        })
        const suffix = mode === 'diff' ? '差异' : '叠加'
        downloadCanvas(canvas, `书法对比-${suffix}-${Date.now()}.png`)
      },
    }))

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const updateSize = () => {
        const { width, height } = container.getBoundingClientRect()
        if (!original) {
          setDisplaySize({ width: Math.round(width), height: Math.round(height) })
          return
        }
        setDisplaySize(calcDisplaySize(width, height, original))
      }

      updateSize()
      const observer = new ResizeObserver(updateSize)
      observer.observe(container)
      return () => observer.disconnect()
    }, [original])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width: displayW, height: displayH } = displaySize
      if (displayW <= 0 || displayH <= 0) return

      if (canvas.width !== displayW) canvas.width = displayW
      if (canvas.height !== displayH) canvas.height = displayH

      if (!original || !copy) {
        ctx.fillStyle = '#faf7f2'
        ctx.fillRect(0, 0, displayW, displayH)
        ctx.fillStyle = '#8b7d6b'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('请上传原帖与临摹图片后开始对比', displayW / 2, displayH / 2)
        return
      }

      renderComparisonFrame(ctx, {
        original,
        copy,
        transform,
        mode,
        overlayView,
        opacity,
        diffThreshold,
        width: displayW,
        height: displayH,
        showGuides,
        enablePreprocess,
        diffMethod,
      })
    }, [
      original,
      copy,
      transform,
      mode,
      overlayView,
      opacity,
      diffThreshold,
      displaySize,
      showGuides,
      enablePreprocess,
      diffMethod,
    ])

    const canvasDelta = useCallback((clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      if (!canvas) return { dx: 0, dy: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        dx: (clientX - rect.left) * scaleX,
        dy: (clientY - rect.top) * scaleY,
      }
    }, [])

    const touchCanvasPos = useCallback(
      (touch: Touch) => {
        const pos = canvasDelta(touch.clientX, touch.clientY)
        return { x: pos.dx, y: pos.dy }
      },
      [canvasDelta],
    )

    const beginPinchFromPoints = useCallback((points: Array<{ x: number; y: number }>) => {
      if (points.length !== 2) return

      dragRef.current = null
      const [a, b] = points
      const startDistance = Math.hypot(b.x - a.x, b.y - a.y)
      if (startDistance < 8) return

      pinchRef.current = {
        startDistance,
        startCenterX: (a.x + b.x) / 2,
        startCenterY: (a.y + b.y) / 2,
        baseTransform: { ...transformRef.current },
      }
      setIsDragging(true)
    }, [])

    const beginPinch = useCallback(() => {
      beginPinchFromPoints([...activePointersRef.current.values()])
    }, [beginPinchFromPoints])

    const applyPinch = useCallback((points?: Array<{ x: number; y: number }>) => {
      const pinch = pinchRef.current
      if (!pinch) return

      const gesturePoints = points ?? [...activePointersRef.current.values()]
      if (gesturePoints.length !== 2) return

      const [a, b] = gesturePoints
      const distance = Math.hypot(b.x - a.x, b.y - a.y)
      if (pinch.startDistance <= 0) return

      const centerX = (a.x + b.x) / 2
      const centerY = (a.y + b.y) / 2
      const scaleRatio = distance / pinch.startDistance

      onTransformChange({
        ...pinch.baseTransform,
        translateX: pinch.baseTransform.translateX + (centerX - pinch.startCenterX),
        translateY: pinch.baseTransform.translateY + (centerY - pinch.startCenterY),
        scale: clamp(pinch.baseTransform.scale * scaleRatio, 0.5, 2),
      })
    }, [onTransformChange])

    const beginDrag = useCallback(
      (pointerId: number, x: number, y: number) => {
        pinchRef.current = null
        dragRef.current = {
          pointerId,
          startX: x,
          startY: y,
          baseTransform: { ...transformRef.current },
        }
        setIsDragging(true)
      },
      [],
    )

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!canInteract || e.pointerType === 'touch') return
        e.preventDefault()

        const pos = canvasDelta(e.clientX, e.clientY)
        activePointersRef.current.set(e.pointerId, { x: pos.dx, y: pos.dy })

        if (activePointersRef.current.size === 2) {
          beginPinch()
        } else if (activePointersRef.current.size === 1) {
          beginDrag(e.pointerId, pos.dx, pos.dy)
        }

        e.currentTarget.setPointerCapture(e.pointerId)
      },
      [canInteract, canvasDelta, beginPinch, beginDrag],
    )

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.pointerType === 'touch') return
        if (!activePointersRef.current.has(e.pointerId)) return

        const pos = canvasDelta(e.clientX, e.clientY)
        activePointersRef.current.set(e.pointerId, { x: pos.dx, y: pos.dy })

        if (activePointersRef.current.size === 2) {
          if (!pinchRef.current) beginPinch()
          applyPinch()
          return
        }

        if (enableMagnifier && canInteract && !dragRef.current) {
          setMagnifierPos({ x: e.clientX, y: e.clientY })
        }

        const drag = dragRef.current
        if (!drag || drag.pointerId !== e.pointerId) return

        const dx = pos.dx - drag.startX
        const dy = pos.dy - drag.startY

        onTransformChange({
          ...drag.baseTransform,
          translateX: drag.baseTransform.translateX + dx,
          translateY: drag.baseTransform.translateY + dy,
        })
      },
      [canvasDelta, onTransformChange, enableMagnifier, canInteract, beginPinch, applyPinch],
    )

    const handlePointerLeave = useCallback(() => {
      setMagnifierPos(null)
    }, [])

    useEffect(() => {
      if (!enableMagnifier || !magnifierPos || !canInteract) return
      const source = canvasRef.current
      const lens = magnifierRef.current
      if (!source || !lens || source.width === 0) return

      const rect = source.getBoundingClientRect()
      const scaleX = source.width / rect.width
      const scaleY = source.height / rect.height
      const cx = (magnifierPos.x - rect.left) * scaleX
      const cy = (magnifierPos.y - rect.top) * scaleY

      const zoom = 3
      const lensSize = 140
      const srcSize = lensSize / zoom

      const ctx = lens.getContext('2d')!
      lens.width = lensSize
      lens.height = lensSize
      ctx.clearRect(0, 0, lensSize, lensSize)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, lensSize, lensSize)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(
        source,
        cx - srcSize / 2,
        cy - srcSize / 2,
        srcSize,
        srcSize,
        0,
        0,
        lensSize,
        lensSize,
      )
      ctx.strokeStyle = '#b45309'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, lensSize, lensSize)
      ctx.beginPath()
      ctx.moveTo(lensSize / 2, 0)
      ctx.lineTo(lensSize / 2, lensSize)
      ctx.moveTo(0, lensSize / 2)
      ctx.lineTo(lensSize, lensSize / 2)
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)'
      ctx.stroke()
    }, [magnifierPos, enableMagnifier, canInteract, displaySize, transform, mode, overlayView, opacity, diffThreshold, showGuides, enablePreprocess, diffMethod])

    const handlePointerUp = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.pointerType === 'touch') return
        if (!activePointersRef.current.has(e.pointerId)) return

        activePointersRef.current.delete(e.pointerId)
        e.currentTarget.releasePointerCapture(e.pointerId)

        if (activePointersRef.current.size === 2) {
          beginPinch()
          return
        }

        pinchRef.current = null

        if (activePointersRef.current.size === 1) {
          const [pointerId, point] = [...activePointersRef.current.entries()][0]
          beginDrag(pointerId, point.x, point.y)
          return
        }

        dragRef.current = null
        setIsDragging(false)
        setMagnifierPos(null)
      },
      [beginPinch, beginDrag],
    )

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas || !canInteract) return

      const syncTouchPositions = (touches: TouchList) => {
        for (let i = 0; i < touches.length; i += 1) {
          const touch = touches.item(i)
          if (!touch) continue
          activeTouchesRef.current.set(touch.identifier, touchCanvasPos(touch))
        }
      }

      const applyTouchGesture = () => {
        const points = [...activeTouchesRef.current.values()]
        if (points.length === 2) {
          if (!pinchRef.current) beginPinchFromPoints(points)
          else applyPinch(points)
          return
        }

        if (points.length === 1) {
          pinchRef.current = null
          const [pointerId, point] = [...activeTouchesRef.current.entries()][0]
          const drag = dragRef.current
          if (!drag || drag.pointerId !== pointerId) {
            beginDrag(pointerId, point.x, point.y)
            return
          }

          onTransformChange({
            ...drag.baseTransform,
            translateX: drag.baseTransform.translateX + (point.x - drag.startX),
            translateY: drag.baseTransform.translateY + (point.y - drag.startY),
          })
        }
      }

      const onTouchStart = (event: TouchEvent) => {
        event.preventDefault()
        syncTouchPositions(event.touches)
        applyTouchGesture()
      }

      const onTouchMove = (event: TouchEvent) => {
        event.preventDefault()
        syncTouchPositions(event.touches)
        applyTouchGesture()
      }

      const onTouchEnd = (event: TouchEvent) => {
        event.preventDefault()
        for (let i = 0; i < event.changedTouches.length; i += 1) {
          const touch = event.changedTouches.item(i)
          if (touch) activeTouchesRef.current.delete(touch.identifier)
        }

        if (activeTouchesRef.current.size === 2) {
          beginPinchFromPoints([...activeTouchesRef.current.values()])
          return
        }

        pinchRef.current = null

        if (activeTouchesRef.current.size === 1) {
          const [pointerId, point] = [...activeTouchesRef.current.entries()][0]
          beginDrag(pointerId, point.x, point.y)
          return
        }

        dragRef.current = null
        setIsDragging(false)
      }

      canvas.addEventListener('touchstart', onTouchStart, { passive: false })
      canvas.addEventListener('touchmove', onTouchMove, { passive: false })
      canvas.addEventListener('touchend', onTouchEnd, { passive: false })
      canvas.addEventListener('touchcancel', onTouchEnd, { passive: false })

      return () => {
        canvas.removeEventListener('touchstart', onTouchStart)
        canvas.removeEventListener('touchmove', onTouchMove)
        canvas.removeEventListener('touchend', onTouchEnd)
        canvas.removeEventListener('touchcancel', onTouchEnd)
      }
    }, [canInteract, touchCanvasPos, beginPinchFromPoints, applyPinch, beginDrag, onTransformChange])

    const handleWheel = useCallback(
      (e: React.WheelEvent<HTMLCanvasElement>) => {
        if (!canInteract) return
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.02 : 0.02
        const nextScale = clamp(transformRef.current.scale + delta, 0.5, 2)
        onTransformChange({ ...transformRef.current, scale: nextScale })
      },
      [canInteract, onTransformChange],
    )

    return (
      <div
        ref={containerRef}
        className="relative h-[min(70vh,720px)] min-h-[360px] w-full min-w-0 flex-1 overflow-hidden rounded-lg border border-stone-200 bg-[#faf7f2] touch-none"
      >
        <canvas
          ref={canvasRef}
          className={`absolute left-1/2 top-1/2 max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 touch-none shadow-sm ${
            canInteract
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-default'
          }`}
          style={
            displaySize.width > 0
              ? { width: displaySize.width, height: displaySize.height, touchAction: 'none' }
              : { touchAction: 'none' }
          }
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onWheel={handleWheel}
        />

        {enableMagnifier && magnifierPos && canInteract && !isDragging && (
          <canvas
            ref={magnifierRef}
            className="pointer-events-none fixed z-50 rounded-full border-2 border-amber-700 shadow-lg"
            style={{
              width: 140,
              height: 140,
              left: magnifierPos.x + 20,
              top: magnifierPos.y - 160,
            }}
          />
        )}

        {canInteract && (
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            拖拽移动 · 双指缩放 · 滚轮缩放
            {enableMagnifier ? ' · 悬停放大' : ''}
            {showGuides ? ' · 辅助线' : ''}
          </p>
        )}
      </div>
    )
  },
)

export default ComparisonCanvas
