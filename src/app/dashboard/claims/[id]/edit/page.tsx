'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiX, FiFile, FiImage, FiAlertCircle, FiPlus, FiPaperclip, FiEdit2 } from 'react-icons/fi'
import { getClaimById, updateClaimFull } from '@/lib/claims'
import { Claim } from '@/lib/types'

const MAX_FILE_SIZE = 1 * 1024 * 1024

interface UploadFile {
  name: string
  size: number
  type: string
  base64?: string
  preview?: string
  error?: string
  existing?: boolean
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
  const [fetching, setFetching] = useState(true)
  const [notFound, setNotFound] = useState(false)
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

  // Keep existing co_workers to pass back unchanged
  const [coWorkers, setCoWorkers] = useState<{ name: string; father_name: string }[]>([])

  useEffect(() => {
    if (!claimId) return
    getClaimById(claimId).then((claim: Claim | null) => {
      if (!claim) { setNotFound(true); setFetching(false); return }
      if (!['on_hold', 'submitted'].includes(claim.status)) {
        toast.error('Only pending or on-hold claims can be edited. (केवल लंबित या होल्ड दावे संपादित किए जा सकते हैं।)')
        router.push('/dashboard')
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
      if (claim.co_workers?.length) {
        setCoWorkers(claim.co_workers.map(cw => ({ name: cw.name, father_name: cw.father_name })))
      }
      if (claim.attachments?.length) {
        setFiles(claim.attachments.map(a => ({
          name: a.name, size: a.size, type: a.type,
          base64: a.base64,
          preview: a.type.startsWith('image/') ? a.base64 : undefined,
          existing: true,
        })))
      }
      setFetching(false)
    })
  }, [claimId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFiles = async (selected: FileList | null) => {
    if (!selected) return
    const newFiles: UploadFile[] = []
    for (const file of Array.from(selected)) {
      if (file.size > MAX_FILE_SIZE) {
        newFiles.push({ name: file.name, size: file.size, type: file.type, error: `File too large (${(file.size / 1024).toFixed(0)}KB). Max 1MB.` })
      } else {
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        const base64 = await fileToBase64(file)
        newFiles.push({ name: file.name, size: file.size, type: file.type, preview, base64 })
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
    const { error } = await updateClaimFull(claimId, {
      sender_name: form.sender_name,
      tour_purpose: form.tour_purpose,
      tour_from_date: form.tour_from_date,
      tour_to_date: form.tour_to_date,
      site_name: form.site_name,
      total_amount: parseFloat(form.total_amount) || 0,
      remarks: form.remarks,
      co_workers: coWorkers,
      attachments: validFiles.map(f => ({ name: f.name, type: f.type, size: f.size, base64: f.base64 || '' })),
    })
    setLoading(false)

    if (error) { toast.error('Update failed: ' + error); return }
    toast.success('Claim updated & resubmitted!')
    router.push('/dashboard/claims/my')
  }

  if (fetching) return <div className="text-center py-20 text-gray-400">Loading...</div>

  if (notFound) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-lg font-medium text-gray-600">Claim nahi mila</p>
      <button onClick={() => router.push('/dashboard/claims/my')} className="text-blue-600 text-sm mt-3 hover:underline">← My Claims</button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
          <FiEdit2 className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Edit Claim</h1>
          <p className="text-gray-500 text-xs">On Hold claim edit karein aur resubmit karein</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
        <span>⏸️</span>
        <p className="text-yellow-800 text-xs">
          <span className="font-semibold">Claim On Hold hai.</span> Changes karke resubmit karein — status wapas <strong>Submitted</strong> ho jaayega.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-4 items-start">

          {/* LEFT — Tour Details */}
          <div className="card space-y-3 flex-1 w-full py-4 px-4">
            <h2 className="font-semibold text-gray-800 border-b pb-2">Tour Details</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Purpose of Tour <span className="text-red-500">*</span></label>
                <input name="tour_purpose" value={form.tour_purpose} onChange={handleChange}
                  className="input-field text-sm py-2" placeholder="e.g. Client visit" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sender Name</label>
                <input name="sender_name" value={form.sender_name} onChange={handleChange}
                  className="input-field text-sm py-2" placeholder="Sender ka naam" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date <span className="text-red-500">*</span></label>
                <input type="date" name="tour_from_date" value={form.tour_from_date} onChange={handleChange} className="input-field text-sm py-2" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date <span className="text-red-500">*</span></label>
                <input type="date" name="tour_to_date" value={form.tour_to_date} onChange={handleChange} className="input-field text-sm py-2" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Site Name <span className="text-red-500">*</span></label>
              <input name="site_name" value={form.site_name} onChange={handleChange}
                className="input-field text-sm py-2" placeholder="e.g. Delhi Plant" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Bill Amount (₹) <span className="text-red-500">*</span></label>
              <input type="number" name="total_amount" value={form.total_amount} onChange={handleChange}
                className="input-field text-sm py-2" placeholder="0.00" min="0" step="0.01" required />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Remarks (Optional)</label>
              <textarea name="remarks" value={form.remarks} onChange={handleChange}
                className="input-field text-sm py-2 h-16 resize-none" placeholder="Any additional notes..." />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-60">
                {loading ? 'Saving...' : '✓ Save & Resubmit'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-secondary px-5 text-sm py-2.5">Cancel</button>
            </div>
          </div>

          {/* RIGHT — Documents */}
          <div className="card w-full lg:w-72 space-y-3 flex-shrink-0 py-4 px-4">
            <h2 className="font-semibold text-gray-800 border-b pb-2 flex items-center gap-2 text-sm">
              <FiPaperclip className="text-orange-500" /> Documents
            </h2>
            <p className="text-xs text-gray-500 flex items-start gap-1">
              <FiAlertCircle className="text-orange-400 mt-0.5 flex-shrink-0" />
              Purane documents hain — replace ya add kar sakte hain. Max 1MB each
            </p>

            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((uf, index) => (
                  <div key={index} className={`flex items-center gap-2 p-2 rounded-lg border ${
                    uf.error ? 'border-red-200 bg-red-50' : uf.existing ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    {uf.preview
                      ? <img src={uf.preview} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" />
                      : <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          {uf.type === 'application/pdf' ? <FiFile className="text-red-500" /> : <FiImage className="text-blue-500" />}
                        </div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate">{uf.name}</p>
                      <p className={`text-[11px] ${uf.error ? 'text-red-500' : uf.existing ? 'text-orange-500' : 'text-gray-400'}`}>
                        {uf.error || (uf.existing ? `Existing · ${(uf.size / 1024).toFixed(0)} KB` : `${(uf.size / 1024).toFixed(0)} KB`)}
                      </p>
                    </div>
                    <button type="button" onClick={() => removeFile(index)}
                      className="text-gray-300 hover:text-red-500 flex-shrink-0 p-0.5"><FiX className="text-sm" /></button>
                  </div>
                ))}
              </div>
            )}

            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-orange-300 rounded-xl py-4 text-orange-600 font-medium hover:border-orange-500 hover:bg-orange-50 transition-colors text-sm">
              <span className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center flex-shrink-0">
                <FiPlus className="text-sm" />
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
