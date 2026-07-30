import type { WritingAnalysis, WritingAnalysisProgress } from '../../writing/types/writing'
import type {
  GeneratedImage,
  ImageGenerationRequest,
  VoiceTranscriptUpdate,
} from './productivity'

export type ProductivityProviderKind = 'image' | 'grammar' | 'voice'

export interface ProductivityProvider {
  readonly id: string
  readonly name: string
  readonly kind: ProductivityProviderKind
  readonly local: boolean
  readonly requiresApiKey: boolean
  isAvailable(): boolean
}

export interface ImageProvider extends ProductivityProvider {
  readonly kind: 'image'
  generate(request: ImageGenerationRequest, signal?: AbortSignal): Promise<GeneratedImage[]>
}

export interface GrammarProvider extends ProductivityProvider {
  readonly kind: 'grammar'
  analyze(
    text: string,
    options?: {
      force?: boolean
      signal?: AbortSignal
      onProgress?: (progress: WritingAnalysisProgress) => void
    },
  ): Promise<WritingAnalysis>
}

export interface VoiceSessionOptions {
  language?: string
  onUpdate(update: VoiceTranscriptUpdate): void
  onError(message: string): void
  onStatusChange(status: 'listening' | 'processing' | 'idle'): void
}

export interface VoiceProviderSession {
  start(): void
  pause(): void
  resume(): void
  stop(): void
  cancel(): void
}

export interface VoiceProvider extends ProductivityProvider {
  readonly kind: 'voice'
  createSession(options: VoiceSessionOptions): VoiceProviderSession
}

export interface ProductivityProviderConfig {
  imageProvider?: ImageProvider
  grammarProvider?: GrammarProvider
  voiceProvider?: VoiceProvider
}

export interface ResolvedProductivityProviderConfig extends ProductivityProviderConfig {}
