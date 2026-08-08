import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorApi, EditorTextSelection } from '../../lib/editor-api'
import type { VoiceProvider, VoiceProviderSession } from '../types/provider'
import type {
  ProductivityHistoryItem,
  VoiceCaptureStatus,
  VoiceCommandId,
  VoiceInsertionMode,
} from '../types/productivity'
import { executeVoiceCommand, matchVoiceCommand } from '../services/voiceCommandEngine'

function history(kind: ProductivityHistoryItem['kind'], title: string, detail: string): ProductivityHistoryItem {
  return { id: crypto.randomUUID(), kind, title, detail, createdAt: Date.now() }
}

export type VoiceCommandsController = ReturnType<typeof useVoiceCommands>

export function useVoiceCommands(api: EditorApi | null, provider: VoiceProvider) {
  const [status, setStatus] = useState<VoiceCaptureStatus>('idle')
  const [mode, setMode] = useState<VoiceInsertionMode>('cursor')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [lastTranscript, setLastTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ProductivityHistoryItem[]>([])
  const sessionRef = useRef<VoiceProviderSession | null>(null)
  const selectionRef = useRef<EditorTextSelection | null>(null)
  const modeRef = useRef<VoiceInsertionMode>('cursor')

  useEffect(() => { modeRef.current = mode }, [mode])

  const addActivity = useCallback((item: ProductivityHistoryItem) => {
    setActivity((current) => [item, ...current].slice(0, 30))
  }, [])

  const runCommand = useCallback((command: VoiceCommandId) => {
    if (!api) return false
    const didRun = executeVoiceCommand(api, command)
    if (didRun) addActivity(history('voice-command', 'Voice command', command.replaceAll('-', ' ')))
    return didRun
  }, [addActivity, api])

  const dictationTarget = () =>
    modeRef.current === 'end' ? 'end' : modeRef.current === 'selection' ? 'selection' : 'cursor'

  const clearDictationPreview = useCallback(() => {
    const target = dictationTarget()
    api?.updateDictation({
      text: '',
      isFinal: true,
      target,
      selection: target === 'selection' ? selectionRef.current ?? undefined : undefined,
    })
  }, [api])

  const previewTranscript = useCallback((interimTranscript: string) => {
    if (!api) return
    const target = dictationTarget()
    api.updateDictation({
      text: interimTranscript,
      isFinal: false,
      target,
      selection: target === 'selection' ? selectionRef.current ?? undefined : undefined,
    })
  }, [api])

  const insertTranscript = useCallback((transcript: string) => {
    if (!api || !transcript.trim()) return false
    const command = matchVoiceCommand(transcript)
    const target = dictationTarget()
    if (command) {
      // The live preview already streamed the raw words into the document
      // as they were recognized — this turned out to be a command instead
      // of literal text, so discard that preview before running it.
      clearDictationPreview()
      return runCommand(command.id)
    }
    const didInsert = api.updateDictation({
      text: transcript.trim(),
      isFinal: true,
      target,
      selection: target === 'selection' ? selectionRef.current ?? undefined : undefined,
    })
    if (didInsert) {
      addActivity(history('dictation', 'Dictation inserted', transcript.trim().slice(0, 100)))
      selectionRef.current = null
      if (target === 'selection') setMode('cursor')
    }
    return didInsert
  }, [addActivity, api, clearDictationPreview, runCommand])

  const stop = useCallback(() => {
    sessionRef.current?.stop()
    setStatus('processing')
  }, [])

  const cancel = useCallback(() => {
    sessionRef.current?.cancel()
    sessionRef.current = null
    setStatus('idle')
    setInterimTranscript('')
    // Cancelling mid-utterance means no final result will ever arrive to
    // close out whatever the live preview already streamed into the
    // document — discard it explicitly rather than leaving unconfirmed
    // words behind. A no-op if no preview was open.
    clearDictationPreview()
  }, [clearDictationPreview])

  useEffect(() => cancel, [cancel])

  const start = useCallback(() => {
    if (!api || !provider.isAvailable() || sessionRef.current) return
    selectionRef.current = api.getTextSelection()
    setError(null)
    const session = provider.createSession({
      onUpdate: (update) => {
        setInterimTranscript(update.interimTranscript)
        if (!update.isFinal || !update.transcript) {
          previewTranscript(update.interimTranscript)
          return
        }
        setLastTranscript(update.transcript)
        setInterimTranscript('')
        insertTranscript(update.transcript)
      },
      onError: (message) => {
        setError(message)
        setStatus('error')
        sessionRef.current = null
      },
      onStatusChange: (next) => {
        setStatus(next)
        if (next === 'idle') {
          sessionRef.current = null
          // Catch-all: if the session ended for any reason without a final
          // result closing out the last preview (e.g. the browser stopped
          // recognition mid-word), don't leave unconfirmed words behind.
          // A no-op once a final result already closed it normally.
          clearDictationPreview()
        }
      },
    })
    sessionRef.current = session
    session.start()
  }, [api, clearDictationPreview, insertTranscript, previewTranscript, provider])

  const pause = useCallback(() => {
    sessionRef.current?.pause()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    sessionRef.current?.resume()
    setStatus('listening')
  }, [])

  const undoDictation = useCallback(() => {
    api?.undo()
    addActivity(history('voice-command', 'Dictation undone', lastTranscript.slice(0, 100)))
  }, [addActivity, api, lastTranscript])

  return {
    status,
    mode,
    interimTranscript,
    lastTranscript,
    error,
    activity,
    isSupported: provider.isAvailable(),
    setMode,
    start,
    pause,
    resume,
    stop,
    cancel,
    undoDictation,
    runCommand,
  }
}
