'use client'

import { useState } from 'react'
import { FiDownload, FiZoomIn, FiX, FiFile, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

interface FileItem {
  id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  url: string
}

export default function FileViewer({ files }: { files: FileItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  if (!files.length) {
    return (
      <div className="card text-center py-10 text-gray-400">
        <FiFile className="text-4xl mx-auto mb-2" />
        <p>No documents uploaded</p>
      </div>
    )
  }

  const active = files[activeIndex]
  const isImage = active.file_type.startsWith('image/')
  const isPdf = active.file_type === 'application/pdf'

  return (
    <div className="card p-0 overflow-hidden">
      {/* Thumbnail strip */}
      <div className="flex gap-2 p-3 bg-gray-50 border-b border-gray-200 overflow-x-auto">
        {files.map((f, i) => (
          <button
            key={f.id}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}
          >
            {f.file_type.startsWith('image/') ? (
              <img src={f.url} alt={f.file_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center gap-1">
                <FiFile className="text-red-400 text-xl" />
                <span className="text-xs text-gray-500">PDF</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Main Viewer */}
      <div className="relative bg-gray-900 min-h-[400px] flex items-center justify-center">
        {/* Nav Arrows */}
        {files.length > 1 && (
          <>
            <button
              onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
              disabled={activeIndex === 0}
              className="absolute left-3 z-10 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center disabled:opacity-30"
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={() => setActiveIndex(i => Math.min(files.length - 1, i + 1))}
              disabled={activeIndex === files.length - 1}
              className="absolute right-3 z-10 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center disabled:opacity-30"
            >
              <FiChevronRight />
            </button>
          </>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          {isImage && (
            <button
              onClick={() => setLightbox(true)}
              className="w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center"
              title="Zoom"
            >
              <FiZoomIn />
            </button>
          )}
          <a
            href={active.url}
            download={active.file_name}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center"
            title="Download"
          >
            <FiDownload />
          </a>
        </div>

        {isImage && (
          <img
            src={active.url}
            alt={active.file_name}
            className="max-h-[500px] max-w-full object-contain cursor-zoom-in"
            onClick={() => setLightbox(true)}
          />
        )}
        {isPdf && (
          <iframe
            src={active.url}
            className="w-full h-[500px] bg-white"
            title={active.file_name}
          />
        )}
      </div>

      {/* File Info Bar */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">{active.file_name}</p>
          <p className="text-xs text-gray-400">{(active.file_size / 1024).toFixed(0)} KB • {activeIndex + 1} of {files.length}</p>
        </div>
        <a
          href={active.url}
          download={active.file_name}
          className="btn-primary flex items-center gap-2 text-sm py-1.5"
        >
          <FiDownload /> Download
        </a>
      </div>

      {/* Lightbox */}
      {lightbox && isImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
            onClick={() => setLightbox(false)}
          >
            <FiX className="text-xl" />
          </button>
          <img
            src={active.url}
            alt={active.file_name}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
