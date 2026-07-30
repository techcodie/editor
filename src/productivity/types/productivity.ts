export type ProductivityTab = 'images' | 'grammar' | 'voice' | 'providers' | 'history'

export type ImageInsertionMode = 'insert' | 'replace'
export type VoiceInsertionMode = 'cursor' | 'selection' | 'end'
export type VoiceCaptureStatus = 'idle' | 'listening' | 'paused' | 'processing' | 'error'

export interface GeneratedImage {
  id: string
  prompt: string
  dataUrl: string
  width: number
  height: number
  providerId: string
  createdAt: number
  seed: number
}

export interface ImageGenerationRequest {
  prompt: string
  count?: number
  width?: number
  height?: number
}

export interface VoiceTranscriptUpdate {
  transcript: string
  interimTranscript: string
  confidence: number
  isFinal: boolean
}

export interface SpeakerSegment {
  id: string
  speakerId: string
  speakerName: string
  text: string
  rawText: string
  index: number
}

export interface TranscriptSpeaker {
  id: string
  name: string
  color: string
  segmentCount: number
  wordCount: number
}

export type VoiceCommandId =
  | 'bold'
  | 'italic'
  | 'undo'
  | 'redo'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'bullet-list'
  | 'numbered-list'
  | 'insert-table'
  | 'new-paragraph'

export interface VoiceCommandMatch {
  id: VoiceCommandId
  label: string
}

export type ProductivityHistoryKind =
  | 'image-generated'
  | 'image-inserted'
  | 'grammar-analysis'
  | 'grammar-applied'
  | 'dictation'
  | 'voice-command'
  | 'speaker-update'

export interface ProductivityHistoryItem {
  id: string
  kind: ProductivityHistoryKind
  title: string
  detail: string
  createdAt: number
}
