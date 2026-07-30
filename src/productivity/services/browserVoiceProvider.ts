import type {
  VoiceProvider,
  VoiceProviderSession,
  VoiceSessionOptions,
} from '../types/provider'

interface NativeAlternative { transcript: string; confidence: number }
interface NativeResult { isFinal: boolean; length: number; [index: number]: NativeAlternative }
interface NativeResultList { length: number; [index: number]: NativeResult }
interface NativeResultEvent extends Event { resultIndex: number; results: NativeResultList }
interface NativeErrorEvent extends Event { error: string }
interface NativeRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: NativeResultEvent) => void) | null
  onerror: ((event: NativeErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}
type NativeRecognitionConstructor = new () => NativeRecognition
interface VoiceWindow extends Window {
  SpeechRecognition?: NativeRecognitionConstructor
  webkitSpeechRecognition?: NativeRecognitionConstructor
}

function constructor(): NativeRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const voiceWindow = window as VoiceWindow
  return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition ?? null
}

class BrowserVoiceSession implements VoiceProviderSession {
  private recognition: NativeRecognition | null = null
  private paused = false
  private cancelled = false
  private readonly options: VoiceSessionOptions

  constructor(options: VoiceSessionOptions) {
    this.options = options
  }

  private createRecognition(): NativeRecognition {
    const Recognition = constructor()
    if (!Recognition) throw new Error('Browser speech recognition is unavailable.')
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = this.options.language ?? 'en-US'
    recognition.onresult = (event) => {
      let transcript = ''
      let interimTranscript = ''
      let confidence = 0
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const alternative = result[0]
        if (!alternative) continue
        confidence = Math.max(confidence, alternative.confidence || 0)
        if (result.isFinal) transcript += alternative.transcript
        else interimTranscript += alternative.transcript
      }
      this.options.onUpdate({ transcript: transcript.trim(), interimTranscript: interimTranscript.trim(), confidence, isFinal: Boolean(transcript.trim()) })
    }
    recognition.onerror = (event) => {
      if (event.error === 'aborted' && (this.paused || this.cancelled)) return
      this.options.onError(event.error === 'not-allowed' ? 'Microphone permission was denied.' : 'Voice recognition stopped unexpectedly.')
    }
    recognition.onend = () => {
      if (this.recognition === recognition) this.recognition = null
      if (!this.paused && !this.cancelled && !this.recognition) {
        this.options.onStatusChange('idle')
      }
    }
    return recognition
  }

  start(): void {
    if (this.recognition) return
    this.paused = false
    this.cancelled = false
    try {
      this.recognition = this.createRecognition()
      this.recognition.start()
      this.options.onStatusChange('listening')
    } catch (error) {
      this.recognition = null
      this.options.onError(error instanceof Error ? error.message : 'Voice recognition could not start.')
    }
  }

  pause(): void {
    if (!this.recognition) return
    const recognition = this.recognition
    this.recognition = null
    this.paused = true
    recognition.stop()
  }

  resume(): void {
    if (!this.paused) return
    this.start()
  }

  stop(): void {
    const recognition = this.recognition
    this.recognition = null
    this.paused = false
    this.options.onStatusChange('processing')
    recognition?.stop()
  }

  cancel(): void {
    this.cancelled = true
    this.paused = false
    this.recognition?.abort()
    this.recognition = null
    this.options.onStatusChange('idle')
  }
}

export class BrowserVoiceProvider implements VoiceProvider {
  readonly id = 'browser-speech'
  readonly name = 'Browser Speech Recognition'
  readonly kind = 'voice' as const
  readonly local = true
  readonly requiresApiKey = false

  isAvailable(): boolean {
    return constructor() !== null
  }

  createSession(options: VoiceSessionOptions): VoiceProviderSession {
    return new BrowserVoiceSession(options)
  }
}
