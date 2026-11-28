'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiX, FiFile, FiImage, FiAlertCircle, FiPlus, FiPaperclip, FiArrowLeft } from 'react-icons/fi'
import { createClaim } from '@/lib/claims'
import { SessionUser } from '@/lib/types'
import { M } from '@/lib/messages'
import Link from 'next/link'

const MAX_FILE_SIZE = 1 * 1024 * 1024

interface UploadFile {
  file: File
  preview?: string
  base64?: string
  error?: string
  sizeLabel?: string
}

// Compress image to under 1MB — aggressive
async function compressImage(file: File): Promise<{ blob: Blob; base64: string }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Start with max 1200px — enough for bill photos
      const MAX_DIM = 1200
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width)
          width = MAX_DIM
        } else {
          width = Math.round((width * MAX_DIM) / height)
          height = MAX_DIM
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      const TARGET = 900 * 1024 // 900KB target

      // Start at quality 0.8, keep reducing until under 900KB
      // Also reduce dimensions if needed
      const compress = (w: number, h: number, quality: number) => {
        canvas.width = w
        canvas.height = h
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => {
          if (!blob) { resolve({ blob: new Blob(), base64: '' }); return }

          if (blob.size > TARGET) {
            if (quality > 0.2) {
              // Reduce quality first
              compress(w, h, parseFloat((quality - 0.1).toFixed(1)))
            } else if (w > 600) {
              // Then reduce size
              compress(Math.round(w * 0.75), Math.round(h * 0.75), 0.7)
            } else {
              // Accept whatever we have
              const reader = new FileReader()
              reader.onload = () => resolve({ blob, base64: reader.result as string })
              reader.readAsDataURL(blob)
            }
          } else {
            const reader = new FileReader()
            reader.onload = () => resolve({ blob, base64: reader.result as string })
            reader.readAsDataURL(blob)
          }
        }, 'image/jpeg', quality)
      }

      compress(width, height, 0.8)
    }
    img.onerror = () => resolve({ blob: new Blob(), base64: '' })
    img.src = url
  })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function getSession(): SessionUser | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find(r => r.startsWith('tbms_session='))
      ?.split('=').slice(1).join('=')
    if (!raw) return null
    return JSON.parse(decodeURIComponent(raw))
  } catch { return null }
}

export default function NewClaimPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])

  const [form, setForm] = useState({
    tour_purpose: '',
    sender_name: '',
    tour_from_date: '',
    tour_to_date: '',
    site_name: '',
    total_amount: '',
    remarks: '',
  })

  const [compressing, setCompressing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFiles = async (selected: FileList | null) => {
    if (!selected) return
    setCompressing(true)
    const newFiles: UploadFile[] = []
    for (const file of Array.from(selected)) {
      if (file.type === 'application/pdf') {
        if (file.size > MAX_FILE_SIZE) {
          newFiles.push({ file, error: `PDF too large (${(file.size / 1024).toFixed(0)}KB). Max 1MB.` })
        } else {
          const base64 = await fileToBase64(file)
          newFiles.push({ file, base64 })
        }
      } else if (file.type.startsWith('image/')) {
        const original_kb = Math.round(file.size / 1024)
        const { blob, base64 } = await compressImage(file)
        const compressed_kb = Math.round(blob.size / 1024)
        const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
        const preview = URL.createObjectURL(blob)
        const label = original_kb > compressed_kb
          ? `${compressed_kb}KB (compressed from ${original_kb}KB)`
          : `${compressed_kb}KB`
        newFiles.push({ file: compressedFile, preview, base64, sizeLabel: label })
      } else {
        newFiles.push({ file, error: 'Only images and PDFs are allowed.' })
      }
    }
    setFiles(prev => [...prev, ...newFiles])
    setCompressing(false)
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      if (prev[index]?.preview) URL.revokeObjectURL(prev[index].preview!)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validFiles = files.filter(f => !f.error)
    if (validFiles.length === 0) {
      toast.error(`${M.claimNoDoc.en} (${M.claimNoDoc.hi})`)
      return
    }

    const user = getSession()
    if (!user) {
      toast.error(`${M.claimNotLoggedIn.en} (${M.claimNotLoggedIn.hi})`)
      window.location.replace('/login')
      return
    }

    setLoading(true)
    try {
      const { error } = await createClaim({
        submitted_by: user.full_name,
        submitted_by_id: user.id,
        sender_name: form.sender_name,
        tour_purpose: form.tour_purpose,
        tour_from_date: form.tour_from_date,
        tour_to_date: form.tour_to_date,
        site_name: form.site_name,
        total_amount: parseFloat(form.total_amount) || 0,
        remarks: form.remarks,
        co_workers: [],
        attachments: validFiles.map(uf => ({
          name: uf.file.name,
          type: uf.file.type,
          size: uf.file.size,
          base64: uf.base64 || '',
        })),
      })

      if (error) throw new Error(error)
      toast.success(`${M.claimSubmitSuccess.en} (${M.claimSubmitSuccess.hi})`)
      router.push('/dashboard')
    } catch {
      toast.error(`${M.claimSubmitFail.en} (${M.claimSubmitFail.hi})`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard"
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          title="Back to Dashboard">
          <FiArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Submit Tour Bill Claim</h1>
          <p className="text-gray-500 text-sm">Fill in your tour details and attach supporting documents</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT — Tour Details */}
          <div className="card space-y-4 flex-1 w-full">
            <h2 className="font-semibold text-gray-800 border-b pb-2">Tour Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose of Tour <span className="text-red-500">*</span>
                </label>
                <input name="tour_purpose" value={form.tour_purpose} onChange={handleChange}
                  className="input-field" placeholder="e.g. Client visit, Site inspection"
                  autoComplete="off" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                <input name="sender_name" value={form.sender_name} onChange={handleChange}
                  className="input-field" placeholder="Sender name" autoComplete="off" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date <span className="text-red-500">*</span>
                </label>
                <input type="date" name="tour_from_date" value={form.tour_from_date}
                  onChange={handleChange} className="input-field" autoComplete="off" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date <span className="text-red-500">*</span>
                </label>
                <input type="date" name="tour_to_date" value={form.tour_to_date}
                  onChange={handleChange} className="input-field" autoComplete="off" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site Name <span className="text-red-500">*</span>
              </label>
              <input name="site_name" value={form.site_name} onChange={handleChange}
                className="input-field" placeholder="e.g. Delhi Plant, Mumbai Office"
                autoComplete="off" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Bill Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input type="number" name="total_amount" value={form.total_amount}
                onChange={handleChange} className="input-field" placeholder="0.00"
                min="0" step="0.01" autoComplete="off" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks (Optional)
              </label>
              <textarea name="remarks" value={form.remarks} onChange={handleChange}
                className="input-field h-20 resize-none" placeholder="Any additional notes..."
                autoComplete="off" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3">
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
              <Link href="/dashboard" className="btn-secondary px-6 py-3 text-center">
                Cancel
              </Link>
            </div>
          </div>

          {/* RIGHT — Attach Documents */}
          <div className="card w-full lg:w-72 space-y-4 flex-shrink-0">
            <h2 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <FiPaperclip className="text-blue-500" /> Attach Documents
            </h2>
            <p className="text-xs text-gray-500 flex items-start gap-1">
              <FiAlertCircle className="text-orange-400 mt-0.5 flex-shrink-0" />
              JPG, PNG, PDF — max 1MB each
            </p>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((uf, index) => (
                  <div key={index} className={`flex items-center gap-2 p-2.5 rounded-lg border ${uf.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                    {uf.preview
                      ? <img src={uf.preview} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                      : <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          {uf.file.type === 'application/pdf'
                            ? <FiFile className="text-red-500 text-lg" />
                            : <FiImage className="text-blue-500 text-lg" />}
                        </div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{uf.file.name}</p>
                      <p className={`text-xs ${uf.error ? 'text-red-500' : 'text-green-600'}`}>
                        {uf.error || uf.sizeLabel || `${(uf.file.size / 1024).toFixed(0)} KB`}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeFile(index)}
                      className="text-gray-300 hover:text-red-500 p-1 flex-shrink-0">
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => fileInputRef.current?.click()}
              disabled={compressing}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 rounded-xl py-5 text-blue-600 font-medium hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-60 disabled:cursor-wait">
              {compressing ? (
                <>
                  <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <FiPlus />
                  </span>
                  {files.length === 0 ? 'Attach Document' : 'Attach More'}
                </>
              )}
            </button>

            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf"
              className="hidden" onChange={e => handleFiles(e.target.files)} />

            {files.filter(f => !f.error).length > 0 && (
              <p className="text-xs text-center text-green-600 font-medium">
                ✓ {files.filter(f => !f.error).length} file{files.filter(f => !f.error).length > 1 ? 's' : ''} attached
              </p>
            )}
          </div>

        </div>
      </form>
    </div>
  )
}
