import { ImagePlus, LoaderCircle, MousePointer2, Square } from 'lucide-react'

interface ImagePromptBoxProps {
  prompt: string
  generating: boolean
  hasSelection: boolean
  onPromptChange: (prompt: string) => void
  onUseSelection: () => void
  onGenerate: () => void
  onCancel: () => void
}

export function ImagePromptBox({ prompt, generating, hasSelection, onPromptChange, onUseSelection, onGenerate, onCancel }: ImagePromptBoxProps) {
  return (
    <div className="border-b border-neutral-200 p-4">
      <label htmlFor="productivity-image-prompt" className="mb-1.5 block text-[11px] font-semibold text-neutral-700">Image prompt</label>
      <textarea
        id="productivity-image-prompt"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        rows={4}
        maxLength={500}
        placeholder="A clean editorial illustration of a product launch plan"
        className="w-full resize-none rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm leading-5 text-neutral-900 outline-none transition-shadow placeholder:text-neutral-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
      />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={onUseSelection} disabled={!hasSelection || generating} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 text-xs font-semibold text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">
          <MousePointer2 size={14} aria-hidden />Use selection
        </button>
        {generating ? (
          <button type="button" onClick={onCancel} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">
            <Square size={12} fill="currentColor" aria-hidden />Cancel
          </button>
        ) : (
          <button type="button" onClick={onGenerate} disabled={!prompt.trim()} className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-md bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35">
            <ImagePlus size={14} aria-hidden />Generate
          </button>
        )}
      </div>
      {generating && <p role="status" className="mt-2 flex items-center gap-2 text-[11px] text-neutral-500"><LoaderCircle size={13} className="animate-spin" aria-hidden />Generating local previews...</p>}
    </div>
  )
}
