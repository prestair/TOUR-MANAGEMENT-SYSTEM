// Bilingual message display component
// English in English font, Hindi in Devanagari

interface BiMsgProps {
  en: string
  hi: string
  type?: 'error' | 'success' | 'info'
  inline?: boolean  // for toast strings
}

export function BiMsg({ en, hi, type = 'error' }: BiMsgProps) {
  const colors = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info:    'bg-blue-50 border-blue-200 text-blue-700',
  }
  return (
    <div className={`border rounded-lg px-3 py-2 text-sm ${colors[type]}`}>
      <span className="font-medium" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>{en}</span>
      <span className="text-gray-400 mx-1.5">·</span>
      <span style={{ fontFamily: '"Noto Sans Devanagari", "Mangal", serif', fontSize: '0.82rem' }}>{hi}</span>
    </div>
  )
}

// For toast messages — returns "English (हिंदी)" string
export function toastMsg(en: string, hi: string): string {
  return `${en} · ${hi}`
}

// Inline error text for form validation
export function ErrorMsg({ en, hi }: { en: string; hi: string }) {
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <span style={{ fontFamily: 'Inter, Arial, sans-serif' }}>{en}</span>
      <span className="text-red-400 mx-1.5">·</span>
      <span style={{ fontFamily: '"Noto Sans Devanagari", "Mangal", serif', fontSize: '0.82rem' }}>{hi}</span>
    </p>
  )
}
