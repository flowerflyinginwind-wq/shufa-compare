import { useCallback, useEffect, useRef, useState } from 'react'
import { fileFromCanvas } from '../lib/imageLoad'

interface CameraModalProps {
  open: boolean
  title: string
  onClose: () => void
  onCapture: (file: File) => void
}

export default function CameraModal({ open, title, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    if (!open) {
      stopStream()
      setError(null)
      return
    }

    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        setError('无法访问摄像头，请检查权限或使用相册上传')
      }
    }

    start()
    return () => {
      cancelled = true
      stopStream()
    }
  }, [open, stopStream])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const file = fileFromCanvas(canvas, `camera-${Date.now()}.jpg`)
    onCapture(file)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium text-stone-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-stone-500 hover:text-stone-800">
            关闭
          </button>
        </div>

        {error ? (
          <p className="py-8 text-center text-sm text-red-600">{error}</p>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-[4/3] w-full rounded-lg bg-black object-cover"
          />
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={Boolean(error)}
            onClick={handleCapture}
            className="flex-1 rounded-md bg-amber-800 py-2 text-sm text-white hover:bg-amber-900 disabled:opacity-40"
          >
            拍照
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
