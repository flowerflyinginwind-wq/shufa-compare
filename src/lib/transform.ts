export interface TransformState {
  translateX: number
  translateY: number
  scale: number
  rotation: number
}

export interface ViewportState {
  scale: number
  translateX: number
  translateY: number
}

export const DEFAULT_TRANSFORM: TransformState = {
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotation: 0,
}

export const DEFAULT_VIEWPORT: ViewportState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
}

/**
 * 视图变换：同时缩放/平移原稿与临摹层。
 */
export function applyViewportTransform(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportState,
  canvasWidth: number,
  canvasHeight: number,
) {
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  ctx.translate(viewport.translateX, viewport.translateY)
  ctx.translate(centerX, centerY)
  ctx.scale(viewport.scale, viewport.scale)
  ctx.translate(-centerX, -centerY)
}

/**
 * 变换顺序：先绕画布中心缩放/旋转，再整体平移。
 * 平移与缩放解耦，避免拖动平移滑块时产生“放大”错觉。
 */
export function applyCopyTransform(
  ctx: CanvasRenderingContext2D,
  transform: TransformState,
  canvasWidth: number,
  canvasHeight: number,
) {
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  ctx.translate(transform.translateX, transform.translateY)
  ctx.translate(centerX, centerY)
  ctx.rotate((transform.rotation * Math.PI) / 180)
  ctx.scale(transform.scale, transform.scale)
  ctx.translate(-centerX, -centerY)
}

export type ImageSource = HTMLImageElement | HTMLCanvasElement

export function drawCopyImage(
  ctx: CanvasRenderingContext2D,
  image: ImageSource,
  transform: TransformState,
  canvasWidth: number,
  canvasHeight: number,
  alpha = 1,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  applyCopyTransform(ctx, transform, canvasWidth, canvasHeight)
  ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight)
  ctx.restore()
}

export function renderCopyToCanvas(
  image: ImageSource,
  transform: TransformState,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  drawCopyImage(ctx, image, transform, width, height)
  return canvas
}
