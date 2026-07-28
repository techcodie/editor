import type {
  Version,
  VersionSnapshot,
  VersionSnapshotContent,
} from '../types/version'

interface SnapshotDelta {
  prefix: number
  suffix: number
  middle: string
}

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function encode(value: string): Promise<Pick<VersionSnapshot, 'compression' | 'data' | 'byteLength'>> {
  const source = textEncoder.encode(value)
  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([source]).stream().pipeThrough(new CompressionStream('gzip'))
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer())
    return { compression: 'gzip', data: bytesToBase64(compressed), byteLength: compressed.byteLength }
  }
  return { compression: 'none', data: bytesToBase64(source), byteLength: source.byteLength }
}

async function decode(snapshot: VersionSnapshot): Promise<string> {
  const bytes = base64ToBytes(snapshot.data)
  if (snapshot.compression === 'gzip') {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot decompress the selected version.')
    }
    const source = Uint8Array.from(bytes)
    const stream = new Blob([source.buffer]).stream().pipeThrough(new DecompressionStream('gzip'))
    return textDecoder.decode(await new Response(stream).arrayBuffer())
  }
  return textDecoder.decode(bytes)
}

function createDelta(base: string, next: string): SnapshotDelta {
  let prefix = 0
  const maxPrefix = Math.min(base.length, next.length)
  while (prefix < maxPrefix && base[prefix] === next[prefix]) prefix += 1
  let suffix = 0
  const maxSuffix = Math.min(base.length - prefix, next.length - prefix)
  while (
    suffix < maxSuffix &&
    base[base.length - suffix - 1] === next[next.length - suffix - 1]
  ) suffix += 1
  return { prefix, suffix, middle: next.slice(prefix, next.length - suffix) }
}

function applyDelta(base: string, delta: SnapshotDelta): string {
  const suffix = delta.suffix > 0 ? base.slice(base.length - delta.suffix) : ''
  return `${base.slice(0, delta.prefix)}${delta.middle}${suffix}`
}

export function hashDocument(content: VersionSnapshotContent): string {
  const value = JSON.stringify(content.document)
  let hash = 2_166_136_261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16_777_619)
  }
  return `${value.length}-${(hash >>> 0).toString(16)}`
}

export async function createFullSnapshot(content: VersionSnapshotContent): Promise<VersionSnapshot> {
  const serialized = JSON.stringify(content)
  const encoded = await encode(serialized)
  return {
    formatVersion: 1,
    encoding: 'full',
    ...encoded,
    uncompressedLength: textEncoder.encode(serialized).byteLength,
  }
}

export async function createSnapshot(
  content: VersionSnapshotContent,
  base?: { id: string; content: VersionSnapshotContent },
): Promise<VersionSnapshot> {
  const serialized = JSON.stringify(content)
  const full = await createFullSnapshot(content)
  if (!base) return full
  const baseSerialized = JSON.stringify(base.content)
  const deltaSerialized = JSON.stringify(createDelta(baseSerialized, serialized))
  const encodedDelta = await encode(deltaSerialized)
  if (encodedDelta.byteLength + 32 >= full.byteLength) return full
  return {
    formatVersion: 1,
    encoding: 'delta',
    ...encodedDelta,
    baseVersionId: base.id,
    uncompressedLength: textEncoder.encode(serialized).byteLength,
  }
}

export async function resolveSnapshot(
  version: Version,
  versions: Version[],
  resolving = new Set<string>(),
): Promise<VersionSnapshotContent> {
  if (resolving.has(version.id)) throw new Error('Version history contains a circular snapshot reference.')
  resolving.add(version.id)
  const serialized = await decode(version.snapshot)
  let content: string
  if (version.snapshot.encoding === 'full') {
    content = serialized
  } else {
    const base = versions.find((item) => item.id === version.snapshot.baseVersionId)
    if (!base) throw new Error('A base snapshot required by this version is missing.')
    const baseContent = await resolveSnapshot(base, versions, resolving)
    content = applyDelta(JSON.stringify(baseContent), JSON.parse(serialized) as SnapshotDelta)
  }
  resolving.delete(version.id)
  const parsed: unknown = JSON.parse(content)
  if (!parsed || typeof parsed !== 'object' || !('document' in parsed) || !('text' in parsed)) {
    throw new Error('The selected version contains an invalid snapshot.')
  }
  return structuredClone(parsed) as VersionSnapshotContent
}

export function snapshotSavings(snapshot: VersionSnapshot): number {
  if (snapshot.uncompressedLength <= 0) return 0
  return Math.max(0, Math.round((1 - snapshot.byteLength / snapshot.uncompressedLength) * 100))
}
