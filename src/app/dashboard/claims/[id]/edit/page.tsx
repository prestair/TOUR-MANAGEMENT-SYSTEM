'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiX, FiFile, FiImage, FiAlertCircle, FiPlus, FiPaperclip, FiEdit2 } from 'react-icons/fi'

const MAX_FILE_SIZE = 1 * 1024 * 1024

interface UploadFile {
  file?: File
  preview?: string
  base64?: string
  error?: string
  name: string
  size: number
  type: string
  existing?: boolean
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

export default function EditClaimPage() {
  const router = useRouter()
  const params = useParams()
  const claimId = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
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

  useEffect(() => {
    const stored = localStorage.getItem('tbms_claims')
    if (!stored) { setNotFound(true); return }
    try {
      const claims = JSON.parse(stored)
      const claim = claims.find((c: any) => c.id === claimId)
      if (!claim) { setNotFound(true); return }
      if (claim.status !== 'on_hold') {
        toast.error('Sirf On Hold claims edit ho sakte hain')
        router.push('/dashboard/claims/my')
        return
      }
      setForm({
        tour_purpose: claim.tour_purpose || '',
        sender_name: claim.sender_name || '',
        tour_from_date: claim.tour_from_date || '',
        tour_to_date: claim.tour_to_date || '',
        site_name: claim.site_name || '',
        total_amount: String(claim.total_amount || ''),
        remarks: claim.remarks || '',
      })
      // Co-workers load
      if (claim.co_workers?.length) {
        setCoWorkers(claim.co_workers)
      } else if (claim.coworker_name) {
        setCoWorkers([{ name: claim.coworker_name, father_name: claim.coworker_father_name || '' }])
      }
      // Existing attachments
      if (claim.attachments?.length) {
        setFiles(claim.attachments.map((a: any) => ({
          name: a.name, size: a.size, type: a.type,
          base64: a.base64,
          preview: a.type.startsWith('image/') ? a.base64 : undefined,
          existing: true,
        })))
      }
    } catch { setNotFound(true) }
  }, [claimId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const updateCoWorker = (index: number, field: keyof CoWorker, value: string) => {
    setCoWorkers(prev => prev.map((cw, i) => i === index ? { ...cw, [field]: value } : cw))
  }

  const addCoWorker = () => setCoWorkers(prev => [...prev, { name: '', father_name: '' }])

  const removeCoWorker = (index: number) => {
    if (coWorkers.length === 1) return
    setCoWorkers(prev => prev.filter((_, i) => i !== index))
  }

  const handleFiles = async (selected: FileList | null) => {
    if (!selected) return
    const newFiles: UploadFile[] = []
    for (const file of Array.from(selected)) {
      if (file.size > MAX_FILE_SIZE) {
        newFiles.push({ file, name: file.name, size: file.size, type: file.type, error: `File too large (${(file.size / 1024).toFixed(0)}KB). Max 1MB.` })
      } else {
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        const base64 = await fileToBase64(file)
        newFiles.push({ file, name: file.name, size: file.size, type: file.type, preview, base64 })
      }
    }
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      if (prev[index]?.preview && !prev[index].existing) URL.revokeObjectURL(prev[index].preview!)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validFiles = files.filter(f => !f.error)
    if (validFiles.length === 0) { toast.error('Kam se kam ek document attach karein'); return }

    setLoading(true)
    try {
      const stored: any[] = JSON.parse(localStorage.getItem('tbms_claims') || '[]')
      const attachments = validFiles.map(f => ({ name: f.name, type: f.type, size: f.size, base64: f.base64 || '' }))
      const filledCoWorkers = coWorkers.filter(cw => cw.name.trim())

      const updated = stored.map(c =>
        c.id === claimId ? {
          ...c,
          tour_purpose: form.tour_purpose,
          sender_name: form.sender_name,
          tour_from_date: form.tour_from_date,
          tour_to_date: form.tour_to_date,
          site_name: form.site_name,
          co_workers: filledCoWorkers,
          coworker_name: filledCoWorkers[0]?.name || '',
          coworker_father_name: filledCoWorkers[0]?.father_name || '',
          total_amount: parseFloat(form.total_amount) || 0,
          remarks: form.remarks,
          status: 'submitted',
          attachments,
          file_count: validFiles.length,
          updated_at: new Date().toISOString(),
        } : c
      )

      localStorage.setItem('tbms_claims', JSON.stringify(updated))
      toast.success('Claim updated & resubmitted!')
      router.push('/dashboard/claims/my')
    } catch { toast.error('Kuch galat hua') } finally { setLoading(false) }
  }

  if (notFound) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-lg font-medium text-gray-600">Claim nahi mila</p>
      <button onClick={() => router.push('/dashboard/claims/my')} className="text-blue-600 text-sm mt-3 hover:underline">← My Claims</button>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <FiEdit2 className="text-orange-600 text-xl" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Claim</h1>
          <p className="text-gray-500 text-sm">On Hold claim edit karein aur resubmit karein</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
        <span className="text-xl">⏸️</span>
        <p className="text-yellow-800">
          <span className="font-semibold">Claim On Hold hai.</span> Changes karke resubmit karein — status wapas <strong>Submitted</strong> ho jaayega.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT */}
          <div className="card space-y-4 flex-1 w-full">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">Tour Details</h2>

            {/* Purpose + Sender Name — ek hi row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Tour <span className="text-red-500">*</span></label>
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
                <div key={i} className="grid grid-cols-2 gap-3 items-center">
                  <input value={cw.name} onChange={e => updateCoWorker(i, 'name', e.target.value)}
                    className="input-field text-sm" placeholder={`Co-worker ${i + 1} naam`} />
                  <div className="flex gap-2">
                    <input value={cw.father_name} onChange={e => updateCoWorker(i, 'father_name', e.target.value)}
                      className="input-field text-sm flex-1" placeholder="Pita ji ka naam" />
                    {coWorkers.length > 1 && (
                      <button type="button" onClick={() => removeCoWorker(i)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0">
                        <FiX className="text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {/* + Add Co-worker */}
              <button type="button" onClick={addCoWorker}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-1 px-1">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
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
              <button type="submit" disabled={loading}
                className="flex-1 py-3 rounded-xl font-semibold text-base bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-60">
                {loading ? 'Saving...' : '✓ Save & Resubmit'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-secondary px-6">Cancel</button>
            </div>
          </div>

          {/* RIGHT — Documents */}
          <div className="card w-full lg:w-80 space-y-4 flex-shrink-0">
            <h2 className="font-semibold text-gray-800 text-lg border-b pb-2 flex items-center gap-2">
              <FiPaperclip className="text-orange-500" /> Documents
            </h2>
            <p className="text-xs text-gray-500 flex items-start gap-1">
              <FiAlertCircle className="text-orange-400 mt-0.5 flex-shrink-0" />
              Purane documents hain — replace ya add kar sakte hain. Max 1MB each
            </p>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((uf, index) => (
                  <div key={index} className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                    uf.error ? 'border-red-200 bg-red-50' : uf.existing ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    {uf.preview
                      ? <img src={uf.preview} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                      : <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          {uf.type === 'application/pdf' ? <FiFile className="text-red-500 text-lg" /> : <FiImage className="text-blue-500 text-lg" />}
                        </div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{uf.name}</p>
                      <p className={`text-xs ${uf.error ? 'text-red-500' : uf.existing ? 'text-orange-500' : 'text-gray-400'}`}>
                        {uf.error || (uf.existing ? `Existing · ${(uf.size / 1024).toFixed(0)} KB` : `${(uf.size / 1024).toFixed(0)} KB`)}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeFile(index)}
                      className="text-gray-300 hover:text-red-500 flex-shrink-0 p-1"><FiX /></button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-300 rounded-xl py-5 text-orange-600 font-medium hover:border-orange-500 hover:bg-orange-50 transition-colors text-base">
              <span className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center flex-shrink-0">
                <FiPlus className="text-base" />
              </span>
              {files.length === 0 ? 'Attach Document' : 'Attach More'}
            </button>

            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf"
              className="hidden" onChange={(e) => handleFiles(e.target.files)} />

            {files.filter(f => !f.error).length > 0 && (
              <p className="text-xs text-center text-green-600 font-medium">
                ✓ {files.filter(f => !f.error).length} file{files.filter(f => !f.error).length > 1 ? 's' : ''} ready
              </p>
            )}
          </div>

        </div>
      </form>
    </div>
  )
}
