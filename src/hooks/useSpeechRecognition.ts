import { useCallback, useEffect, useRef, useState } from 'react'

type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error'

export type SpeechRecognitionErrorKind =
  | 'permission-denied'
  | 'no-speech'
  | 'audio-unavailable'
  | 'network'
  | 'language'
  | 'unexpected'

export interface SpeechRecognitionError {
  kind: SpeechRecognitionErrorKind
  message: string
}

interface NativeSpeechRecognitionAlternative {
  transcript: string
}

interface NativeSpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  readonly [index: number]: NativeSpeechRecognitionAlternative
}

interface NativeSpeechRecognitionResultList {
  readonly length: number
  readonly [index: number]: NativeSpeechRecognitionResult
}

interface NativeSpeechRecognitionEvent extends Event {
  readonly results: NativeSpeechRecognitionResultList
}

interface NativeSpeechRecognitionErrorEvent extends Event {
  readonly error: string
}

interface NativeSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: NativeSpeechRecognitionEvent) => void) | null
  onerror: ((event: NativeSpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type NativeSpeechRecognitionConstructor = new () => NativeSpeechRecognition

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: NativeSpeechRecognitionConstructor
  webkitSpeechRecognition?: NativeSpeechRecognitionConstructor
}

interface UseSpeechRecognitionOptions {
  onTranscriptChange: (value: string) => void
  onListeningEnd?: () => void
}

function getSpeechRecognitionConstructor(): NativeSpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null

  const speechWindow = window as SpeechRecognitionWindow
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null
}

function getFriendlyError(error: string): SpeechRecognitionError {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        kind: 'permission-denied',
        message: 'Microphone access was denied. Allow access and try again.',
      }
    case 'no-speech':
      return {
        kind: 'no-speech',
        message: 'No speech was detected. Try again when you are ready.',
      }
    case 'audio-capture':
      return {
        kind: 'audio-unavailable',
        message: 'No microphone is available. Check your device and try again.',
      }
    case 'network':
      return {
        kind: 'network',
        message: 'Speech recognition could not connect. Check your connection and retry.',
      }
    case 'language-not-supported':
      return {
        kind: 'language',
        message: 'Speech recognition does not support the current browser language.',
      }
    default:
      return {
        kind: 'unexpected',
        message: 'Voice input stopped unexpectedly. Please try again.',
      }
  }
}

function combineTranscript(initialValue: string, transcript: string): string {
  if (!transcript) return initialValue
  const separator = initialValue && !/\s$/.test(initialValue) ? ' ' : ''
  return `${initialValue}${separator}${transcript}`
}

export function useSpeechRecognition({
  onTranscriptChange,
  onListeningEnd,
}: UseSpeechRecognitionOptions) {
  const [status, setStatus] = useState<SpeechRecognitionStatus>('idle')
  const [error, setError] = useState<SpeechRecognitionError | null>(null)
  const [isSupported] = useState(() => getSpeechRecognitionConstructor() !== null)
  const recognitionRef = useRef<NativeSpeechRecognition | null>(null)
  const initialValueRef = useRef('')
  const onTranscriptChangeRef = useRef(onTranscriptChange)
  const onListeningEndRef = useRef(onListeningEnd)

  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange
    onListeningEndRef.current = onListeningEnd
  }, [onListeningEnd, onTranscriptChange])

  const cancelListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    recognitionRef.current = null
    try {
      recognition.abort()
    } catch {
      // The browser may have already ended the recognition session.
    }
    setStatus('idle')
  }, [])

  const startListening = useCallback(
    (initialValue: string) => {
      const SpeechRecognition = getSpeechRecognitionConstructor()
      if (!SpeechRecognition || recognitionRef.current) return

      let recognition: NativeSpeechRecognition
      try {
        recognition = new SpeechRecognition()
      } catch {
        setError({
          kind: 'unexpected',
          message: 'Voice input could not start. Please try again.',
        })
        setStatus('error')
        return
      }

      initialValueRef.current = initialValue
      setError(null)
      setStatus('processing')

      // continuous: true so a natural pause between sentences doesn't end
      // the session — matches the document-dictation voice provider
      // (browserVoiceProvider.ts), which already sets this. `stopListening`/
      // `cancelListening` remain the only way this session ends before the
      // browser itself ends it.
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = document.documentElement.lang || navigator.language || 'en-US'

      recognition.onstart = () => {
        if (recognitionRef.current === recognition) setStatus('listening')
      }

      recognition.onresult = (event) => {
        if (recognitionRef.current !== recognition) return

        const segments: string[] = []
        for (let index = 0; index < event.results.length; index += 1) {
          const transcript = event.results[index]?.[0]?.transcript.trim()
          if (transcript) segments.push(transcript)
        }

        onTranscriptChangeRef.current(
          combineTranscript(initialValueRef.current, segments.join(' ')),
        )
      }

      recognition.onerror = (event) => {
        if (recognitionRef.current !== recognition) return

        recognitionRef.current = null
        if (event.error === 'aborted') {
          setStatus('idle')
          return
        }

        setError(getFriendlyError(event.error))
        setStatus('error')
      }

      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return

        recognitionRef.current = null
        setStatus('idle')
        onListeningEndRef.current?.()
      }

      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch {
        recognitionRef.current = null
        setError({
          kind: 'unexpected',
          message: 'Voice input could not start. Please try again.',
        })
        setStatus('error')
      }
    },
    [],
  )

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return

    setStatus('processing')
    try {
      recognition.stop()
    } catch {
      recognitionRef.current = null
      setError({
        kind: 'unexpected',
        message: 'Voice input could not finish cleanly. Review the transcript and retry.',
      })
      setStatus('error')
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setStatus((current) => (current === 'error' ? 'idle' : current))
  }, [])

  useEffect(
    () => () => {
      const recognition = recognitionRef.current
      recognitionRef.current = null
      try {
        recognition?.abort()
      } catch {
        // The browser may have already ended the recognition session.
      }
    },
    [],
  )

  return {
    status,
    error,
    isSupported,
    startListening,
    stopListening,
    cancelListening,
    clearError,
  }
}
