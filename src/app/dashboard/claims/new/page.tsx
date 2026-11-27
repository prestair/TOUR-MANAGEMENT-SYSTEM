'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiX, FiFile, FiImage, FiAlertCircle, FiPlus, FiPaperclip } from 'react-icons/fi'
import { createClaim } from '@/lib/claims'
import { SessionUser } from '@/lib/types'
import { M } from '@/lib/messages'

const MAX_FILE_SIZE = 1 * 1024 * 1024

interface UploadFile {
  file: File
  preview?: string
  base64?: string
  error?: string
}

interface CoWorker {
  name: string
  father_name: string
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
  const [coWorkers, setCoWorkers] = useState<CoWorker[]>([{ name: '', father_name: '' }])

  const [form, setForm] = useState({
    tour_purpose: '',
    sender_name: '',
    tour_from_date: '',
    tour_to_date: '',
    site_name: '',
    total_amount: '',
    remarks: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const updateCoWorker = (index: number, field: keyof CoWorker, value: string) => {
    setCoWorkers(prev => prev.map((cw, i) => i === index ? { ...cw, [field]: value } : cw))
  }

  const handleFiles = async (selected: FileList | null) => {
    if (!selected) return
    const newFiles: UploadFile[] = []
    for (const file of Array.from(selected)) {
      if (file.size > MAX_FILE_SIZE) {
        newFiles.push({ file, error: `Too large (${(file.size / 1024).toFixed(0)}KB). Max 1MB.` })
      } else {
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        const base64 = await fileToBase64(file)
        newFiles.push({ file, preview, base64 })
      }
    }
    setFiles(prev => [...prev, ...newFiles])
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
    if (!user) { toast.error(`${M.claimNotLoggedIn.en} (${M.claimNotLoggedIn.hi})`); window.location.replace('/login'); return }

    setLoading(true)
    try {
      const { claim, error } = await createClaim({
        submitted_by: user.full_name,
        submitted_by_id: user.id,
        sender_name: form.sender_name,
        tour_purpose: form.tour_purpose,
        tour_from_date: form.tour_from_date,
        tour_to_date: form.tour_to_date,
        site_name: form.site_name,
        total_amount: parseFloat(form.total_amount) || 0,
        remarks: form.remarks,
        co_workers: coWorkers.filter(cw => cw.name.trim()),
        attachments: validFiles.map(uf => ({
          name: uf.file.name,
          type: uf.file.type,
          size: uf.file.size,
          base64: uf.base64 || '',
        })),
      })

      if (error) throw new Error(error)
      toast.success(`${M.claimSubmitSuccess.en} (${M.claimSubmitSuccess.hi})`)
      router.push('/dashboard/claims/my')
    } catch (err: unknown) {
      toast.error(`${M.claimSubmitFail.en} (${M.claimSubmitFail.hi})`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submit Tour Bill Claim</h1>
        <p className="text-gray-500 mt-1">Fill in your tour details and attach supporting documents</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT — Tour Details */}
          <div className="card space-y-4 flex-1 w-full">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">Tour Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose of Tour <span className="text-red-500">*</span>
                </label>
                <input name="tour_purpose" value={form.tour_purpose} onChange={handleChange}
                  className="input-field" placeholder="e.g. Client visit, Site inspection" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                <input name="sender_name" value={form.sender_name} onChange={handleChange}
                  className="input-field" placeholder="Sender ka naam" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date <span className="text-red-500">*</span></label>
                <input type="date" name="tour_from_date" value={form.tour_from_date} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date <span className="text-red-500">*</span></label>
                <input type="date" name="tour_to_date" value={form.tour_to_date} onChange={handleChange} className="input-field" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name <span className="text-red-500">*</span></label>
              <input name="site_name" value={form.site_name} onChange={handleChange}
                className="input-field" placeholder="e.g. Delhi Plant, Mumbai Office" required />
            </div>

            {/* Co-workers */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Co-worker Details</label>
              {coWorkers.map((cw, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 items-start">
                  <input value={cw.name} onChange={e => updateCoWorker(i, 'name', e.target.value)}
                    className="input-field text-sm" placeholder={`Co-worker ${i + 1} naam`} />
                  <div className="flex gap-2">
                    <input value={cw.father_name} onChange={e => updateCoWorker(i, 'father_name', e.target.value)}
                      className="input-field text-sm flex-1" placeholder="Pita ji ka naam" />
                    {coWorkers.length > 1 && (
                      <button type="button" onClick={() => setCoWorkers(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                        <FiX className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setCoWorkers(prev => [...prev, { name: '', father_name: '' }])}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-1 px-1">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                  <FiPlus />
                </span>
                Add Co-worker
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Bill Amount (₹) <span className="text-red-500">*</span></label>
              <input type="number" name="total_amount" value={form.total_amount} onChange={handleChange}
                className="input-field" placeholder="0.00" min="0" step="0.01" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
              <textarea name="remarks" value={form.remarks} onChange={handleChange}
                className="input-field h-20 resize-none" placeholder="Any additional notes..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-base">
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-secondary px-6">Cancel</button>
            </div>
          </div>

          {/* RIGHT — Attach Documents */}
          <div className="card w-full lg:w-80 space-y-4 flex-shrink-0">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2 flex items-center gap-2">
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
                      <p className={`text-xs ${uf.error ? 'text-red-500' : 'text-gray-400'}`}>
                        {uf.error || `${(uf.file.size / 1024).toFixed(0)} KB`}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="text-gray-300 hover:text-red-500 p-1">
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-blue-300 rounded-xl py-5 text-blue-600 font-medium hover:border-blue-500 hover:bg-blue-50 transition-colors text-base">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <FiPlus className="text-base" />
              </span>
              {files.length === 0 ? 'Attach Document' : 'Attach More'}
            </button>

            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf"
              className="hidden" onChange={(e) => handleFiles(e.target.files)} />

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
