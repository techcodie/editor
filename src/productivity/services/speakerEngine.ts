import type { SpeakerSegment, TranscriptSpeaker } from '../types/productivity'

const SPEAKER_COLORS = ['#4f46e5', '#059669', '#dc2626', '#2563eb', '#ca8a04', '#9333ea']

function speakerId(name: string): string {
  return `speaker-${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}

export function parseTranscriptSpeakers(text: string): {
  speakers: TranscriptSpeaker[]
  segments: SpeakerSegment[]
} {
  const segments: SpeakerSegment[] = []
  const pattern = /^([A-Z][A-Za-z0-9 .'-]{0,39}):\s+(.+)$/gm
  for (const match of text.matchAll(pattern)) {
    const name = match[1].trim()
    segments.push({
      id: `speaker-segment-${segments.length + 1}`,
      speakerId: speakerId(name),
      speakerName: name,
      text: match[2].trim(),
      rawText: match[0],
      index: segments.length,
    })
  }

  const grouped = new Map<string, TranscriptSpeaker>()
  for (const segment of segments) {
    const current = grouped.get(segment.speakerId)
    const wordCount = segment.text.split(/\s+/).filter(Boolean).length
    grouped.set(segment.speakerId, current
      ? { ...current, segmentCount: current.segmentCount + 1, wordCount: current.wordCount + wordCount }
      : {
          id: segment.speakerId,
          name: segment.speakerName,
          color: SPEAKER_COLORS[grouped.size % SPEAKER_COLORS.length],
          segmentCount: 1,
          wordCount,
        })
  }
  return { speakers: [...grouped.values()], segments }
}
