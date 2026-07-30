import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Image, Mic2, SlidersHorizontal, SpellCheck2, WandSparkles, X } from 'lucide-react'
import type { EditorApi } from '../../lib/editor-api'
import type { WritingSuggestion } from '../../writing/types/suggestion'
import type { ProductivityProviderRegistry } from '../services/providerRegistry'
import { insertGeneratedImage } from '../services/imageInsertion'
import { useGrammarProvider } from '../hooks/useGrammarProvider'
import { useImageGeneration } from '../hooks/useImageGeneration'
import { useSpeakerManager } from '../hooks/useSpeakerManager'
import { useVoiceCommands } from '../hooks/useVoiceCommands'
import type { ImageInsertionMode, ProductivityHistoryItem, ProductivityTab } from '../types/productivity'
import { GrammarSuggestionsPanel } from './GrammarSuggestionsPanel'
import { ImageGeneratorPanel } from './ImageGeneratorPanel'
import { ProviderSettings } from './ProviderSettings'
import { SpeakerManager } from './SpeakerManager'
import { VoiceCommandPalette } from './VoiceCommandPalette'
import { VoiceToolbar } from './VoiceToolbar'

const TABS: ReadonlyArray<{ id: ProductivityTab; label: string; icon: typeof Image }> = [
  { id: 'images', label: 'Images', icon: Image },
  { id: 'grammar', label: 'Grammar', icon: SpellCheck2 },
  { id: 'voice', label: 'Voice', icon: Mic2 },
  { id: 'providers', label: 'Providers', icon: SlidersHorizontal },
  { id: 'history', label: 'History', icon: Clock3 },
]

interface ProductivitySidebarProps {
  isOpen: boolean
  api: EditorApi | null
  registry: ProductivityProviderRegistry
  onClose: () => void
  onApplyWriting: (original: string, suggested: string, reason: string) => boolean
  onCommentWriting: (suggestion: WritingSuggestion) => boolean
}

function item(kind: ProductivityHistoryItem['kind'], title: string, detail: string): ProductivityHistoryItem {
  return { id: crypto.randomUUID(), kind, title, detail, createdAt: Date.now() }
}

export function ProductivitySidebar({ isOpen, api, registry, onClose, onApplyWriting, onCommentWriting }: ProductivitySidebarProps) {
  const panelRef = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<ProductivityTab>('images')
  const [history, setHistory] = useState<ProductivityHistoryItem[]>([])
  const images = useImageGeneration(registry.getImageProvider())
  const grammar = useGrammarProvider(registry.getGrammarProvider(), api)
  const speakers = useSpeakerManager(api)
  const voice = useVoiceCommands(api, registry.getVoiceProvider())
  const combinedHistory = useMemo(() => [...history, ...voice.activity].toSorted((left, right) => right.createdAt - left.createdAt).slice(0, 40), [history, voice.activity])

  useEffect(() => {
    if (!isOpen) return
    const previous = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>('[aria-label="Close AI productivity"]')?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => { window.removeEventListener('keydown', handleKeyDown); previous?.focus() }
  }, [isOpen, onClose])

  if (!isOpen) return null
  const addHistory = (entry: ProductivityHistoryItem) => setHistory((current) => [entry, ...current].slice(0, 30))
  const generate = async (prompt: string) => {
    const generated = await images.generate(prompt)
    if (generated?.length) addHistory(item('image-generated', 'Images generated', prompt.slice(0, 120)))
    return generated
  }
  const insert = (image: Parameters<typeof insertGeneratedImage>[1], mode: ImageInsertionMode) => {
    if (!api) return
    const didInsert = insertGeneratedImage(api, image, mode === 'replace' ? 'selection' : 'cursor')
    if (didInsert) addHistory(item('image-inserted', mode === 'replace' ? 'Selection replaced with image' : 'Image inserted', image.prompt.slice(0, 120)))
  }
  return (
    <aside ref={panelRef} id="productivity-sidebar" aria-label="AI productivity" className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-neutral-200 bg-[#fafafa] text-neutral-950 shadow-[var(--document-editor-shadow-overlay)] sm:max-w-[31rem] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-[30rem] lg:rounded-lg lg:border">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 lg:rounded-t-lg"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-700"><WandSparkles size={16} aria-hidden /></span><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold">AI productivity</h2><p className="text-[10px] text-neutral-500">Local-first workspace</p></div><button type="button" onClick={onClose} aria-label="Close AI productivity" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35"><X size={16} aria-hidden /></button></header>
      <div role="tablist" aria-label="Productivity tools" className="viewer-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-2 py-2">{TABS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/35 ${tab === id ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'}`}><Icon size={13} aria-hidden />{label}</button>)}</div>
      <div className="viewer-scroll min-h-0 flex-1 overflow-y-auto" role="tabpanel">
        {tab === 'images' && <ImageGeneratorPanel api={api} images={images.images} generating={images.status === 'generating'} error={images.error} onGenerate={generate} onCancel={images.cancel} onInsert={insert} />}
        {tab === 'grammar' && <GrammarSuggestionsPanel analysis={grammar.analysis} scope={grammar.scope} analyzing={grammar.status === 'analyzing'} progress={grammar.progress?.progress ?? 0} error={grammar.error} onAnalyze={(scope, force) => { void grammar.analyze(scope, force).then((result) => { if (result) addHistory(item('grammar-analysis', 'Writing analyzed', `${result.suggestions.length} suggestions`)) }) }} onCancel={grammar.cancel} onApply={(suggestion) => { if (onApplyWriting(suggestion.originalText, suggestion.suggestedText, suggestion.reason)) addHistory(item('grammar-applied', 'Writing suggestion applied', suggestion.title)) }} onComment={onCommentWriting} />}
        {tab === 'voice' && <><VoiceToolbar status={voice.status} mode={voice.mode} supported={voice.isSupported} onModeChange={voice.setMode} onStart={voice.start} onPause={voice.pause} onResume={voice.resume} onStop={voice.stop} onUndo={voice.undoDictation} />{voice.error && <p role="alert" className="mx-4 mt-3 text-xs text-red-700">{voice.error}</p>}{(voice.interimTranscript || voice.lastTranscript) && <div className="mx-4 mt-3 rounded-md border border-neutral-200 bg-white p-3"><p className="text-[10px] font-semibold text-neutral-500">Transcript</p><p aria-live="polite" className="mt-1 text-xs leading-5 text-neutral-700">{voice.interimTranscript || voice.lastTranscript}</p></div>}<VoiceCommandPalette onRun={voice.runCommand} /><SpeakerManager speakers={speakers.speakers} segments={speakers.segments} onRename={(speaker, name, globally) => { if (speakers.rename(speaker.name, name, globally)) addHistory(item('speaker-update', 'Speaker renamed', `${speaker.name} to ${name}`)) }} onMerge={(source, target) => { if (speakers.merge(source.name, target.name)) addHistory(item('speaker-update', 'Speakers merged', `${source.name} into ${target.name}`)) }} onSplit={(segment, name) => { if (speakers.split(segment, name)) addHistory(item('speaker-update', 'Speaker segment split', name)) }} onNavigate={speakers.navigate} /></>}
        {tab === 'providers' && <ProviderSettings providers={registry.list()} />}
        {tab === 'history' && <div className="p-4">{combinedHistory.length === 0 ? <div className="rounded-md border border-dashed border-neutral-300 px-5 py-10 text-center text-xs text-neutral-500">Productivity activity will appear here.</div> : <ol className="space-y-2">{combinedHistory.map((entry) => <li key={entry.id} className="border-b border-neutral-200 pb-2.5 last:border-0"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-neutral-800">{entry.title}</span><time className="shrink-0 text-[9px] text-neutral-400">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-neutral-500">{entry.detail}</p></li>)}</ol>}</div>}
      </div>
    </aside>
  )
}
