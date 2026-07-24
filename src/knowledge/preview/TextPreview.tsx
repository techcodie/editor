interface TextPreviewProps {
  content: string
  html?: string
}

export const TextPreview = memo(function TextPreview({ content, html }: TextPreviewProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
      <article className="min-h-[32rem] rounded-lg border border-neutral-200 bg-white px-6 py-8 text-neutral-800 shadow-[0_1px_2px_rgba(20,20,20,0.04),0_18px_45px_-35px_rgba(20,20,20,0.35)] [content-visibility:auto] [contain-intrinsic-size:auto_32rem] sm:px-12 sm:py-12">
        {html ? (
          <div
            className="knowledge-preview-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words text-[0.9375rem] leading-7 text-neutral-700">
            {content}
          </div>
        )}
      </article>
    </div>
  )
})
import { memo } from 'react'
