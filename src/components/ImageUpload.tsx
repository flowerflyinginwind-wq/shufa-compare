import { useCallback, useEffect, useRef, useState } from 'react'
import CameraModal from './CameraModal'

interface ImageUploadProps {
  label: string
  hint: string
  image: HTMLImageElement | null
  onImageChange: (image: HTMLImageElement | null) => void
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  gif: 'image/gif',
  bmp: 'image/bmp',
}

const ACCEPTED_MIMES = new Set(Object.values(EXT_TO_MIME))

function resolveMime(file: File): string {
  if (file.type && (ACCEPTED_MIMES.has(file.type) || file.type.startsWith('image/'))) {
    return file.type
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_MIME[ext] ?? ''
}

function isAcceptedImage(file: File): boolean {
  return resolveMime(file) !== '' || file.type.startsWith('image/')
}

export default function ImageUpload({
  label,
  hint,
  image,
  onImageChange,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const dragDepthRef = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  const revokeObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl])

  const loadFile = useCallback(
    (file: File) => {
      if (!isAcceptedImage(file)) {
        alert('请上传图片文件')
        return
      }

      revokeObjectUrl()
      const url = URL.createObjectURL(file)
      objectUrlRef.current = url

      const img = new Image()
      img.onload = () => {
        setPreviewUrl(url)
        onImageChange(img)
      }
      img.onerror = () => {
        revokeObjectUrl()
        setPreviewUrl(null)
        alert('图片加载失败，请重试')
      }
      img.src = url
    },
    [onImageChange, revokeObjectUrl],
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      const imageFile = Array.from(files).find((f) => isAcceptedImage(f))
      if (!imageFile) {
        alert('请上传图片文件')
        return
      }
      loadFile(imageFile)
    },
    [loadFile],
  )

  const handleCameraClick = () => {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setCameraOpen(true)
    } else {
      cameraInputRef.current?.click()
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current += 1
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current -= 1
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragDepthRef.current = 0
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handleClear = useCallback(() => {
    revokeObjectUrl()
    setPreviewUrl(null)
    onImageChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [onImageChange, revokeObjectUrl])

  const acceptList = 'image/*'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-stone-800">{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCameraClick}
            className="text-xs text-amber-800 hover:text-amber-950"
          >
            拍照
          </button>
          {image && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-stone-500 hover:text-red-600"
            >
              清除
            </button>
          )}
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-3 transition-colors ${
          isDragging
            ? 'border-amber-600 bg-amber-50'
            : 'border-stone-300 bg-white hover:border-amber-500'
        }`}
      >
        {image && previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="pointer-events-none mx-auto max-h-28 w-full rounded object-contain"
            draggable={false}
          />
        ) : (
          <div className="pointer-events-none py-6 text-center text-sm text-stone-500">
            <p>点击、拖拽或拍照上传</p>
            <p className="mt-1 text-xs">{hint}</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={acceptList}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <CameraModal
        open={cameraOpen}
        title={`${label} - 拍照`}
        onClose={() => setCameraOpen(false)}
        onCapture={loadFile}
      />
    </div>
  )
}
