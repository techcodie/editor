import { ScanText } from 'lucide-react'
import type { DocumentModel } from '../types/documentModel'

interface OCRPreviewProps {
  model: DocumentModel
}

export function OCRPreview({ model }: OCRPreviewProps) {
  return (
    <section className="h-full overflow-y-auto overscroll-contain bg-neutral-50 p-4 sm:p-6" aria-label="Recognized text">
      <div className="mx-auto min-h-full max-w-[46rem] rounded-lg border border-neutral-200 bg-white px-5 py-6 shadow-sm sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
            <ScanText size={15} className="text-indigo-600" aria-hidden />
            Recognized text
          </div>
          <span className="text-[10px] font-medium text-neutral-500">
            {Math.round(model.confidence)}% confidence
          </span>
        </div>
        {model.text.trim() ? (
          <div className="whitespace-pre-wrap text-sm leading-7 text-neutral-700">
            {model.text}
          </div>
        ) : (
          <p className="py-14 text-center text-sm text-neutral-500">
            No readable text was detected in this document.
          </p>
        )}
      </div>
    </section>
  )
}
