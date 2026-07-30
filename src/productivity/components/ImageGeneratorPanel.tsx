import { useState } from 'react'
import type { EditorApi } from '../../lib/editor-api'
import type { GeneratedImage, ImageInsertionMode } from '../types/productivity'
import { GeneratedImageGallery } from './GeneratedImageGallery'
import { ImagePromptBox } from './ImagePromptBox'

interface ImageGeneratorPanelProps {
  api: EditorApi | null
  images: GeneratedImage[]
  generating: boolean
  error: string | null
  onGenerate: (prompt: string) => Promise<GeneratedImage[] | undefined>
  onCancel: () => void
  onInsert: (image: GeneratedImage, mode: ImageInsertionMode) => void
}

export function ImageGeneratorPanel({ api, images, generating, error, onGenerate, onCancel, onInsert }: ImageGeneratorPanelProps) {
  const [prompt, setPrompt] = useState('')
  const selection = api?.getTextSelection() ?? null
  return (
    <div>
      <ImagePromptBox
        prompt={prompt}
        generating={generating}
        hasSelection={Boolean(selection)}
        onPromptChange={setPrompt}
        onUseSelection={() => selection && setPrompt(selection.text.slice(0, 500))}
        onGenerate={() => void onGenerate(prompt)}
        onCancel={onCancel}
      />
      {error && <p role="alert" className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <GeneratedImageGallery images={images} canReplace={Boolean(selection)} onInsert={onInsert} onRegenerate={(value) => { setPrompt(value); void onGenerate(value) }} />
    </div>
  )
}
