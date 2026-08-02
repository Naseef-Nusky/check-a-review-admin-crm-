import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { Crop, ImagePlus, RefreshCw, Trash2, X } from 'lucide-react'
import { LOGO_UPLOAD_HINT } from '../utils/constants'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_BYTES = 2 * 1024 * 1024
/** Wide brand/email logos — much more horizontal room than a 1:1 square. */
const DEFAULT_ASPECT = 3 / 1

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

async function getCroppedFile(imageSrc, pixelCrop, fileName = 'logo.png') {
  const image = await createImage(imageSrc)
  const width = Math.max(1, Math.round(pixelCrop.width))
  const height = Math.max(1, Math.round(pixelCrop.height))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Keep transparency for PNG logos instead of forcing a white square pad.
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  )

  const blob = await new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result), 'image/png', 0.95)
  })

  if (!blob) throw new Error('Could not crop logo')
  return new File([blob], fileName.replace(/\.\w+$/, '') + '.png', { type: 'image/png' })
}

export default function LogoUploader({
  valueFile = null,
  previewUrl = '',
  onChange,
  onError,
  disabled = false,
  /** Crop frame ratio. Default 3:1 for email/site logos. */
  aspect = DEFAULT_ASPECT,
}) {
  const inputRef = useRef(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [pendingName, setPendingName] = useState('logo.png')
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    return () => {
      if (cropSrc.startsWith('blob:')) URL.revokeObjectURL(cropSrc)
    }
  }, [cropSrc])

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('Invalid logo format. Use PNG, JPG, or WEBP.')
      return false
    }
    if (file.size > MAX_BYTES) {
      onError?.('Logo file is too large. Maximum size is 2MB.')
      return false
    }
    return true
  }

  const openCropper = (file) => {
    if (!validateFile(file)) return
    onError?.('')
    if (cropSrc.startsWith('blob:')) URL.revokeObjectURL(cropSrc)
    setPendingName(file.name || 'logo.png')
    setCropSrc(URL.createObjectURL(file))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setCropOpen(true)
  }

  const onFilePicked = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || disabled) return
    openCropper(file)
  }

  const closeCropper = () => {
    setCropOpen(false)
    if (cropSrc.startsWith('blob:')) URL.revokeObjectURL(cropSrc)
    setCropSrc('')
  }

  const applyCrop = async () => {
    if (!cropSrc || !croppedAreaPixels) return
    setApplying(true)
    try {
      const file = await getCroppedFile(cropSrc, croppedAreaPixels, pendingName)
      onChange?.(file)
      closeCropper()
    } catch (err) {
      onError?.(err.message || 'Failed to crop logo')
    } finally {
      setApplying(false)
    }
  }

  const useFullImage = async () => {
    if (!cropSrc) return
    setApplying(true)
    try {
      const image = await createImage(cropSrc)
      const file = await getCroppedFile(
        cropSrc,
        { x: 0, y: 0, width: image.width, height: image.height },
        pendingName,
      )
      onChange?.(file)
      closeCropper()
    } catch (err) {
      onError?.(err.message || 'Failed to use full image')
    } finally {
      setApplying(false)
    }
  }

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const removeLogo = () => {
    onError?.('')
    onChange?.(null)
  }

  return (
    <div>
      <div className="mt-2 flex items-start gap-4">
        <div className="flex h-20 w-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {previewUrl ? (
            <img src={previewUrl} alt="Logo preview" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <ImagePlus className="h-7 w-7 text-slate-300" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <input
            ref={inputRef}
            id="logo"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            disabled={disabled}
            onChange={onFilePicked}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              onClick={() => inputRef.current?.click()}
            >
              {previewUrl || valueFile ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reselect
                </>
              ) : (
                <>
                  <ImagePlus className="h-3.5 w-3.5" />
                  Upload logo
                </>
              )}
            </button>

            {(previewUrl || valueFile) && (
              <>
                <button
                  type="button"
                  disabled={disabled || (!valueFile && !previewUrl)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={async () => {
                    if (valueFile) {
                      openCropper(valueFile)
                      return
                    }
                    if (previewUrl) {
                      try {
                        const response = await fetch(previewUrl)
                        const blob = await response.blob()
                        const file = new File([blob], 'logo.png', { type: blob.type || 'image/png' })
                        openCropper(file)
                      } catch {
                        onError?.('Could not load logo for cropping. Please reselect the image.')
                      }
                      return
                    }
                    inputRef.current?.click()
                  }}
                >
                  <Crop className="h-3.5 w-3.5" />
                  Crop
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  onClick={removeLogo}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-slate-400">{LOGO_UPLOAD_HINT}</p>
        </div>
      </div>

      {cropOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Crop logo</h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Wide selection for email branding — zoom out to include more of the logo.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 p-2 text-slate-400 hover:text-slate-700"
                onClick={closeCropper}
                disabled={applying}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative h-[28rem] bg-slate-900">
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                minZoom={0.4}
                maxZoom={3}
                aspect={aspect}
                cropShape="rect"
                showGrid
                objectFit="contain"
                restrictPosition={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="space-y-4 px-5 py-4">
              <label className="block text-sm text-slate-600">
                Zoom (zoom out to select more of the image)
                <input
                  type="range"
                  min={0.4}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="mt-2 w-full accent-primary-500"
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={closeCropper}
                  disabled={applying}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  onClick={useFullImage}
                  disabled={applying}
                >
                  Use full image
                </button>
                <button
                  type="button"
                  className="rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
                  onClick={applyCrop}
                  disabled={applying || !croppedAreaPixels}
                >
                  {applying ? 'Applying...' : 'Apply crop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
